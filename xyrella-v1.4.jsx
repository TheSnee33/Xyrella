const { useState, useEffect, useRef, useCallback } = React;

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg: "#06090F", surface: "#0D1117", card: "#161B22", border: "#21262D",
  accent: "#7C3AED", accentSoft: "#A78BFA", accentGlow: "rgba(124,58,237,0.12)",
  gold: "#F59E0B", green: "#22C55E", red: "#EF4444", orange: "#F59E0B",
  blue: "#3B82F6", teal: "#14B8A6", text: "#F0F6FC", muted: "#8B949E", dim: "#484F58",
  // Mode-specific accents
  dateAccent: "#E0427A", dateAccentSoft: "#FF6B9D", dateGlow: "rgba(224,66,122,0.12)",
  bizAccent: "#3B82F6", bizAccentSoft: "#60A5FA", bizGlow: "rgba(59,130,246,0.12)",
};
const FONTS = { display: "'Playfair Display', serif", body: "'DM Sans', sans-serif" };

// ─── FIREBASE CONFIG ──────────────────────────────────────────────────────────
const keyStr = "AIzaSyBiFXZXBlH-bYkGS1d_r1frzd2w3igcT8U";
const FIREBASE_CONFIG = { projectId: "xyrella-5f994", apiKey: keyStr };

