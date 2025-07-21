from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_MODEL_URL: str
    DATABASE_URL: str
    SECRET_KEY: str
    AGENT_API_URL: str
    ENCRYPTION_KEY: str


settings = Settings()