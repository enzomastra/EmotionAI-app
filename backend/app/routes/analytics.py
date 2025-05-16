from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
import json
from app.database import SessionLocal
from app.models.therapy_session import TherapySession
from app.models.patient import Patient
from app.routes.deps import get_current_clinic, get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

def parse_emotions_from_results(results_json: str) -> Dict[str, int]:
    try:
        # Convert string representation of dict to actual dict
        if isinstance(results_json, str):
            results_json = results_json.replace("'", '"')
        results = json.loads(results_json)
        
        # Return the emotion_summary directly if it exists
        if 'emotion_summary' in results:
            return results['emotion_summary']
        
        # If no emotion_summary, count emotions from timeline
        emotion_counts = {}
        if 'timeline' in results:
            for emotion in results['timeline'].values():
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        return emotion_counts
    except (json.JSONDecodeError, AttributeError) as e:
        print(f"Error parsing results: {e}")
        return {}

@router.get("/patient/{patient_id}/emotions/summary")
def get_patient_emotion_summary(
    patient_id: int,
    db: Session = Depends(get_db),
    current_clinic = Depends(get_current_clinic)
):
    # Verify patient belongs to clinic
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_clinic.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all therapy sessions for the patient
    sessions = db.query(TherapySession).filter(
        TherapySession.patient_id == patient_id
    ).all()
    
    # Count emotions across all sessions
    total_emotion_counts = {}
    for session in sessions:
        session_emotions = parse_emotions_from_results(session.results)
        for emotion, count in session_emotions.items():
            total_emotion_counts[emotion] = total_emotion_counts.get(emotion, 0) + count
    
    return [{"emotion": emotion, "count": count} for emotion, count in total_emotion_counts.items()]

@router.get("/patient/{patient_id}/emotions/by-session")
def get_patient_emotions_by_session(
    patient_id: int,
    db: Session = Depends(get_db),
    current_clinic = Depends(get_current_clinic)
):
    # Verify patient belongs to clinic
    patient = db.query(Patient).filter(
        Patient.id == patient_id,
        Patient.clinic_id == current_clinic.id
    ).first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get all therapy sessions for the patient
    sessions = db.query(TherapySession).filter(
        TherapySession.patient_id == patient_id
    ).order_by(TherapySession.date).all()
    
    # Organize data by session
    sessions_data = {}
    for session in sessions:
        emotion_counts = parse_emotions_from_results(session.results)
        sessions_data[str(session.id)] = {
            "date": session.date,
            "emotions": [{"emotion": e, "count": c} for e, c in emotion_counts.items()]
        }
    
    return sessions_data 