// ─── FIREBASE AUTH HELPERS ────────────────────────────────────────────────────
const authUrl = "https://identitytoolkit.googleapis.com/v1/accounts";
const signUpWithEmail = async (apiKey, email, password) => {
  const res = await fetch(`${authUrl}:signUp?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const data = await res.json(); if (data.error) throw new Error(data.error.message); return data;
};
const signInWithEmail = async (apiKey, email, password) => {
  const res = await fetch(`${authUrl}:signInWithPassword?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const data = await res.json(); if (data.error) throw new Error(data.error.message); return data;
};
const signInAnonymously = async (apiKey) => {
  const res = await fetch(`${authUrl}:signUp?key=${apiKey}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }) });
  const data = await res.json(); if (data.error) throw new Error(data.error.message); return data;
};
const saveUserProfile = async (projectId, apiKey, uid, profile) => {
  await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}?key=${apiKey}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { uid: { stringValue: uid }, displayName: { stringValue: profile.displayName || "" }, email: { stringValue: profile.email || "" }, igHandle: { stringValue: profile.igHandle || "" }, createdAt: { stringValue: new Date().toISOString() }, credits: { mapValue: { fields: { balance: { integerValue: 5 }, totalPurchased: { integerValue: 0 }, totalEarned: { integerValue: 0 }, totalSpent: { integerValue: 0 } } } }, trialRecordings: { integerValue: profile.trialRecordings || 0 }, disclaimerAccepted: { booleanValue: true } } }),
  });
};

// ─── DATEIQ TRAIT DEFINITIONS ─────────────────────────────────────────────────
const DATEIQ_CATEGORIES = {
  negative: { label: "Negative Traits", tagline: "Red flags to watch for", description: "Standalone traits to watch out for as red flags. Scored 0-100 where lower is better.", colorZones: [{ min:0,max:32,color:"green" },{ min:33,max:65,color:"orange" },{ min:66,max:100,color:"red" }], icon: "🚩" },
  positive: { label: "Positive Traits", tagline: "Green flags indicating a good match", description: "Standalone traits indicating a good match. Scored 0-100 where higher is better.", colorZones: [{ min:0,max:32,color:"red" },{ min:33,max:65,color:"orange" },{ min:66,max:100,color:"green" }], icon: "💚" },
  polar: { label: "Polar Opposite Traits", tagline: "No healthy balance — lean toward the ideal", description: "Scales where one end is ideal, the other worst-case. No desirable middle ground.", colorZones: [{ min:0,max:32,color:"red" },{ min:33,max:65,color:"orange" },{ min:66,max:100,color:"green" }], icon: "⚖️" },
  balance: { label: "Traits Requiring Balance", tagline: "Extremes on either side are problematic", description: "Scales where extremes are problematic. Ideal is balanced middle (26-75).", colorZones: [{ min:0,max:25,color:"red" },{ min:26,max:75,color:"green" },{ min:76,max:100,color:"red" }], icon: "🎯" },
};

const DATEIQ_TRAITS = [
  { key:"narcissism",label:"Narcissism",category:"negative",description:"Self-centeredness and need for admiration" },
  { key:"manipulativeness",label:"Manipulativeness",category:"negative",description:"Deceptive influence tactics" },
  { key:"dishonesty",label:"Dishonesty",category:"negative",description:"Pattern of untruthfulness" },
  { key:"arrogance",label:"Arrogance",category:"negative",description:"Superiority and dismissiveness" },
  { key:"jealousy",label:"Jealousy",category:"negative",description:"Insecurity-driven resentment" },
  { key:"controllingBehavior",label:"Controlling Behavior",category:"negative",description:"Need to dominate and restrict" },
  { key:"impulsiveness",label:"Impulsiveness",category:"negative",description:"Poor impulse control" },
  { key:"pessimism",label:"Pessimism",category:"negative",description:"Chronic negativity" },
  { key:"selfishness",label:"Selfishness",category:"negative",description:"Prioritizing self at others' expense" },
  { key:"rudeness",label:"Rudeness",category:"negative",description:"Dismissive or disrespectful communication" },
  { key:"altruism",label:"Altruism",category:"positive",description:"Selfless concern for others" },
  { key:"authenticity",label:"Authenticity",category:"positive",description:"Genuine and true to self" },
  { key:"confidence",label:"Confidence",category:"positive",description:"Healthy self-assurance" },
  { key:"compassion",label:"Compassion",category:"positive",description:"Deep awareness of suffering" },
  { key:"competence",label:"Competence",category:"positive",description:"Demonstrated capability" },
  { key:"humor",label:"Humor",category:"positive",description:"Natural wit and lightheartedness" },
  { key:"openMindedness",label:"Open-Mindedness",category:"positive",description:"Willingness to consider new ideas" },
  { key:"reliability",label:"Reliability",category:"positive",description:"Consistency and dependability" },
  { key:"respectfulness",label:"Respectfulness",category:"positive",description:"Regard for others' boundaries" },
  { key:"empathy",label:"Empathy",category:"positive",description:"Understanding others' feelings" },
  { key:"honestyPolar",label:"Honesty",category:"polar",idealLabel:"Honest",worstLabel:"Dishonest",description:"Truthfulness in communication" },
  { key:"loyaltyPolar",label:"Loyalty",category:"polar",idealLabel:"Loyal",worstLabel:"Disloyal",description:"Commitment and faithfulness" },
  { key:"generosityPolar",label:"Generosity",category:"polar",idealLabel:"Generous",worstLabel:"Stingy",description:"Willingness to give" },
  { key:"patiencePolar",label:"Patience",category:"polar",idealLabel:"Patient",worstLabel:"Impatient",description:"Composure under pressure" },
  { key:"kindnessPolar",label:"Kindness",category:"polar",idealLabel:"Kind",worstLabel:"Cruel",description:"Warmth and consideration" },
  { key:"integrityPolar",label:"Integrity",category:"polar",idealLabel:"Principled",worstLabel:"Deceitful",description:"Moral and ethical adherence" },
  { key:"forgivenessPolar",label:"Forgiveness",category:"polar",idealLabel:"Forgiving",worstLabel:"Vindictive",description:"Letting go of grudges" },
  { key:"gratitudePolar",label:"Gratitude",category:"polar",idealLabel:"Grateful",worstLabel:"Entitled",description:"Appreciation vs entitlement" },
  { key:"selflessnessPolar",label:"Selflessness",category:"polar",idealLabel:"Selfless",worstLabel:"Self-centered",description:"Putting others alongside self" },
  { key:"competencePolar",label:"Competence",category:"polar",idealLabel:"Competent",worstLabel:"Incompetent",description:"Ability and follow-through" },
  { key:"teamPlayerPolar",label:"Team Player",category:"polar",idealLabel:"Team Player",worstLabel:"Jealous",description:"Collaborative vs envious" },
  { key:"selfWorthBalance",label:"Self-Worth",category:"balance",lowLabel:"No Balls",midLabel:"Confident",highLabel:"Narcissist",description:"Self-assurance between insecurity and narcissism" },
  { key:"independenceBalance",label:"Independence",category:"balance",lowLabel:"Clingy",midLabel:"Balanced Autonomy",highLabel:"Emotionally Distant",description:"Autonomy between clinginess and distance" },
  { key:"expressivenessBalance",label:"Expressiveness",category:"balance",lowLabel:"Repressed",midLabel:"Balanced Openness",highLabel:"Unhinged",description:"Openness between repression and drama" },
  { key:"assertivenessBalance",label:"Assertiveness",category:"balance",lowLabel:"Passive",midLabel:"Balanced Communication",highLabel:"Aggressive",description:"Expressing needs between passivity and aggression" },
  { key:"influenceBalance",label:"Influence",category:"balance",lowLabel:"Pushover",midLabel:"Influential",highLabel:"Manipulative",description:"Social influence between weakness and manipulation" },
  { key:"leadershipBalance",label:"Leadership",category:"balance",lowLabel:"Careless",midLabel:"Protective",highLabel:"Controlling",description:"Leadership between negligence and control" },
];

// ─── BUSINESSIQ TRAIT DEFINITIONS ─────────────────────────────────────────────
const BUSINESSIQ_CATEGORIES = {
  buyer: { label: "Buyer Signals", tagline: "Positive indicators of purchase intent", description: "How likely the prospect is to move forward. Scored 0-100 where higher is better.", colorZones: [{ min:0,max:32,color:"red" },{ min:33,max:65,color:"orange" },{ min:66,max:100,color:"green" }], icon: "💰" },
  risk: { label: "Risk Signals", tagline: "Red flags that may stall the deal", description: "Obstacles that could prevent closing. Scored 0-100 where lower is better.", colorZones: [{ min:0,max:32,color:"green" },{ min:33,max:65,color:"orange" },{ min:66,max:100,color:"red" }], icon: "⚠️" },
  polar: { label: "Personality Indicators", tagline: "Character scales — lean toward the ideal", description: "Personality scales from ideal business counterpart to difficult. Higher is better.", colorZones: [{ min:0,max:32,color:"red" },{ min:33,max:65,color:"orange" },{ min:66,max:100,color:"green" }], icon: "🤝" },
  balance: { label: "Behavioral Balance", tagline: "Extremes hurt the deal", description: "Behavioral scales where extremes are problematic. Middle zone (26-75) is ideal.", colorZones: [{ min:0,max:25,color:"red" },{ min:26,max:75,color:"green" },{ min:76,max:100,color:"red" }], icon: "📊" },
};

const BUSINESSIQ_TRAITS = [
  { key:"comfortableBuying",label:"Comfortable Buying",category:"buyer",description:"Ease when discussing purchase decisions" },
  { key:"budgetFlexibility",label:"Budget Flexibility",category:"buyer",description:"Willingness to invest for the right solution" },
  { key:"decisionAuthority",label:"Decision Authority",category:"buyer",description:"Power to make the final call" },
  { key:"urgency",label:"Urgency",category:"buyer",description:"Time pressure or motivation to act now" },
  { key:"enthusiasm",label:"Enthusiasm",category:"buyer",description:"Genuine excitement about product/service" },
  { key:"trustLevel",label:"Trust Level",category:"buyer",description:"Confidence in you and your company" },
  { key:"engagement",label:"Engagement",category:"buyer",description:"Active participation and questioning" },
  { key:"visionAlignment",label:"Vision Alignment",category:"buyer",description:"Sees how your solution fits their needs" },
  { key:"championPotential",label:"Champion Potential",category:"buyer",description:"Likely to advocate for you internally" },
  { key:"followThroughIntent",label:"Follow-Through Intent",category:"buyer",description:"Signals they'll take next steps" },
  { key:"priceSensitivity",label:"Price Sensitivity",category:"risk",description:"Excessive focus on cost over value" },
  { key:"indecisiveness",label:"Indecisiveness",category:"risk",description:"Inability to commit or move forward" },
  { key:"skepticism",label:"Skepticism",category:"risk",description:"Persistent doubt about your claims" },
  { key:"defensiveness",label:"Defensiveness",category:"risk",description:"Guarded or resistant to new ideas" },
  { key:"distraction",label:"Distraction",category:"risk",description:"Lack of focus or presence" },
  { key:"competitorLoyalty",label:"Competitor Loyalty",category:"risk",description:"Strong attachment to existing vendors" },
  { key:"gatekeeping",label:"Gatekeeping",category:"risk",description:"Blocking access to decision makers" },
  { key:"objectionStacking",label:"Objection Stacking",category:"risk",description:"Piling on reasons not to buy" },
  { key:"stallingTactics",label:"Stalling Tactics",category:"risk",description:"Deliberately delaying decisions" },
  { key:"dishonesty_biz",label:"Dishonesty",category:"risk",description:"Misleading about needs, budget, or timeline" },
  { key:"agreeablePolar",label:"Agreeableness",category:"polar",idealLabel:"Agreeable",worstLabel:"Disagreeable",description:"Cooperative vs combative" },
  { key:"transparencyPolar",label:"Transparency",category:"polar",idealLabel:"Transparent",worstLabel:"Evasive",description:"Open about needs vs withholding" },
  { key:"respectPolar",label:"Respect",category:"polar",idealLabel:"Respectful",worstLabel:"Dismissive",description:"Values your time vs condescending" },
  { key:"collaborationPolar",label:"Collaboration",category:"polar",idealLabel:"Collaborative",worstLabel:"Adversarial",description:"Mutual benefit vs self-serving" },
  { key:"decisivenessPolar",label:"Decisiveness",category:"polar",idealLabel:"Decisive",worstLabel:"Wishy-washy",description:"Clear commitments vs waffling" },
  { key:"responsivenessPolar",label:"Responsiveness",category:"polar",idealLabel:"Responsive",worstLabel:"Unresponsive",description:"Engages promptly vs ghosting" },
  { key:"detailOrientedPolar",label:"Detail Orientation",category:"polar",idealLabel:"Detail-Oriented",worstLabel:"Careless",description:"Pays attention vs overlooks" },
  { key:"openMindedPolar",label:"Open-Mindedness",category:"polar",idealLabel:"Open-Minded",worstLabel:"Closed-Minded",description:"Considers new solutions vs stuck" },
  { key:"professionalismPolar",label:"Professionalism",category:"polar",idealLabel:"Professional",worstLabel:"Unprofessional",description:"Integrity vs erratic behavior" },
  { key:"reliabilityPolar",label:"Reliability",category:"polar",idealLabel:"Reliable",worstLabel:"Flaky",description:"Follows through vs breaks promises" },
  { key:"solutionFocusPolar",label:"Solution Focus",category:"polar",idealLabel:"Solution-Focused",worstLabel:"Problem-Focused",description:"Seeks solutions vs dwells on obstacles" },
  { key:"vulnerabilityBalance",label:"Vulnerability",category:"balance",lowLabel:"Guarded",midLabel:"Open",highLabel:"Oversharing",description:"Openness between secrecy and TMI" },
  { key:"assertivenessBalance_biz",label:"Assertiveness",category:"balance",lowLabel:"Passive",midLabel:"Assertive",highLabel:"Aggressive",description:"Negotiation style between doormat and bulldozer" },
  { key:"formalityBalance",label:"Formality",category:"balance",lowLabel:"Too Casual",midLabel:"Professional",highLabel:"Rigid",description:"Between unprofessional and overly stiff" },
  { key:"detailFocusBalance",label:"Detail Focus",category:"balance",lowLabel:"Vague",midLabel:"Thorough",highLabel:"Overthinking",description:"Attention between careless and analysis paralysis" },
  { key:"emotionalInvestment",label:"Emotional Investment",category:"balance",lowLabel:"Detached",midLabel:"Engaged",highLabel:"Emotional",description:"Between apathy and irrational attachment" },
  { key:"negotiationStyle",label:"Negotiation Style",category:"balance",lowLabel:"Pushover",midLabel:"Fair Negotiator",highLabel:"Hardball",description:"Between giving away the farm and scorched earth" },
];

// ─── TERMS OF USE ─────────────────────────────────────────────────────────────
const TERMS = [
  { num:"Section 1 — Nature of Results", text:'The personality analysis, trait scores, and related outputs provided by Xyrella ("Results") are generated by artificial intelligence for informational purposes only. Results do not constitute a medical, psychological, or psychiatric diagnosis, nor professional sales or business advice.' },
  { num:"Section 2 — Acceptable Use", text:"You agree not to use the Results to disparage, defame, harass, stalk, or intimidate any individual. Public dissemination of Results is strongly discouraged and may expose you to legal liability." },
  { num:"Section 3 — Legal Limitations", text:"Results generated by Xyrella are not admissible as evidence in any court of law, arbitration, or administrative proceeding. If you feel unsafe, contact emergency services (911) immediately." },
  { num:"Section 4 — Personal Well-Being", text:"The Results reflect an AI assessment of a recorded conversation and do not define your personal worth, compatibility, or value as an individual or professional." },
  { num:"Section 5 — Data & Privacy", text:"By using Xyrella, you acknowledge that audio recordings and transcripts are processed by third-party AI services. You are solely responsible for obtaining any required consent from recorded parties as mandated by applicable laws." },
  { num:"Section 6 — Bluetooth Coaching", text:"The live coaching feature provides AI-generated suggestions through your connected audio device. These suggestions are advisory only. Xyrella is not responsible for the outcome of any conversation based on coaching suggestions." },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const getCategories = (mode) => mode === "business" ? BUSINESSIQ_CATEGORIES : DATEIQ_CATEGORIES;
const getTraitDefs = (mode) => mode === "business" ? BUSINESSIQ_TRAITS : DATEIQ_TRAITS;
const getCatKeys = (mode) => mode === "business" ? ["buyer","risk","polar","balance"] : ["negative","positive","polar","balance"];
const getModeAccent = (mode) => mode === "business" ? C.bizAccent : C.dateAccent;
const getModeAccentSoft = (mode) => mode === "business" ? C.bizAccentSoft : C.dateAccentSoft;
const getModeGlow = (mode) => mode === "business" ? C.bizGlow : C.dateGlow;
const getModeIcon = (mode) => mode === "business" ? "💼" : "💘";
const getModeLabel = (mode) => mode === "business" ? "BusinessIQ" : "DateIQ";

const getScoreColor = (s, cat) => {
  const allCats = {...DATEIQ_CATEGORIES,...BUSINESSIQ_CATEGORIES};
  const z = allCats[cat]?.colorZones || [];
  for (const zone of z) { if (s >= zone.min && s <= zone.max) return zone.color === "green" ? C.green : zone.color === "red" ? C.red : C.orange; }
  return C.orange;
};
const getScoreZoneLabel = (s, cat) => {
  if (cat==="negative"||cat==="risk") return s<=32?"Low risk":s<=65?"Moderate":"High risk";
  if (cat==="positive"||cat==="buyer") return s>=66?"Strong":s>=33?"Moderate":"Weak";
  if (cat==="polar") return s>=66?"Ideal":s>=33?"Mixed":"Worst";
  if (cat==="balance") return s<=25?"Too low":s<=75?"Healthy":"Too high";
  return "";
};

// ─── FIREBASE SAVE ────────────────────────────────────────────────────────────
const saveToFirebase = async (projectId, apiKey, userId, data) => {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  try {
    const fields = {
      mode:{stringValue:data.mode||"date"}, subjectName:{stringValue:data.subjectName||"Unknown"},
      context:{stringValue:data.context}, date:{stringValue:data.date},
      duration:{stringValue:data.duration}, transcript:{stringValue:data.transcript},
      overallScore:{doubleValue:data.overallScore}, summary:{stringValue:data.summary||""},
      traitCount:{integerValue:37}, modelVersion:{stringValue:"claude-sonnet-4-20250514"}, userId:{stringValue:userId},
    };
    const sRes = await fetch(`${base}/users/${userId}/sessions?key=${apiKey}`, {
      method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ fields }),
    });
    const session = await sRes.json();
    const sId = session.name?.split("/").pop();
    for (const t of data.traits) {
      await fetch(`${base}/users/${userId}/sessions/${sId}/traitScores/${t.key}?key=${apiKey}`, {
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ fields: { traitKey:{stringValue:t.key}, label:{stringValue:t.label}, category:{stringValue:t.category}, score:{doubleValue:t.score}, maxScore:{integerValue:100}, notes:{stringValue:t.notes||""} } }),
      });
    }
    return sId;
  } catch(e) { console.error("Firebase save error:",e); return null; }
};

// ─── AI ANALYSIS ──────────────────────────────────────────────────────────────
const analyzeTranscript = async (transcript, context, mode) => {
  const traits = getTraitDefs(mode);
  const cats = getCategories(mode);
  const catKeys = getCatKeys(mode);
  const modeLabel = mode === "business" ? "BusinessIQ" : "DateIQ";

  const traitList = traits.map(t => {
    let n = "";
    const cat = t.category;
    if (cat==="negative"||cat==="risk") n = "0=none, 100=extreme. Lower is better.";
    if (cat==="positive"||cat==="buyer") n = "0=none, 100=extreme. Higher is better.";
    if (cat==="polar") n = `0=${t.worstLabel}, 100=${t.idealLabel}. Higher is better.`;
    if (cat==="balance") n = `0=${t.lowLabel}, 50=${t.midLabel}(ideal 26-75), 100=${t.highLabel}. Middle is best.`;
    return `{"key":"${t.key}","label":"${t.label}","category":"${t.category}","score":<0-100>,"notes":"<evidence>"}  // ${n}`;
  }).join("\n    ");

  const interestInstructions = mode === "business"
    ? `Also extract what the prospect is interested in or mentions about products, services, competitors, requirements, budget constraints, timelines, and any personal details shared. Note specific product names, models, brands, features they like or dislike.`
    : `Also extract what this person is interested in or mentions: hobbies, foods, places, activities, pets, music, movies, travel destinations, things they love, things they dislike. Note specific names and details.`;

  const prompt = `You are ${modeLabel}, an advanced AI ${mode==="business"?"sales intelligence":"personality"} analyst. Analyze this ${context} transcript and score the ${mode==="business"?"PROSPECT/CLIENT":"PRIMARY SPEAKER"} on exactly 37 traits.

RULES:
- Score 0-100 integers only based on transcript evidence
${catKeys.map(k => {
  const c = cats[k];
  if (k==="negative"||k==="risk") return `- ${c.label.toUpperCase()}: 0=none, 100=extreme. Lower better.`;
  if (k==="positive"||k==="buyer") return `- ${c.label.toUpperCase()}: 0=none, 100=extreme. Higher better.`;
  if (k==="polar") return `- ${c.label.toUpperCase()}: 0=worst, 100=ideal. Higher better. No healthy middle.`;
  if (k==="balance") return `- ${c.label.toUpperCase()}: 0=extreme low, 50=ideal, 100=extreme high. 26-75 green zone.`;
  return "";
}).join("\n")}
- Provide 2-3 sentence evidence notes per trait
- If insufficient data, score 50 and note it

${interestInstructions}

TRANSCRIPT:
"${transcript}"

Return ONLY valid JSON:
{
  "overallScore": <0-100>,
  "summary": "<2-3 sentences>",
  "traits": [
    ${traitList}
  ],
  "interests": {
    "likes": ["<thing they expressed interest in>", ...],
    "dislikes": ["<thing they expressed dislike toward>", ...],
    "mentions": ["<notable specific mention: brand, place, person, product>", ...],
    "keyInsights": ["<actionable insight for the user>", ...]
  }${mode==="business" ? `,
  "dealStage": "<prospecting|qualifying|proposal|closing>",
  "nextSteps": ["<suggested follow-up action>", ...],
  "objections": ["<key objection raised>", ...]` : ""}
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:5000, messages:[{role:"user",content:prompt}] }),
  });
  const d = await response.json();
  return JSON.parse((d.content?.[0]?.text||"").replace(/```json|```/g,"").trim());
};

// ─── BLUETOOTH COACHING ENGINE ────────────────────────────────────────────────
class CoachingEngine {
  constructor() {
    this.synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    this.connected = false;
    this.volume = 0.3;
    this.queue = [];
    this.speaking = false;
  }

  async connectBluetooth() {
    try {
      // Use Web Audio API to route to Bluetooth
      // AudioContext will automatically use the system's default output (Bluetooth if connected)
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      this.audioCtx = ctx;
      this.connected = true;
      return true;
    } catch (e) {
      console.error("Bluetooth connection error:", e);
      return false;
    }
  }

  speak(text) {
    if (!this.synth || !text) return;
    // Cancel any ongoing speech
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = this.volume;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    // Try to use a natural-sounding voice
    const voices = this.synth.getVoices();
    const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google") || v.name.includes("Natural"));
    if (preferred) utterance.voice = preferred;
    this.synth.speak(utterance);
  }

  disconnect() {
    if (this.synth) this.synth.cancel();
    if (this.audioCtx) this.audioCtx.close();
    this.connected = false;
  }
}

// ─── VISUAL COMPONENTS ────────────────────────────────────────────────────────
const RadialScore = ({score,size=100,mode="date"}) => {
  const r=size/2-8, circ=2*Math.PI*r, dash=circ*(score/100);
  const color = score>=66?C.green:score>=33?C.orange:C.red;
  return (<div style={{position:"relative",width:size,height:size}}>
    <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6} strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" style={{transition:"stroke-dasharray 1s ease"}}/>
    </svg>
    <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
      <span style={{fontFamily:FONTS.display,fontSize:size*.28,color,fontWeight:700,lineHeight:1}}>{score}</span>
      <span style={{fontSize:size*.12,color:C.muted}}>/100</span>
    </div>
  </div>);
};

const ScoreBar = ({score,category}) => {
  const color = getScoreColor(score,category);
  return (<div style={{width:"100%",height:8,background:C.border,borderRadius:4,overflow:"hidden"}}>
    <div style={{height:"100%",borderRadius:4,background:color,width:`${score}%`,transition:"width 1s ease"}}/>
  </div>);
};

const PolarMeter = ({score,idealLabel,worstLabel}) => (<div>
  <div style={{position:"relative",width:"100%",height:10,borderRadius:5,background:"linear-gradient(90deg,#EF4444 0%,#EF4444 32%,#F59E0B 32%,#F59E0B 65%,#22C55E 65%,#22C55E 100%)"}}>
    <div style={{position:"absolute",top:-3,left:`${score}%`,transform:"translateX(-50%)",width:16,height:16,borderRadius:"50%",background:"#fff",border:`2px solid ${getScoreColor(score,"polar")}`,transition:"left 1s ease",boxShadow:"0 2px 8px rgba(0,0,0,.4)"}}/>
  </div>
  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:4}}><span>{worstLabel}</span><span>{idealLabel}</span></div>
</div>);

const BalanceMeter = ({score,lowLabel,midLabel,highLabel}) => (<div>
  <div style={{position:"relative",width:"100%",height:10,borderRadius:5,background:"linear-gradient(90deg,#EF4444 0%,#EF4444 25%,#22C55E 25%,#22C55E 75%,#EF4444 75%,#EF4444 100%)"}}>
    <div style={{position:"absolute",top:-3,left:`${score}%`,transform:"translateX(-50%)",width:16,height:16,borderRadius:"50%",background:"#fff",border:`2px solid ${getScoreColor(score,"balance")}`,transition:"left 1s ease",boxShadow:"0 2px 8px rgba(0,0,0,.4)"}}/>
  </div>
  <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.muted,marginTop:4}}><span>{lowLabel} (0)</span><span style={{color:C.green}}>{midLabel}</span><span>{highLabel} (100)</span></div>
</div>);

const CategoryHeader = ({cat,isOpen,onToggle,mode}) => {
  const cats = getCategories(mode);
  const info = cats[cat];
  if (!info) return null;
  return (<div style={{marginBottom:8}}>
    <div onClick={onToggle} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:C.card,border:`1px solid ${C.border}`,borderRadius:14,cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>{info.icon}</span>
        <div><div style={{fontWeight:700,fontSize:15,color:C.text}}>{info.label}</div><div style={{fontSize:12,color:C.muted}}>{info.tagline}</div></div>
      </div>
      <span style={{color:C.muted,fontSize:14,transition:"transform 0.2s",transform:isOpen?"rotate(180deg)":"rotate(0)"}}>▼</span>
    </div>
    {isOpen && <div style={{padding:"12px 16px",background:C.surface,border:`1px solid ${C.border}`,borderTop:"none",borderRadius:"0 0 14px 14px",fontSize:13,color:C.muted,lineHeight:1.6}}>{info.description}</div>}
  </div>);
};

const Input = ({label,type="text",placeholder,value,onChange,...props}) => (
  <div style={{marginBottom:14}}>
    {label && <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:5}}>{label}</div>}
    <input type={type} placeholder={placeholder} value={value} onChange={onChange}
      style={{width:"100%",padding:"12px 14px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",fontFamily:FONTS.body,boxSizing:"border-box"}} {...props}/>
  </div>
);

// ─── INTEREST PANEL ───────────────────────────────────────────────────────────
const InterestPanel = ({interests, mode}) => {
  if (!interests) return null;
  const accent = getModeAccent(mode);
  const accentSoft = getModeAccentSoft(mode);
  const sections = [
    { key: "likes", icon: "👍", label: mode === "business" ? "Interested In" : "Things They Like", color: C.green },
    { key: "dislikes", icon: "👎", label: mode === "business" ? "Concerns / Dislikes" : "Things They Dislike", color: C.red },
    { key: "mentions", icon: "📌", label: "Notable Mentions", color: C.blue },
    { key: "keyInsights", icon: "💡", label: mode === "business" ? "Sales Insights" : "Key Insights", color: C.gold },
  ];
  return (<div style={{background:C.card,borderRadius:16,padding:18,border:`1px solid ${C.border}`,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:16,marginBottom:14,color:accentSoft}}>{mode==="business"?"📋 Prospect Intelligence":"📝 Interest Notes"}</div>
    {sections.map(sec => {
      const items = interests[sec.key];
      if (!items || items.length === 0) return null;
      return (<div key={sec.key} style={{marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
          <span style={{fontSize:14}}>{sec.icon}</span>
          <span style={{fontSize:13,fontWeight:600,color:sec.color}}>{sec.label}</span>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {items.map((item, i) => (
            <span key={i} style={{padding:"4px 10px",background:`${sec.color}15`,border:`1px solid ${sec.color}30`,borderRadius:20,fontSize:12,color:sec.color}}>{item}</span>
          ))}
        </div>
      </div>);
    })}
  </div>);
};

// ─── BUSINESS-SPECIFIC PANELS ─────────────────────────────────────────────────
const DealPanel = ({report}) => {
  if (!report.dealStage && !report.nextSteps && !report.objections) return null;
  return (<div style={{background:C.card,borderRadius:16,padding:18,border:`1px solid ${C.border}`,marginBottom:16}}>
    <div style={{fontWeight:700,fontSize:16,marginBottom:14,color:C.bizAccentSoft}}>📊 Deal Intelligence</div>
    {report.dealStage && <div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:.5}}>Deal Stage</div>
      <div style={{display:"inline-block",padding:"6px 14px",background:`${C.blue}20`,border:`1px solid ${C.blue}40`,borderRadius:20,fontSize:14,fontWeight:600,color:C.blue,textTransform:"capitalize"}}>{report.dealStage}</div>
    </div>}
    {report.nextSteps && report.nextSteps.length > 0 && <div style={{marginBottom:12}}>
      <div style={{fontSize:12,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Recommended Next Steps</div>
      {report.nextSteps.map((step, i) => (
        <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
          <span style={{color:C.green,fontSize:14,marginTop:1}}>→</span>
          <span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{step}</span>
        </div>
      ))}
    </div>}
    {report.objections && report.objections.length > 0 && <div>
      <div style={{fontSize:12,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Objections Raised</div>
      {report.objections.map((obj, i) => (
        <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:6}}>
          <span style={{color:C.orange,fontSize:14,marginTop:1}}>⚡</span>
          <span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{obj}</span>
        </div>
      ))}
    </div>}
  </div>);
};

// ─── COACHING INDICATOR ───────────────────────────────────────────────────────
const CoachingBadge = ({active, coaching, onToggle}) => {
  if (!active) return null;
  return (<div onClick={onToggle} style={{position:"fixed",top:12,right:12,zIndex:999,padding:"6px 12px",borderRadius:20,background:coaching?`${C.teal}30`:`${C.dim}50`,border:`1px solid ${coaching?C.teal:C.dim}`,cursor:"pointer",display:"flex",alignItems:"center",gap:6,backdropFilter:"blur(8px)"}}>
    <div style={{width:8,height:8,borderRadius:"50%",background:coaching?C.teal:C.dim,animation:coaching?"blink 1.5s infinite":"none"}}/>
    <span style={{fontSize:11,fontWeight:600,color:coaching?C.teal:C.muted}}>{coaching?"COACHING ON":"COACHING OFF"}</span>
    <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
  </div>);
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
function XyrellaApp() {
  // Auth state
  const [user, setUser] = useState(null);
  const [trialCount, setTrialCount] = useState(0);
  const MAX_TRIALS = 2;

  // Navigation
  const [screen, setScreen] = useState("splash");
  const [mode, setMode] = useState(null); // "date" | "business"

  // Recording state
  const [context, setContext] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processStep, setProcessStep] = useState(0);
  const [report, setReport] = useState(null);
  const [expandedTrait, setExpandedTrait] = useState(null);
  const [openCategories, setOpenCategories] = useState({});
  const [savedToFirebase, setSavedToFirebase] = useState(false);

  // Auth form
  const [authMode, setAuthMode] = useState("signup");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authIG, setAuthIG] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Coaching
  const [coachingActive, setCoachingActive] = useState(false);
  const [coachingConnected, setCoachingConnected] = useState(false);
  const coachRef = useRef(new CoachingEngine());

  // Report tab
  const [reportTab, setReportTab] = useState("traits"); // "traits" | "interests" | "deal"

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const liveTranscriptRef = useRef("");

  // Timers
  useEffect(() => { if (screen==="splash") { const t=setTimeout(()=>setScreen("terms"),2800); return ()=>clearTimeout(t); } }, [screen]);
  useEffect(() => { if (isRecording) { timerRef.current=setInterval(()=>setRecordingTime(t=>t+1),1000); } else { clearInterval(timerRef.current); } return ()=>clearInterval(timerRef.current); }, [isRecording]);
  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  // Context options per mode
  const contextOptions = mode === "business"
    ? ["Sales Call","Discovery Call","Demo Meeting","Negotiation","Follow-Up","Networking"]
    : ["First Date","Second Date","Friendship","Family","Business Meeting"];

  // Set default context when mode changes
  useEffect(() => { if (mode) setContext(mode === "business" ? "Sales Call" : "First Date"); }, [mode]);

  // Auth handlers
  const handleSignup = async () => {
    setAuthError("");
    if (!authName.trim()) { setAuthError("Please enter your name."); return; }
    if (!authEmail.trim()) { setAuthError("Please enter your email."); return; }
    if (authPassword.length<6) { setAuthError("Password must be at least 6 characters."); return; }
    if (authPassword!==authConfirm) { setAuthError("Passwords do not match."); return; }
    if (!FIREBASE_CONFIG.apiKey) { setAuthError("Firebase API key not configured."); return; }
    setAuthLoading(true);
    try {
      const r = await signUpWithEmail(FIREBASE_CONFIG.apiKey, authEmail, authPassword);
      setUser({ uid:r.localId, email:r.email, displayName:authName, idToken:r.idToken });
      await saveUserProfile(FIREBASE_CONFIG.projectId, FIREBASE_CONFIG.apiKey, r.localId, { displayName:authName, email:r.email, igHandle:authIG, trialRecordings:trialCount });
      setScreen("modeSelect");
    } catch(e) {
      const m = e.message||"";
      if (m.includes("EMAIL_EXISTS")) setAuthError("Account exists. Try signing in.");
      else if (m.includes("INVALID_EMAIL")) setAuthError("Invalid email address.");
      else setAuthError(m);
    }
    setAuthLoading(false);
  };

  const handleSignin = async () => {
    setAuthError("");
    if (!authEmail.trim()||!authPassword) { setAuthError("Enter email and password."); return; }
    if (!FIREBASE_CONFIG.apiKey) { setAuthError("Firebase API key not configured."); return; }
    setAuthLoading(true);
    try {
      const r = await signInWithEmail(FIREBASE_CONFIG.apiKey, authEmail, authPassword);
      setUser({ uid:r.localId, email:r.email, displayName:r.displayName||authEmail.split("@")[0], idToken:r.idToken });
      setScreen("modeSelect");
    } catch(e) {
      const m = e.message||"";
      if (m.includes("INVALID_LOGIN")||m.includes("INVALID_PASSWORD")) setAuthError("Invalid email or password.");
      else if (m.includes("EMAIL_NOT_FOUND")) setAuthError("No account with this email.");
      else setAuthError(m);
    }
    setAuthLoading(false);
  };

  const handleAnonymousLogin = async () => {
    setAuthError("");
    if (!FIREBASE_CONFIG.apiKey) { setAuthError("Firebase API key not configured."); return; }
    setAuthLoading(true);
    try {
      const r = await signInAnonymously(FIREBASE_CONFIG.apiKey);
      setUser({ uid:r.localId, email:null, displayName:"Guest User", idToken:r.idToken });
      setScreen("modeSelect");
    } catch(e) {
      setAuthError(e.message || "Failed to sign in anonymously.");
    }
    setAuthLoading(false);
  };

  // Recording handlers
  const startRecording = () => {
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported. Use Chrome."); return; }
    liveTranscriptRef.current=""; setTranscript("");
    const rec = new SR(); rec.continuous=true; rec.interimResults=true; rec.lang="en-US";
    rec.onresult = e => { let f=""; for(let i=0;i<e.results.length;i++) { if(e.results[i].isFinal) f+=e.results[i][0].transcript+" "; } liveTranscriptRef.current=f; setTranscript(f); };
    rec.start(); recognitionRef.current=rec; setIsRecording(true); setRecordingTime(0);
  };
  const stopRecording = () => { if(recognitionRef.current) recognitionRef.current.stop(); setIsRecording(false); };

  // Coaching toggle
  const toggleCoaching = async () => {
    if (coachingActive) {
      coachRef.current.disconnect();
      setCoachingActive(false);
      setCoachingConnected(false);
    } else {
      const ok = await coachRef.current.connectBluetooth();
      if (ok) {
        setCoachingActive(true);
        setCoachingConnected(true);
        coachRef.current.speak("Coaching connected. I'll whisper suggestions during the conversation.");
      } else {
        alert("Could not connect to audio output. Make sure Bluetooth headset is connected.");
      }
    }
  };

  // Analysis
  const runAnalysis = async () => {
    const ft = liveTranscriptRef.current||transcript;
    if (!ft.trim()) { alert("No transcript captured."); return; }
    const nc = trialCount+1; setTrialCount(nc);
    setScreen("processing"); let step=0;
    const mLabel = getModeLabel(mode);
    const si = setInterval(()=>{ step++; setProcessStep(step); if(step>=5) clearInterval(si); },1500);
    try {
      const result = await analyzeTranscript(ft, context, mode);
      const traitDefs = getTraitDefs(mode);
      const traits = result.traits.map(t => { const d=traitDefs.find(x=>x.key===t.key); return {...t,...d, scoreColor:getScoreColor(t.score,t.category||d?.category), scoreLabel:getScoreZoneLabel(t.score,t.category||d?.category)}; });
      const rd = {...result, traits, transcript:ft, context, subjectName, mode, date:new Date().toISOString().split("T")[0], duration:formatTime(recordingTime)};
      setReport(rd);
      if (user&&FIREBASE_CONFIG.apiKey) { const sid=await saveToFirebase(FIREBASE_CONFIG.projectId,FIREBASE_CONFIG.apiKey,user.uid,rd); if(sid) setSavedToFirebase(true); }
      clearInterval(si); setScreen("report"); setReportTab("traits");
    } catch(e) { clearInterval(si); alert("Analysis error: "+e.message); setScreen("recording"); }
  };

  const handleNewRecording = () => {
    if (!user && trialCount>=MAX_TRIALS) { setScreen("signup"); return; }
    setReport(null); setRecordingTime(0); setTranscript(""); liveTranscriptRef.current=""; setSubjectName(""); setScreen("modeSelect");
  };

  const toggleCategory = cat => setOpenCategories(p=>({...p,[cat]:!p[cat]}));

  // ─── GRADIENT HELPERS ─────────────────────────────────────────────────────
  const accentGrad = mode === "business"
    ? `linear-gradient(135deg,${C.bizAccent},#1E40AF)`
    : `linear-gradient(135deg,${C.dateAccent},#8B2FC9)`;
  const bgGlow = mode === "business"
    ? "radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.08) 0%, transparent 60%)"
    : "radial-gradient(ellipse at 50% 0%, rgba(224,66,122,0.08) 0%, transparent 60%)";

  // ─── SHELL ────────────────────────────────────────────────────────────────
  const shell = content => (
    <div style={{minHeight:"100vh",background:C.bg,color:C.text,fontFamily:FONTS.body,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"24px 20px",boxSizing:"border-box",backgroundImage:bgGlow}}>
      <CoachingBadge active={isRecording} coaching={coachingActive} onToggle={toggleCoaching}/>
      <div style={{width:"100%",maxWidth:440}}>{content}</div>
    </div>
  );

  // ═════════════════════════════════════════════════════════════════════════════
  // SCREENS
  // ═════════════════════════════════════════════════════════════════════════════

  // ── SPLASH ──
  if (screen==="splash") return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",backgroundImage:"radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.12) 0%, transparent 70%)"}}>
      <div style={{fontSize:64,marginBottom:16}}>🧠</div>
      <div style={{fontFamily:FONTS.display,fontSize:52,fontWeight:700,letterSpacing:-1,background:"linear-gradient(135deg,#A78BFA,#E0427A,#3B82F6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Xyrella</div>
      <div style={{color:C.muted,fontSize:14,marginTop:10,letterSpacing:3,textTransform:"uppercase"}}>Know More. Win More.</div>
      <div style={{display:"flex",gap:20,marginTop:24}}>
        <div style={{fontSize:12,color:C.dateAccentSoft}}>💘 DateIQ</div>
        <div style={{color:C.dim}}>|</div>
        <div style={{fontSize:12,color:C.bizAccentSoft}}>💼 BusinessIQ</div>
      </div>
    </div>
  );

  // ── TERMS ──
  if (screen==="terms") return shell(<div>
    <div style={{textAlign:"center",marginBottom:16}}><div style={{fontFamily:FONTS.display,fontSize:22,fontWeight:700}}>Terms of Use</div><div style={{fontSize:11,color:C.dim,textTransform:"uppercase",letterSpacing:1,marginTop:4}}>Xyrella — User Agreement</div></div>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 18px",maxHeight:420,overflowY:"auto",marginBottom:16}}>
      {TERMS.map((s,i)=>(<div key={i}>{i>0&&<div style={{height:1,background:C.border,margin:"14px 0"}}/>}<div style={{fontSize:11,fontWeight:700,color:C.accentSoft,textTransform:"uppercase",letterSpacing:.8,marginBottom:4}}>{s.num}</div><p style={{fontSize:12,color:C.muted,lineHeight:1.65,margin:0}}>{s.text}</p></div>))}
    </div>
    <div style={{fontSize:11,color:C.dim,textAlign:"center",marginBottom:10}}>Scroll to review all sections</div>
    <button onClick={()=>setScreen("onboard")} style={{width:"100%",padding:16,background:`linear-gradient(135deg,${C.accent},#5B21B6)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:FONTS.body}}>I Agree</button>
  </div>);

  // ── ONBOARD ──
  if (screen==="onboard") return shell(<div>
    <div style={{textAlign:"center",marginBottom:28}}>
      <div style={{fontSize:48,marginBottom:8}}>🧠</div>
      <div style={{fontFamily:FONTS.display,fontSize:32,fontWeight:700,lineHeight:1.2}}>Intelligence for<br/><span style={{background:"linear-gradient(135deg,#E0427A,#3B82F6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>every conversation.</span></div>
      <div style={{color:C.muted,fontSize:14,marginTop:12,lineHeight:1.6}}>Record any conversation and get AI-powered analysis across <strong style={{color:C.text}}>37 key traits</strong> — for dating <em>and</em> business.</div>
    </div>
    {[
      {icon:"💘",title:"DateIQ",desc:"Personality analysis for dates — spot red flags, find green flags"},
      {icon:"💼",title:"BusinessIQ",desc:"Sales intelligence — read prospects, track deals, close smarter"},
      {icon:"🎧",title:"Live Coaching",desc:"Get whispered suggestions through your Bluetooth headset in real-time"},
      {icon:"📝",title:"Interest Tracking",desc:"AI notes what they like, dislike, and mention — never forget a detail"},
    ].map((f,i)=>(
      <div key={i} style={{display:"flex",gap:14,marginBottom:12,background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`}}><div style={{fontSize:28}}>{f.icon}</div><div><div style={{fontWeight:700,fontSize:15}}>{f.title}</div><div style={{color:C.muted,fontSize:13,marginTop:2}}>{f.desc}</div></div></div>
    ))}
    <div style={{background:C.card,border:"1px solid rgba(34,197,94,.2)",borderRadius:14,padding:"14px 16px",marginBottom:20,textAlign:"center"}}>
      <div style={{fontSize:13,color:C.green,fontWeight:600}}>Create an account to start analyzing</div>
      <div style={{fontSize:12,color:C.muted,marginTop:4}}>Sign up to save results and track your conversations</div>
    </div>
    <button onClick={()=>setScreen("signup")} style={{width:"100%",padding:16,background:`linear-gradient(135deg,${C.accent},#5B21B6)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:FONTS.body,marginBottom:10}}>Get Started</button>
  </div>);

  // ── MODE SELECT ──
  if (screen==="modeSelect") return shell(<div>
    <div style={{textAlign:"center",marginBottom:28}}>
      <div style={{fontSize:40,marginBottom:8}}>🧠</div>
      <div style={{fontFamily:FONTS.display,fontSize:28,fontWeight:700}}>Choose Your Mode</div>
      <div style={{color:C.muted,fontSize:14,marginTop:6}}>What kind of conversation are you analyzing?</div>
    </div>
    <div onClick={()=>{setMode("date");setScreen("recording");}} style={{background:C.card,borderRadius:20,padding:24,marginBottom:14,border:`1px solid ${C.border}`,cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.dateAccent},#FF6B9D)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:44}}>💘</div>
        <div>
          <div style={{fontFamily:FONTS.display,fontSize:24,fontWeight:700,color:C.dateAccentSoft}}>DateIQ</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4,lineHeight:1.5}}>Personality analysis for dates and relationships. Score 37 traits across red flags, green flags, and behavioral patterns.</div>
        </div>
      </div>
    </div>
    <div onClick={()=>{setMode("business");setScreen("recording");}} style={{background:C.card,borderRadius:20,padding:24,marginBottom:20,border:`1px solid ${C.border}`,cursor:"pointer",transition:"all 0.2s",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${C.bizAccent},#60A5FA)`}}/>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontSize:44}}>💼</div>
        <div>
          <div style={{fontFamily:FONTS.display,fontSize:24,fontWeight:700,color:C.bizAccentSoft}}>BusinessIQ</div>
          <div style={{fontSize:13,color:C.muted,marginTop:4,lineHeight:1.5}}>Sales intelligence for meetings and calls. Score buyer signals, risk indicators, and deal readiness across 37 traits.</div>
        </div>
      </div>
    </div>
    {user && <div style={{textAlign:"center",fontSize:12,color:C.muted}}>Signed in as {user.displayName}</div>}
  </div>);

  // ── SIGNUP / SIGNIN ──
  if (screen==="signup") return shell(<div>
    <div style={{textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:48,marginBottom:8}}>🧠</div>
      <div style={{fontFamily:FONTS.display,fontSize:26,fontWeight:700}}>{authMode==="signup"?"Create Your Account":"Welcome Back"}</div>
      <div style={{color:C.muted,fontSize:13,marginTop:6}}>{authMode==="signup"?"Get 5 free credits when you sign up":"Sign in to access your reports"}</div>
    </div>
    <div style={{display:"flex",background:C.surface,borderRadius:10,padding:3,marginBottom:20}}>
      {["signup","signin"].map(m=>(<div key={m} onClick={()=>{setAuthMode(m);setAuthError("");}} style={{flex:1,padding:10,textAlign:"center",fontSize:14,fontWeight:600,borderRadius:8,cursor:"pointer",background:authMode===m?C.card:"none",color:authMode===m?C.text:C.muted}}>{m==="signup"?"Sign Up":"Sign In"}</div>))}
    </div>
    {authError&&<div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.25)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#fca5a5",marginBottom:14,lineHeight:1.4}}>{authError}</div>}
    {authMode==="signup"&&<>
      <Input label="Full Name" placeholder="Your name" value={authName} onChange={e=>setAuthName(e.target.value)}/>
      <Input label="Email" type="email" placeholder="you@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/>
      <Input label="Password" type="password" placeholder="At least 6 characters" value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/>
      <Input label="Confirm Password" type="password" placeholder="Re-enter password" value={authConfirm} onChange={e=>setAuthConfirm(e.target.value)}/>
      <Input label="Instagram Handle (optional)" placeholder="@yourhandle" value={authIG} onChange={e=>setAuthIG(e.target.value)}/>
      <button onClick={handleSignup} disabled={authLoading} style={{width:"100%",padding:16,background:authLoading?C.dim:`linear-gradient(135deg,${C.accent},#5B21B6)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:authLoading?"default":"pointer",fontFamily:FONTS.body,opacity:authLoading?.6:1}}>{authLoading?"Creating Account...":"Create Account"}</button>
    </>}
    {authMode==="signin"&&<>
      <Input label="Email" type="email" placeholder="you@email.com" value={authEmail} onChange={e=>setAuthEmail(e.target.value)}/>
      <Input label="Password" type="password" placeholder="Your password" value={authPassword} onChange={e=>setAuthPassword(e.target.value)}/>
      <button onClick={handleSignin} disabled={authLoading} style={{width:"100%",padding:16,background:authLoading?C.dim:`linear-gradient(135deg,${C.accent},#5B21B6)`,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:authLoading?"default":"pointer",fontFamily:FONTS.body,opacity:authLoading?.6:1}}>{authLoading?"Signing In...":"Sign In"}</button>
    </>}

    <div style={{marginTop:24, textAlign:"center"}}>
      <div style={{fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:1, marginBottom:10}}>Testing / Quick Access</div>
      <button onClick={handleAnonymousLogin} disabled={authLoading} style={{width:"100%",padding:14,background:"none",border:`1px solid ${C.border}`,borderRadius:14,color:C.text,fontSize:14,cursor:authLoading?"default":"pointer",fontFamily:FONTS.body,opacity:authLoading?.6:1}}>
        {authLoading?"Authenticating...":"Anonymous Login (No Typing)"}
      </button>
    </div>
  </div>);

  // ── RECORDING ──
  if (screen==="recording") {
    if (!user&&trialCount>=MAX_TRIALS) { setScreen("signup"); return null; }
    if (!mode) { setScreen("modeSelect"); return null; }
    const accent = getModeAccent(mode);
    const accentSoft = getModeAccentSoft(mode);
    const mIcon = getModeIcon(mode);
    const mLabel = getModeLabel(mode);
    const namePlaceholder = mode==="business" ? "Prospect's name (e.g. John, Acme Corp...)" : "Date's name (e.g. Jessica, Mike...)";

    return shell(<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <button onClick={()=>setScreen("modeSelect")} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,fontFamily:FONTS.body}}>← Back</button>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span style={{fontSize:16}}>{mIcon}</span>
          <span style={{fontFamily:FONTS.display,fontSize:18,fontWeight:700,color:accentSoft}}>{mLabel}</span>
        </div>
        <div style={{minWidth:48,textAlign:"right"}}>{user?<div style={{fontSize:11,color:C.green,fontWeight:600}}>{user.displayName?.split(" ")[0]}</div>:<div style={{fontSize:11,color:C.orange,fontWeight:600}}>Trial {trialCount+1}/{MAX_TRIALS}</div>}</div>
      </div>

      <input placeholder={namePlaceholder} value={subjectName} onChange={e=>setSubjectName(e.target.value)} maxLength={40} style={{width:"100%",padding:"12px 14px",borderRadius:12,border:`1px solid ${C.border}`,background:C.card,color:C.text,fontSize:15,marginBottom:16,fontFamily:FONTS.body,boxSizing:"border-box"}}/>

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {contextOptions.map(ctx=>(<button key={ctx} onClick={()=>setContext(ctx)} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${context===ctx?accent:C.border}`,background:context===ctx?getModeGlow(mode):"none",color:context===ctx?accentSoft:C.muted,fontSize:12,cursor:"pointer",fontFamily:FONTS.body}}>{ctx}</button>))}
      </div>

      {/* Bluetooth Coaching Toggle */}
      <div onClick={toggleCoaching} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.card,borderRadius:12,padding:"12px 16px",marginBottom:20,border:`1px solid ${coachingActive?C.teal+"40":C.border}`,cursor:"pointer"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🎧</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:coachingActive?C.teal:C.text}}>Live Coaching</div>
            <div style={{fontSize:11,color:C.muted}}>Whispered tips via Bluetooth headset</div>
          </div>
        </div>
        <div style={{width:40,height:22,borderRadius:11,background:coachingActive?C.teal:C.dim,position:"relative",transition:"background 0.2s"}}>
          <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:coachingActive?20:2,transition:"left 0.2s"}}/>
        </div>
      </div>

      <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginBottom:24}}>
        <button onClick={isRecording?stopRecording:startRecording} style={{width:100,height:100,borderRadius:"50%",background:isRecording?`radial-gradient(circle,${C.red},#7F1D1D)`:accentGrad,border:"none",cursor:"pointer",boxShadow:isRecording?`0 0 40px rgba(239,68,68,0.5)`:`0 0 40px ${getModeGlow(mode)}`,fontSize:36,transition:"all 0.3s",animation:isRecording?"pulse 1.5s infinite":"none"}}>{isRecording?"⏹":"🎙️"}</button>
        <style>{`@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}`}</style>
        {isRecording&&<div style={{marginTop:16,textAlign:"center"}}><div style={{fontFamily:FONTS.display,fontSize:32,color:C.red}}>{formatTime(recordingTime)}</div><div style={{color:C.muted,fontSize:12,marginTop:4}}>RECORDING — tap to stop</div></div>}
        {!isRecording&&recordingTime===0&&<div style={{color:C.muted,fontSize:13,marginTop:12}}>Tap to begin recording</div>}
        {!isRecording&&recordingTime>0&&<div style={{color:C.green,fontSize:13,marginTop:12}}>{formatTime(recordingTime)} recorded</div>}
      </div>

      {transcript&&<div style={{background:C.card,borderRadius:14,padding:16,border:`1px solid ${C.border}`,marginBottom:16,maxHeight:120,overflowY:"auto"}}><div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Live Transcript</div><div style={{fontSize:13,color:C.text,lineHeight:1.6}}>{transcript}</div></div>}

      {!isRecording&&recordingTime===0&&<div style={{marginBottom:16}}><div style={{fontSize:12,color:C.muted,marginBottom:6}}>Or paste a transcript manually:</div><textarea placeholder="Paste conversation transcript here..." value={transcript} onChange={e=>{setTranscript(e.target.value);liveTranscriptRef.current=e.target.value;}} style={{width:"100%",minHeight:100,padding:12,background:C.card,border:`1px solid ${C.border}`,borderRadius:12,color:C.text,fontSize:13,fontFamily:FONTS.body,resize:"vertical",boxSizing:"border-box"}}/></div>}

      {(transcript||recordingTime>0)&&!isRecording&&<button onClick={runAnalysis} style={{width:"100%",padding:16,background:accentGrad,border:"none",borderRadius:16,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:FONTS.body}}>Analyze 37 {mode==="business"?"Business":"Dating"} Traits</button>}
      {!user&&<button onClick={()=>setScreen("signup")} style={{width:"100%",padding:10,marginTop:12,background:"none",border:"none",color:C.accentSoft,fontSize:13,cursor:"pointer",fontFamily:FONTS.body,textDecoration:"underline"}}>Create an account to save your results</button>}
    </div>);
  }

  // ── PROCESSING ──
  if (screen==="processing") {
    const mLabel = getModeLabel(mode);
    const mIcon = getModeIcon(mode);
    const steps = mode === "business"
      ? ["Uploading and transcribing audio...","Analyzing buyer signals...","Scanning for risk indicators...","Evaluating personality traits...","Extracting prospect interests & deal intel...","Generating your BusinessIQ report..."]
      : ["Uploading and transcribing audio...","Scanning for negative red flags...","Evaluating positive green flags...","Scoring polar opposite traits...","Extracting interests & insights...","Generating your DateIQ report..."];

    return shell(<div style={{textAlign:"center",marginTop:"10vh"}}>
      <div style={{fontSize:64,marginBottom:24,animation:"spin 2s linear infinite"}}>{mIcon}</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <div style={{fontFamily:FONTS.display,fontSize:28,marginBottom:8}}>Analyzing...</div>
      <div style={{color:C.muted,fontSize:14,marginBottom:32}}>{context} {subjectName?`with ${subjectName}`:""} — {formatTime(recordingTime)} recorded</div>
      {steps.map((s,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10,opacity:processStep>=i?1:.25,transition:"opacity 0.5s ease",background:processStep>=i?C.card:"none",borderRadius:10,padding:"10px 14px",border:processStep>=i?`1px solid ${C.border}`:"1px solid transparent"}}><span style={{fontSize:16,width:24,textAlign:"center"}}>{processStep>i?"✅":processStep===i?"⏳":"⬜"}</span><span style={{fontSize:13,color:processStep>=i?C.text:C.muted}}>{s}</span></div>))}
    </div>);
  }

  // ── REPORT ──
  if (screen==="report"&&report) {
    const cats = getCatKeys(mode);
    const allCats = getCategories(mode);
    const byCat={}; cats.forEach(c=>{byCat[c]=report.traits.filter(t=>t.category===c);});
    const accent = getModeAccent(mode);
    const accentSoft = getModeAccentSoft(mode);
    const mLabel = getModeLabel(mode);
    const mIcon = getModeIcon(mode);

    return shell(<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <button onClick={handleNewRecording} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,fontFamily:FONTS.body}}>← New</button>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <span>{mIcon}</span>
          <span style={{fontFamily:FONTS.display,fontSize:20,fontWeight:700}}>{mLabel} Report</span>
        </div>
        <div style={{width:48}}/>
      </div>

      {/* Score Header */}
      <div style={{background:C.card,borderRadius:20,padding:24,marginBottom:16,border:`1px solid ${C.border}`,textAlign:"center"}}>
        {subjectName&&<div style={{fontFamily:FONTS.display,fontSize:22,fontWeight:700,marginBottom:4}}>{subjectName}</div>}
        <div style={{color:C.muted,fontSize:12,marginBottom:16}}>{report.context} — {report.date}</div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:16}}><RadialScore score={report.overallScore} size={110} mode={mode}/></div>
        <div style={{fontSize:13,color:C.text,lineHeight:1.6,fontStyle:"italic"}}>"{report.summary}"</div>
        {savedToFirebase&&<div style={{color:C.green,fontSize:12,marginTop:12}}>Saved to your account</div>}
        <div style={{display:"flex",justifyContent:"center",gap:16,marginTop:16}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>37</div><div style={{fontSize:11,color:C.muted}}>Traits</div></div>
          <div style={{width:1,background:C.border}}/>
          <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>4</div><div style={{fontSize:11,color:C.muted}}>Categories</div></div>
          {report.interests && <>
            <div style={{width:1,background:C.border}}/>
            <div style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:700}}>{(report.interests.likes?.length||0)+(report.interests.dislikes?.length||0)}</div><div style={{fontSize:11,color:C.muted}}>Interests</div></div>
          </>}
        </div>
      </div>

      {/* Report Tabs */}
      <div style={{display:"flex",background:C.surface,borderRadius:10,padding:3,marginBottom:16}}>
        {[
          {key:"traits",label:"Traits"},
          {key:"interests",label:"Notes"},
          ...(mode==="business"?[{key:"deal",label:"Deal Intel"}]:[]),
        ].map(tab=>(<div key={tab.key} onClick={()=>setReportTab(tab.key)} style={{flex:1,padding:10,textAlign:"center",fontSize:13,fontWeight:600,borderRadius:8,cursor:"pointer",background:reportTab===tab.key?C.card:"none",color:reportTab===tab.key?C.text:C.muted}}>{tab.label}</div>))}
      </div>

      {/* Tab Content */}
      {reportTab==="traits" && <>
        {cats.map(cat=>(<div key={cat} style={{marginBottom:16}}>
          <CategoryHeader cat={cat} isOpen={openCategories[cat]} onToggle={()=>toggleCategory(cat)} mode={mode}/>
          {byCat[cat].map(trait=>{
            const isExp=expandedTrait===trait.key, color=trait.scoreColor||getScoreColor(trait.score,trait.category);
            return (<div key={trait.key} onClick={()=>setExpandedTrait(isExp?null:trait.key)} style={{background:C.card,borderRadius:12,padding:"12px 14px",marginBottom:6,border:`1px solid ${isExp?color:C.border}`,cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{flex:1}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:600,fontSize:14}}>{trait.label}</span><span style={{fontSize:10,padding:"2px 6px",borderRadius:10,fontWeight:700,background:color===C.green?"rgba(34,197,94,.15)":color===C.red?"rgba(239,68,68,.15)":"rgba(245,158,11,.15)",color}}>{trait.scoreLabel||getScoreZoneLabel(trait.score,trait.category)}</span></div>{trait.description&&<div style={{fontSize:11,color:C.muted,marginTop:2}}>{trait.description}</div>}</div>
                <div style={{marginLeft:12,textAlign:"right"}}><span style={{fontFamily:FONTS.display,fontSize:22,color,fontWeight:700}}>{trait.score}</span><span style={{fontSize:11,color:C.muted}}>/100</span></div>
              </div>
              {(trait.category==="negative"||trait.category==="positive"||trait.category==="buyer"||trait.category==="risk")&&<ScoreBar score={trait.score} category={trait.category}/>}
              {trait.category==="polar"&&<PolarMeter score={trait.score} idealLabel={trait.idealLabel} worstLabel={trait.worstLabel}/>}
              {trait.category==="balance"&&<BalanceMeter score={trait.score} lowLabel={trait.lowLabel} midLabel={trait.midLabel} highLabel={trait.highLabel}/>}
              {isExp&&trait.notes&&<div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`,fontSize:13,color:C.muted,lineHeight:1.6,fontStyle:"italic"}}>"{trait.notes}"</div>}
            </div>);
          })}
        </div>))}
      </>}

      {reportTab==="interests" && <InterestPanel interests={report.interests} mode={mode}/>}
      {reportTab==="deal" && mode==="business" && <DealPanel report={report}/>}

      {/* Footer */}
      {!user&&<div style={{background:C.card,border:`1px solid ${accent}30`,borderRadius:14,padding:16,marginBottom:16,textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:accentSoft,marginBottom:6}}>Save your results</div><div style={{fontSize:12,color:C.muted,marginBottom:12}}>Create an account to keep this report and get 5 free credits.</div><button onClick={()=>setScreen("signup")} style={{padding:"10px 24px",background:accentGrad,border:"none",borderRadius:12,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:FONTS.body}}>Create Account</button></div>}
      <div style={{textAlign:"center",padding:"24px 0",borderTop:`1px solid ${C.border}`,marginTop:16}}><div style={{fontSize:11,color:C.dim,lineHeight:1.6}}>Results do not constitute medical, psychological, or professional business advice.<br/>10% of purchases donated to Liberating Humanity.</div></div>
    </div>);
  }

  return shell(<div style={{textAlign:"center",marginTop:"40vh"}}><div style={{color:C.muted}}>Loading...</div></div>);
}
