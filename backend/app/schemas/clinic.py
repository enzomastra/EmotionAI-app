from pydantic import BaseModel
from typing import List
from app.schemas.patient import PatientResponse

class ClinicBase(BaseModel):
    name: str
    email: str

class ClinicCreate(ClinicBase):
    password: str

class ClinicResponse(ClinicBase):
    id: int
    patients: List["PatientResponse"] = []

    class Config:
        orm_mode = True