from pydantic import BaseModel

class ClinicRegister(BaseModel):
    name: str
    email: str
    password: str

class ClinicLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"