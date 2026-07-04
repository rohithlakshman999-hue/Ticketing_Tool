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
        columns = [c['name'] for c in inspector.get_columns('tickets')]
        
        with engine.begin() as conn:
            if "contact_name" not in columns:
                print("Adding contact_name column...")
                conn.execute(text("ALTER TABLE tickets ADD COLUMN contact_name TEXT"))
            if "created_by_id" not in columns:
                print("Adding created_by_id column...")
                # SQLite and Postgres handle integer types slightly differently but TEXT/INTEGER is safe
                conn.execute(text("ALTER TABLE tickets ADD COLUMN created_by_id INTEGER"))
            
        print("[SUCCESS] Database connected and columns verified")
    except Exception as e:
        print("[ERROR] Database startup/migration failed:", str(e))


# ------------------- CORS CONFIG (FINAL) -------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ✅ Wildcard ensures CORS headers on ALL responses including errors
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
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