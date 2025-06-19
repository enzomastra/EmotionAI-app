from pydantic import BaseModel
from typing import List
from app.schemas.patient import PatientResponse

class UserBase(BaseModel):
    name: str
    email: str

class UserRegister(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(UserBase):
    id: int
    role: str
    patients: List["PatientResponse"] = []

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None