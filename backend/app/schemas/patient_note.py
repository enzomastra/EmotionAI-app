from pydantic import BaseModel
from datetime import datetime

class PatientNoteBase(BaseModel):
    text: str

class PatientNoteCreate(PatientNoteBase):
    pass

class PatientNoteResponse(PatientNoteBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True 