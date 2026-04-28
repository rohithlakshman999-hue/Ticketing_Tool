from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .config import settings

# ------------------- DATABASE URL -------------------

DATABASE_URL = settings.get_database_url()

# Fix for Render (postgres:// → postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Detect SQLite
is_sqlite = DATABASE_URL.startswith("sqlite")

# ------------------- ENGINE -------------------

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=True,
)

# ------------------- SESSION -------------------

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ------------------- BASE -------------------

Base = declarative_base()

# ------------------- DEPENDENCY -------------------

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()