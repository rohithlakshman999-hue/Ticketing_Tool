import psycopg2
import bcrypt

password = "admin123".encode('utf-8')
new_hash = bcrypt.hashpw(password, bcrypt.gensalt()).decode('utf-8')

try:
    conn = psycopg2.connect(
        "postgresql://postgres.syqqnqabformonceyxnb:appleorangebanana123@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
    )
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET hashed_password = %s WHERE email = 'admin@ticketing.com'",
        (new_hash,)
    )
    conn.commit()
    print("Password changed to admin123")
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
