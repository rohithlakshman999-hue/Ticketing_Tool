from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.api import auth, tickets, ai, devices, companies
from app.core.websockets import manager
import app.models  # ✅ Load models for SQLAlchemy


# ------------------- CREATE APP -------------------

app = FastAPI(title="IT Service Ticketing API")


# ------------------- STARTUP -------------------

@app.on_event("startup")
def on_startup():
    try:
        # 1. Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
        
        # 2. Auto-Migrate columns using SQLAlchemy (Works for SQLite and Postgres)
        from sqlalchemy import text, inspect
        inspector = inspect(engine)
        
        with engine.begin() as conn:
            # TICKETS
            if 'tickets' in inspector.get_table_names():
                columns_tickets = [c['name'] for c in inspector.get_columns('tickets')]
                if "contact_name" not in columns_tickets:
                    print("Adding contact_name column to tickets...")
                    conn.execute(text("ALTER TABLE tickets ADD COLUMN contact_name TEXT"))
                if "created_by_id" not in columns_tickets:
                    print("Adding created_by_id column to tickets...")
                    conn.execute(text("ALTER TABLE tickets ADD COLUMN created_by_id INTEGER"))
            
            # USERS
            if 'users' in inspector.get_table_names():
                columns_users = [c['name'] for c in inspector.get_columns('users')]
                if "company_id" not in columns_users:
                    conn.execute(text("ALTER TABLE users ADD COLUMN company_id INTEGER"))
                if "designation" not in columns_users:
                    conn.execute(text("ALTER TABLE users ADD COLUMN designation TEXT"))
                if "last_login" not in columns_users:
                    conn.execute(text("ALTER TABLE users ADD COLUMN last_login TEXT"))

            # DEVICES
            if 'devices' in inspector.get_table_names():
                columns_devices = [c['name'] for c in inspector.get_columns('devices')]
                if "purchase_date" not in columns_devices:
                    # using TEXT for datetime fallback in SQLite, or standard timestamp
                    conn.execute(text("ALTER TABLE devices ADD COLUMN purchase_date TEXT"))
                if "warranty_available" not in columns_devices:
                    conn.execute(text("ALTER TABLE devices ADD COLUMN warranty_available INTEGER DEFAULT 0"))
                if "warranty_duration" not in columns_devices:
                    conn.execute(text("ALTER TABLE devices ADD COLUMN warranty_duration TEXT"))
                if "warranty_expiry_date" not in columns_devices:
                    conn.execute(text("ALTER TABLE devices ADD COLUMN warranty_expiry_date TEXT"))
            
        print("[SUCCESS] Database connected and all columns verified/migrated")
    except Exception as e:
        print("[ERROR] Database startup/migration failed:", str(e))


# ------------------- CORS CONFIG (FINAL) -------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ticketingtool.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ------------------- ROUTERS -------------------

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(devices.router, prefix="/devices", tags=["devices"])
app.include_router(companies.router, prefix="/companies", tags=["companies"])


# ------------------- ROOT -------------------

@app.get("/")
def root():
    return {"message": "Welcome to the IT Service Ticketing API"}


# ------------------- HEALTH CHECK (IMPORTANT) -------------------

@app.get("/health")
def health():
    return {"status": "ok"}


# ------------------- WEBSOCKET -------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print("WebSocket error:", str(e))
        manager.disconnect(websocket)