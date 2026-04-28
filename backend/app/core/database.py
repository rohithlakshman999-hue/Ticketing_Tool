import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set")

# Fix for Render (postgres:// → postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Detect PostgreSQL vs SQLite
is_sqlite = DATABASE_URL.startswith("sqlite")

# Engine configuration
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {"sslmode": "require"},
    pool_pre_ping=True,   # prevents stale connections
    pool_size=5,
    max_overflow=10
)

# Session
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base model
Base = declarative_base()


# ------------------- DB DEPENDENCY -------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()