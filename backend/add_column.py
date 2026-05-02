import os
from sqlalchemy import text
from sqlalchemy import create_engine
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("DATABASE_URL not found in .env")
    exit(1)

# Handle potential postgresql:// vs postgres:// issue
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def add_last_login_column():
    try:
        with engine.connect() as conn:
            # Check if column exists
            result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='last_login'"))
            if not result.fetchone():
                print("Adding 'last_login' column to 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN last_login VARCHAR NULL"))
                conn.commit()
                print("Column added successfully.")
            else:
                print("'last_login' column already exists.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    add_last_login_column()
