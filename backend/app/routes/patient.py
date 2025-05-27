from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.patient import PatientCreate, PatientResponse
from app.models.patient import Patient
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