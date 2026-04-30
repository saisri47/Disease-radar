# AI Triage And Hospital Mapping Specification

## Goal

Upgrade Disease Radar from a passive symptom reporting dashboard into an actionable user assistance system.

The new core flow:

1. User enters symptoms and pincode.
2. System predicts likely diseases or disease categories.
3. System assigns urgency.
4. System maps the user to nearby hospitals or clinics.
5. UI shows a clear recommended action.

Example result:

- Likely condition: Viral fever / flu-like illness
- Urgency: Medium
- Recommended action: Visit a nearby general physician today
- Nearby care options: 3 hospitals in or near your pincode

## Product Positioning

This should be presented as:

- AI-based symptom interpretation
- Probable disease prediction
- Severity-aware triage
- Hospital and clinic recommendation

This should not be presented as:

- guaranteed diagnosis
- confirmed disease detection
- replacement for a doctor

Recommended disclaimer:

"This system provides probable disease patterns and triage guidance based on symptoms. It is not a medical diagnosis. For emergencies or severe symptoms, seek immediate professional care."

## Current Project Fit

Current backend:

- FastAPI in [backend/main.py](backend/main.py)
- Existing report submission endpoint: `/api/report`
- Existing report analytics endpoints: `/api/reports`, `/api/symptom_counts`
- Existing precaution chatbot endpoint: `/api/precautions`

Current frontend:

- Symptom + pincode capture in [frontend/src/pages/ReportPage.jsx](frontend/src/pages/ReportPage.jsx)
- Dashboard and analytics views already exist

This makes the report flow the correct place to add prediction, urgency, and hospital recommendation.

## Proposed User Flow

### Primary Flow

1. User opens Report page.
2. User selects symptoms.
3. User selects pincode.
4. User submits report.
5. Backend stores the report.
6. Backend runs symptom-to-disease inference.
7. Backend calculates urgency.
8. Backend fetches pincode-matched hospitals or clinics.
9. Frontend shows a results panel below or instead of the success popup.

### Result Screen Content

- Top 3 likely diseases or categories
- Confidence band for each prediction
- Urgency level: Low / Medium / High / Emergency
- Reason for urgency
- Recommended action
- Nearby hospitals or clinics
- Red-flag notice when applicable
- Medical disclaimer

## Functional Requirements

### 1. Disease Prediction

Input:

- symptoms
- pincode
- onset_date if available

Output:

- top 3 likely diseases
- disease category
- confidence score or qualitative confidence band

Initial supported disease categories:

- Viral fever / flu-like illness
- Common cold / upper respiratory infection
- Gastrointestinal infection
- Possible dengue-like illness
- Possible respiratory distress condition
- Non-specific mild illness

Recommended v1 approach:

- Start with a symptom-to-disease weighted rule engine.
- Label it as AI-assisted inference in the project presentation.
- Upgrade later to an ML model if dataset quality improves.

Reason:

- The current project does not contain training data with confirmed diagnoses.
- A rules engine is explainable, fast, and defensible for a panel demo.

### 2. Urgency Scoring

Urgency levels:

- Low: home care and monitor
- Medium: consult a doctor soon
- High: visit a doctor or clinic today
- Emergency: seek emergency care immediately

Example red-flag symptoms:

- chest pain
- severe shortness of breath
- confusion
- persistent high fever
- dehydration
- vomiting with weakness

Urgency output should include:

- urgency level
- urgency score
- explanation
- action recommendation

### 3. Hospital Or Clinic Mapping

Input:

- pincode
- urgency level
- likely disease category

Output:

- 3 to 5 nearby hospitals or clinics
- facility name
- address
- contact if available
- facility type
- suitability tag such as `General Physician`, `Emergency`, `Respiratory Care`

Recommended v1 approach:

- Maintain a curated JSON or database table mapping pincodes to hospitals.
- Return the closest matching options for the selected pincode.
- If exact pincode is unavailable, fall back to same city or nearest configured pincode.

### 4. Clear Action Plan

Each result must end with a single direct instruction.

Examples:

- "Monitor symptoms at home and rest. Consult a doctor if symptoms worsen."
- "Visit a nearby general physician within 24 hours."
- "Go to the nearest hospital immediately."

## Backend Design

### New Modules

Recommended new files:

- `backend/triage_rules.py`
- `backend/disease_predictor.py`
- `backend/hospital_directory.py`
- `backend/data/hospitals.json`

