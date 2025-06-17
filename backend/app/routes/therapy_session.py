from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime
from app.schemas.therapy_session import TherapySessionCreate, TherapySessionResponse, TherapySessionUpdate
from app.models.therapy_session import TherapySession
from app.models.patient import Patient
from app.models.user import User
from app.routes.deps import get_db, get_current_user
from app.services.api_client import analyze_video
import os
import json

router = APIRouter(prefix="/patients/{patient_id}/therapy-sessions", tags=["sessions"])

@router.post("/", response_model=TherapySessionResponse)
def create_session(patient_id: int, session: TherapySessionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db_session = TherapySession(date=session.date, results=session.results, patient_id=patient.id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=list[TherapySessionResponse])
def list_sessions(patient_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return db.query(TherapySession).filter(TherapySession.patient_id == patient.id).all()

@router.post("/analyze", response_model=TherapySessionResponse)
async def analyze_and_save(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    temp_dir = "./temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)
    with open(temp_file_path, "wb") as temp_file:
        temp_file.write(await file.read())
    result = analyze_video(temp_file_path)
    os.remove(temp_file_path)
    db_session = TherapySession(date=datetime.utcnow(), results=json.dumps(result), patient_id=patient.id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.patch("/{session_id}/observations", response_model=TherapySessionResponse)
def update_session_observations(
    patient_id: int,
    session_id: int,
    session_update: TherapySessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify patient exists and belongs to clinic
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get the session and verify it belongs to the patient
    session = db.query(TherapySession).filter(
        TherapySession.id == session_id,
        TherapySession.patient_id == patient_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Therapy session not found")
    
    # Update observations
    session.observations = session_update.observations
    db.commit()
    db.refresh(session)
    return session