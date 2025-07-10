from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.schemas.therapy_session import TherapySessionResponse
from app.models.patient import Patient
from app.models.therapy_session import TherapySession
from app.routes.deps import get_db, get_current_user
import unicodedata

router = APIRouter(prefix="/patients", tags=["patients"])

def normalize_name(name: str) -> str:
    if not name:
        return ''
    # Quitar tildes y pasar a minúsculas
    nfkd = unicodedata.normalize('NFKD', name)
    return ''.join([c for c in nfkd if not unicodedata.combining(c)]).lower()

@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    normalized = normalize_name(patient.name)
    db_patient = Patient(name=patient.name, name_search=normalized, age=patient.age, user_id=current_user.id, observations=patient.observations)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/", response_model=list[PatientResponse])
def list_patients(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    name: str = None,
    age: int = None
):
    query = db.query(Patient).filter(Patient.user_id == current_user.id)
    if name:
        normalized = normalize_name(name)
        for word in normalized.split():
            query = query.filter(Patient.name_search.ilike(f"%{word}%"))
    if age:
        query = query.filter(Patient.age == age)
    return query.all()

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.patch("/{patient_id}/observations", response_model=PatientResponse)
def update_patient_observations(
    patient_id: int,
    patient_update: PatientUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.observations = patient_update.observations
    db.commit()
    db.refresh(patient)
    return patient

# Therapy Session endpoints
@router.get("/{patient_id}/therapy-sessions", response_model=list[TherapySessionResponse])
def get_patient_therapy_sessions(patient_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify patient exists and belongs to user
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    sessions = db.query(TherapySession).filter(
        TherapySession.patient_id == patient_id
    ).all()
    return sessions

@router.get("/{patient_id}/therapy-sessions/{session_id}", response_model=TherapySessionResponse)
def get_patient_therapy_session(patient_id: int, session_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Verify patient exists and belongs to user
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    session = db.query(TherapySession).filter(
        TherapySession.id == session_id,
        TherapySession.patient_id == patient_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Therapy session not found")
    
    return session