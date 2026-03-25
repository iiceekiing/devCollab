from fastapi import WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.websocket.connection import handle_websocket_connection

async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    token: str,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for real-time communication."""
    await handle_websocket_connection(websocket, room_id, token, db)
