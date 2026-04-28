from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "IT Service Ticketing API"
    SQLALCHEMY_DATABASE_URI: str = "postgresql://postgres:postgres@localhost:5432/ticketing_db"
    SECRET_KEY: str = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7" # Should be in .env in prod
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60 # 30 days
    OPENAI_API_KEY: str = "mock-key"
    GOOGLE_CLIENT_ID: str = "placeholder"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
