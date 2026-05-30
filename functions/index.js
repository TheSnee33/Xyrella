/**
 * Xyrella Cloud Functions (Firebase)
 * Project: xyrella-5f994
 *
 * Callable functions:
 * 1. transcribeAudio - Speech-to-Text transcription
 * 2. analyzeWithGemini - AI analysis with Gemini 2.0 Flash
 * 3. analyzeWithClaude - AI analysis with Claude Sonnet 4
 * 4. mergeAnalysis - Combine both AI results
 * 5. analyzeVoicePsychology - Voice-based psychological trait analysis (Gemini)
 * 6. transcribeVoiceSample - Transcribe uploaded voice samples
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

// Project constants (Updated: 2026-05-30)
const PROJECT_ID = 'xyrella-5f994';

// Helper to verify auth token from context or headers (supports custom REST fetch requests)
const getAuthUser = async (data, context) => {
  console.log("DEBUG getAuthUser START - env keys:", Object.keys(process.env));
  console.log("DEBUG getAuthUser START - input parameters:", {
    hasData: !!data,
    dataType: typeof data,
    hasContext: !!context,
    contextType: typeof context,
    contextHasAuth: context ? !!context.auth : false,
    dataHasAuth: data ? !!data.auth : false
  });

  if (context && context.auth) {
    console.log("DEBUG getAuthUser - returning context.auth", JSON.stringify(context.auth));
    return context.auth;
  }
  if (data && data.auth) {
    console.log("DEBUG getAuthUser - returning data.auth", JSON.stringify(data.auth));
    return data.auth;
  }
  
  const req1 = context && context.rawRequest ? context.rawRequest : null;
  const req2 = data && data.rawRequest ? data.rawRequest : null;
  const req = req1 || req2;
  
  if (!req) {
    console.log("DEBUG getAuthUser - rawRequest is not found in context or data");
    console.log("DEBUG getAuthUser keys - dataKeys:", data ? Object.keys(data) : [], "contextKeys:", context ? Object.keys(context) : []);
  }

  const headers = req && req.headers ? req.headers : {};
  console.log("DEBUG getAuthUser - rawRequest headers keys:", Object.keys(headers));
  
  let idToken = headers['x-firebase-auth-token'] || headers['x-firebase-id-token'];
  console.log("DEBUG getAuthUser - extracted x-firebase-auth-token:", idToken ? "FOUND (length " + idToken.length + ")" : "MISSING");
  
  if (!idToken && headers.authorization) {
    console.log("DEBUG getAuthUser - checking authorization header:", headers.authorization.substring(0, 20) + "...");
    if (headers.authorization.startsWith('Bearer ')) {
      idToken = headers.authorization.split('Bearer ')[1];
    }
  }
  
  if (idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      console.log("DEBUG getAuthUser - verified token, uid:", decodedToken.uid);
      return { uid: decodedToken.uid, token: decodedToken };
    } catch (e) {
      console.error("DEBUG getAuthUser - Manual token verification failed:", e.message);
    }
  } else {
    console.log("DEBUG getAuthUser - No token found to verify");
  }
  return null;
};

// ============================================================================
// FUNCTION 1: TRANSCRIBE AUDIO
// ============================================================================

/**
 * Transcribe audio from Firebase Storage using Google Cloud Speech-to-Text
 *
 * Request:
 *   {
 *     audioUrl: string (Firebase Storage download URL),
 *     languageCode: string (e.g. 'en-US')
 *   }
 *
 * Response:
 *   {
 *     transcript: string,
 *     confidence: number (0-1),
 *     wordCount: number
 *   }
 */
