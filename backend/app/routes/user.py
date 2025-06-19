from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user import UserRegister, UserLogin, Token, UserResponse, UserUpdate
from app.models.user import User
from app.core.auth import get_password_hash, verify_password, create_access_token
from app.database import SessionLocal
from app.routes.deps import get_db, get_admin_user, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(request: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=Token)
def register(request: UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user (default role is CLINIC)
    user = User(
        email=request.email,
        hashed_password=get_password_hash(request.password),
        name=request.name,
        role="clinic"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Generate token with user ID
    access_token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    """
    Endpoint para cerrar sesión.
    En una implementación real, podríamos invalidar el token aquí.
    """
    return {"message": "Successfully logged out"}

@router.get("/admin/dashboard")
def admin_dashboard(current_user: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """
    Endpoint para el dashboard del administrador.
    Solo accesible por usuarios con rol ADMIN.
    """
    # Obtener estadísticas generales
    total_users = db.query(User).filter(User.role == "clinic").count()
    total_patients = db.query(User).join(User.patients).count()
    
    # Obtener lista de usuarios clínicos
    clinic_users = db.query(User).filter(User.role == "clinic").all()
    
    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "clinic_users": [user.to_dict() for user in clinic_users]
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Obtener el perfil del usuario autenticado.
    """
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_me(update: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if update.name is not None:
        current_user.name = update.name
    if update.email is not None:
        # Verificar que el email no esté en uso
        if db.query(User).filter(User.email == update.email, User.id != current_user.id).first():
            raise HTTPException(status_code=400, detail="Email already in use")
        current_user.email = update.email
    db.commit()
    db.refresh(current_user)
    return current_user
