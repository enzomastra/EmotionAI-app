from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.patient import PatientCreate, PatientResponse
from app.schemas.therapy_session import TherapySessionResponse
from app.models.patient import Patient
from app.models.therapy_session import TherapySession
from app.routes.deps import get_db, get_current_clinic

router = APIRouter(prefix="/patients", tags=["patients"])

@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    db_patient = Patient(name=patient.name, age=patient.age, clinic_id=clinic.id)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@router.get("/", response_model=list[PatientResponse])
def list_patients(db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    return db.query(Patient).filter(Patient.clinic_id == clinic.id).all()

@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.clinic_id == clinic.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

# Therapy Session endpoints
@router.get("/{patient_id}/therapy-sessions", response_model=list[TherapySessionResponse])
def get_patient_therapy_sessions(patient_id: int, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    # Verify patient exists and belongs to clinic
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.clinic_id == clinic.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    sessions = db.query(TherapySession).filter(
        TherapySession.patient_id == patient_id
    ).all()
    return sessions

@router.get("/{patient_id}/therapy-sessions/{session_id}", response_model=TherapySessionResponse)
def get_patient_therapy_session(patient_id: int, session_id: int, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    # Verify patient exists and belongs to clinic
    patient = db.query(Patient).filter(Patient.id == patient_id, Patient.clinic_id == clinic.id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    session = db.query(TherapySession).filter(
        TherapySession.id == session_id,
        TherapySession.patient_id == patient_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Therapy session not found")
    
    return session