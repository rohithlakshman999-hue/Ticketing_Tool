from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import get_database_url
import os

DATABASE_URL = get_database_url()

# Render/Heroku uses "postgres://" which SQLAlchemy 1.4+ requires as "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Use SQLite if DATABASE_URL is a local default (not a real Postgres URL)
_is_sqlite = DATABASE_URL.startswith("sqlite") or "localhost:5432/ticketing_db" in DATABASE_URL

if _is_sqlite:
    # Fallback to SQLite for local dev
    DATABASE_URL = "sqlite:///./ticketing_v4.db"
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
    print("WARNING: Using SQLite fallback database")
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
    print("OK: Using PostgreSQL database")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()