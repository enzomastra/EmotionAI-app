from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.auth import ClinicRegister, Token, ClinicLogin
from app.models.clinic import Clinic
from app.core.auth import get_password_hash, verify_password, create_access_token
from app.database import SessionLocal

router = APIRouter(prefix="/auth", tags=["auth"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=Token)
def register_clinic(clinic: ClinicRegister, db: Session = Depends(get_db)):
    if db.query(Clinic).filter(Clinic.email == clinic.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(clinic.password)
    db_clinic = Clinic(name=clinic.name, email=clinic.email, hashed_password=hashed_password)
    db.add(db_clinic)
    db.commit()
    db.refresh(db_clinic)
    access_token = create_access_token(data={"sub": db_clinic.id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
def login_clinic(credentials: ClinicLogin, db: Session = Depends(get_db)):
    clinic = db.query(Clinic).filter(Clinic.email == credentials.email).first()
    if not clinic or not verify_password(credentials.password, clinic.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(data={"sub": clinic.id})
    return {"access_token": access_token, "token_type": "bearer"}
