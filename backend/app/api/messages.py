from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.schemas import MessageCreate, Message as MessageSchema
from app.services.message import MessageService
from app.services.room import RoomService
from app.api.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/messages", tags=["messages"])

@router.post("/", response_model=MessageSchema)
async def create_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new message in a room."""
    # Check if user is a member of the room
    room_service = RoomService(db)
    if not room_service.is_user_in_room(message_data.room_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this room"
        )
    
    message_service = MessageService(db)
    message = message_service.create_message(message_data, current_user.id)
    return message

@router.get("/room/{room_id}", response_model=List[MessageSchema])
async def get_room_messages(
    room_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get messages from a room."""
    # Check if user is a member of the room
    room_service = RoomService(db)
    if not room_service.is_user_in_room(room_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this room"
        )
    
    message_service = MessageService(db)
    messages = message_service.get_room_messages(room_id, limit, offset)
    return messages

@router.delete("/{message_id}")
async def delete_message(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a message (only by sender or room creator)."""
    message_service = MessageService(db)
    message_service.delete_message(message_id, current_user.id)
    
    return {"message": "Message deleted successfully"}
