from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_MODEL_URL: str = "http://192.168.18.8:8000/api"  # URL de la API del modelo

    class Config:
        env_file = ".env"

settings = Settings()