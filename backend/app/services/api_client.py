import requests
from fastapi import HTTPException
from ..core.config import settings
import os

def analyze_video(file_path: str):
    url = f"{settings.API_MODEL_URL}/video/analyze"
    try:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=500, detail="El archivo no existe antes de enviarlo al modelo")

        with open(file_path, "rb") as file:
            files = {"file": ("video.mp4", file, "video/mp4")}  # Asegúrate de usar un nombre genérico
            response = requests.post(url, files=files, timeout=120)
            response.raise_for_status()
            return response.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="The request to the model API timed out.")
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Error connecting to model API: {e}")