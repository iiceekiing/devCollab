from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Room, RoomMember, User, Message
from app.core.schemas import RoomCreate
from datetime import datetime
import uuid

class RoomService:
    def __init__(self, db: Session):
        self.db = db

    def create_room(self, room_data: RoomCreate, creator_id: int) -> Room:
        """Create a new collaboration room."""
        # Generate unique room ID
        room_id = str(uuid.uuid4())
        
        # Create room
        db_room = Room(
            id=room_id,
            name=room_data.name,
            description=room_data.description,
            created_by=creator_id
        )
        
        self.db.add(db_room)
        self.db.commit()
        self.db.refresh(db_room)
        
        # Add creator as room member
        self.add_user_to_room(room_id, creator_id)
        
        return db_room

    def get_room_by_id(self, room_id: str) -> Room:
        """Get room by ID."""
        room = self.db.query(Room).filter(Room.id == room_id).first()
        if not room:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Room not found"
            )
        return room

    def get_user_rooms(self, user_id: int) -> list[Room]:
        """Get all rooms that user is a member of."""
        rooms = self.db.query(Room).join(RoomMember).filter(
            RoomMember.user_id == user_id,
            RoomMember.is_active == True,
            Room.is_active == True
        ).all()
        return rooms

    def add_user_to_room(self, room_id: str, user_id: int) -> RoomMember:
        """Add user to a room."""
        # Check if room exists
        room = self.get_room_by_id(room_id)
        
        # Check if user is already a member
        existing_membership = self.db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user_id,
            RoomMember.is_active == True
        ).first()
        
        if existing_membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this room"
            )
        
        # Add user to room
        room_member = RoomMember(room_id=room_id, user_id=user_id)
        self.db.add(room_member)
        self.db.commit()
        self.db.refresh(room_member)
        
        return room_member

    def remove_user_from_room(self, room_id: str, user_id: int) -> bool:
        """Remove user from a room."""
        room_member = self.db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user_id,
            RoomMember.is_active == True
        ).first()
        
        if not room_member:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User is not a member of this room"
            )
        
        # Deactivate membership (soft delete)
        room_member.is_active = False
        self.db.commit()
        
        return True

    def get_room_members(self, room_id: str) -> list[User]:
        """Get all active members of a room."""
        members = self.db.query(User).join(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.is_active == True,
            User.is_active == True
        ).all()
        return members

    def is_user_in_room(self, room_id: str, user_id: int) -> bool:
        """Check if user is a member of the room."""
        membership = self.db.query(RoomMember).filter(
            RoomMember.room_id == room_id,
            RoomMember.user_id == user_id,
            RoomMember.is_active == True
        ).first()
        
        return membership is not None

    def get_room_messages(self, room_id: str, limit: int = 50) -> list[Message]:
        """Get recent messages from a room."""
        messages = self.db.query(Message).filter(
            Message.room_id == room_id
        ).order_by(Message.created_at.desc()).limit(limit).all()
        
        # Return in chronological order
        return list(reversed(messages))

    def delete_room(self, room_id: str, user_id: int) -> bool:
        """Delete a room (only by creator)."""
        room = self.get_room_by_id(room_id)
        
        if room.created_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only room creator can delete the room"
            )
        
        # Soft delete room
        room.is_active = False
        self.db.commit()
        
        return True