exports.transcribeAudio = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { audioUrl, languageCode = 'en-US' } = data;

  if (!audioUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'audioUrl is required');
  }

  try {
    // Fetch audio from Firebase Storage
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.buffer();
    const audioBase64 = audioBuffer.toString('base64');

    // Prepare Speech-to-Text API request
    const speechApiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_API_KEY || ''}`;

    const speechPayload = {
      config: {
        encoding: 'WEBM_OPUS',
        languageCode: languageCode,
        model: 'latest_long'
      },
      audio: {
        content: audioBase64
      }
    };

    // Call Speech-to-Text API
    const speechResponse = await fetch(speechApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(speechPayload)
    });

    if (!speechResponse.ok) {
      throw new Error(`Speech-to-Text API failed: ${speechResponse.statusText}`);
    }

    const speechResult = await speechResponse.json();

    // Extract transcript and confidence
    let transcript = '';
    let confidence = 0;

    if (speechResult.results && speechResult.results.length > 0) {
      const results = speechResult.results;
      const alternatives = results[results.length - 1].alternatives;

      if (alternatives && alternatives.length > 0) {
        transcript = alternatives[0].transcript || '';
        confidence = alternatives[0].confidence || 0;
      }
    }

    const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

    return {
      transcript,
      confidence,
      wordCount
    };
  } catch (error) {
    console.error('Transcription error:', error);
    throw new functions.https.HttpsError('internal', `Transcription failed: ${error.message}`);
  }
});

// ============================================================================
// FUNCTION 2: ANALYZE WITH GEMINI
// ============================================================================

/**
 * Analyze transcript with Google Gemini 2.0 Flash
 *
 * Request:
 *   {
 *     transcript: string,
 *     mode: 'date' | 'business',
 *     traitDefinitions: array of trait objects
 *   }
 *
 * Response:
 *   {
 *     overallScore: number,
 *     summary: string,
 *     traits: array,
 *     interests: { likes, dislikes, mentions, keyInsights }
 *   }
 */
exports.analyzeWithGemini = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { transcript, mode = 'date', traitDefinitions = [] } = data;

  if (!transcript) {
    throw new functions.https.HttpsError('invalid-argument', 'transcript is required');
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Build trait definitions string
    const traitsText = traitDefinitions
      .map(t => `- ${t.label} (${t.key}): ${t.description}`)
      .join('\n');

    const modePrompt = mode === 'business'
      ? 'This is a sales/business conversation. Also extract: dealStage, nextSteps, objections.'
      : 'This is a dating conversation.';

    const prompt = `You are an expert conversation analyst. Analyze this transcript for AI dating/sales coaching.

TRANSCRIPT:
${transcript}

MODE: ${modePrompt}

TRAITS TO SCORE (0-100 scale):
${traitsText}

For EACH trait, provide:
1. A score (0-100)
2. A 1-2 sentence evidence note
3. Relevant quote(s) if applicable

Also extract:
- Overall quality score (0-100)
- Summary (2-3 sentences)
- Interests: likes, dislikes, mentions, key insights
${mode === 'business' ? '- Deal stage\n- Next steps (as array)\n- Objections raised (as array)' : ''}

Respond in this JSON format only:
{
  "overallScore": number,
  "summary": "string",
  "traits": [
    {
      "key": "string",
      "score": number,
      "notes": "string",
      "quote": "string or null"
    }
  ],
  "interests": {
    "likes": ["string"],
    "dislikes": ["string"],
    "mentions": ["string"],
    "keyInsights": ["string"]
  }
  ${mode === 'business' ? ', "dealStage": "string", "nextSteps": ["string"], "objections": ["string"]' : ''}
}`;

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048
      }
    };

    const geminiResponse = await fetch(`${geminiUrl}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API failed: ${geminiResponse.statusText}`);
    }

    const geminiResult = await geminiResponse.json();

    if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const responseText = geminiResult.candidates[0].content.parts[0].text;

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini response as JSON');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    return {
      overallScore: analysisResult.overallScore,
      summary: analysisResult.summary,
      traits: analysisResult.traits,
      interests: analysisResult.interests,
      dealStage: analysisResult.dealStage || null,
      nextSteps: analysisResult.nextSteps || [],
      objections: analysisResult.objections || [],
      availabilityChecked: true
    };
  } catch (error) {
    console.error('Gemini analysis error:', error);
    throw new functions.https.HttpsError('internal', `Gemini analysis failed: ${error.message}`);
  }
});

// ============================================================================
// FUNCTION 3: ANALYZE WITH CLAUDE
// ============================================================================

/**
 * Analyze transcript with Claude Sonnet 4
 * Same structure as Gemini, but using Anthropic API
 *
 * Gracefully handles missing API key
 */
exports.analyzeWithClaude = functions.https.onCall(async (data, context) => {
  const authUser = await getAuthUser(data, context);
  if (!authUser) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const payload = data && data.data ? data.data : data;
  const { transcript, mode = 'date', traitDefinitions = [] } = payload;

  if (!transcript) {
    throw new functions.https.HttpsError('invalid-argument', 'transcript is required');
  }

  try {
    const claudeKey = process.env.ANTHROPIC_API_KEY;

    // Gracefully handle missing API key
    if (!claudeKey) {
      return {
        available: false,
        reason: 'Anthropic API key not configured'
      };
    }

    // Build trait definitions string
    const traitsText = traitDefinitions
      .map(t => `- ${t.label} (${t.key}): ${t.description}`)
      .join('\n');

    const modePrompt = mode === 'business'
      ? 'This is a sales/business conversation. Also extract: dealStage, nextSteps, objections.'
      : 'This is a dating conversation.';

    const prompt = `You are an expert conversation analyst. Analyze this transcript for AI dating/sales coaching.

