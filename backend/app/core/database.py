import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# Graceful fallback for local development if PostgreSQL is not running
try:
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    # Test connection
    with engine.connect() as conn:
        pass
    print("Successfully connected to PostgreSQL")
except Exception as e:
    print(f"WARNING: PostgreSQL not available ({e}). Falling back to SQLite.")
    engine = create_engine("sqlite:///./ticketing_v4.db", connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
