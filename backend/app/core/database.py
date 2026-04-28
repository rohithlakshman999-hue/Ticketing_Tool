import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Get database URL from environment (Render)
DATABASE_URL = os.getenv("postgresql://ticketing_db_e3kf_user:5VNPM9XdS2lvFNwjCGQ6UDNTJENNpCBp@dpg-d7o9ugreo5us739p242g-a.oregon-postgres.render.com/ticketing_db_e3kf")

# Fix for PostgreSQL URL (Render sometimes gives postgres:// instead of postgresql://)
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(DATABASE_URL)

# Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base
Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()