### New Response Models

```python
class PredictionResult(BaseModel):
    disease: str
    category: str
    confidence: float
    confidence_band: str
    matched_symptoms: list[str]

class HospitalResult(BaseModel):
    name: str
    facility_type: str
    pincode: str
    address: str
    phone: str | None = None
    specialty: str | None = None

class TriageResponse(BaseModel):
    report_id: int
    urgency_level: str
    urgency_score: int
    recommendation: str
    reasoning: list[str]
    predictions: list[PredictionResult]
    hospitals: list[HospitalResult]
    disclaimer: str
```

### Option A: Extend Existing Endpoint

Current endpoint:

- `POST /api/report`

New behavior:

- store report
- run prediction + urgency + hospital lookup
- return enriched result

Recommended response:

```json
{
  "status": "ok",
  "report_id": 101,
  "triage": {
    "urgency_level": "Medium",
    "urgency_score": 58,
    "recommendation": "Visit a nearby general physician today.",
    "reasoning": [
      "Fever and cough indicate a flu-like illness pattern.",
      "No emergency red-flag symptom was detected."
    ],
    "predictions": [
      {
        "disease": "Influenza",
        "category": "Viral fever / flu-like illness",
        "confidence": 0.78,
        "confidence_band": "High",
        "matched_symptoms": ["fever", "cough", "fatigue"]
      },
      {
        "disease": "Common Cold",
        "category": "Upper respiratory infection",
        "confidence": 0.42,
        "confidence_band": "Medium",
        "matched_symptoms": ["cough"]
      }
    ],
    "hospitals": [
      {
        "name": "City General Hospital",
        "facility_type": "Hospital",
        "pincode": "110001",
        "address": "Connaught Place, New Delhi",
        "phone": "+91-XXXXXXXXXX",
        "specialty": "General Medicine"
      }
    ],
    "disclaimer": "This is not a medical diagnosis. Seek professional care for severe symptoms."
  }
}
```

### Option B: Separate Endpoint

Alternative endpoint:

- `POST /api/triage`

Request body:

```json
{
  "symptoms": ["fever", "cough", "fatigue"],
  "pincode": "110001",
  "onset_date": "2026-03-18"
}
```

Use this if you want to keep report storage separate from triage logic.

Recommendation:

- For your current project, extending `/api/report` is better because it keeps the user flow simple.

## Disease Prediction Logic

### v1 Rule-Based Mapping

Example knowledge base:

```python
DISEASE_RULES = [
    {
        "disease": "Influenza",
        "category": "Viral fever / flu-like illness",
        "symptoms": {
            "fever": 3,
            "cough": 2,
            "fatigue": 2,
            "body aches": 2,
            "chills": 2,
            "sore throat": 1
        }
    },
    {
        "disease": "Common Cold",
        "category": "Upper respiratory infection",
        "symptoms": {
            "cough": 2,
            "sneezing": 3,
            "congestion": 3,
            "sore throat": 2,
            "headache": 1
        }
    },
    {
        "disease": "Gastroenteritis",
        "category": "Gastrointestinal infection",
        "symptoms": {
            "nausea": 3,
            "vomiting": 3,
            "diarrhea": 3,
            "fatigue": 1,
            "fever": 1
        }
    },
    {
        "disease": "Dengue-like illness",
        "category": "Mosquito-borne fever pattern",
        "symptoms": {
            "fever": 3,
            "headache": 2,
            "body aches": 3,
            "fatigue": 2,
            "nausea": 1
        }
    }
]
```

Scoring approach:

- sum weights for matched symptoms
- normalize against rule maximum
- sort descending
- return top 3 predictions

Confidence band suggestion:

- `High` for score >= 0.7
- `Medium` for score >= 0.4
- `Low` otherwise

## Urgency Logic

### Example Scoring Rules

Base score inputs:

- severe symptoms present
- number of symptoms
- high-risk patterns
- predicted disease category

Red-flag override:

- If any emergency symptom is present, set urgency to `Emergency`.

Example scoring:

```python
EMERGENCY_SYMPTOMS = {
    "chest pain",
    "shortness of breath"
}

HIGH_PRIORITY_SYMPTOMS = {
    "high fever",
    "vomiting",
    "diarrhea",
    "fatigue"
}
```

Urgency mapping:

- `0-24`: Low
- `25-49`: Medium
- `50-74`: High
- `75+`: Emergency

Example recommendations:

