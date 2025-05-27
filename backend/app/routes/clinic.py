from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.clinic import ClinicRegister, ClinicLogin, Token
from app.models.clinic import Clinic
from app.core.auth import get_password_hash, verify_password, create_access_token
from app.database import SessionLocal
from app.routes.deps import get_db

router = APIRouter(prefix="/clinic", tags=["clinic"])

@router.post("/login", response_model=Token)
def login(request: ClinicLogin, db: Session = Depends(get_db)):
    clinic = db.query(Clinic).filter(Clinic.email == request.email).first()
    if not clinic or not verify_password(request.password, clinic.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": clinic.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register(request: ClinicRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(Clinic).filter(Clinic.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new clinic
    clinic = Clinic(
        email=request.email,
        password=get_password_hash(request.password),
        name=request.name
    )
    db.add(clinic)
    db.commit()
    db.refresh(clinic)
    
    # Generate token
    access_token = create_access_token(data={"sub": clinic.email})
    return {"access_token": access_token, "token_type": "bearer"}
