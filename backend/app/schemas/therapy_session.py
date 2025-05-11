from pydantic import BaseModel
from datetime import datetime

class TherapySessionBase(BaseModel):
    date: datetime
    results: str

class TherapySessionCreate(TherapySessionBase):
    pass

class TherapySessionResponse(TherapySessionBase):
    id: int

    class Config:
        orm_mode = True