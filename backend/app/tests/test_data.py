from sqlalchemy.orm import Session
from app.models.clinic import Clinic
from app.models.patient import Patient
from app.models.therapy_session import TherapySession
from app.core.auth import get_password_hash
import json
from datetime import datetime, timedelta

def create_test_data(db: Session):
    # Create a test clinic
    clinic = Clinic(
        name="Test Clinic",
        email="test@clinic.com",
        hashed_password=get_password_hash("testpassword123")
    )
    db.add(clinic)
    db.commit()
    db.refresh(clinic)

    # Create test patients
    patients = [
        Patient(
            name="Juan Pérez",
            age=25,
            clinic_id=clinic.id
        ),
        Patient(
            name="María García",
            age=30,
            clinic_id=clinic.id
        )
    ]
    for patient in patients:
        db.add(patient)
    db.commit()
    for patient in patients:
        db.refresh(patient)

    # Create test therapy sessions with emotion data
    # We'll create 3 sessions for each patient
    for patient in patients:
        for i in range(3):
            # Different emotion patterns for each session
            if i == 0:
                emotions = ["happy", "happy", "neutral", "surprised"] * 2
            elif i == 1:
                emotions = ["sad", "angry", "fearful", "neutral"] * 2
            else:
                emotions = ["happy", "surprised", "happy", "neutral"] * 2

            session = TherapySession(
                patient_id=patient.id,
                date=datetime.utcnow() - timedelta(days=i*7),  # Sessions 1 week apart
                results=json.dumps({
                    "emotions": emotions,
                    "session_duration": 3600,  # 1 hour session
                    "notes": f"Test session {i+1}"
                })
            )
            db.add(session)
    
    db.commit()

    return {
        "clinic": clinic,
        "patients": patients
    } 