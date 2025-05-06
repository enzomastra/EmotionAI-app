from pydantic import BaseModel
from typing import Dict

class EmotionSummary(BaseModel):
    disgust: int
    fear: int
    happy: int
    neutral: int
    sad: int

class Timeline(BaseModel):
    timeline: Dict[str, str]

class VideoAnalysisResponse(BaseModel):
    emotion_summary: EmotionSummary
    timeline: Timeline