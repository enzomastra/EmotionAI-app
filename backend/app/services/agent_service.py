import httpx
from typing import Optional, List, Dict, Any
from ..core.config import settings
from datetime import datetime

class AgentService:
    def __init__(self):
        self.base_url = settings.AGENT_API_URL
        print(f"[AgentService] Initializing with base_url: {self.base_url}")
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def get_chat_history(self, patient_id: int, session_ids: Optional[List[int]] = None) -> Dict[str, Any]:
        """Get chat history for a patient or specific sessions"""
        url = f"/chat/{patient_id}"
        params = []
        if session_ids:
            params.extend([("session_ids", str(id)) for id in session_ids])
        
        if params:
            url += "?" + "&".join(f"{k}={v}" for k, v in params)
        
        print(f"[AgentService] Sending GET request to: {self.base_url}{url}")
        try:
            response = await self.client.get(url)
            print(f"[AgentService] Response status: {response.status_code}")
            print(f"[AgentService] Response content: {response.text}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"[AgentService] HTTP error: {str(e)}")
            raise
        except Exception as e:
            print(f"[AgentService] Error: {str(e)}")
            raise

    async def send_message(self, message: str, therapist_id: int, patient_id: int, emotion_data: dict) -> Dict[str, Any]:
        """Send a message to the agent with emotion data"""
        url = f"/api/agent/chat"
        data = {
            "message": message,
            "therapist_id": str(therapist_id),
            "patient_id": str(patient_id),
            "emotion_data": emotion_data
        }
        print(f"[AgentService] Sending request to: {self.base_url}{url}")
        print(f"[AgentService] Request data: {data}")
        try:
            response = await self.client.post(url, json=data)
            print(f"[AgentService] Response status: {response.status_code}")
            print(f"[AgentService] Response content: {response.text}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"[AgentService] HTTP error: {str(e)}")
            raise
        except Exception as e:
            print(f"[AgentService] Error: {str(e)}")
            raise

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

    async def analyze_patient_data(self, patient_id: int, emotion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze patient data and get recommendations"""
        url = f"/analyze/{patient_id}"
        print(f"[AgentService] Sending analysis request to: {self.base_url}{url}")
        print(f"[AgentService] Request data: {emotion_data}")
        
        try:
            response = await self.client.post(
                url,
                json={"emotion_data": emotion_data}
            )
            print(f"[AgentService] Response status: {response.status_code}")
            print(f"[AgentService] Response content: {response.text}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"[AgentService] HTTP error: {str(e)}")
            raise
        except Exception as e:
            print(f"[AgentService] Error analyzing patient data: {str(e)}")
            raise

# Create a singleton instance
agent_service = AgentService() 