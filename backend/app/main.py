from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine
from app.models import models
from app.api import auth, rooms, messages
from app.websocket.route import websocket_endpoint
from sqlalchemy.orm import Session
import uvicorn

# Create database tables (only if database is available)
try:
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️  Could not create database tables: {e}")
    print("📋 Make sure PostgreSQL is running before using the app")

app = FastAPI(
    title="devCollab API",
    description="Real-time collaboration platform API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(rooms.router, prefix="/api")
app.include_router(messages.router, prefix="/api")

# WebSocket endpoint
@app.websocket("/ws/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: str, token: str = None):
    """WebSocket endpoint for real-time room communication."""
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        await websocket_endpoint(websocket, room_id, token, db)
    finally:
        db.close()

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "devCollab API"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to devCollab API",
        "docs": "/docs",
        "health": "/health",
        "websocket": "/ws/{room_id}"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )
