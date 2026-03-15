from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from app.services.api_client import analyze_video
from fastapi.middleware.cors import CORSMiddleware
from app.services.agent_service import agent_service

import os

from app.schemas.video import VideoAnalysisResponse
from fastapi.exceptions import HTTPException, RequestValidationError

from app.database import Base, engine
from app.models.user import User
from app.models.patient import Patient
from app.models.therapy_session import TherapySession

from app.routes import user, patient, analytics, therapy_session, agent

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EmotionAI Backend", version="1.0.0")

# Global Exception handler to log validation errors (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"--- 422 Validation Error for {request.url.path} ---")
    print(f"Errors: {exc.errors()}")
    print("------------------------------------------------")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(patient.router)
app.include_router(analytics.router)
app.include_router(therapy_session.router)
app.include_router(agent.router, prefix="", tags=["agent"])

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup when the application shuts down"""
    await agent_service.close()

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