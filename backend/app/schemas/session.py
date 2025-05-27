from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any

class TherapySessionBase(BaseModel):
    results: str

class TherapySessionCreate(TherapySessionBase):
    pass

class TherapySessionResponse(BaseModel):
    id: int
    date: datetime
    results: Dict[str, Any]
    patient_id: int

    class Config:
        from_attributes = True 