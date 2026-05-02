import sqlite3
import os
import uuid

db_path = "backend/ticketing_v4.db"

def fix_sqlite():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Ensure last_login exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        if "last_login" not in columns:
            print("Adding last_login column to users table...")
            cursor.execute("ALTER TABLE users ADD COLUMN last_login TEXT")
            conn.commit()

        # Check if user exists
        email = "ganesan@hertznbytes.com"
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        row = cursor.fetchone()

        if row:
            cursor.execute("UPDATE users SET role = 'admin' WHERE email = ?", (email,))
            print(f"SUCCESS: Existing user {email} is now an admin.")
        else:
            # Create the user
            print(f"User {email} not found. Creating user as admin...")
            dummy_password = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO users (email, full_name, hashed_password, role, is_active)
                VALUES (?, ?, ?, ?, ?)
            """, (email, "Ganesan", dummy_password, "admin", 1))
            print(f"SUCCESS: Created user {email} as admin.")
        
        conn.commit()
            
    except Exception as e:
        print(f"ERROR: {str(e)}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_sqlite()
