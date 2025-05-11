from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_MODEL_URL: str #"http://192.168.18.8:8000/api" URL de la API del modelo
    DATABASE_URL: str #"postgresql://postgres:1234@localhost/emotionai" URL de la base de datos

    class Config:
        env_file = ".env"

settings = Settings()