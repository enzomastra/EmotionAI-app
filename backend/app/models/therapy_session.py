from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
from app.core.security import EncryptedText

class TherapySession(Base):
    __tablename__ = "therapy_sessions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    results = Column(EncryptedText, nullable=False)  # JSON string with analysis results
    observations = Column(EncryptedText, nullable=True)  # Clinician's observations for this session
    patient_id = Column(Integer, ForeignKey("patients.id"))

    patient = relationship("Patient", back_populates="therapy_sessions")