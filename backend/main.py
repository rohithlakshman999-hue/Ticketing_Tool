from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.api import auth, tickets, ai, devices
from app.core.websockets import manager


# ✅ 1. CREATE APP FIRST
app = FastAPI(title="IT Service Ticketing API")


# ✅ 2. STARTUP EVENT (AFTER app is created)
@app.on_event("startup")
def on_startup():
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database connected and tables created")
    except Exception as e:
        print("❌ Database connection failed:", e)


# ✅ 3. MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ✅ 4. ROUTERS
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(devices.router, prefix="/devices", tags=["devices"])


# ✅ 5. ROOT ENDPOINT
@app.get("/")
def root():
    return {"message": "Welcome to the IT Service Ticketing API"}


# ✅ 6. WEBSOCKET
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)