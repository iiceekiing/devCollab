# Backend Logic Documentation

## Overview

The devCollab backend is built with FastAPI and follows a clean architecture pattern with separation of concerns. The system is organized into API routes, services, models, and core utilities.

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Application                │
├─────────────────────────────────────────────────────────────┤
│  API Layer          │  Service Layer   │  Data Layer │
│  - Routes           │  - Business     │  - Models    │
│  - Validation       │    Logic        │  - Database  │
│  - Response         │  - Operations   │  - Schemas   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/app/
├── api/                 # API route handlers
│   ├── auth.py         # Authentication endpoints
│   ├── rooms.py        # Room management endpoints
│   └── messages.py     # Message endpoints
├── core/               # Core functionality
│   ├── config.py       # Configuration settings
│   ├── database.py     # Database connection
│   ├── security.py     # Security utilities
│   └── schemas.py     # Pydantic models
├── models/             # Database models
│   └── models.py      # SQLAlchemy models
├── services/           # Business logic
│   ├── auth.py         # Authentication service
│   ├── room.py         # Room management service
│   └── message.py      # Message service
└── websocket/          # WebSocket handlers
    ├── connection.py   # Connection management
    ├── manager.py      # Connection manager
    └── route.py        # WebSocket routes
```

## API Layer

### Authentication Routes (`api/auth.py`)

#### POST /api/auth/register
Registers a new user account.

**Handler**:
```python
@router.post("/register", response_model=schemas.Token)
async def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Check if user exists
    db_user = auth_service.get_user_by_email(db, user_data.email)
    if db_user:
        raise HTTPException(status_code=409, detail="Email already registered")
    
    # Create user
    user = auth_service.create_user(db, user_data)
    
    # Generate token
    access_token = security.create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at
        }
    }
```

#### POST /api/auth/login
Authenticates user and returns JWT token.

**Handler**:
```python
@router.post("/login", response_model=schemas.Token)
async def login(
    user_credentials: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    # Authenticate user
    user = auth_service.authenticate_user(
        db, user_credentials.email, user_credentials.password
    )
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate token
    access_token = security.create_access_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer", 
        "expires_in": settings.JWT_EXPIRE_MINUTES * 60,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at
        }
    }
