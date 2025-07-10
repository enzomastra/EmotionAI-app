from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
from app.core.security import EncryptedString, EncryptedText

class Patient(Base):
    __tablename__ = "patients"

    #agregar despues diagnostico y observaciones
    id = Column(Integer, primary_key=True, index=True)
    name = Column(EncryptedString, nullable=False)
    name_search = Column(String, nullable=False, index=True)
    age = Column(Integer, nullable=False)
    observations = Column(EncryptedText, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # Alias para compatibilidad con el schema
    @property
    def clinic_id(self):
        return self.user_id

    user = relationship("User", back_populates="patients")
    therapy_sessions = relationship("TherapySession", back_populates="patient")