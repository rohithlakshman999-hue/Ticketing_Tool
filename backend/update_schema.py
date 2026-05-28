import os
import sqlite3

def run_migration():
    db_path = "ticketing_v4.db"
    
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Add contact_number to tickets
        cursor.execute("ALTER TABLE tickets ADD COLUMN contact_number VARCHAR")
        print("Added contact_number to tickets.")
    except sqlite3.OperationalError as e:
        print("contact_number already exists or error:", e)

    try:
        # Add phone and email to companies
        cursor.execute("ALTER TABLE companies ADD COLUMN phone VARCHAR")
        print("Added phone to companies.")
    except sqlite3.OperationalError as e:
        print("phone already exists or error:", e)

    try:
        cursor.execute("ALTER TABLE companies ADD COLUMN email VARCHAR")
        print("Added email to companies.")
    except sqlite3.OperationalError as e:
        print("email already exists or error:", e)

    # For serial_number, SQLite does not support ALTER COLUMN.
    # But since it's a string, empty string '' satisfies NOT NULL.
    # To truly make it nullable, we would recreate the table. 
    # For now, we'll let the application layer handle it by passing '' if None.

    conn.commit()
    conn.close()
    print("Migration complete.")

if __name__ == "__main__":
    run_migration()