```

### Room Routes (`api/rooms.py`)

#### POST /api/rooms
Creates a new collaboration room.

**Handler**:
```python
@router.post("/", response_model=schemas.Room)
async def create_room(
    room_data: schemas.RoomCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return room_service.create_room(
        db, room_data.name, room_data.description, current_user.id
    )
```

#### GET /api/rooms
Lists all rooms accessible to the user.

**Handler**:
```python
@router.get("/", response_model=List[schemas.Room])
async def get_rooms(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    rooms = room_service.get_user_rooms(db, current_user.id, skip, limit)
    return rooms
```

### Message Routes (`api/messages.py`)

#### GET /api/messages/{room_id}
Retrieves message history for a room.

**Handler**:
```python
@router.get("/{room_id}", response_model=schemas.MessageList)
async def get_room_messages(
    room_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify user access
    if not room_service.is_user_member(db, room_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return message_service.get_room_messages(db, room_id, limit, offset)
```

## Service Layer

### Authentication Service (`services/auth.py`)

#### User Creation
```python
def create_user(db: Session, user_data: schemas.UserCreate) -> models.User:
    hashed_password = security.get_password_hash(user_data.password)
    db_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

#### User Authentication
```python
def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    
    if not security.verify_password(password, user.hashed_password):
        return None
    
    return user
```

### Room Service (`services/room.py`)

#### Room Creation
```python
def create_room(db: Session, name: str, description: str, owner_id: str) -> models.Room:
    room = models.Room(
        name=name,
        description=description,
        owner_id=owner_id
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    
    # Add owner as member
    add_room_member(db, room.id, owner_id, "owner")
    
    return room
```

#### Room Membership Management
```python
def add_room_member(db: Session, room_id: str, user_id: str, role: str = "member"):
    membership = models.RoomMember(
        room_id=room_id,
        user_id=user_id,
        role=role
    )
    db.add(membership)
    db.commit()
    return membership

def is_user_member(db: Session, room_id: str, user_id: str) -> bool:
    membership = db.query(models.RoomMember).filter(
        models.RoomMember.room_id == room_id,
        models.RoomMember.user_id == user_id
    ).first()
    return membership is not None
```

### Message Service (`services/message.py`)

#### Message Creation
```python
def create_message(
    db: Session, 
    room_id: str, 
    user_id: str, 
    content: str, 
    message_type: str = "text"
) -> models.Message:
    message = models.Message(
        room_id=room_id,
        user_id=user_id,
        content=content,
        type=message_type
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message
```

#### Message Retrieval
```python
def get_room_messages(
    db: Session, 
    room_id: str, 
    limit: int = 50, 
    offset: int = 0
) -> schemas.MessageList:
    messages = db.query(models.Message)\
        .filter(models.Message.room_id == room_id)\
        .order_by(models.Message.created_at.desc())\
        .limit(limit)\
        .offset(offset)\
        .all()
    
    return schemas.MessageList(
        messages=messages,
        total=len(messages),
        limit=limit,
        offset=offset
    )
```

## Data Layer

### Database Models (`models/models.py`)

#### User Model
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owned_rooms = relationship("Room", back_populates="owner")
    room_memberships = relationship("RoomMember", back_populates="user")
    messages = relationship("Message", back_populates="user")
```

#### Room Model
```python
class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="owned_rooms")
    members = relationship("RoomMember", back_populates="room")
    messages = relationship("Message", back_populates="room")
```

#### Message Model
```python
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    content = Column(Text, nullable=False)
    type = Column(String(50), default="text")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    room = relationship("Room", back_populates="messages")
    user = relationship("User", back_populates="messages")
```

### Pydantic Schemas (`core/schemas.py`)

#### User Schemas
```python
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

#### Room Schemas
```python
class RoomBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class RoomCreate(RoomBase):
    pass

class RoomResponse(RoomBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    member_count: Optional[int] = 0
    
    class Config:
        from_attributes = True
```

## Core Utilities

### Configuration (`core/config.py`)
```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # Redis
    REDIS_URL: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = []
    WEBSOCKET_CORS_ALLOWED_ORIGINS: List[str] = []
    
    class Config:
        env_file = ".env"
```

### Database Connection (`core/database.py`)
```python
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Security Utilities (`core/security.py`)
```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return bcrypt.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt
```

## Error Handling

### HTTP Exceptions
```python
# Custom exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
```

### Validation Errors
```python
# Pydantic validation errors are automatically handled
# Custom validation in services
if not room_name or len(room_name.strip()) == 0:
    raise ValueError("Room name cannot be empty")

if len(room_name) > 100:
    raise ValueError("Room name too long")
```

## Dependency Injection

### Database Dependency
```python
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Current User Dependency
```python
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user
```

## Performance Optimizations

### Database Optimizations
```python
# Database indexes
class Message(Base):
    # ... other fields
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), index=True)

# Query optimization
def get_room_messages_optimized(db: Session, room_id: str):
    return db.query(models.Message)\
        .options(joinedload(models.Message.user))\
        .filter(models.Message.room_id == room_id)\
        .order_by(models.Message.created_at.desc())\
        .limit(50)\
        .all()
```

### Caching Strategy
```python
# Redis caching for frequently accessed data
def get_room_with_cache(db: Session, room_id: str):
    cache_key = f"room:{room_id}"
    
    # Try cache first
    cached_room = redis_client.get(cache_key)
    if cached_room:
        return json.loads(cached_room)
    
    # Query database
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    
    # Cache for 5 minutes
    if room:
        redis_client.setex(cache_key, 300, json.dumps(room.to_dict()))
    
    return room
```

This backend architecture provides a scalable, maintainable foundation for the devCollab platform with clear separation of concerns and comprehensive error handling.
