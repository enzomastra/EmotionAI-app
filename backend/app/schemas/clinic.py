from pydantic import BaseModel
from typing import List
from app.schemas.patient import PatientResponse

class ClinicBase(BaseModel):
    name: str
    email: str

class ClinicRegister(ClinicBase):
    password: str

class ClinicLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class ClinicResponse(ClinicBase):
    id: int
    patients: List["PatientResponse"] = []

    class Config:
        orm_mode = True