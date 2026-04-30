from typing import List, Dict


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
            "sore throat": 1,
            "headache": 1,
            "congestion": 1,
        },
    },
    {
        "disease": "Common Cold",
        "category": "Upper respiratory infection",
        "symptoms": {
            "cough": 2,
            "sneezing": 3,
            "congestion": 3,
            "sore throat": 2,
            "headache": 1,
            "fatigue": 1,
        },
    },
    {
        "disease": "Gastroenteritis",
        "category": "Gastrointestinal infection",
        "symptoms": {
            "nausea": 3,
            "vomiting": 3,
            "diarrhea": 3,
            "fatigue": 1,
            "fever": 1,
            "body aches": 1,
        },
    },
    {
        "disease": "Dengue-like Illness",
        "category": "Mosquito-borne fever pattern",
        "symptoms": {
            "fever": 3,
            "headache": 2,
            "body aches": 3,
            "fatigue": 2,
            "nausea": 1,
            "vomiting": 1,
            "chills": 1,
        },
    },
    {
        "disease": "Respiratory Distress Pattern",
        "category": "Possible respiratory concern",
        "symptoms": {
            "shortness of breath": 4,
            "chest pain": 4,
            "cough": 2,
            "fever": 1,
            "fatigue": 1,
        },
    },
]


def confidence_band(score: float) -> str:
    if score >= 0.7:
        return "High"
    if score >= 0.4:
        return "Medium"
    return "Low"


def predict_diseases(symptoms: List[str]) -> List[Dict]:
    normalized = [symptom.strip().lower() for symptom in symptoms if symptom.strip()]
    predictions = []

    for rule in DISEASE_RULES:
        symptom_weights = rule["symptoms"]
        max_score = sum(symptom_weights.values())
        matched = [symptom for symptom in normalized if symptom in symptom_weights]
        raw_score = sum(symptom_weights[symptom] for symptom in matched)
        score = round(raw_score / max_score, 2) if max_score else 0.0

        if matched:
            predictions.append(
                {
                    "disease": rule["disease"],
                    "category": rule["category"],
                    "confidence": score,
                    "confidence_band": confidence_band(score),
                    "matched_symptoms": matched,
                }
            )

    if not predictions:
        return [
            {
                "disease": "Non-specific mild illness",
                "category": "General symptom pattern",
                "confidence": 0.2,
                "confidence_band": "Low",
                "matched_symptoms": normalized,
            }
        ]

    predictions.sort(key=lambda item: item["confidence"], reverse=True)
    return predictions[:3]
