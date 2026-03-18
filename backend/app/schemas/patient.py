from pydantic import BaseModel
from typing import List, Optional
# Unused imports removed for performance and to avoid circular loading

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
    clinic_id: Optional[int] = None
    # therapy_sessions and notes removed for performance as they are loaded via dedicated endpoints

    class Config:
        from_attributes = True