import psycopg2
import bcrypt

# Generate hash using bcrypt directly
password = "adminpassword".encode('utf-8')
new_hash = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

try:
    conn = psycopg2.connect(
        "postgresql://postgres.syqqnqabformonceyxnb:appleorangebanana123@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
    )
    cur = conn.cursor()
    
    # Check if admin exists
    cur.execute("SELECT id, email, role FROM users WHERE email = 'admin@ticketing.com'")
    user = cur.fetchone()
    
    if user:
        cur.execute(
            "UPDATE users SET hashed_password = %s, role = 'admin' WHERE email = 'admin@ticketing.com'",
            (new_hash,)
        )
        conn.commit()
        print("Password reset successfully! Login with admin@ticketing.com / adminpassword")
    else:
        cur.execute(
            "INSERT INTO users (email, full_name, hashed_password, role, is_active) VALUES (%s, %s, %s, %s, %s)",
            ("admin@ticketing.com", "System Admin", new_hash, "admin", True)
        )
        conn.commit()
        print("Admin user created! Login with admin@ticketing.com / adminpassword")
    
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
