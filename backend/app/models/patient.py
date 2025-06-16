from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    #agregar despues diagnostico y observaciones
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer, nullable=False)
    observations = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Alias para compatibilidad con el schema
    @property
    def clinic_id(self):
        return self.user_id

    user = relationship("User", back_populates="patients")
    therapy_sessions = relationship("TherapySession", back_populates="patient")