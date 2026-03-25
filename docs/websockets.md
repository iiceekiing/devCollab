# WebSocket Documentation

## Overview

devCollab uses Socket.IO for real-time WebSocket communication, enabling instant messaging, live user presence, and real-time collaboration features. The WebSocket system is designed for scalability using Redis pub/sub for horizontal scaling.

## WebSocket Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │  Backend    │    │    Redis    │
│ (Socket.IO)  │◄──►│ (Socket.IO)  │◄──►│   (Pub/Sub) │
└─────────────┘    └─────────────┘    └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │ PostgreSQL  │
                    │ (Database)  │
                    └─────────────┘
```

## Connection Flow

### Client Connection
1. Client establishes WebSocket connection with JWT token
2. Backend validates token and authenticates connection
3. Backend registers user in connection manager
4. Client can join rooms and send/receive messages

### Room Joining
1. Client emits `join_room` event with room ID
2. Backend validates room existence and user permissions
3. Backend adds user to room participants
4. Backend broadcasts user joined event to room
5. Backend sends current active users list to client

### Message Broadcasting
1. Client sends message via `send_message` event
2. Backend validates message and saves to database
3. Backend publishes message to Redis pub/sub
4. All backend instances receive message via Redis
5. All connected clients in room receive message

## WebSocket Events

### Client → Server Events

#### join_room
Join a collaboration room.

**Payload**:
```json
{
  "room_id": "uuid-string"
}
```

**Response Events**:
- `room_joined`: Successfully joined room
- `error`: Failed to join room

#### leave_room
Leave a collaboration room.

**Payload**:
```json
{
  "room_id": "uuid-string"
}
```

**Response Events**:
- `room_left`: Successfully left room
- `error`: Failed to leave room

#### send_message
Send a message to a room.

**Payload**:
```json
{
  "room_id": "uuid-string",
  "content": "message content",
  "type": "text"
}
```

**Response Events**:
- `message_sent`: Message successfully delivered
- `error`: Failed to send message

### Server → Client Events

#### room_joined
Successfully joined a room.

**Payload**:
```json
{
  "room_id": "uuid-string",
  "user": {
    "id": "uuid",
    "username": "string"
  }
}
```

#### room_left
Successfully left a room.

**Payload**:
```json
{
  "room_id": "uuid-string",
  "user": {
    "id": "uuid", 
    "username": "string"
  }
}
```

#### new_message
New message received in room.

**Payload**:
```json
{
  "id": "uuid",
  "room_id": "uuid-string",
  "content": "message content",
  "type": "text",
  "user": {
    "id": "uuid",
    "username": "string"
  },
  "created_at": "iso-datetime"
}
```

#### active_users
Updated list of active users in room.

**Payload**:
```json
{
  "room_id": "uuid-string",
  "users": [
    {
      "id": "uuid",
      "username": "string",
      "joined_at": "iso-datetime"
    }
  ]
}
```

#### user_joined
Another user joined the room.

**Payload**:
```json
{
  "room_id": "uuid-string",
  "user": {
    "id": "uuid",
    "username": "string"
  },
  "joined_at": "iso-datetime"
}
```

#### user_left
Another user left the room.

**Payload**:
```json
{
  "room_id": "uuid-string",
  "user": {
    "id": "uuid",
    "username": "string"
  },
  "left_at": "iso-datetime"
}
```

#### error
Error occurred during WebSocket operation.

**Payload**:
```json
{
  "code": "error-code",
  "message": "error description",
  "event": "original-event-name"
}
```

## Backend Implementation

### Connection Manager
The `ConnectionManager` class manages WebSocket connections:

```python
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.room_connections: Dict[str, List[str]] = {}
        self.user_rooms: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    async def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        self.remove_user_from_all_rooms(user_id)
    
    async def join_room(self, user_id: str, room_id: str):
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        if user_id not in self.room_connections[room_id]:
            self.room_connections[room_id].append(user_id)
        self.user_rooms[user_id] = room_id
```

### WebSocket Endpoint
The main WebSocket endpoint handles connections:

```python
@app.websocket("/ws/{room_id}")
async def websocket_room(websocket: WebSocket, room_id: str, token: str = None):
    # Authenticate user
    user = await authenticate_websocket(token)
    if not user:
        await websocket.close(code=4001)
        return
    
    # Connect user
    await manager.connect(websocket, user.id)
    
    try:
        # Handle WebSocket messages
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(user.id, room_id, data)
    except WebSocketDisconnect:
        await manager.disconnect(user.id)
