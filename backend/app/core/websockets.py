from typing import List
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    # ------------------- CONNECT -------------------

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    # ------------------- DISCONNECT -------------------

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    # ------------------- BROADCAST -------------------

    async def broadcast(self, message: dict):
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Mark broken connections
                disconnected.append(connection)

        # Cleanup dead connections
        for conn in disconnected:
            self.disconnect(conn)


# Singleton instance
manager = ConnectionManager()