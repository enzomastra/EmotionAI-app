from pydantic import BaseModel
from typing import List, Optional
from app.schemas.therapy_session import TherapySessionResponse
from .patient_note import PatientNoteResponse

class PatientBase(BaseModel):
    name: str
    age: int
    observations: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    observations: Optional[str] = None

class PatientResponse(PatientBase):
    id: int
    clinic_id: int
    therapy_sessions: List[TherapySessionResponse] = []
    notes: List[PatientNoteResponse] = []

    class Config:
        from_attributes = True