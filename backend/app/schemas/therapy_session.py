from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any, Optional
import json

class TherapySessionBase(BaseModel):
    date: datetime
    results: str

class TherapySessionCreate(TherapySessionBase):
    pass

class TherapySessionUpdate(BaseModel):
    observations: Optional[str] = None

class TherapySessionResponse(BaseModel):
    id: int
    date: datetime
    results: str
    observations: Optional[str] = None
    patient_id: int

    class Config:
        from_attributes = True

    def get_results_dict(self) -> Dict[str, Any]:
        """Convierte el string JSON de results a un diccionario"""
        return json.loads(self.results)