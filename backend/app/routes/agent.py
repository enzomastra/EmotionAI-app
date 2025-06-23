from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
from ..services.agent_service import agent_service
from ..core.auth import get_current_user
from ..models.user import User

router = APIRouter()

class AgentMessageRequest(BaseModel):
    message: str
    session_ids: Optional[List[str]] = None
    session_emotions: Optional[Dict[str, Dict]] = None
    patient_id: Optional[int] = None

@router.get("/chat/{patient_id}")
async def get_chat_history(
    patient_id: int,
    session_ids: Optional[List[int]] = None,
    current_user: User = Depends(get_current_user)
):
    """Get chat history for a patient or specific sessions"""
    try:
        # Verificar que el paciente pertenece al usuario actual
        if not any(patient.id == patient_id for patient in current_user.patients):
            raise HTTPException(status_code=403, detail="Patient not found or access denied")
        
        return await agent_service.get_chat_history(patient_id, session_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def send_message(
    request: AgentMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send a message to the agent with session emotions data"""
    try:
        print(f"[Agent Route] Received request data:")
        print(f"Message: {request.message}")
        print(f"Session IDs: {request.session_ids}")
        print(f"Session Emotions: {request.session_emotions}")
        print(f"Request dict: {request.dict()}")

        # Obtener therapist_id
        therapist_id = current_user.id
        # Obtener patient_id (preferir el campo explícito, si no, usar el primer session_id si está disponible)
        patient_id = request.patient_id
        if patient_id is None and request.session_ids:
            try:
                patient_id = int(request.session_ids[0])
            except Exception:
                raise HTTPException(status_code=400, detail="No se pudo determinar el patient_id")
        if patient_id is None:
            raise HTTPException(status_code=400, detail="Se requiere patient_id")

        # Preparar datos emocionales (extraer el primer valor del dict si existe)
        if request.session_emotions and isinstance(request.session_emotions, dict):
            # Toma el primer valor del dict (de la sesión seleccionada)
            emotion_data = next(iter(request.session_emotions.values()))
        else:
            emotion_data = {}

        # Enviar mensaje al agente
        response = await agent_service.send_message(
            message=request.message,
            therapist_id=therapist_id,
            patient_id=patient_id,
            emotion_data=emotion_data
        )
        print(f"[Agent Route] Agent response: {response}")
        return response
    except Exception as e:
        print(f"[Agent Route] Error in send_message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze/{patient_id}")
async def analyze_patient_data(
    patient_id: int,
    data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Analyze patient data and get recommendations"""
    try:
        # Verificar que el paciente pertenece al usuario actual
        if not any(patient.id == patient_id for patient in current_user.patients):
            raise HTTPException(status_code=403, detail="Patient not found or access denied")
        
        if "emotion_data" not in data:
            raise HTTPException(status_code=400, detail="Emotion data is required")
        
        return await agent_service.analyze_patient_data(patient_id, data["emotion_data"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 