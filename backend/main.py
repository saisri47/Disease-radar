from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from secrets import token_urlsafe
import json
import os
import shutil
import sqlite3
from typing import Dict, List, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import Column, Date, DateTime, Integer, String, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from disease_predictor import predict_diseases
from hospital_directory import get_nearby_hospitals, resolve_location_context
from triage_rules import score_urgency

DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(DB_DIR, "disease_radar.db")
DB_URL = f"sqlite:///{DB_PATH}"
REPORT_EXPIRATION_DAYS = 7
UPLOAD_DIR = Path(DB_DIR) / "backend" / "uploads" / "reports"
ADMIN_PASSWORD = os.getenv("DISEASE_RADAR_ADMIN_PASSWORD", "doctor123")
ADMIN_SESSIONS: Dict[str, Dict[str, str]] = {}

engine = create_engine(DB_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


class ReportDB(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    symptoms = Column(String)
    cell = Column(String)
    pincode = Column(String, nullable=True)
    onset_date = Column(Date)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    review_status = Column(String, nullable=True)
    report_file_path = Column(String, nullable=True)
    report_file_name = Column(String, nullable=True)
    verified_disease = Column(String, nullable=True)
    verification_notes = Column(String, nullable=True)
    reviewed_by = Column(String, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    latitude = Column(String, nullable=True)
    longitude = Column(String, nullable=True)


Base.metadata.create_all(bind=engine)


def ensure_schema() -> None:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    try:
        columns = {
            row[1]
            for row in conn.execute("PRAGMA table_info(reports)").fetchall()
        }
        required_columns = {
            "review_status": "ALTER TABLE reports ADD COLUMN review_status TEXT",
            "report_file_path": "ALTER TABLE reports ADD COLUMN report_file_path TEXT",
            "report_file_name": "ALTER TABLE reports ADD COLUMN report_file_name TEXT",
            "verified_disease": "ALTER TABLE reports ADD COLUMN verified_disease TEXT",
            "verification_notes": "ALTER TABLE reports ADD COLUMN verification_notes TEXT",
            "reviewed_by": "ALTER TABLE reports ADD COLUMN reviewed_by TEXT",
            "reviewed_at": "ALTER TABLE reports ADD COLUMN reviewed_at TEXT",
            "latitude": "ALTER TABLE reports ADD COLUMN latitude TEXT",
            "longitude": "ALTER TABLE reports ADD COLUMN longitude TEXT",
        }

        for column, statement in required_columns.items():
            if column not in columns:
                conn.execute(statement)

        # Preserve existing demo data by treating legacy rows as already approved.
        conn.execute(
            """
            UPDATE reports
            SET review_status = 'approved'
            WHERE review_status IS NULL OR TRIM(review_status) = ''
            """
        )
        conn.commit()
    finally:
        conn.close()


ensure_schema()

app = FastAPI(title="Disease Radar API (SQLite)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ReportIn(BaseModel):
    symptoms: List[str]
    cell: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    onset_date: Optional[date] = None


class PrecautionQuery(BaseModel):
    query: str


class AdminLoginIn(BaseModel):
    password: str
    admin_name: Optional[str] = None


class AdminReviewIn(BaseModel):
    action: str
    verified_disease: Optional[str] = None
    verification_notes: Optional[str] = None
    reviewed_by: Optional[str] = None


class LocationResolveOut(BaseModel):
    pincode: str
    display_name: str
    source: str


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def cutoff_time() -> datetime:
    return utcnow() - timedelta(days=REPORT_EXPIRATION_DAYS)


def normalize_symptoms(symptoms: List[str]) -> List[str]:
    return [symptom.strip().lower() for symptom in symptoms if symptom and symptom.strip()]


def normalize_date(onset_date_value: Optional[date], onset_date_text: Optional[str]) -> date:
    if onset_date_value:
        return onset_date_value
    if onset_date_text:
        try:
            return date.fromisoformat(onset_date_text)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Invalid onset_date format. Use YYYY-MM-DD.") from exc
    return date.today()


def store_uploaded_report(report_id: int, medical_report: UploadFile) -> tuple[str, str]:
    safe_name = Path(medical_report.filename or f"report_{report_id}.bin").name
    destination = UPLOAD_DIR / f"{report_id}_{safe_name}"
    with destination.open("wb") as buffer:
        shutil.copyfileobj(medical_report.file, buffer)
    return str(destination), safe_name


def serialize_report(report: ReportDB, include_admin_fields: bool = False) -> dict:
    latitude = float(report.latitude) if report.latitude not in (None, "") else None
    longitude = float(report.longitude) if report.longitude not in (None, "") else None
    if report.pincode:
        location_label = report.pincode
    elif report.cell:
        location_label = report.cell
    elif latitude is not None and longitude is not None:
        location_context = resolve_location_context(latitude, longitude)
        location_label = location_context.get("display_name") or location_context.get("pincode") or "Current area"
    else:
        location_label = "Unknown"

    data = {
        "id": report.id,
        "symptoms": report.symptoms.split(",") if report.symptoms else [],
        "cell": report.cell,
        "pincode": report.pincode,
        "latitude": latitude,
        "longitude": longitude,
        "location_label": location_label,
        "onset_date": str(report.onset_date) if report.onset_date else None,
        "created_at": report.created_at.isoformat() + "Z" if report.created_at else None,
        "review_status": report.review_status or "pending",
        "verified_disease": report.verified_disease,
    }
    if include_admin_fields:
        data.update(
            {
                "report_file_name": report.report_file_name,
                "has_medical_report": bool(report.report_file_path),
                "verification_notes": report.verification_notes,
                "reviewed_by": report.reviewed_by,
                "reviewed_at": report.reviewed_at.isoformat() + "Z" if report.reviewed_at else None,
            }
        )
    return data


def require_admin(x_admin_token: Optional[str] = Header(default=None)) -> dict:
    if not x_admin_token or x_admin_token not in ADMIN_SESSIONS:
        raise HTTPException(status_code=401, detail="Admin authentication required.")
    return ADMIN_SESSIONS[x_admin_token]


async def parse_report_submission(
    request: Request,
    symptoms_payload: Optional[str],
    pincode: Optional[str],
    latitude: Optional[float],
    longitude: Optional[float],
    onset_date_text: Optional[str],
) -> ReportIn:
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        body = await request.json()
        return ReportIn(**body)

    if not symptoms_payload:
        raise HTTPException(status_code=400, detail="Symptoms are required.")

    try:
        parsed_symptoms = json.loads(symptoms_payload)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Symptoms must be a JSON array.") from exc

    if not isinstance(parsed_symptoms, list):
        raise HTTPException(status_code=400, detail="Symptoms must be a JSON array.")

    return ReportIn(
        symptoms=parsed_symptoms,
        pincode=pincode,
        latitude=latitude,
        longitude=longitude,
        onset_date=normalize_date(None, onset_date_text),
    )


@app.post("/api/report")
async def create_report(
    request: Request,
    medical_report: Optional[UploadFile] = File(default=None),
    symptoms_payload: Optional[str] = Form(default=None),
    pincode: Optional[str] = Form(default=None),
    latitude: Optional[float] = Form(default=None),
    longitude: Optional[float] = Form(default=None),
    onset_date_text: Optional[str] = Form(default=None),
):
    submission = await parse_report_submission(
        request,
        symptoms_payload=symptoms_payload,
        pincode=pincode,
        latitude=latitude,
        longitude=longitude,
        onset_date_text=onset_date_text,
    )

    normalized_symptoms = normalize_symptoms(submission.symptoms)
    if not normalized_symptoms:
        raise HTTPException(status_code=400, detail="Please provide at least one symptom.")

    db = SessionLocal()
    try:
        db_obj = ReportDB(
            symptoms=",".join(normalized_symptoms),
            cell=submission.cell,
            pincode=submission.pincode,
            latitude=str(submission.latitude) if submission.latitude is not None else None,
            longitude=str(submission.longitude) if submission.longitude is not None else None,
            onset_date=normalize_date(submission.onset_date, onset_date_text),
            review_status="pending",
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)

        if medical_report and medical_report.filename:
            file_path, file_name = store_uploaded_report(db_obj.id, medical_report)
            db_obj.report_file_path = file_path
            db_obj.report_file_name = file_name
            db.commit()
            db.refresh(db_obj)

        predictions = predict_diseases(normalized_symptoms)
        urgency_level, urgency_score, recommendation, reasoning = score_urgency(
            normalized_symptoms,
            predictions,
        )
        hospital_lookup = get_nearby_hospitals(
            submission.pincode,
            urgency_level,
            predictions,
            latitude=submission.latitude,
            longitude=submission.longitude,
        )

        if not reasoning:
            reasoning = ["The recommendation is based on the submitted symptom pattern."]

        return {
            "status": "ok",
            "id": db_obj.id,
            "review_status": db_obj.review_status,
            "message": "Report submitted and sent for doctor/admin verification.",
            "requires_admin_review": True,
            "triage": {
                "urgency_level": urgency_level,
                "urgency_score": urgency_score,
                "recommendation": recommendation,
                "reasoning": reasoning,
                "predictions": predictions,
                "hospitals": hospital_lookup["facilities"],
                "hospital_lookup_source": hospital_lookup["source"],
                "hospital_lookup_pincode": hospital_lookup["resolved_pincode"],
                "hospital_lookup_reason": hospital_lookup.get("reason"),
                "hospital_lookup_error": hospital_lookup.get("error"),
                "location_mode": (
                    "coordinates"
                    if submission.latitude is not None and submission.longitude is not None
                    else "pincode"
                ),
                "disclaimer": (
                    "This is a provisional symptom-based triage result. "
                    "Only doctor-approved cases are published to maps and analytics."
                ),
            },
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    finally:
        db.close()


@app.get("/api/reports")
def list_reports(limit: int = 200):
    db = SessionLocal()
    try:
        rows = (
            db.query(ReportDB)
            .filter(ReportDB.created_at >= cutoff_time(), ReportDB.review_status == "approved")
            .order_by(ReportDB.created_at.desc())
            .limit(limit)
            .all()
        )
        return [serialize_report(row) for row in rows]
    finally:
        db.close()


@app.get("/api/location/resolve", response_model=LocationResolveOut)
def resolve_location(latitude: float = Query(...), longitude: float = Query(...)):
    return resolve_location_context(latitude, longitude)


@app.get("/api/aggregate/{cell}")
def aggregate(cell: str):
    db = SessionLocal()
    try:
        count = (
            db.query(ReportDB)
            .filter(
                ReportDB.cell == cell,
                ReportDB.created_at >= cutoff_time(),
                ReportDB.review_status == "approved",
            )
            .count()
        )
        return {"cell": cell, "count": count}
    finally:
        db.close()


@app.get("/api/symptom_counts")
def symptom_counts():
    db = SessionLocal()
    try:
        rows = (
            db.query(ReportDB.symptoms)
            .filter(
                ReportDB.created_at >= cutoff_time(),
                ReportDB.review_status == "approved",
            )
            .all()
        )

        counter = Counter()
        total_reports = 0
        for (symptoms_text,) in rows:
            if not symptoms_text:
                continue
            total_reports += 1
            counter.update(normalize_symptoms(symptoms_text.split(",")))

        return {"total": dict(counter), "total_reports": total_reports}
    finally:
        db.close()


@app.get("/api/symptom_counts_by_cell")
def symptom_counts_by_cell(cell: str = Query(None, description="Filter by cell, e.g. cell_4_5")):
    db = SessionLocal()
    try:
        query = db.query(ReportDB.cell, ReportDB.symptoms).filter(
            ReportDB.created_at >= cutoff_time(),
            ReportDB.review_status == "approved",
        )
        if cell:
            query = query.filter(ReportDB.cell == cell)

        by_cell = defaultdict(Counter)
        for cell_name, symptoms_text in query.all():
            if not symptoms_text:
                continue
            by_cell[cell_name].update(normalize_symptoms(symptoms_text.split(",")))

        return {"by_cell": {name: dict(counts) for name, counts in by_cell.items()}}
    finally:
        db.close()


@app.post("/api/admin/login")
def admin_login(payload: AdminLoginIn):
    if payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin password.")

    token = token_urlsafe(24)
    ADMIN_SESSIONS[token] = {
        "admin_name": (payload.admin_name or "Doctor Admin").strip() or "Doctor Admin",
    }
    return {"token": token, "admin_name": ADMIN_SESSIONS[token]["admin_name"]}


@app.get("/api/admin/reports")
def list_admin_reports(
    status: str = Query(default="pending"),
    limit: int = 100,
    admin_session: dict = Depends(require_admin),
):
    db = SessionLocal()
    try:
        query = db.query(ReportDB).filter(ReportDB.created_at >= cutoff_time())
        if status != "all":
            query = query.filter(ReportDB.review_status == status)

        rows = query.order_by(ReportDB.created_at.asc()).limit(limit).all()
        return {
            "admin_name": admin_session["admin_name"],
            "reports": [serialize_report(row, include_admin_fields=True) for row in rows],
        }
    finally:
        db.close()


@app.post("/api/admin/reports/{report_id}/review")
def review_report(
    report_id: int,
    payload: AdminReviewIn,
    admin_session: dict = Depends(require_admin),
):
    action = payload.action.strip().lower()
    if action not in {"approve", "reject"}:
        raise HTTPException(status_code=400, detail="Action must be approve or reject.")
    if action == "approve" and not (payload.verified_disease or "").strip():
        raise HTTPException(status_code=400, detail="Verified disease is required when approving a report.")

    db = SessionLocal()
    try:
        report = db.query(ReportDB).filter(ReportDB.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")

        report.review_status = "approved" if action == "approve" else "rejected"
        report.verified_disease = (payload.verified_disease or "").strip() or None
        report.verification_notes = (payload.verification_notes or "").strip() or None
        report.reviewed_by = (payload.reviewed_by or admin_session["admin_name"]).strip()
        report.reviewed_at = utcnow()
        db.commit()
        db.refresh(report)
        return {"status": "ok", "report": serialize_report(report, include_admin_fields=True)}
    finally:
        db.close()


@app.get("/api/admin/reports/{report_id}/document")
def get_report_document(report_id: int, admin_session: dict = Depends(require_admin)):
    db = SessionLocal()
    try:
        report = db.query(ReportDB).filter(ReportDB.id == report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found.")
        if not report.report_file_path or not os.path.exists(report.report_file_path):
            raise HTTPException(status_code=404, detail="Medical report file not found.")
        return FileResponse(
            report.report_file_path,
            filename=report.report_file_name or os.path.basename(report.report_file_path),
        )
    finally:
        db.close()


@app.post("/api/precautions")
def get_precautions(req: PrecautionQuery):
    query = req.query.lower()

    precautions_db = {
        "fever": {
            "title": "Precautions for Fever",
            "points": [
                "Rest: Get adequate sleep to help your body fight the infection",
                "Stay hydrated: Drink plenty of water, warm tea, or electrolyte drinks",
                "Monitor temperature: Use a thermometer regularly and track readings",
                "Medication: Take paracetamol or ibuprofen as directed (follow dosage)",
                "Cool compress: Apply cool, damp cloth to forehead and neck",
                "Light clothing: Avoid heavy blankets; wear light, breathable clothes",
                "Nutrition: Eat light, easily digestible foods",
                "Isolation: Stay away from others if possible to prevent spreading",
                "Seek medical help: If fever persists beyond 3-5 days or exceeds 103 F (39.4 C)",
            ],
        },
        "cough": {
            "title": "Precautions for Cough",
            "points": [
                "Stay hydrated: Drink warm water, honey lemon tea, or herbal remedies",
                "Use a humidifier: Add moisture to the air to ease coughing",
                "Avoid irritants: Stay away from smoke, pollution, and strong odors",
                "Throat lozenges: Use sugar-free lozenges to soothe throat",
                "Elevation: Sleep with an extra pillow to ease breathing",
                "Cough syrup: Use over-the-counter cough suppressants if needed",
                "Avoid dairy: Milk can increase mucus production",
                "Warm compresses: Apply to chest for relief",
                "Cover mouth: Use a mask when around others to prevent spread",
                "Rest voice: Avoid talking excessively to prevent further irritation",
            ],
        },
        "sore throat": {
            "title": "Precautions for Sore Throat",
            "points": [
                "Gargle with salt water: Mix 1/2 teaspoon salt in warm water, gargle 3-4 times daily",
                "Use throat lozenges: Soothing lozenges with honey or menthol help",
                "Stay hydrated: Drink warm herbal teas, warm water with honey",
                "Avoid irritants: Don't smoke or expose to secondhand smoke",
                "Use a humidifier: Moist air helps ease throat discomfort",
                "Eat soft foods: Avoid spicy, hot, or hard foods",
                "Rest: Get adequate sleep to help recovery",
                "Honey: A spoonful of honey can coat and soothe throat",
                "Avoid cold drinks: Stick to warm beverages",
                "See doctor: If pain persists beyond a week or worsens",
            ],
        },
        "headache": {
            "title": "Precautions for Headache",
            "points": [
                "Rest: Take a break from work and relax in a quiet, dark room",
                "Stay hydrated: Dehydration is a common headache trigger",
                "Pain relief: Take aspirin, ibuprofen, or paracetamol as directed",
                "Apply cold/heat: Use an ice pack or heating pad on forehead or neck",
                "Neck stretch: Gently stretch neck muscles if tension-related",
                "Avoid bright lights: Dim lights reduce headache intensity",
                "Skip caffeine: Avoid excess caffeine which can trigger migraines",
                "Eat regularly: Skipping meals can trigger headaches",
                "Practice relaxation: Deep breathing, meditation, or yoga",
                "See doctor: If severe, recurring, or accompanied by other symptoms",
            ],
        },
        "fatigue": {
            "title": "Precautions for Fatigue",
            "points": [
                "Sleep: Get 7-9 hours of quality sleep every night",
                "Rest regularly: Take short breaks during the day",
                "Nutrition: Eat balanced meals with proteins, carbs, and healthy fats",
                "Hydration: Drink plenty of water throughout the day",
                "Exercise: Light physical activity can boost energy (avoid overexertion)",
                "Limit stress: Practice meditation, yoga, or relaxation techniques",
                "Reduce caffeine: Especially before bedtime",
                "Vitamin B12: Consider supplements if deficient",
                "Iron levels: Check if anemia might be causing fatigue",
                "See doctor: If fatigue persists for weeks without clear cause",
            ],
        },
        "flu": {
            "title": "Precautions for Flu (Influenza)",
            "points": [
                "Get vaccinated: Annual flu vaccine is the best prevention",
                "Rest: Get plenty of sleep to help immune system fight virus",
                "Stay hydrated: Drink water, warm tea, soups, and broths",
                "Isolation: Stay home for at least 5-7 days to prevent spreading",
                "Antiviral medication: Consult doctor about oseltamivir (Tamiflu) within 48 hours",
                "Pain relief: Use acetaminophen or ibuprofen for fever and aches",
                "Respiratory hygiene: Cover mouth when coughing/sneezing",
                "Hand hygiene: Wash hands frequently with soap and water",
                "Avoid contact: Keep distance from family members if possible",
                "Monitor symptoms: Watch for severe symptoms requiring emergency care",
            ],
        },
        "cold": {
            "title": "Precautions for Common Cold",
            "points": [
                "Rest: Allow your body time to heal with adequate rest",
                "Fluids: Drink warm water, herbal tea, warm lemon water with honey",
                "Vitamin C: Eat citrus fruits, berries, or take supplements",
                "Saline nasal drops: Clear nasal congestion naturally",
                "Honey: A spoonful of honey helps soothe throat and cough",
                "Elevate head: Sleep with extra pillows to ease breathing",
                "Warm compress: Apply to sinuses for relief",
                "Avoid dairy: Reduces mucus production",
                "Hygiene: Wash hands and cover mouth to prevent spreading",
                "Prevention: Avoid close contact with sick people, maintain hygiene",
            ],
        },
    }

    for symptom, data in precautions_db.items():
        if symptom in query:
            formatted_response = f"\n{data['title']}\n\n"
            for index, point in enumerate(data["points"], 1):
                formatted_response += f"{index}. {point}\n"
            formatted_response += (
                "\nRemember: These are general guidelines. "
                "Always consult a healthcare professional for personalized medical advice."
            )
            return {"response": formatted_response}

    default_response = (
        "I understand you're asking about precautions. Could you please specify a symptom or condition? "
        "I can help with: fever, cough, sore throat, headache, fatigue, flu, cold, and more. "
        "Try asking 'What precautions should I take for [symptom]?'"
    )
    return {"response": default_response}
