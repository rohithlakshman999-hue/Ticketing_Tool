from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.api import auth, tickets, ai, devices
from app.core.websockets import manager


# ------------------- CREATE APP -------------------

app = FastAPI(title="IT Service Ticketing API")


# ------------------- STARTUP -------------------

@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database connected and tables created")
    except Exception as e:
        print("❌ Database connection failed:", str(e))


# ------------------- CORS (VERY IMPORTANT FIX) -------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ticketingtool.vercel.app",   # ✅ your frontend
    ],
    allow_credentials=True,   # ✅ IMPORTANT
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------- ROUTERS -------------------

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(devices.router, prefix="/devices", tags=["devices"])


# ------------------- ROOT -------------------

@app.get("/")
def root():
    return {"message": "Welcome to the IT Service Ticketing API"}


# ------------------- WEBSOCKET -------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)