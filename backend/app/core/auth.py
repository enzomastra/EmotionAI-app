from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.core.config import settings
from app.models.user import User
from sqlalchemy.orm import Session
from app.database import get_db

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

print("Using SECRET_KEY:", SECRET_KEY)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    # Asegurarse de que sub sea string
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    print("Token created with SECRET_KEY:", SECRET_KEY)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        print("Attempting to decode token with SECRET_KEY:", SECRET_KEY)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("Successfully decoded payload:", payload)
        return payload
    except JWTError as e:
        print("Error decoding token:", str(e))
        return None

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    try:
        # Intentar buscar por ID primero
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            # Si no se encuentra por ID, intentar por email
            user = db.query(User).filter(User.email == user_id).first()
    except ValueError:
        # Si la conversión a int falla, buscar por email
        user = db.query(User).filter(User.email == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    return user