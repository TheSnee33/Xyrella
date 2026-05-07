/**
 * Xyrella v1.5 Firebase Schema
 * Database structure for Xyrella (DateIQ + BusinessIQ)
 * Project: xyrella-5f994
 *
 * Key Features:
 * - Isolated contact profiles with separate sessions and data
 * - Per-contact trait aggregation
 * - Multi-AI analysis (Gemini + Claude) with confidence scoring
 * - Separate storage for audio and voice profiles
 * - Scalable sub-collection structure
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// ============================================================================
// SCHEMA DEFINITIONS & TYPES
// ============================================================================

/**
 * User document structure
 */
export const UserSchema = {
  email: 'string',
  displayName: 'string',
  igHandle: 'string | null',
  phone: 'string | null',
  credits: {
    balance: 'number',           // Current credits
    totalPurchased: 'number',    // Total credits bought
    totalEarned: 'number',       // Total from referrals
    totalSpent: 'number'         // Total used
  },
  referral: {
    code: 'string',              // Unique referral code
    referredBy: 'string | null', // ID of referrer
    referralCount: 'number',     // # of successful referrals
    creditsEarned: 'number'      // Total from referrals
  },
  voiceProfile: {
    trained: 'boolean',
    sampleCount: 'number',
    trainedAt: 'timestamp | null'
  },
  coachingPrefs: {
    bluetoothEnabled: 'boolean',
    volume: 'number',            // 0-100
    frequency: 'string',         // 'daily', 'weekly', 'monthly'
    voice: 'string'              // 'male', 'female', etc.
  },
  subscription: {
    plan: 'string',              // 'free', 'pro', 'premium'
    status: 'string',            // 'active', 'cancelled', 'expired'
    expiresAt: 'timestamp | null'
  },
  disclaimersAccepted: 'boolean',
  disclaimerAcceptedAt: 'timestamp | null',
  createdAt: 'timestamp',
  lastActive: 'timestamp'
};

/**
 * Contact document structure (nested under users/{userId}/contacts/{contactId})
 */
export const ContactSchema = {
  name: 'string',
  mode: 'string',                // 'date' | 'business'
  createdAt: 'timestamp',
  lastSessionAt: 'timestamp | null',
  sessionCount: 'number',
  avatarEmoji: 'string',         // '💘', '💼', etc.
  tags: 'string[]',              // ['hot lead', 'second date']
  notes: 'string',               // Free-form user notes

  aggregatedTraits: {
    // [traitKey]: {
    //   avgScore: number,
    //   sessionCount: number,
    //   trend: 'up' | 'down' | 'stable'
    // }
  },

  interests: {
    likes: 'string[]',
    dislikes: 'string[]',
    mentions: 'string[]'
  }
};

/**
 * Session document structure
 * (nested under users/{userId}/contacts/{contactId}/sessions/{sessionId})
 */
export const SessionSchema = {
  contactId: 'string',
  userId: 'string',
  mode: 'string',                // 'date' | 'business'
  context: 'string',             // User-provided context

  date: 'string',                // 'YYYY-MM-DD'
  createdAt: 'timestamp',
  duration: 'string',            // 'MM:SS' format
  durationSeconds: 'number',

  audioRef: 'string',            // Firebase Storage path
  audioUrl: 'string | null',     // Download URL
  transcript: 'string',

  transcriptionMethod: 'string', // 'live' | 'uploaded' | 'pasted'
  overallScore: 'number',        // 0-100
  summary: 'string',

  reportUnlocked: 'boolean',
  creditsCost: 'number',
  traitCount: 'number',

  modelVersion: 'string',        // e.g. '1.5'
  aiModelsUsed: 'string[]',      // ['gemini-2.0-flash', 'claude-sonnet-4']

  interests: {
    likes: 'string[]',
    dislikes: 'string[]',
    mentions: 'string[]',
    keyInsights: 'string[]'
  },

  dealStage: 'string | null',    // BusinessIQ only
  nextSteps: 'string[]',         // BusinessIQ only
  objections: 'string[]'         // BusinessIQ only
};

