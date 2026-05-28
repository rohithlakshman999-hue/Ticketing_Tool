import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import engine
from sqlalchemy import text

def apply_constraint():
    with engine.begin() as conn:
        try:
            print("Dropping existing unique constraints on 'companies' table...")
            conn.execute(text("""
                DO $$
                DECLARE
                    r RECORD;
                BEGIN
                    FOR r IN (
                        SELECT conname
                        FROM pg_constraint
                        WHERE conrelid = 'companies'::regclass AND contype = 'u'
                    ) LOOP
                        EXECUTE 'ALTER TABLE companies DROP CONSTRAINT ' || quote_ident(r.conname);
                    END LOOP;
                END $$;
            """))
            print("Successfully dropped old unique constraints.")
        except Exception as e:
            print(f"Warning: Failed to drop old constraints: {e}")

        try:
            print("Adding composite unique constraint 'uq_company_name_contact'...")
            conn.execute(text("""
                ALTER TABLE companies 
                ADD CONSTRAINT uq_company_name_contact UNIQUE (name, contact_person)
            """))
            print("Successfully added new composite unique constraint.")
        except Exception as e:
            print(f"Warning: Failed to add new constraint: {e}")

if __name__ == "__main__":
    apply_constraint()
