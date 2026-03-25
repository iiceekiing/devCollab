from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# Room schemas
class RoomBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class Room(RoomBase):
    id: str
    created_by: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

# Message schemas
class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    room_id: str

class Message(MessageBase):
    id: int
    room_id: str
    sender_id: int
    sender_username: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# WebSocket schemas
class WebSocketMessage(BaseModel):
    type: str
    data: dict

class ChatMessage(WebSocketMessage):
    type: str = "chat"
    data: dict

class UserJoined(WebSocketMessage):
    type: str = "user_joined"
    data: dict

class UserLeft(WebSocketMessage):
    type: str = "user_left"
    data: dict