```

### Redis Integration
Redis pub/sub enables horizontal scaling:

```python
import redis
import json

redis_client = redis.Redis(host='redis', port=6379, decode_responses=True)

async def publish_to_room(room_id: str, event: str, data: dict):
    message = {
        "event": event,
        "room_id": room_id,
        "data": data
    }
    redis_client.publish(f"room:{room_id}", json.dumps(message))

async def subscribe_to_room(room_id: str):
    pubsub = redis_client.pubsub()
    pubsub.subscribe(f"room:{room_id}")
    
    for message in pubsub.listen():
        if message['type'] == 'message':
            data = json.loads(message['data'])
            await broadcast_to_room(room_id, data)
```

## Frontend Implementation

### Socket Context
The `SocketContext` provides WebSocket functionality:

```javascript
const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
```

### Connection Management
```javascript
useEffect(() => {
  if (isAuthenticated && token) {
    const newSocket = io(WS_URL, {
      auth: { token: token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
      setConnected(false)
    })

    setSocket(newSocket)
    return () => newSocket.close()
  }
}, [isAuthenticated, token])
```

### Event Handling
```javascript
useEffect(() => {
  if (socket) {
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message])
    })

    socket.on('active_users', (users) => {
      setActiveUsers(users)
    })

    socket.on('user_joined', (data) => {
      console.log('User joined:', data)
    })

    return () => {
      socket.off('new_message')
      socket.off('active_users')
      socket.off('user_joined')
    }
  }
}, [socket])
```

### Room Operations
```javascript
const joinRoom = (roomId) => {
  if (socket && connected) {
    socket.emit('join_room', { room_id: roomId })
  }
}

const sendMessage = (roomId, message) => {
  if (socket && connected) {
    socket.emit('send_message', {
      room_id: roomId,
      content: message,
      type: 'text'
    })
  }
}
```

## Scalability Features

### Horizontal Scaling
- Multiple backend instances can run simultaneously
- Redis pub/sub ensures all instances receive messages
- Connection state managed per instance
- Load balancer can distribute connections

### Performance Optimizations
- Connection pooling and reuse
- Efficient message broadcasting
- Minimal memory footprint per connection
- Automatic cleanup of disconnected clients

### Reliability Features
- Automatic reconnection on connection loss
- Fallback to HTTP polling if WebSocket fails
- Graceful degradation on network issues
- Connection health monitoring

## Security Considerations

### Authentication
- JWT token validation for all connections
- Automatic disconnection on invalid tokens
- Room-based access control
- User permission validation

### Data Validation
- Input validation for all WebSocket messages
- Sanitization of message content
- Rate limiting per user/room
- Message size limits

### Connection Security
- CORS configuration for WebSocket connections
- Origin validation for security
- Connection rate limiting
- DDoS protection measures

## Monitoring and Debugging

### Connection Monitoring
```javascript
socket.on('connect', () => {
  console.log('WebSocket connected')
  // Track connection metrics
})

socket.on('disconnect', (reason) => {
  console.log('WebSocket disconnected:', reason)
  // Track disconnection reasons
})
```

### Event Logging
```python
async def handle_websocket_message(user_id: str, room_id: str, data: dict):
    logger.info(f"WebSocket message from {user_id} in room {room_id}: {data}")
    # Process message
```

### Performance Metrics
- Connection count per room
- Message frequency analysis
- Latency measurements
- Error rate tracking

## Configuration

### Environment Variables
```env
# WebSocket Settings
WEBSOCKET_CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis Settings
REDIS_URL=redis://redis:6379
```

### Socket.IO Configuration
```python
socketio = AsyncServer(
    app,
    cors_allowed_origins=settings.WEBSOCKET_CORS_ALLOWED_ORIGINS,
    logger=True,
    engineio_logger=True
)
```

## Testing WebSocket Features

### Unit Tests
Test WebSocket event handlers:
- Connection and disconnection
- Room joining and leaving
- Message sending and receiving
- Error handling

### Integration Tests
Test WebSocket communication:
- Client-server message flow
- Room management operations
- Real-time updates
- Connection recovery

### Load Testing
Test WebSocket performance:
- Concurrent connections
- Message throughput
- Memory usage
- Scalability limits

This WebSocket system provides a robust foundation for real-time collaboration while ensuring scalability and reliability.