/**
 * TraitScore document structure
 * (nested under users/{userId}/contacts/{contactId}/sessions/{sessionId}/traitScores/{traitKey})
 */
export const TraitScoreSchema = {
  traitKey: 'string',
  label: 'string',
  category: 'string',            // 'communication', 'personality', 'interest', 'emotional'

  score: 'number',               // Final merged score 0-100
  maxScore: 'number',            // Always 100
  scoreColor: 'string',          // Hex color
  scoreLabel: 'string',          // e.g. 'High', 'Low', 'Balanced'
  notes: 'string',               // Evidence-based note

  geminiScore: 'number',         // Individual Gemini score
  claudeScore: 'number | null',  // Individual Claude score (may be null)
  confidenceLevel: 'string',     // 'high' | 'medium' | 'low'

  idealLabel: 'string',          // For polar traits (e.g. "Outgoing")
  worstLabel: 'string',          // For polar traits (e.g. "Introverted")

  lowLabel: 'string',            // For balanced traits (e.g. "Low")
  midLabel: 'string',            // For balanced traits (e.g. "Moderate")
  highLabel: 'string',           // For balanced traits (e.g. "High")
  zoneLabel: 'string',           // User-friendly zone name

  clips: [
    {
      timestampStart: 'number',  // Seconds
      timestampEnd: 'number',
      quote: 'string',
      significance: 'string'     // Why this quote matters
    }
  ]
};

/**
 * Voice Sample document
 * (nested under users/{userId}/contacts/{contactId}/voiceSamples/{sampleId})
 *
 * Stores individual audio recordings for voice profiling and replay
 */
export const VoiceSampleSchema = {
  contactId: 'string',
  userId: 'string',
  sessionId: 'string | null',       // Links to session if from a recorded session
  label: 'string',                   // User-given label: 'first date call', 'phone convo 3/15'

  audioRef: 'string',               // Firebase Storage path
  audioUrl: 'string | null',        // Download URL for replay
  duration: 'number',               // Duration in seconds
  format: 'string',                 // 'webm', 'mp3', 'wav', 'm4a'
  sizeBytes: 'number',

  transcript: 'string | null',      // Full text transcript (from Speech-to-Text)
  transcriptionStatus: 'string',    // 'pending' | 'processing' | 'completed' | 'failed'
  transcriptionConfidence: 'number', // 0-1 from Speech-to-Text

  voiceAnalysis: {
    status: 'string',               // 'pending' | 'processing' | 'completed' | 'failed'
    analyzedAt: 'timestamp | null',

    // Acoustic / prosodic features extracted by AI
    tone: 'string',                  // 'warm', 'cold', 'nervous', 'confident', 'aggressive', etc.
    pace: 'string',                  // 'slow', 'moderate', 'fast', 'erratic'
    pitch: 'string',                 // 'low', 'moderate', 'high', 'variable'
    energy: 'string',               // 'low', 'moderate', 'high'
    emotionalState: 'string',       // 'calm', 'anxious', 'excited', 'angry', 'sad', etc.
    sarcasmDetected: 'boolean',
    passiveAggressionDetected: 'boolean',

    // AI-generated voice personality summary
    voicePersonalitySummary: 'string',  // 2-3 sentence summary of what voice reveals
    redFlags: 'string[]',              // Voice-specific concerns
    greenFlags: 'string[]',           // Voice-specific positives

    // Confidence in voice-based analysis
    analysisConfidence: 'number'     // 0-1
  },

  createdAt: 'timestamp',
  updatedAt: 'timestamp'
};

/**
 * Voice Profile document
 * (nested under users/{userId}/contacts/{contactId}/voiceProfile — single doc)
 *
 * Aggregated voice analysis across all samples for a contact
 */
