from pydantic import BaseModel
from typing import List, Optional
from app.schemas.therapy_session import TherapySessionResponse

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

    class Config:
        from_attributes = True