import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add the backend directory to path so imports work correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import Base, engine as old_engine
import app.models  # Ensures all models are loaded

SUPABASE_URL = "postgresql://postgres:applebananauser12@db.syqqnqabformonceyxnb.supabase.co:5432/postgres"

new_engine = create_engine(
    SUPABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)

def migrate():
    print("Creating tables in Supabase...")
    Base.metadata.create_all(bind=new_engine)
    
    with old_engine.connect() as old_conn:
        with new_engine.begin() as new_conn:
            for table in Base.metadata.sorted_tables:
                print(f"Migrating table {table.name}...")
                
                # Fetch all rows from old DB
                rows = old_conn.execute(table.select()).fetchall()
                print(f"  Found {len(rows)} rows.")
                
                if rows:
                    # Convert rows to list of dictionaries
                    # Note: row._mapping provides a dictionary-like interface in SQLAlchemy 1.4/2.0
                    row_dicts = [dict(row._mapping) for row in rows]
                    
                    # Insert into new DB
                    new_conn.execute(table.insert(), row_dicts)
                    print(f"  Inserted {len(rows)} rows into {table.name}.")
                else:
                    print(f"  No rows to insert for {table.name}.")
                    
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
