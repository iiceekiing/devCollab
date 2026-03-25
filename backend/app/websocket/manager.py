import redis
import json
import asyncio
from typing import Dict, List, Set
from app.core.config import settings

class WebSocketManager:
    def __init__(self):
        # Redis connection for pub/sub
        self.redis = redis.from_url(settings.REDIS_URL)
        self.pubsub = self.redis.pubsub()
        
        # Active connections: {room_id: {user_id: set of websockets}}
        self.active_connections: Dict[str, Dict[int, Set]] = {}
        
        # User to room mapping: {user_id: room_id}
        self.user_rooms: Dict[int, str] = {}
        
        # User names cache: {user_id: username}
        self.user_names: Dict[int, str] = {}

    async def connect_user(self, websocket, user_id: int, username: str, room_id: str):
        """Connect a user to a room."""
        # Store user name
        self.user_names[user_id] = username
        self.user_rooms[user_id] = room_id
        
        # Add connection to room
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        
        if user_id not in self.active_connections[room_id]:
            self.active_connections[room_id][user_id] = set()
        
        self.active_connections[room_id][user_id].add(websocket)
        
        # Notify others that user joined
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "data": {
                "user_id": user_id,
                "username": username
            }
        }, exclude_user_id=user_id)
        
        # Send current room users to the new user
        await self.send_active_users_to_user(websocket, room_id)

    async def disconnect_user(self, websocket, user_id: int):
        """Disconnect a user from their room."""
        if user_id not in self.user_rooms:
            return
        
        room_id = self.user_rooms[user_id]
        username = self.user_names.get(user_id, "Unknown")
        
        # Remove connection
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            self.active_connections[room_id][user_id].discard(websocket)
            
            # If no more connections for this user, remove user from room
            if not self.active_connections[room_id][user_id]:
                del self.active_connections[room_id][user_id]
                
                # Notify others that user left
                await self.broadcast_to_room(room_id, {
                    "type": "user_left",
                    "data": {
                        "user_id": user_id,
                        "username": username
                    }
                })
                
                # Clean up empty rooms
                if not self.active_connections[room_id]:
                    del self.active_connections[room_id]
        
        # Clean up user mappings
        del self.user_rooms[user_id]
        if user_id in self.user_names:
            del self.user_names[user_id]

    async def send_message_to_user(self, websocket, message: dict):
        """Send a message to a specific websocket."""
        try:
            await websocket.send_text(json.dumps(message))
        except:
            # Connection is closed, will be cleaned up by disconnect
            pass

    async def broadcast_to_room(self, room_id: str, message: dict, exclude_user_id: int = None):
        """Broadcast a message to all users in a room."""
        if room_id not in self.active_connections:
            return
        
        message_str = json.dumps(message)
        
        # Send to all connected users in the room
        for user_id, websockets in self.active_connections[room_id].items():
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            # Send to all websockets for this user
            for websocket in websockets.copy():  # Copy to avoid modification during iteration
                await self.send_message_to_user(websocket, message)

    async def send_active_users_to_user(self, websocket, room_id: str):
        """Send list of active users in a room to a specific user."""
        if room_id not in self.active_connections:
            return
        
        active_users = []
        for user_id in self.active_connections[room_id]:
            username = self.user_names.get(user_id, "Unknown")
            active_users.append({
                "user_id": user_id,
                "username": username
            })
        
        await self.send_message_to_user(websocket, {
            "type": "active_users",
            "data": {
                "users": active_users
            }
        })

    def get_active_users_in_room(self, room_id: str) -> List[dict]:
        """Get list of active users in a room."""
        if room_id not in self.active_connections:
            return []
        
        active_users = []
        for user_id in self.active_connections[room_id]:
            username = self.user_names.get(user_id, "Unknown")
            active_users.append({
                "user_id": user_id,
                "username": username
            })
        
        return active_users

# Global WebSocket manager instance
websocket_manager = WebSocketManager()
