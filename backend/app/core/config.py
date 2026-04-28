from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # ------------------- APP -------------------
    PROJECT_NAME: str = "IT Service Ticketing API"

    # ------------------- DATABASE -------------------
    # Render uses DATABASE_URL, fallback for local
    DATABASE_URL: Optional[str] = None
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    def get_database_url(self) -> str:
        return (
            self.DATABASE_URL
            or self.SQLALCHEMY_DATABASE_URI
            or "postgresql://postgres:postgres@localhost:5432/ticketing_db"
        )

    # ------------------- SECURITY -------------------
    # ✅ Prevents crash if env missing
    SECRET_KEY: str = "fallback-secret-key"

    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60  # 30 days

    # ------------------- API KEYS -------------------
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None

    # ------------------- CONFIG -------------------
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


# ✅ Create settings instance
settings = Settings()