export const VoiceProfileSchema = {
  contactId: 'string',
  userId: 'string',
  sampleCount: 'number',
  totalDuration: 'number',           // Total seconds of audio analyzed
  lastUpdated: 'timestamp',

  // Aggregated voice characteristics
  dominantTone: 'string',
  dominantPace: 'string',
  dominantPitch: 'string',
  dominantEnergy: 'string',
  emotionalRange: 'string[]',       // All detected emotional states across samples

  // Voice-derived trait modifiers (adjustments to trait scores based on voice)
  // These get merged into the main trait scoring pipeline
  voiceTraitModifiers: {
    // [traitKey]: {
    //   modifier: number,            // -15 to +15 adjustment to base score
    //   reason: string,              // Why voice analysis suggests this adjustment
    //   confidence: number,          // 0-1
    //   sampleCount: number          // How many samples informed this
    // }
  },

  // Overall voice-based psychological indicators
  psychologicalIndicators: {
    dominanceLevel: 'number',        // 0-100: vocal dominance patterns
    anxietyMarkers: 'number',        // 0-100: vocal stress indicators
    authenticityScore: 'number',     // 0-100: voice consistency/genuineness
    empathyIndicators: 'number',     // 0-100: vocal warmth/mirroring
    aggressionMarkers: 'number',     // 0-100: hostile vocal patterns
    confidenceLevel: 'number'        // 0-100: vocal confidence cues
  },

  // Consistency tracking: does their voice match their words?
  verbalVocalConsistency: 'number',  // 0-100: how aligned voice tone is with content
  inconsistencyFlags: 'string[]',    // Specific moments where voice contradicted words

  profileSummary: 'string'          // AI-generated overall voice profile narrative
};

/**
 * Waitlist document (public, no authentication required for creation)
 */
export const WaitlistSchema = {
  email: 'string',
  name: 'string | null',
  phone: 'string | null',
  source: 'string',              // 'organic', 'referral', 'ad', etc.
  timestamp: 'timestamp'
};

// ============================================================================
// INDEX DEFINITIONS
// ============================================================================

/**
 * Recommended Firestore composite indexes:
 *
 * 1. users/{userId}/contacts/{contactId}/sessions
 *    - Collection: sessions
 *    - Fields: createdAt (Desc), reportUnlocked (Asc)
 *    - Filter: reportUnlocked == true, ordered by createdAt
 *
 * 2. users/{userId}/contacts/{contactId}/sessions
 *    - Collection: sessions
 *    - Fields: date (Desc)
 *    - For: Browsing sessions by date
 *
 * 3. users (global)
 *    - Collection: users
 *    - Fields: createdAt (Desc)
 *    - For: Admin analytics
 *
 * 4. waitlist (global)
 *    - Collection: waitlist
 *    - Fields: timestamp (Desc)
 *    - For: Monitoring signups
 */

