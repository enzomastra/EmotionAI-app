from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.api_client import analyze_video

import os

from app.schemas.video import VideoAnalysisResponse
from fastapi.exceptions import HTTPException

from app.database import Base, engine
from app.models.clinic import Clinic
from app.models.patient import Patient
from app.models.therapy_session import TherapySession

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EmotionAI Backend", version="1.0.0")


@app.post("/video/analyze", response_model=VideoAnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    try:
        temp_dir = "./temp"
        os.makedirs(temp_dir, exist_ok=True)
        temp_file_path = os.path.join(temp_dir, file.filename)

        with open(temp_file_path, "wb") as temp_file:
            temp_file.write(await file.read())

        if not os.path.exists(temp_file_path):
            print(f"El archivo {temp_file_path} no existe")
            raise HTTPException(status_code=500, detail="El archivo temporal no fue creado correctamente")

        if os.path.getsize(temp_file_path) == 0:
            raise HTTPException(status_code=500, detail="archivo vacio")

        result = analyze_video(temp_file_path)

        os.remove(temp_file_path)

        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)