TRANSCRIPT:
${transcript}

MODE: ${modePrompt}

TRAITS TO SCORE (0-100 scale):
${traitsText}

For EACH trait, provide:
1. A score (0-100)
2. A 1-2 sentence evidence note
3. Relevant quote(s) if applicable

Also extract:
- Overall quality score (0-100)
- Summary (2-3 sentences)
- Interests: likes, dislikes, mentions, key insights
${mode === 'business' ? '- Deal stage\n- Next steps (as array)\n- Objections raised (as array)' : ''}

Respond in this JSON format only:
{
  "overallScore": number,
  "summary": "string",
  "traits": [
    {
      "key": "string",
      "score": number,
      "notes": "string",
      "quote": "string or null"
    }
  ],
  "interests": {
    "likes": ["string"],
    "dislikes": ["string"],
    "mentions": ["string"],
    "keyInsights": ["string"]
  }
  ${mode === 'business' ? ', "dealStage": "string", "nextSteps": ["string"], "objections": ["string"]' : ''}
}`;

    const claudeUrl = 'https://api.anthropic.com/v1/messages';

    const claudePayload = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const claudeResponse = await fetch(claudeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(claudePayload)
    });

    if (!claudeResponse.ok) {
      throw new Error(`Claude API failed: ${claudeResponse.statusText}`);
    }

    const claudeResult = await claudeResponse.json();

    if (!claudeResult.content || claudeResult.content.length === 0) {
      throw new Error('No response from Claude');
    }

    const responseText = claudeResult.content[0].text;

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Claude response as JSON');
    }

    const analysisResult = JSON.parse(jsonMatch[0]);

    return {
      overallScore: analysisResult.overallScore,
      summary: analysisResult.summary,
      traits: analysisResult.traits,
      interests: analysisResult.interests,
      dealStage: analysisResult.dealStage || null,
      nextSteps: analysisResult.nextSteps || [],
      objections: analysisResult.objections || [],
      availabilityChecked: true
    };
  } catch (error) {
    console.error('Claude analysis error:', error);
    throw new functions.https.HttpsError('internal', `Claude analysis failed: ${error.message}`);
  }
});

// ============================================================================
// FUNCTION 4: MERGE ANALYSIS
// ============================================================================

/**
 * Merge analysis results from Gemini and Claude
 * Averages scores and combines insights based on confidence
 *
 * Request:
 *   {
 *     geminiResult: object,
 *     claudeResult: object | null
 *   }
 *
 * Response:
 *   Merged analysis object with confidenceLevel
 */
exports.mergeAnalysis = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { geminiResult, claudeResult = null } = data;

  if (!geminiResult) {
    throw new functions.https.HttpsError('invalid-argument', 'geminiResult is required');
  }

  try {
    // If only Gemini available, use it with medium confidence
    if (!claudeResult || !claudeResult.availabilityChecked || claudeResult.available === false) {
      return {
        ...geminiResult,
        traits: (geminiResult.traits || []).map(trait => ({
          ...trait,
          confidenceLevel: 'medium'
        })),
        mergedFrom: 'gemini_only'
      };
    }

    // Merge trait scores
    const mergedTraits = {};

    // Index traits by key from both results
    const geminiTraits = {};
    const claudeTraits = {};

    (geminiResult.traits || []).forEach(t => {
      geminiTraits[t.key] = t;
    });

    (claudeResult.traits || []).forEach(t => {
      claudeTraits[t.key] = t;
    });

    // Merge each trait
    const allTraitKeys = new Set([
      ...Object.keys(geminiTraits),
      ...Object.keys(claudeTraits)
    ]);

    for (const key of allTraitKeys) {
      const gTrait = geminiTraits[key];
      const cTrait = claudeTraits[key];

      if (gTrait && cTrait) {
        // Both AIs scored this trait
        const avgScore = Math.round((gTrait.score + cTrait.score) / 2);
        const scoreDiff = Math.abs(gTrait.score - cTrait.score);

        let confidenceLevel = 'high';
        if (scoreDiff > 30) confidenceLevel = 'low';
        else if (scoreDiff > 15) confidenceLevel = 'medium';

        mergedTraits[key] = {
          key,
          score: avgScore,
          notes: gTrait.notes || cTrait.notes,
          quote: gTrait.quote || cTrait.quote,
          geminiScore: gTrait.score,
          claudeScore: cTrait.score,
          confidenceLevel
        };
      } else if (gTrait) {
        // Only Gemini scored this
        mergedTraits[key] = {
          ...gTrait,
          geminiScore: gTrait.score,
          claudeScore: null,
          confidenceLevel: 'medium'
        };
      } else {
        // Only Claude scored this
        mergedTraits[key] = {
          ...cTrait,
          geminiScore: null,
          claudeScore: cTrait.score,
          confidenceLevel: 'medium'
        };
      }
    }

    // Merge overall score
    const overallScore = Math.round(
      (geminiResult.overallScore + claudeResult.overallScore) / 2
    );

    // Combine interests (union of both)
    const mergedInterests = {
      likes: Array.from(new Set([
        ...(geminiResult.interests?.likes || []),
        ...(claudeResult.interests?.likes || [])
      ])),
      dislikes: Array.from(new Set([
        ...(geminiResult.interests?.dislikes || []),
        ...(claudeResult.interests?.dislikes || [])
      ])),
      mentions: Array.from(new Set([
        ...(geminiResult.interests?.mentions || []),
        ...(claudeResult.interests?.mentions || [])
      ])),
      keyInsights: Array.from(new Set([
        ...(geminiResult.interests?.keyInsights || []),
        ...(claudeResult.interests?.keyInsights || [])
      ]))
    };

    return {
      overallScore,
      summary: geminiResult.summary || claudeResult.summary,
      traits: Object.values(mergedTraits),
      interests: mergedInterests,
      dealStage: geminiResult.dealStage || claudeResult.dealStage || null,
      nextSteps: Array.from(new Set([
        ...(geminiResult.nextSteps || []),
        ...(claudeResult.nextSteps || [])
      ])),
      objections: Array.from(new Set([
        ...(geminiResult.objections || []),
        ...(claudeResult.objections || [])
      ])),
      mergedFrom: 'both'
    };
  } catch (error) {
    console.error('Merge analysis error:', error);
    throw new functions.https.HttpsError('internal', `Merge failed: ${error.message}`);
  }
});


// ============================================================================
// FUNCTION 5: TRANSCRIBE VOICE SAMPLE
// ============================================================================

/**
 * Transcribe a voice sample from Firebase Storage
 * Same as transcribeAudio but saves result back to the voiceSample doc
 *
 * Request:
 *   {
 *     userId: string,
 *     contactId: string,
 *     sampleId: string,
 *     audioUrl: string,
 *     languageCode: string (default 'en-US')
 *   }
 *
 * Response:
 *   { transcript, confidence, wordCount }
 */
exports.transcribeVoiceSample = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, contactId, sampleId, audioUrl, languageCode = 'en-US' } = data;

  if (!audioUrl || !userId || !contactId || !sampleId) {
    throw new functions.https.HttpsError('invalid-argument', 'audioUrl, userId, contactId, sampleId required');
  }

  // Verify caller owns this data
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot access other users data');
  }

  try {
    // Mark as processing
    const sampleRef = admin.firestore()
      .doc(`users/${userId}/contacts/${contactId}/voiceSamples/${sampleId}`);
    await sampleRef.update({ transcriptionStatus: 'processing' });

    // Fetch audio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.buffer();
    const audioBase64 = audioBuffer.toString('base64');

    // Call Speech-to-Text
    const speechApiUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${process.env.GOOGLE_CLOUD_API_KEY || ''}`;

    const speechPayload = {
      config: {
        encoding: 'WEBM_OPUS',
        languageCode,
        model: 'latest_long',
        enableWordTimeOffsets: true,        // Get word timestamps for clip extraction
        enableWordConfidence: true,
        enableAutomaticPunctuation: true
      },
      audio: { content: audioBase64 }
    };

    const speechResponse = await fetch(speechApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(speechPayload)
    });

    if (!speechResponse.ok) {
      throw new Error(`Speech-to-Text API failed: ${speechResponse.statusText}`);
    }

    const speechResult = await speechResponse.json();

    let transcript = '';
    let confidence = 0;

    if (speechResult.results && speechResult.results.length > 0) {
      // Concatenate all result segments
      transcript = speechResult.results
        .map(r => r.alternatives?.[0]?.transcript || '')
        .join(' ')
        .trim();

      // Average confidence across segments
      const confidences = speechResult.results
        .map(r => r.alternatives?.[0]?.confidence || 0)
        .filter(c => c > 0);
      confidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;
    }

    const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

    // Save transcript back to the voice sample doc
    await sampleRef.update({
      transcript,
      transcriptionStatus: 'completed',
      transcriptionConfidence: confidence,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { transcript, confidence, wordCount };
  } catch (error) {
    console.error('Voice sample transcription error:', error);

    // Mark as failed
    try {
      const sampleRef = admin.firestore()
        .doc(`users/${userId}/contacts/${contactId}/voiceSamples/${sampleId}`);
      await sampleRef.update({ transcriptionStatus: 'failed' });
    } catch (_) {}

    throw new functions.https.HttpsError('internal', `Transcription failed: ${error.message}`);
  }
});