export const CompositeIndexes = [
  {
    collection: 'users/{userId}/contacts/{contactId}/sessions',
    fields: [
      { fieldPath: 'createdAt', order: 'DESCENDING' },
      { fieldPath: 'reportUnlocked', order: 'ASCENDING' }
    ]
  },
  {
    collection: 'users/{userId}/contacts/{contactId}/sessions',
    fields: [
      { fieldPath: 'date', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'users',
    fields: [
      { fieldPath: 'createdAt', order: 'DESCENDING' }
    ]
  },
  {
    collection: 'waitlist',
    fields: [
      { fieldPath: 'timestamp', order: 'DESCENDING' }
    ]
  }
];

// ============================================================================
// FIREBASE INITIALIZATION & HELPERS
// ============================================================================

/**
 * Initialize Firebase (call once at app startup)
 */
export function initializeFirebase(config) {
  const app = initializeApp(config);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  return { app, db, storage, auth };
}

/**
 * Get all collections and subcollections for a user (useful for debugging/export)
 */
export async function getUserData(db, userId) {
  const userRef = doc(db, 'users', userId);
  const userData = await getDoc(userRef);

  if (!userData.exists()) {
    return null;
  }

  const contactsSnap = await getDocs(collection(userRef, 'contacts'));
  const contacts = {};

  for (const contactSnap of contactsSnap.docs) {
    const contactId = contactSnap.id;
    const contactData = contactSnap.data();

    const sessionsSnap = await getDocs(collection(contactSnap.ref, 'sessions'));
    const sessions = {};

    for (const sessionSnap of sessionsSnap.docs) {
      const sessionId = sessionSnap.id;
      const sessionData = sessionSnap.data();

      const traitsSnap = await getDocs(collection(sessionSnap.ref, 'traitScores'));
      const traits = {};

      for (const traitSnap of traitsSnap.docs) {
        traits[traitSnap.id] = traitSnap.data();
      }

      sessions[sessionId] = {
        ...sessionData,
        traitScores: traits
      };
    }

    contacts[contactId] = {
      ...contactData,
      sessions
    };
  }

  return {
    ...userData.data(),
    contacts
  };
}

// ============================================================================
// SAVE HELPER FUNCTIONS
// ============================================================================

/**
 * Create or update a user
 */
export async function saveUser(db, userId, userData) {
  const userRef = doc(db, 'users', userId);
  const now = serverTimestamp();

  const dataWithTimestamps = {
    ...userData,
    lastActive: now,
    createdAt: userData.createdAt || now
  };

  await setDoc(userRef, dataWithTimestamps, { merge: true });
  return userRef;
}

/**
 * Create or update a contact for a user
 */
export async function saveContact(db, userId, contactId, contactData) {
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  const now = serverTimestamp();

  const dataWithTimestamps = {
    ...contactData,
    createdAt: contactData.createdAt || now
  };

  await setDoc(contactRef, dataWithTimestamps, { merge: true });
  return contactRef;
}

/**
 * Create a new session for a contact
 * Also updates contact's sessionCount and lastSessionAt
 */
export async function saveSession(db, userId, contactId, sessionId, sessionData) {
  const sessionRef = doc(db, 'users', userId, 'contacts', contactId, 'sessions', sessionId);
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  const now = serverTimestamp();

  const dataWithTimestamps = {
    ...sessionData,
    userId,
    contactId,
    createdAt: sessionData.createdAt || now
  };

  // Use batch to ensure contact stats stay in sync
  const batch = writeBatch(db);
  batch.set(sessionRef, dataWithTimestamps, { merge: true });
  batch.update(contactRef, {
    lastSessionAt: now,
    sessionCount: increment(1)
  });

  await batch.commit();
  return sessionRef;
}

/**
 * Save trait scores for a session
 * Replaces all existing trait scores for this session
 */
export async function saveTraitScores(db, userId, contactId, sessionId, traitScoresMap) {
  const sessionRef = doc(db, 'users', userId, 'contacts', contactId, 'sessions', sessionId);
  const batch = writeBatch(db);

  // Save each trait score
  for (const [traitKey, traitData] of Object.entries(traitScoresMap)) {
    const traitRef = doc(sessionRef, 'traitScores', traitKey);
    batch.set(traitRef, {
      traitKey,
      ...traitData
    }, { merge: true });
  }

  // Update session's trait count and overall score
  const scores = Object.values(traitScoresMap).map(t => t.score);
  const overallScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  batch.update(sessionRef, {
    traitCount: Object.keys(traitScoresMap).length,
    overallScore
  });

  await batch.commit();
}

/**
 * Update aggregated traits for a contact based on all its sessions
 * Should be called after adding/updating sessions
 */
export async function updateContactAggregatedTraits(db, userId, contactId) {
  const sessionRef = collection(db, 'users', userId, 'contacts', contactId, 'sessions');
  const sessionsSnap = await getDocs(sessionRef);

  const traitTotals = {};
  const sessionCounts = {};

  // Aggregate scores across all sessions
  for (const sessionSnap of sessionsSnap.docs) {
    const traitsRef = collection(sessionSnap.ref, 'traitScores');
    const traitsSnap = await getDocs(traitsRef);

    for (const traitSnap of traitsSnap.docs) {
      const { traitKey, score } = traitSnap.data();
      if (!traitTotals[traitKey]) {
        traitTotals[traitKey] = { total: 0, count: 0, scores: [] };
      }
      traitTotals[traitKey].total += score;
      traitTotals[traitKey].count += 1;
      traitTotals[traitKey].scores.push(score);
    }
  }

  // Calculate trends and build aggregated traits object
  const aggregatedTraits = {};
  for (const [traitKey, data] of Object.entries(traitTotals)) {
    const avgScore = data.count > 0 ? data.total / data.count : 0;
    const scores = data.scores;

    // Simple trend: compare last score to average
    let trend = 'stable';
    if (scores.length >= 2) {
      const lastScore = scores[scores.length - 1];
      if (lastScore > avgScore + 5) trend = 'up';
      else if (lastScore < avgScore - 5) trend = 'down';
    }

    aggregatedTraits[traitKey] = {
      avgScore: Math.round(avgScore),
      sessionCount: data.count,
      trend
    };
  }

  // Save aggregated traits
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  await updateDoc(contactRef, {
    aggregatedTraits
  });
}

/**
 * Accumulate interests across all sessions for a contact
 * Merges likes, dislikes, mentions into contact-level interests
 */
export async function updateContactInterests(db, userId, contactId) {
  const sessionRef = collection(db, 'users', userId, 'contacts', contactId, 'sessions');
  const sessionsSnap = await getDocs(sessionRef);

  const allLikes = new Set();
  const allDislikes = new Set();
  const allMentions = new Set();

  for (const sessionSnap of sessionsSnap.docs) {
    const { interests } = sessionSnap.data();
    if (interests) {
      interests.likes?.forEach(item => allLikes.add(item));
      interests.dislikes?.forEach(item => allDislikes.add(item));
      interests.mentions?.forEach(item => allMentions.add(item));
    }
  }

  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  await updateDoc(contactRef, {
    'interests.likes': Array.from(allLikes),
    'interests.dislikes': Array.from(allDislikes),
    'interests.mentions': Array.from(allMentions)
  });
}

/**
 * Delete a contact and all its sessions/traits
 */
export async function deleteContact(db, userId, contactId) {
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  const sessionsRef = collection(contactRef, 'sessions');
  const sessionsSnap = await getDocs(sessionsRef);

  const batch = writeBatch(db);

  // Delete all trait scores and sessions
  for (const sessionSnap of sessionsSnap.docs) {
    const traitsRef = collection(sessionSnap.ref, 'traitScores');
    const traitsSnap = await getDocs(traitsRef);

    for (const traitSnap of traitsSnap.docs) {
      batch.delete(traitSnap.ref);
    }

    batch.delete(sessionSnap.ref);
  }

  // Delete contact
  batch.delete(contactRef);

  await batch.commit();
}

/**
 * Delete a session and all its trait scores
 */
export async function deleteSession(db, userId, contactId, sessionId) {
  const sessionRef = doc(db, 'users', userId, 'contacts', contactId, 'sessions', sessionId);
  const traitsRef = collection(sessionRef, 'traitScores');
  const traitsSnap = await getDocs(traitsRef);

  const batch = writeBatch(db);

  // Delete trait scores
  for (const traitSnap of traitsSnap.docs) {
    batch.delete(traitSnap.ref);
  }

  // Delete session
  batch.delete(sessionRef);

  // Update contact stats
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  batch.update(contactRef, {
    sessionCount: increment(-1)
  });

  await batch.commit();
}

/**
 * Add to user's credit balance
 */
export async function addCredits(db, userId, amount, reason) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    'credits.balance': increment(amount),
    'credits.totalEarned': increment(Math.max(amount, 0)),
    'credits.totalSpent': increment(Math.max(-amount, 0))
  });
}

