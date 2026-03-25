from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Message, Room, User
from app.core.schemas import MessageCreate
from datetime import datetime

class MessageService:
    def __init__(self, db: Session):
        self.db = db

    def create_message(self, message_data: MessageCreate, sender_id: int) -> Message:
        """Create a new message in a room."""
        # Check if room exists and user is a member
        room = self.db.query(Room).filter(Room.id == message_data.room_id).first()
        if not room or not room.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        
        # Check if user is in room (you might want to add this check)
        # For now, we'll allow any authenticated user to message
        
        # Create message
        db_message = Message(
            room_id=message_data.room_id,
            sender_id=sender_id,
            content=message_data.content
        )
        
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        
        return db_message

    def get_room_messages(self, room_id: str, limit: int = 50, offset: int = 0) -> list[Message]:
        """Get messages from a room with pagination."""
        # Check if room exists
        room = self.db.query(Room).filter(Room.id == room_id).first()
        if not room or not room.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        
        messages = self.db.query(Message).filter(
            Message.room_id == room_id
        ).order_by(Message.created_at.asc()).offset(offset).limit(limit).all()
        
        return messages

    def delete_message(self, message_id: int, user_id: int) -> bool:
        """Delete a message (only by sender or room creator)."""
        message = self.db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        # Check if user is sender or room creator
        room = self.db.query(Room).filter(Room.id == message.room_id).first()
        if message.sender_id != user_id and room.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only message sender or room creator can delete messages"
            )
        
        # Delete message
        self.db.delete(message)
        self.db.commit()
        
        return True

    def get_message_by_id(self, message_id: int) -> Message:
        """Get message by ID."""
        message = self.db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found"
            )
        
        return message
