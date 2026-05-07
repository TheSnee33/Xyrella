# Xyrella v1.5

**AI-Powered Conversation Intelligence — For Dating & Business**

Xyrella records conversations and uses AI to analyze 37 personality/behavioral traits — delivering evidence-based intelligence whether you're on a date or in a sales meeting.

> Developed by **Bradford Communications LLC** for **Kyle Mullaney**

---

## What is Xyrella?

Xyrella is an umbrella application containing two powerful modes:

### 💘 DateIQ — Personality Intelligence for Dating
Record dates and get AI-powered personality analysis across 37 traits organized into 4 categories — helping you spot red flags, find green flags, and understand who you're really with.

### 💼 BusinessIQ — Sales Intelligence for Business
Record sales calls, discovery meetings, and negotiations to score 37 business-specific traits — reading prospects, tracking deal readiness, and closing smarter.

### Shared Features
- **📝 Interest Tracking** — AI automatically notes what your conversation partner likes, dislikes, and mentions (foods, hobbies, products, brands, etc.)
- **🎧 Live Coaching** — Get whispered suggestions through your Bluetooth headset during live conversations
- **🧠 37-Trait Analysis** — Each mode has its own specialized set of 37 traits across 4 scoring categories

---

## Version 1.5 — What's New

- **Xyrella Rebrand** — The overarching application is now Xyrella. DateIQ is a subcategory.
- **Xyrella umbrella** — DateIQ and BusinessIQ under one app with mode selection
- **BusinessIQ** — 37 new business/sales traits: Buyer Signals, Risk Signals, Personality Indicators, Behavioral Balance
- **Interest & Notes Tracking** — AI extracts likes, dislikes, mentions, and actionable insights from every conversation
- **Live Coaching Engine** — Bluetooth headset integration for real-time whispered suggestions via Web Speech API
- **Deal Intelligence** (BusinessIQ) — Deal stage detection, recommended next steps, and objection tracking
- **Mode-specific UI** — Pink/purple theme for DateIQ, blue theme for BusinessIQ
- **Updated AI Prompt** — Mode-aware analysis with interest extraction and business-specific deal intelligence
- **6 context types per mode** — DateIQ: First Date, Second Date, Friendship, Family, Business Meeting / BusinessIQ: Sales Call, Discovery Call, Demo Meeting, Negotiation, Follow-Up, Networking

---

## File Structure