/**
 * Add a tag to a contact
 */
export async function addContactTag(db, userId, contactId, tag) {
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  await updateDoc(contactRef, {
    tags: arrayUnion(tag)
  });
}

/**
 * Remove a tag from a contact
 */
export async function removeContactTag(db, userId, contactId, tag) {
  const contactRef = doc(db, 'users', userId, 'contacts', contactId);
  await updateDoc(contactRef, {
    tags: arrayRemove(tag)
  });
}

/**
 * Get all sessions for a contact, sorted by date (newest first)
 */
export async function getContactSessions(db, userId, contactId, limitCount = 50) {
  const q = query(
    collection(db, 'users', userId, 'contacts', contactId, 'sessions'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Get all contacts for a user, sorted by last session
 */
export async function getUserContacts(db, userId) {
  const snap = await getDocs(collection(db, 'users', userId, 'contacts'));
  return snap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => {
      const aTime = a.lastSessionAt?.toMillis() || 0;
      const bTime = b.lastSessionAt?.toMillis() || 0;
      return bTime - aTime;
    });
}

/**
 * Upload audio to Firebase Storage and get download URL
 */
export async function uploadAudio(storage, userId, contactId, sessionId, audioBlob, filename = 'audio.webm') {
  const audioPath = `users/${userId}/contacts/${contactId}/sessions/${sessionId}/${filename}`;
  const audioRef = ref(storage, audioPath);

  await uploadBytes(audioRef, audioBlob);

  // Get download URL
  const auth = getAuth();
  const token = await auth.currentUser?.getIdToken();

  return {
    audioRef: audioPath,
    audioUrl: `https://firebasestorage.googleapis.com/v0/b/xyrella-5f994.firebasestorage.app/o/${encodeURIComponent(audioPath)}?alt=media&token=${token}`
  };
}

/**
 * Delete audio from Firebase Storage
 */
export async function deleteAudio(storage, userId, contactId, sessionId, filename = 'audio.webm') {
  const audioPath = `users/${userId}/contacts/${contactId}/sessions/${sessionId}/${filename}`;
  const audioRef = ref(storage, audioPath);
  await deleteObject(audioRef);
}

/**
 * Fetch audio from Firebase Storage
 */
export async function getAudio(storage, userId, contactId, sessionId, filename = 'audio.webm') {
  const audioPath = `users/${userId}/contacts/${contactId}/sessions/${sessionId}/${filename}`;
  const audioRef = ref(storage, audioPath);
  return await getBytes(audioRef);
}

// ============================================================================
// VOICE SAMPLE & PROFILE FUNCTIONS
// ============================================================================

/**
 * Upload a voice sample for a contact
 * Stores audio in Firebase Storage, creates a voiceSample doc in Firestore
 */
export async function uploadVoiceSample(db, storage, userId, contactId, sampleId, audioBlob, metadata = {}) {
  const {
    label = 'Voice sample',
    format = 'webm',
    sessionId = null,
    duration = 0
  } = metadata;

  // Upload audio to Storage
  const audioPath = `users/${userId}/contacts/${contactId}/voiceSamples/${sampleId}.${format}`;
  const audioStorageRef = ref(storage, audioPath);
  await uploadBytes(audioStorageRef, audioBlob);

  const now = serverTimestamp();

  // Create Firestore doc
  const sampleRef = doc(db, 'users', userId, 'contacts', contactId, 'voiceSamples', sampleId);
  const sampleData = {
    contactId,
    userId,
    sessionId,
    label,
    audioRef: audioPath,
    audioUrl: `https://firebasestorage.googleapis.com/v0/b/xyrella-5f994.firebasestorage.app/o/${encodeURIComponent(audioPath)}?alt=media`,
    duration,
    format,
    sizeBytes: audioBlob.size || 0,
    transcript: null,
    transcriptionStatus: 'pending',
    transcriptionConfidence: 0,
    voiceAnalysis: {
      status: 'pending',
      analyzedAt: null,
      tone: '',
      pace: '',
      pitch: '',
      energy: '',
      emotionalState: '',
      sarcasmDetected: false,
      passiveAggressionDetected: false,
      voicePersonalitySummary: '',
      redFlags: [],
      greenFlags: [],
      analysisConfidence: 0
    },
    createdAt: now,
    updatedAt: now
  };

  await setDoc(sampleRef, sampleData);
  return { sampleRef, audioPath, sampleData };
}

/**
 * Get all voice samples for a contact, sorted newest first
 */
export async function getVoiceSamples(db, userId, contactId) {
  const q = query(
    collection(db, 'users', userId, 'contacts', contactId, 'voiceSamples'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Update a voice sample's analysis results
 */
export async function updateVoiceSampleAnalysis(db, userId, contactId, sampleId, analysisData) {
  const sampleRef = doc(db, 'users', userId, 'contacts', contactId, 'voiceSamples', sampleId);
  await updateDoc(sampleRef, {
    'voiceAnalysis': {
      ...analysisData,
      status: 'completed',
      analyzedAt: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
}

/**
 * Update a voice sample's transcript
 */
export async function updateVoiceSampleTranscript(db, userId, contactId, sampleId, transcript, confidence) {
  const sampleRef = doc(db, 'users', userId, 'contacts', contactId, 'voiceSamples', sampleId);
  await updateDoc(sampleRef, {
    transcript,
    transcriptionStatus: 'completed',
    transcriptionConfidence: confidence,
    updatedAt: serverTimestamp()
  });
}

/**
 * Build/rebuild a contact's aggregated voice profile from all their voice samples
 */
export async function rebuildVoiceProfile(db, userId, contactId) {
  const samples = await getVoiceSamples(db, userId, contactId);
  const analyzedSamples = samples.filter(s => s.voiceAnalysis?.status === 'completed');

  if (analyzedSamples.length === 0) return null;

  // Aggregate tone/pace/pitch/energy by frequency
  const countFrequency = (arr) => {
    const counts = {};
    arr.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  };

  const emotionalRange = [...new Set(
    analyzedSamples.map(s => s.voiceAnalysis.emotionalState).filter(Boolean)
  )];

  // Aggregate psychological indicators
  const avgIndicator = (field) => {
    const vals = analyzedSamples
      .map(s => s.voiceAnalysis?.psychologicalIndicators?.[field])
      .filter(v => v != null);
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 50;
  };

  // Build voice trait modifiers by averaging across samples
  const traitModMap = {};
  for (const sample of analyzedSamples) {
    const mods = sample.voiceAnalysis?.voiceTraitModifiers || {};
    for (const [traitKey, modData] of Object.entries(mods)) {
      if (!traitModMap[traitKey]) {
        traitModMap[traitKey] = { total: 0, count: 0, reasons: [], confidence: 0 };
      }
      traitModMap[traitKey].total += modData.modifier || 0;
      traitModMap[traitKey].count += 1;
      if (modData.reason) traitModMap[traitKey].reasons.push(modData.reason);
      traitModMap[traitKey].confidence += modData.confidence || 0;
    }
  }

  const voiceTraitModifiers = {};
  for (const [key, data] of Object.entries(traitModMap)) {
    voiceTraitModifiers[key] = {
      modifier: Math.round(data.total / data.count),
      reason: data.reasons[data.reasons.length - 1] || '',
      confidence: data.confidence / data.count,
      sampleCount: data.count
    };
  }

  const profileData = {
    contactId,
    userId,
    sampleCount: analyzedSamples.length,
    totalDuration: analyzedSamples.reduce((sum, s) => sum + (s.duration || 0), 0),
    lastUpdated: serverTimestamp(),
    dominantTone: countFrequency(analyzedSamples.map(s => s.voiceAnalysis.tone)),
    dominantPace: countFrequency(analyzedSamples.map(s => s.voiceAnalysis.pace)),
    dominantPitch: countFrequency(analyzedSamples.map(s => s.voiceAnalysis.pitch)),
    dominantEnergy: countFrequency(analyzedSamples.map(s => s.voiceAnalysis.energy)),
    emotionalRange,
    voiceTraitModifiers,
    psychologicalIndicators: {
      dominanceLevel: avgIndicator('dominanceLevel'),
      anxietyMarkers: avgIndicator('anxietyMarkers'),
      authenticityScore: avgIndicator('authenticityScore'),
      empathyIndicators: avgIndicator('empathyIndicators'),
      aggressionMarkers: avgIndicator('aggressionMarkers'),
      confidenceLevel: avgIndicator('confidenceLevel')
    },
    verbalVocalConsistency: Math.round(
      analyzedSamples.reduce((sum, s) => sum + (s.voiceAnalysis?.verbalVocalConsistency || 50), 0)
      / analyzedSamples.length
    ),
    inconsistencyFlags: [...new Set(
      analyzedSamples.flatMap(s => s.voiceAnalysis?.inconsistencyFlags || [])
    )],
    profileSummary: '' // Gets set by the AI analysis function
  };

  const profileRef = doc(db, 'users', userId, 'contacts', contactId, 'voiceProfile', 'current');
  await setDoc(profileRef, profileData, { merge: true });
  return profileData;
}

/**
 * Get a contact's voice profile
 */
export async function getVoiceProfile(db, userId, contactId) {
  const profileRef = doc(db, 'users', userId, 'contacts', contactId, 'voiceProfile', 'current');
  const snap = await getDoc(profileRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Delete a voice sample and its audio from Storage
 */
export async function deleteVoiceSample(db, storage, userId, contactId, sampleId) {
  const sampleRef = doc(db, 'users', userId, 'contacts', contactId, 'voiceSamples', sampleId);
  const sampleSnap = await getDoc(sampleRef);

  if (sampleSnap.exists()) {
    const { audioRef: audioPath } = sampleSnap.data();
    // Delete from Storage
    if (audioPath) {
      try {
        const audioStorageRef = ref(storage, audioPath);
        await deleteObject(audioStorageRef);
      } catch (e) {
        console.warn('Audio file already deleted or not found:', e.message);
      }
    }
    // Delete Firestore doc
    await deleteDoc(sampleRef);
  }
}

// ============================================================================
// QUERY HELPERS
// ============================================================================

/**
 * Find a contact by name for a user
 */
export async function findContactByName(db, userId, contactName) {
  const q = query(
    collection(db, 'users', userId, 'contacts'),
    where('name', '==', contactName)
  );
  const snap = await getDocs(q);
  return snap.docs.length > 0 ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
}

/**
 * Get all sessions across all contacts for a user with a specific mode
 */
export async function getUserSessionsByMode(db, userId, mode) {
  const contactsSnap = await getDocs(collection(db, 'users', userId, 'contacts'));
  const allSessions = [];

  for (const contactSnap of contactsSnap.docs) {
    const q = query(
      collection(contactSnap.ref, 'sessions'),
      where('mode', '==', mode),
      orderBy('createdAt', 'desc')
    );
    const sessionsSnap = await getDocs(q);

    for (const sessionSnap of sessionsSnap.docs) {
      allSessions.push({
        id: sessionSnap.id,
        contactId: contactSnap.id,
        ...sessionSnap.data()
      });
    }
  }

  return allSessions;
}

/**
 * Get trait score for a specific session
 */
export async function getTraitScore(db, userId, contactId, sessionId, traitKey) {
  const traitRef = doc(db, 'users', userId, 'contacts', contactId, 'sessions', sessionId, 'traitScores', traitKey);
  const snap = await getDoc(traitRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Get all trait scores for a session
 */
export async function getSessionTraitScores(db, userId, contactId, sessionId) {
  const traitsSnap = await getDocs(
    collection(db, 'users', userId, 'contacts', contactId, 'sessions', sessionId, 'traitScores')
  );
  return Object.fromEntries(traitsSnap.docs.map(doc => [doc.id, doc.data()]));
}

export default {
  // Schemas
  UserSchema,
  ContactSchema,
  SessionSchema,
  TraitScoreSchema,
  VoiceSampleSchema,
  VoiceProfileSchema,
  WaitlistSchema,
  CompositeIndexes,

  // Init
  initializeFirebase,
  getUserData,

  // User CRUD
  saveUser,
  addCredits,

  // Contact CRUD
  saveContact,
  deleteContact,
  getUserContacts,
  findContactByName,
  addContactTag,
  removeContactTag,
  updateContactAggregatedTraits,
  updateContactInterests,

  // Session CRUD
  saveSession,
  deleteSession,
  getContactSessions,
  getUserSessionsByMode,

  // Trait Scores
  saveTraitScores,
  getTraitScore,
  getSessionTraitScores,

  // Audio (session recordings)
  uploadAudio,
  deleteAudio,
  getAudio,

  // Voice Samples & Profiles
  uploadVoiceSample,
  getVoiceSamples,
  updateVoiceSampleAnalysis,
  updateVoiceSampleTranscript,
  rebuildVoiceProfile,
  getVoiceProfile,
  deleteVoiceSample
};
