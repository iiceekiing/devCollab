from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.schemas import RoomCreate, Room as RoomSchema
from app.services.auth import AuthService
from app.services.room import RoomService
from app.api.auth import get_current_user
from app.models.models import User

router = APIRouter(prefix="/rooms", tags=["rooms"])

@router.post("/", response_model=RoomSchema)
async def create_room(
    room_data: RoomCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new collaboration room."""
    room_service = RoomService(db)
    room = room_service.create_room(room_data, current_user.id)
    return room

@router.get("/", response_model=List[RoomSchema])
async def get_user_rooms(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all rooms that the current user is a member of."""
    room_service = RoomService(db)
    rooms = room_service.get_user_rooms(current_user.id)
    return rooms

@router.get("/{room_id}", response_model=RoomSchema)
async def get_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get room details by ID."""
    room_service = RoomService(db)
    room = room_service.get_room_by_id(room_id)
    
    # Check if user is a member of the room
    if not room_service.is_user_in_room(room_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not a member of this room"
        )
    
    return room

@router.post("/{room_id}/join")
async def join_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Join a collaboration room."""
    room_service = RoomService(db)
    room_member = room_service.add_user_to_room(room_id, current_user.id)
    
    return {"message": "Successfully joined the room"}

@router.post("/{room_id}/leave")
async def leave_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Leave a collaboration room."""
    room_service = RoomService(db)
    room_service.remove_user_from_room(room_id, current_user.id)
    
    return {"message": "Successfully left the room"}

@router.delete("/{room_id}")
async def delete_room(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a collaboration room (only by creator)."""
    room_service = RoomService(db)
    room_service.delete_room(room_id, current_user.id)
    
    return {"message": "Room deleted successfully"}
