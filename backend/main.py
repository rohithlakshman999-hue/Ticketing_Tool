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
        Base.metadata.create_all(bind=engine)
        
        # ✅ Auto-Migration for existing DBs
        import sqlite3
        conn = sqlite3.connect("backend/ticketing_v4.db")
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(tickets)")
        cols = [c[1] for c in cursor.fetchall()]
        
        if "contact_name" not in cols:
            cursor.execute("ALTER TABLE tickets ADD COLUMN contact_name TEXT")
        if "created_by_id" not in cols:
            cursor.execute("ALTER TABLE tickets ADD COLUMN created_by_id INTEGER")
            
        conn.commit()
        conn.close()
        
        print("[SUCCESS] Database connected and tables/columns checked")
    except Exception as e:
        print("[ERROR] Database connection/migration failed:", str(e))


# ------------------- CORS CONFIG (FINAL) -------------------

origins = [
    # Local development
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",

    # Production (MAIN DOMAIN)
    "https://ticketingtool.vercel.app",

    # (Optional) Vercel preview URLs
    "https://ticketingtool-git-main-g-rohith-lakshman-s-projects.vercel.app",
    "https://ticketingtool-45h1yjite-g-rohith-lakshman-s-projects.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # ✅ Temporary fix for CORS issues in production
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