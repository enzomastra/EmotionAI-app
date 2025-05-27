from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.session import SessionCreate, SessionResponse
from app.models.session import Session as SessionModel
from app.routes.deps import get_db, get_current_clinic

router = APIRouter(prefix="/patients/{patient_id}/sessions", tags=["sessions"])

@router.post("/", response_model=SessionResponse)
def create_session(patient_id: int, session: SessionCreate, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    db_session = SessionModel(
        patient_id=patient_id,
        results=session.results,
        clinic_id=clinic.id
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

@router.get("/", response_model=list[SessionResponse])
def list_sessions(patient_id: int, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    return db.query(SessionModel).filter(
        SessionModel.patient_id == patient_id,
        SessionModel.clinic_id == clinic.id
    ).all()

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(patient_id: int, session_id: int, db: Session = Depends(get_db), clinic=Depends(get_current_clinic)):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.patient_id == patient_id,
        SessionModel.clinic_id == clinic.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return session 