from typing import List, Dict
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_rooms: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room: str = "general"):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if room not in self.connection_rooms:
            self.connection_rooms[room] = []
        self.connection_rooms[room].append(websocket)
        
        logger.info(f"WebSocket connected to room: {room}")
    
    def disconnect(self, websocket: WebSocket, room: str = "general"):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if room in self.connection_rooms and websocket in self.connection_rooms[room]:
            self.connection_rooms[room].remove(websocket)
            if not self.connection_rooms[room]:
                del self.connection_rooms[room]
        
        logger.info(f"WebSocket disconnected from room: {room}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        if websocket.client_state == WebSocketState.CONNECTED:
            await websocket.send_text(message)
    
    async def broadcast_to_room(self, message: str, room: str = "general"):
        if room in self.connection_rooms:
            disconnected_connections = []
            for connection in self.connection_rooms[room]:
                try:
                    if connection.client_state == WebSocketState.CONNECTED:
                        await connection.send_text(message)
                    else:
                        disconnected_connections.append(connection)
                except Exception as e:
                    logger.error(f"Error sending message: {e}")
                    disconnected_connections.append(connection)
            
            # Clean up disconnected connections
            for connection in disconnected_connections:
                self.disconnect(connection, room)
    
    async def broadcast_test_update(self, test_case_id: int, status: str, message: str):
        update_data = {
            "type": "test_update",
            "test_case_id": test_case_id,
            "status": status,
            "message": message,
            "timestamp": str(datetime.now())
        }
        await self.broadcast_to_room(json.dumps(update_data), "test_updates")


manager = ConnectionManager()


@router.websocket("/ws/{room}")
async def websocket_endpoint(websocket: WebSocket, room: str):
    await manager.connect(websocket, room)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo received message back to the room
            await manager.broadcast_to_room(f"Client in {room}: {data}", room)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)


@router.websocket("/ws")
async def websocket_general(websocket: WebSocket):
    await websocket_endpoint(websocket, "general")