- Low: "Rest, hydrate, and monitor symptoms for 24 to 48 hours."
- Medium: "Consult a doctor soon, especially if symptoms persist or worsen."
- High: "Visit a nearby clinic or doctor today."
- Emergency: "Seek emergency medical care immediately."

## Hospital Mapping Design

### v1 Data Source

Use a local data file first:

- `backend/data/hospitals.json`

Suggested structure:

```json
{
  "110001": [
    {
      "name": "City General Hospital",
      "facility_type": "Hospital",
      "address": "Connaught Place, New Delhi",
      "phone": "+91-XXXXXXXXXX",
      "specialty": "General Medicine"
    }
  ],
  "560001": [
    {
      "name": "Bangalore Central Clinic",
      "facility_type": "Clinic",
      "address": "MG Road, Bangalore",
      "phone": "+91-XXXXXXXXXX",
      "specialty": "General Physician"
    }
  ]
}
```

### Selection Logic

- If urgency is `Emergency`, prioritize hospitals over clinics.
- If respiratory symptoms dominate, prioritize pulmonary or general emergency care.
- If GI symptoms dominate, prioritize general medicine.
- If exact pincode is missing, use nearest configured pincode from the existing pincode list.

## Frontend Design

### Report Page Changes

Current file:

- [frontend/src/pages/ReportPage.jsx](frontend/src/pages/ReportPage.jsx)

Replace the current transient success popup with a structured triage result panel.

### New Result Panel Sections

1. Prediction summary
   - likely condition
   - confidence
   - urgency badge

2. Recommended action
   - one clear instruction
   - short reasoning

3. Nearby hospitals or clinics
   - card list of facilities
   - address
   - specialty
   - contact

4. Disclaimer
   - not a diagnosis
   - emergency escalation warning

### Example UI Copy

```text
Likely condition
Influenza / flu-like illness

Urgency
Medium

Recommended action
Visit a nearby general physician today.

Why this result
- Fever, cough, and fatigue match a flu-like illness pattern.
- No immediate emergency red-flag symptom was detected.

Nearby care
- City General Hospital
- Metro Clinic
- Primary Care Center
```

### Suggested Frontend State Shape

```javascript
const [triageResult, setTriageResult] = useState(null)
```

Suggested submit handling:

- POST symptoms and pincode
- receive triage payload
- store `triageResult`
- render result card inline under the form

## Data Model Changes

Current report model is enough for v1:

- symptoms
- pincode
- onset_date
- created_at

Optional future additions:

- severity self-rating
- age band
- sex
- pregnancy flag
- known chronic conditions
- free-text notes

These improve prediction quality later but are not required for v1.

## Safety Requirements

### Required Guardrails

- Always say `likely`, `possible`, or `probable`
- Never say the prediction is certain
- Always include a disclaimer
- Always escalate emergency symptoms to immediate medical care
- Do not suppress care recommendations when severe symptoms are present

### High-Risk Copy Rules

Allowed:

- "Possible flu-like illness"
- "Urgent medical attention recommended"
- "Visit the nearest hospital"

Avoid:

- "You definitely have dengue"
- "This confirms pneumonia"
- "No need to see a doctor"

## Panel Presentation Language

Use this wording in your presentation:

"Our enhanced Disease Radar platform does not only collect symptom reports. It interprets the reported symptoms using an AI-assisted disease prediction layer, assigns a triage urgency score, and maps the user to nearby hospitals or clinics based on pincode. This makes the system directly useful to the reporter, not only to the analytics dashboard."

Short version:

"The system predicts probable diseases, determines urgency, and recommends nearby care."

## Implementation Plan

### Phase 1

- Add disease rules engine
- Add urgency scoring
- Add local hospital directory
- Extend `/api/report` response
- Render triage result on Report page

### Phase 2

- Add richer symptom metadata
- Improve hospital matching
- Add disease explanation cards
- Add user-specific risk summary from local outbreak data

### Phase 3

- Replace rules engine with ML-assisted ranking if labeled data becomes available
- Add feedback loop for prediction quality
- Add doctor specialization routing

## Recommended Next Build

For this codebase, the best next implementation is:

1. Extend `POST /api/report` to return triage output.
2. Add a rule-based disease predictor.
3. Add an urgency scoring module.
4. Add a curated pincode-to-hospital directory.
5. Replace the success popup on the report page with a result panel.

That is the smallest change set that makes the product match the panel feedback.
