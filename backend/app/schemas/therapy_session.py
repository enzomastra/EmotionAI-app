from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any
import json

class TherapySessionBase(BaseModel):
    date: datetime
    results: str

class TherapySessionCreate(TherapySessionBase):
    pass

class TherapySessionResponse(BaseModel):
    id: int
    date: datetime
    results: str
    patient_id: int

    class Config:
        from_attributes = True

    def get_results_dict(self) -> Dict[str, Any]:
        """Convierte el string JSON de results a un diccionario"""
        return json.loads(self.results)