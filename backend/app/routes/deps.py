from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from app.core.auth import decode_access_token
from app.models.clinic import Clinic
from app.database import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_clinic(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_access_token(token)    
    print("TOKEN:", token)
    print("PAYLOAD:", payload)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid authentication")
    try:
        clinic_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid clinic ID")
    clinic = db.query(Clinic).filter(Clinic.id == clinic_id).first()
    if not clinic:
        raise HTTPException(status_code=401, detail="Clinic not found")
    return clinic