// ============================================================================
// FUNCTION 6: ANALYZE VOICE PSYCHOLOGY
// ============================================================================

/**
 * Psychological voice analysis using Gemini 2.0 Flash
 * Analyzes transcript + voice characteristics to produce:
 *   - Voice personality indicators (tone, pace, energy, emotion)
 *   - Sarcasm / passive-aggression detection
 *   - Trait score modifiers (adjustments to the 37 DateIQ traits based on voice cues)
 *   - Verbal-vocal consistency score
 *   - Red/green flags from voice patterns
 *
 * Request:
 *   {
 *     userId: string,
 *     contactId: string,
 *     sampleId: string,
 *     transcript: string,
 *     mode: 'date' | 'business',
 *     traitKeys: string[] (list of trait keys to generate modifiers for)
 *   }
 *
 * Response:
 *   Full voice analysis object (saved to Firestore automatically)
 */
exports.analyzeVoicePsychology = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, contactId, sampleId, transcript, mode = 'date', traitKeys = [] } = data;

  if (!transcript || !userId || !contactId || !sampleId) {
    throw new functions.https.HttpsError('invalid-argument', 'transcript, userId, contactId, sampleId required');
  }

  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Cannot access other users data');
  }

  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Mark as processing
    const sampleRef = admin.firestore()
      .doc(`users/${userId}/contacts/${contactId}/voiceSamples/${sampleId}`);
    await sampleRef.update({ 'voiceAnalysis.status': 'processing' });

    // Build the trait keys list for modifier generation
    const traitKeysText = traitKeys.length > 0
      ? traitKeys.map(k => `  - ${k}`).join('\n')
      : '  (use all 37 DateIQ traits)';

    const prompt = `You are an expert forensic psychologist and voice analysis specialist.
You are analyzing a transcript of a recorded conversation for psychological trait indicators.

Your job is to analyze HOW the person speaks (word choice, sentence structure, speech patterns,
emotional undertones, hedging, dominance signals, deflection, etc.) to produce a psychological
voice profile. This is NOT about what they say — it's about WHAT THEIR SPEECH PATTERNS REVEAL
about their personality.

TRANSCRIPT:
${transcript}

MODE: ${mode === 'business' ? 'Sales/business conversation' : 'Dating conversation'}

Analyze the following dimensions and return JSON:

1. VOICE CHARACTERISTICS:
   - tone: one of "warm", "cold", "nervous", "confident", "aggressive", "defensive", "charming", "monotone", "enthusiastic"
   - pace: one of "slow", "moderate", "fast", "erratic"
   - pitch: one of "low", "moderate", "high", "variable"
   - energy: one of "low", "moderate", "high"
   - emotionalState: one of "calm", "anxious", "excited", "angry", "sad", "guarded", "playful", "dismissive", "flirtatious"

2. DETECTION FLAGS:
   - sarcasmDetected: boolean — look for incongruent statements, ironic phrasing
   - passiveAggressionDetected: boolean — look for indirect hostility, backhanded compliments

3. PSYCHOLOGICAL INDICATORS (0-100 each):
   - dominanceLevel: how much they control/steer the conversation
   - anxietyMarkers: nervous speech patterns, hedging, filler words, self-correction
   - authenticityScore: consistency, natural flow vs rehearsed/performative speech
   - empathyIndicators: active listening cues, emotional mirroring, validation
   - aggressionMarkers: interruption patterns, dismissive language, verbal attacks
   - confidenceLevel: assertive statements, decisive language, comfort with silence

4. VERBAL-VOCAL CONSISTENCY (0-100):
   Does what they're saying match HOW they're saying it? 100 = perfectly aligned,
   0 = completely contradictory (e.g., saying "I'm fine" with hostile undertones)

5. INCONSISTENCY FLAGS:
   Array of specific moments where voice/word patterns contradict each other.
   Example: "Claims to be supportive but uses dismissive language ('whatever', 'sure')"

6. VOICE TRAIT MODIFIERS:
   For each of these trait keys, provide a modifier (-15 to +15) that adjusts the
   base text-analysis score based on voice patterns. Positive = voice suggests
   higher score, negative = voice suggests lower score.

   Trait keys to analyze:
${traitKeysText}

   For each trait, provide:
   - modifier: number (-15 to +15)
   - reason: why voice analysis suggests this adjustment (1 sentence)
   - confidence: 0-1 how confident in this voice-based modifier

7. RED FLAGS: Array of voice-pattern concerns (e.g., "Love-bombing speech pattern detected",
   "Excessive flattery may indicate manipulation")

8. GREEN FLAGS: Array of voice-pattern positives (e.g., "Natural conversational flow suggests authenticity",
   "Active listening patterns indicate genuine empathy")

9. VOICE PERSONALITY SUMMARY: 2-3 sentences summarizing what their voice patterns reveal
   about their personality. Be specific and evidence-based.

Respond in this exact JSON format:
{
  "tone": "string",
  "pace": "string",
  "pitch": "string",
  "energy": "string",
  "emotionalState": "string",
  "sarcasmDetected": boolean,
  "passiveAggressionDetected": boolean,
  "psychologicalIndicators": {
    "dominanceLevel": number,
    "anxietyMarkers": number,
    "authenticityScore": number,
    "empathyIndicators": number,
    "aggressionMarkers": number,
    "confidenceLevel": number
  },
  "verbalVocalConsistency": number,
  "inconsistencyFlags": ["string"],
  "voiceTraitModifiers": {
    "traitKey": {
      "modifier": number,
      "reason": "string",
      "confidence": number
    }
  },
  "redFlags": ["string"],
  "greenFlags": ["string"],
  "voicePersonalitySummary": "string",
  "analysisConfidence": number
}`;

    const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

    const geminiPayload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 4096
      }
    };

    const geminiResponse = await fetch(`${geminiUrl}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API failed: ${geminiResponse.statusText}`);
    }

    const geminiResult = await geminiResponse.json();

    if (!geminiResult.candidates || geminiResult.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const responseText = geminiResult.candidates[0].content.parts[0].text;

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse Gemini voice analysis response');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Save analysis to the voice sample doc
    const voiceAnalysisData = {
      status: 'completed',
      analyzedAt: admin.firestore.FieldValue.serverTimestamp(),
      tone: analysis.tone || '',
      pace: analysis.pace || '',
      pitch: analysis.pitch || '',
      energy: analysis.energy || '',
      emotionalState: analysis.emotionalState || '',
      sarcasmDetected: analysis.sarcasmDetected || false,
      passiveAggressionDetected: analysis.passiveAggressionDetected || false,
      psychologicalIndicators: analysis.psychologicalIndicators || {},
      verbalVocalConsistency: analysis.verbalVocalConsistency || 50,
      inconsistencyFlags: analysis.inconsistencyFlags || [],
      voiceTraitModifiers: analysis.voiceTraitModifiers || {},
      redFlags: analysis.redFlags || [],
      greenFlags: analysis.greenFlags || [],
      voicePersonalitySummary: analysis.voicePersonalitySummary || '',
      analysisConfidence: analysis.analysisConfidence || 0.5
    };

    await sampleRef.update({
      voiceAnalysis: voiceAnalysisData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return voiceAnalysisData;
  } catch (error) {
    console.error('Voice psychology analysis error:', error);

    // Mark as failed
    try {
      const sampleRef = admin.firestore()
        .doc(`users/${userId}/contacts/${contactId}/voiceSamples/${sampleId}`);
      await sampleRef.update({ 'voiceAnalysis.status': 'failed' });
    } catch (_) {}

    throw new functions.https.HttpsError('internal', `Voice analysis failed: ${error.message}`);
  }
});