```
Xyrella-v1.5/
├── README.md                 # This file
├── .gitignore                # Git ignore rules
├── index.html                # Vanilla JS implementation
├── xyrella-v1.4.jsx          # React component — full app with both modes
├── trait-definitions.js      # Master trait config: DateIQ (37) + BusinessIQ (37) = 74 traits
└── firebase-schema.js        # Firestore schema, security rules, indexes, save helper
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS (index.html) + React JSX (xyrella-v1.4.jsx) |
| AI Engine | Anthropic Claude API (claude-sonnet-4-20250514) |
| Database | Google Firebase Firestore (project: xyrella-5f994) |
| Auth | Firebase Authentication |
| Speech | Web Speech API (recognition + synthesis) |
| Coaching | Web Audio API + SpeechSynthesis for Bluetooth routing |
| Hosting | GitHub Pages |

---

## DateIQ Trait Categories (37 Traits)

### Negative Traits (10) — 🚩 Red Flags
Narcissism, Manipulativeness, Dishonesty, Arrogance, Jealousy, Controlling Behavior, Impulsiveness, Pessimism, Selfishness, Rudeness

### Positive Traits (10) — 💚 Green Flags
Altruism, Authenticity, Confidence, Compassion, Competence, Humor, Open-Mindedness, Reliability, Respectfulness, Empathy

### Polar Opposite Traits (11) — ⚖️ No Healthy Middle
Honesty/Dishonesty, Loyalty/Disloyalty, Generosity/Stinginess, Patience/Impatience, Kindness/Cruelty, Integrity/Deceitfulness, Forgiveness/Vindictiveness, Gratitude/Entitlement, Selflessness/Self-centeredness, Competence/Incompetence, Team Player/Jealousy

### Balance Traits (6) — 🎯 Middle is Ideal
Self-Worth, Independence, Expressiveness, Assertiveness, Influence, Leadership

---

## BusinessIQ Trait Categories (37 Traits)

### Buyer Signals (10) — 💰 Purchase Intent
Comfortable Buying, Budget Flexibility, Decision Authority, Urgency, Enthusiasm, Trust Level, Engagement, Vision Alignment, Champion Potential, Follow-Through Intent

### Risk Signals (10) — ⚠️ Deal Killers
Price Sensitivity, Indecisiveness, Skepticism, Defensiveness, Distraction, Competitor Loyalty, Gatekeeping, Objection Stacking, Stalling Tactics, Dishonesty

### Personality Indicators (11) — 🤝 Character Scales
Agreeableness, Transparency, Respect, Collaboration, Decisiveness, Responsiveness, Detail Orientation, Open-Mindedness, Professionalism, Reliability, Solution Focus

### Behavioral Balance (6) — 📊 Extremes Hurt
Vulnerability, Assertiveness, Formality, Detail Focus, Emotional Investment, Negotiation Style

---

## Interest Tracking

The AI automatically extracts and categorizes what conversation partners mention:

### DateIQ Notes
- **Likes**: Hobbies, foods, places, activities, pets, music, travel
- **Dislikes**: Things they express negative feelings about
- **Mentions**: Specific names, places, events, people
- **Key Insights**: Actionable suggestions (e.g., "They love hiking — suggest an outdoor date")

### BusinessIQ Notes
- **Interested In**: Features, solutions, capabilities they respond to
- **Concerns**: Product aspects or deal elements they push back on
- **Mentions**: Competitors, tools, brands, timelines, budgets
- **Sales Insights**: Actionable intelligence (e.g., "Budget approved for Q2")

---

## Live Coaching (Bluetooth)

Xyrella can connect to your Bluetooth headset and whisper real-time suggestions during conversations:

1. Connect Bluetooth headset to your phone/device
2. Toggle "Live Coaching" ON before starting recording
3. Xyrella routes suggestions through Web Speech API → system audio → Bluetooth
4. Coaching suggestions are based on detected conversation patterns

**Technical Notes:**
- Uses `SpeechSynthesisUtterance` with reduced volume (0.3) and natural voice selection
- Routes through `AudioContext` which respects system default audio output (Bluetooth when connected)
- Future phases will include real-time AI analysis for dynamic coaching suggestions

---

## Development Phases

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Interactive DateIQ prototype and UI framework |
| Phase 2 | ✅ Complete | Full 37-trait DateIQ engine and database integration |
| Phase 2.5 | ✅ Current | Xyrella umbrella — BusinessIQ, interest tracking, live coaching |
| Phase 3 | ⏳ Upcoming | Instagram login, credit system, payment processing |
| Phase 4 | 📋 Planned | ChadBot, AI Matchmaker, live coaching AI, separate addendum |

---

## Credit System

| Package | Price | Per Credit |
|---------|-------|-----------|
| 1 credit | $1.25 | $1.25 |
| 5 credits | $5.00 | $1.00 |
| 15 credits | $12.00 | $0.80 |
| 50 credits | $35.00 | $0.70 |

- Full personality/sales report unlock: **5 credits**
- Referral reward: **2 credits** per verified signup
- 10% of all purchases donated to **Liberating Humanity** / Sound of Freedom Foundation

---

## Firebase Setup

1. Project ID: `xyrella-5f994`
2. Enable Firestore in the Firebase Console
3. Deploy security rules from `firebase-schema.js`
4. Create required composite indexes (documented in schema file)
5. Add your Web API Key to the app configuration

---

## Deployment

```bash
git add .
git commit -m "v1.5 — Xyrella: DateIQ + BusinessIQ, interest tracking, live coaching"
git push origin main
```

---

## Legal

- Results do not constitute medical, psychological, or professional business advice
- Users must comply with local recording consent laws
- Bluetooth coaching is advisory only
- Developed under contract between Bradford Communications LLC and Kyle Mullaney

---

*Bradford Communications LLC — Springville, Utah*
