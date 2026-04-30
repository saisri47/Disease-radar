from typing import List, Tuple


EMERGENCY_SYMPTOMS = {
    "chest pain",
    "shortness of breath",
}

HIGH_PRIORITY_SYMPTOMS = {
    "fever",
    "vomiting",
    "diarrhea",
    "fatigue",
    "chills",
}

RESPIRATORY_DISEASES = {
    "Possible respiratory concern",
}


def score_urgency(symptoms: List[str], predictions: List[dict]) -> Tuple[str, int, str, List[str]]:
    normalized = {symptom.strip().lower() for symptom in symptoms if symptom.strip()}
    reasons = []

    if normalized & EMERGENCY_SYMPTOMS:
        reasons.append("Emergency symptom detected in the submitted report.")
        return (
            "Emergency",
            95,
            "Go to the nearest hospital immediately.",
            reasons,
        )

    score = min(len(normalized) * 8, 32)
    if normalized & HIGH_PRIORITY_SYMPTOMS:
        score += 20
        reasons.append("Several symptoms match higher-priority illness patterns.")

    top_prediction = predictions[0] if predictions else None
    if top_prediction:
        if top_prediction["confidence"] >= 0.7:
            score += 20
            reasons.append(
                f"Symptoms strongly match {top_prediction['category'].lower()}."
            )
        elif top_prediction["confidence"] >= 0.4:
            score += 10
            reasons.append(
                f"Symptoms moderately match {top_prediction['category'].lower()}."
            )

        if top_prediction["category"] in RESPIRATORY_DISEASES:
            score += 15
            reasons.append("Respiratory involvement increases urgency.")

    score = min(score, 90)

    if score >= 75:
        return "High", score, "Visit a nearby clinic or doctor today.", reasons
    if score >= 45:
        return "Medium", score, "Visit a nearby general physician today.", reasons
    return "Low", score, "Rest, hydrate, and monitor symptoms for 24 to 48 hours.", reasons
