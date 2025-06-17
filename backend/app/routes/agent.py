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
        
        # Enviar mensaje al agente
        response = await agent_service.send_message(
            message=request.message,
            session_ids=request.session_ids,
            session_emotions=request.session_emotions
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