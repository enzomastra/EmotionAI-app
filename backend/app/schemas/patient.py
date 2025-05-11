from pydantic import BaseModel
from typing import List
from app.schemas.therapy_session import TherapySessionResponse

class PatientBase(BaseModel):
    name: str
    age: int

class PatientCreate(PatientBase):
    pass

class PatientResponse(PatientBase):
    id: int
    therapy_sessions: List["TherapySessionResponse"] = []

    class Config:
        orm_mode = True