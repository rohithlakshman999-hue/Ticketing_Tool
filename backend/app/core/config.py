from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "IT Service Ticketing API"

    DATABASE_URL: Optional[str] = None
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # ✅ Prevent crash
    SECRET_KEY: str = "fallback-secret-key"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60

    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()

def get_database_url():
    return (
        settings.DATABASE_URL
        or settings.SQLALCHEMY_DATABASE_URI
        or "postgresql://postgres:postgres@localhost:5432/ticketing_db"
    )