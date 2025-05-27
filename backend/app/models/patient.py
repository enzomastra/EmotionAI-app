from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    #agregar despues diagnostico y observaciones
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer, nullable=False)
    clinic_id = Column(Integer, ForeignKey("clinics.id"))

    clinic = relationship("Clinic", back_populates="patients")
    therapy_sessions = relationship("TherapySession", back_populates="patient")