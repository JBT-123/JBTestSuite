from typing import Dict, Set, Optional, Any
import json
import asyncio
import uuid
from datetime import datetime
from fastapi import WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.routing import APIRouter
import logging

# Database imports removed for now since we're not using them yet

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, Set[str]] = {}
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str, user_id: Optional[str] = None):
        try:
            logger.info(f"Accepting WebSocket connection for client: {client_id}")
            await websocket.accept()
            logger.info(f"WebSocket accepted for client: {client_id}")
            
            self.active_connections[client_id] = websocket
            self.connection_metadata[client_id] = {
                "user_id": user_id,
                "connected_at": datetime.utcnow(),
                "last_heartbeat": datetime.utcnow()
            }
            
            if user_id:
                if user_id not in self.user_connections:
                    self.user_connections[user_id] = set()
                self.user_connections[user_id].add(client_id)
            
            logger.info(f"WebSocket connected: {client_id} (user: {user_id})")
            
            # Temporarily disable initial message to test if it's causing closure
            # try:
            #     await self.send_personal_message(client_id, {
            #         "type": "connection_established",
            #         "client_id": client_id,
            #         "timestamp": datetime.utcnow().isoformat()
            #     })
            #     logger.info(f"Connection established message sent to: {client_id}")
            # except Exception as e:
            #     logger.error(f"Failed to send connection established message to {client_id}: {e}")
            logger.info(f"Skipping initial message for debugging purposes")
                
        except Exception as e:
            logger.error(f"Error during WebSocket connection setup for {client_id}: {e}")
            raise
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            user_id = self.connection_metadata[client_id].get("user_id")
            if user_id and user_id in self.user_connections:
                self.user_connections[user_id].discard(client_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            del self.active_connections[client_id]
            del self.connection_metadata[client_id]
            logger.info(f"WebSocket disconnected: {client_id}")
    
    async def send_personal_message(self, client_id: str, message: Dict[str, Any]):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        if user_id in self.user_connections:
            disconnected_clients = []
            for client_id in self.user_connections[user_id].copy():
                try:
                    await self.send_personal_message(client_id, message)
                except:
                    disconnected_clients.append(client_id)
            
            for client_id in disconnected_clients:
                self.disconnect(client_id)
    
    async def broadcast(self, message: Dict[str, Any], exclude_client: Optional[str] = None):
        disconnected_clients = []
        for client_id in list(self.active_connections.keys()):
            if client_id != exclude_client:
                try:
                    await self.send_personal_message(client_id, message)
                except:
                    disconnected_clients.append(client_id)
        
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    def get_active_connections_count(self) -> int:
        return len(self.active_connections)
    
    def get_user_connections(self, user_id: str) -> Set[str]:
        return self.user_connections.get(user_id, set())
    
    async def update_heartbeat(self, client_id: str):
        if client_id in self.connection_metadata:
            self.connection_metadata[client_id]["last_heartbeat"] = datetime.utcnow()

manager = ConnectionManager()

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = None,
    user_id: Optional[str] = None
):
    if not client_id:
        client_id = str(uuid.uuid4())
    
    # Log origin for debugging
    origin = websocket.headers.get("origin")
    logger.info(f"WebSocket connection attempt from origin: {origin}")
    
    # Temporarily disable origin checking for debugging
    # allowed_origins = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"]
    # if origin and origin not in allowed_origins:
    #     logger.warning(f"WebSocket connection rejected from origin: {origin}")
    #     await websocket.close(code=1008, reason="Origin not allowed")
    #     return
    
    try:
        await manager.connect(websocket, client_id, user_id)
        logger.info(f"Starting message loop for client: {client_id}")
        
        while True:
            try:
                # Wait for message from client
                logger.debug(f"Waiting for message from client: {client_id}")
                data = await websocket.receive_text()
                logger.debug(f"Received message from {client_id}: {data[:100]}...")
                message = json.loads(data)
                
                # Handle different message types
                await handle_websocket_message(client_id, message, websocket)
                
            except WebSocketDisconnect as e:
                logger.info(f"WebSocket disconnect for {client_id}: {e}")
                break
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from client {client_id}")
                await manager.send_personal_message(client_id, {
                    "type": "error",
                    "message": "Invalid JSON format",
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.error(f"Error handling WebSocket message from {client_id}: {e}")
                await manager.send_personal_message(client_id, {
                    "type": "error", 
                    "message": "Internal server error",
                    "timestamp": datetime.utcnow().isoformat()
                })
                
    except Exception as e:
        logger.error(f"WebSocket connection error for {client_id}: {e}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")
    finally:
        logger.info(f"Cleaning up WebSocket connection for {client_id}")
        manager.disconnect(client_id)

async def handle_websocket_message(client_id: str, message: Dict[str, Any], websocket: WebSocket):
    message_type = message.get("type")
    
    if message_type == "heartbeat":
        await manager.update_heartbeat(client_id)
        await manager.send_personal_message(client_id, {
            "type": "heartbeat_ack",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    elif message_type == "test_execution_start":
        # Handle test execution start request
        test_case_id = message.get("test_case_id")
        if test_case_id:
            await handle_test_execution_start(client_id, test_case_id)
        else:
            await manager.send_personal_message(client_id, {
                "type": "error",
                "message": "Missing test_case_id for test execution",
                "timestamp": datetime.utcnow().isoformat()
            })
    
    elif message_type == "test_execution_stop":
        # Handle test execution stop request
        execution_id = message.get("execution_id")
        if execution_id:
            await handle_test_execution_stop(client_id, execution_id)
        else:
            await manager.send_personal_message(client_id, {
                "type": "error",
                "message": "Missing execution_id for test execution stop",
                "timestamp": datetime.utcnow().isoformat()
            })
    
    elif message_type == "subscribe_to_execution":
        # Handle subscription to execution updates
        execution_id = message.get("execution_id")
        if execution_id:
            await handle_execution_subscription(client_id, execution_id)
    
    else:
        await manager.send_personal_message(client_id, {
            "type": "error",
            "message": f"Unknown message type: {message_type}",
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_test_execution_start(client_id: str, test_case_id: str):
    try:
        # Import orchestrator here to avoid circular imports
        from ..services.test_execution_orchestrator import orchestrator
        
        # Queue the test execution
        execution_id = await orchestrator.queue_test_execution(test_case_id)
        
        await manager.send_personal_message(client_id, {
            "type": "test_execution_queued",
            "test_case_id": test_case_id,
            "execution_id": execution_id,
            "message": "Test execution has been queued",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        logger.info(f"Test execution {execution_id} queued for test case {test_case_id} by client {client_id}")
        
    except Exception as e:
        logger.error(f"Error starting test execution: {e}")
        await manager.send_personal_message(client_id, {
            "type": "test_execution_error",
            "test_case_id": test_case_id,
            "message": f"Failed to start test execution: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_test_execution_stop(client_id: str, execution_id: str):
    try:
        # Import orchestrator here to avoid circular imports
        from ..services.test_execution_orchestrator import orchestrator
        
        # Cancel the execution
        success = await orchestrator.cancel_execution(execution_id)
        
        if success:
            await manager.send_personal_message(client_id, {
                "type": "test_execution_cancelled",
                "execution_id": execution_id,
                "message": "Test execution has been cancelled",
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            await manager.send_personal_message(client_id, {
                "type": "test_execution_error",
                "execution_id": execution_id,
                "message": "Execution not found or cannot be cancelled",
                "timestamp": datetime.utcnow().isoformat()
            })
        
        logger.info(f"Test execution stop requested for execution {execution_id} by client {client_id} - Success: {success}")
        
    except Exception as e:
        logger.error(f"Error stopping test execution: {e}")
        await manager.send_personal_message(client_id, {
            "type": "test_execution_error",
            "execution_id": execution_id,
            "message": f"Failed to stop test execution: {str(e)}",
            "timestamp": datetime.utcnow().isoformat()
        })

async def handle_execution_subscription(client_id: str, execution_id: str):
    await manager.send_personal_message(client_id, {
        "type": "execution_subscription_confirmed",
        "execution_id": execution_id,
        "message": "Subscribed to execution updates",
        "timestamp": datetime.utcnow().isoformat()
    })

# Utility functions for other parts of the application to send WebSocket messages
async def notify_test_execution_started(execution_id: str, test_case_id: str, user_id: Optional[str] = None):
    message = {
        "type": "test_execution_started",
        "execution_id": execution_id,
        "test_case_id": test_case_id,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Broadcasting test_execution_started: {execution_id}")
    if user_id:
        await manager.send_to_user(user_id, message)
        logger.info(f"Sent to user {user_id}")
    else:
        await manager.broadcast(message)
        logger.info(f"Broadcasted to {len(manager.active_connections)} connections")

async def notify_test_execution_progress(execution_id: str, step_number: int, total_steps: int, 
                                       step_description: str, screenshot_path: Optional[str] = None,
                                       user_id: Optional[str] = None):
    message = {
        "type": "test_execution_progress",
        "execution_id": execution_id,
        "step_number": step_number,
        "total_steps": total_steps,
        "step_description": step_description,
        "screenshot_path": screenshot_path,
        "progress_percentage": round((step_number / total_steps) * 100, 2) if total_steps > 0 else 0,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if user_id:
        await manager.send_to_user(user_id, message)
    else:
        await manager.broadcast(message)

async def notify_test_execution_completed(execution_id: str, test_case_id: str, 
                                        success: bool, result_summary: str,
                                        user_id: Optional[str] = None):
    message = {
        "type": "test_execution_completed",
        "execution_id": execution_id,
        "test_case_id": test_case_id,
        "success": success,
        "result_summary": result_summary,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Broadcasting test_execution_completed: {execution_id} (success: {success})")
    if user_id:
        await manager.send_to_user(user_id, message)
        logger.info(f"Sent to user {user_id}")
    else:
        await manager.broadcast(message)
        logger.info(f"Broadcasted to {len(manager.active_connections)} connections")

async def notify_test_execution_error(execution_id: str, test_case_id: str, error_message: str,
                                    user_id: Optional[str] = None):
    message = {
        "type": "test_execution_error", 
        "execution_id": execution_id,
        "test_case_id": test_case_id,
        "error_message": error_message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if user_id:
        await manager.send_to_user(user_id, message)
    else:
        await manager.broadcast(message)

# Health endpoint for WebSocket connections
@router.get("/health")
async def websocket_health():
    return {
        "status": "healthy",
        "active_connections": manager.get_active_connections_count(),
        "timestamp": datetime.utcnow().isoformat()
    }