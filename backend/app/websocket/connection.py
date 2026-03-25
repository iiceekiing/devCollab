from fastapi import WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth import AuthService
from app.services.room import RoomService
from app.services.message import MessageService
from app.core.schemas import MessageCreate
from app.websocket.manager import websocket_manager
import json
import asyncio

class WebSocketConnectionManager:
    def __init__(self):
        self.active_connections: dict = {}

    async def connect(self, websocket: WebSocket, user_id: int, username: str, room_id: str):
        await websocket.accept()
        
        # Store connection
        connection_key = f"{user_id}_{room_id}"
        self.active_connections[connection_key] = websocket
        
        # Connect user to room manager
        await websocket_manager.connect_user(websocket, user_id, username, room_id)
        
        return connection_key

    def disconnect(self, connection_key: str, user_id: int):
        if connection_key in self.active_connections:
            del self.active_connections[connection_key]
        
        # Disconnect from room manager
        # Note: We need to find the websocket, but it's already removed
        # This will be handled by the disconnect event

ws_manager = WebSocketConnectionManager()

async def get_current_user_ws(websocket: WebSocket, token: str, db: Session):
    """Authenticate WebSocket connection."""
    try:
        from app.core.security import verify_token
        username = verify_token(token)
        
        if username is None:
            await websocket.close(code=4001, reason="Invalid token")
            return None
        
        auth_service = AuthService(db)
        user = auth_service.get_user_by_username(username)
        return user
    except Exception as e:
        await websocket.close(code=4001, reason="Authentication failed")
        return None

async def handle_websocket_connection(
    websocket: WebSocket,
    room_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """Handle WebSocket connection for a room."""
    # Authenticate user
    user = await get_current_user_ws(websocket, token, db)
    if not user:
        return
    
    # Check if user is member of the room
    room_service = RoomService(db)
    if not room_service.is_user_in_room(room_id, user.id):
        await websocket.close(code=4003, reason="Not a member of this room")
        return
    
    # Connect user
    connection_key = await ws_manager.connect(websocket, user.id, user.username, room_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Handle different message types
            await handle_message(websocket, message_data, user, room_id, db)
            
    except WebSocketDisconnect:
        # Handle disconnection
        await websocket_manager.disconnect_user(websocket, user.id)
        ws_manager.disconnect(connection_key, user.id)
    except Exception as e:
        # Handle other errors
        await websocket_manager.disconnect_user(websocket, user.id)
        ws_manager.disconnect(connection_key, user.id)

async def handle_message(websocket: WebSocket, message_data: dict, user, room_id: str, db: Session):
    """Handle incoming WebSocket messages."""
    message_type = message_data.get("type")
    
    if message_type == "chat":
        await handle_chat_message(websocket, message_data, user, room_id, db)
    elif message_type == "typing":
        await handle_typing_indicator(websocket, message_data, user, room_id)
    else:
        # Unknown message type
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": {"message": f"Unknown message type: {message_type}"}
        }))

async def handle_chat_message(websocket: WebSocket, message_data: dict, user, room_id: str, db: Session):
    """Handle chat message."""
    content = message_data.get("data", {}).get("content", "")
    
    if not content.strip():
        await websocket.send_text(json.dumps({
            "type": "error",
            "data": {"message": "Message content cannot be empty"}
        }))
        return
    
    # Create message in database
    message_service = MessageService(db)
    message_create = MessageCreate(room_id=room_id, content=content)
    message = message_service.create_message(message_create, user.id)
    
    # Broadcast to room
    await websocket_manager.broadcast_to_room(room_id, {
        "type": "chat",
        "data": {
            "id": message.id,
            "room_id": message.room_id,
            "sender_id": message.sender_id,
            "sender_username": user.username,
            "content": message.content,
            "created_at": message.created_at.isoformat()
        }
    })

async def handle_typing_indicator(websocket: WebSocket, message_data: dict, user, room_id: str, db: Session):
    """Handle typing indicator."""
    is_typing = message_data.get("data", {}).get("is_typing", False)
    
    # Broadcast typing indicator to room (excluding sender)
    await websocket_manager.broadcast_to_room(room_id, {
        "type": "typing",
        "data": {
            "user_id": user.id,
            "username": user.username,
            "is_typing": is_typing
        }
    }, exclude_user_id=user.id)
