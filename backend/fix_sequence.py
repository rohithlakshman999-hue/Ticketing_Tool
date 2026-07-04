import asyncio
from app.core.database import engine
from sqlalchemy import text

def fix_sequences():
    with engine.connect() as conn:
        try:
            # Fix users sequence
            conn.execute(text("SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));"))
            print("Fixed users sequence.")
            
            # Might as well fix other sequences
            conn.execute(text("SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));"))
            print("Fixed companies sequence.")
            
            conn.execute(text("SELECT setval('tickets_id_seq', (SELECT MAX(id) FROM tickets));"))
            print("Fixed tickets sequence.")
            
            conn.execute(text("SELECT setval('devices_id_seq', (SELECT MAX(id) FROM devices));"))
            print("Fixed devices sequence.")
            
            conn.commit()
            print("All sequences updated!")
        except Exception as e:
            print("Error:", e)

if __name__ == "__main__":
    fix_sequences()
