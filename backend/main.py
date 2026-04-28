from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import auth, tickets, ai, devices
from app.core.websockets import manager

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="IT Service Ticketing API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(tickets.router, prefix="/tickets", tags=["tickets"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(devices.router, prefix="/devices", tags=["devices"])

@app.get("/")
def root():
    return {"message": "Welcome to the IT Service Ticketing API"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't really expect clients to send messages right now,
            # but we need to keep the connection open to receive broadcasts.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
