# Live Chatting Documentation

## Overview

The live chat system in devCollab enables real-time messaging between users in collaboration rooms. It combines WebSocket technology for instant delivery with persistent storage for message history.

## Chat Architecture

```
┌─────────────┐    WebSocket    ┌─────────────┐    Redis Pub/Sub    ┌─────────────┐
│   Client    │◄──────────────►│  Backend    │◄──────────────────►│    Redis    │
│             │                │             │                    │             │
│ - Messages  │                │ - Validate  │                    │ - Broadcast │
│ - History  │                │ - Store     │                    │ - Scale     │
│ - UI State │                │ - Broadcast │                    │             │
└─────────────┘                └─────────────┘                    └─────────────┘
                                      │
                                      ▼
                              ┌─────────────┐
                              │ PostgreSQL  │
                              │             │
                              │ - Messages  │
                              │ - History  │
                              │ - Users     │
                              └─────────────┘
```

## Message Flow

### Sending a Message
1. User types message in chat input
2. Client validates message locally (length, content)
3. Client emits `send_message` event via WebSocket
4. Backend receives and validates message
5. Backend saves message to PostgreSQL database
6. Backend publishes message to Redis pub/sub
7. All connected clients in room receive message via `new_message` event
8. Client updates UI with new message
9. Message scrolls into view

### Receiving Messages
1. Client listens for `new_message` events
2. When message received, client validates message format
3. Client adds message to local state
4. UI updates to show new message
5. Chat scrolls to bottom if user was at bottom
6. Unread message count updates (if implemented)

### Loading Message History
1. User joins room or requests history
2. Client calls `/api/messages/{room_id}` endpoint
3. Backend retrieves messages from database with pagination
4. Backend returns paginated message list
5. Client displays messages in chronological order
6. Client establishes WebSocket connection for new messages

## Message Data Model

### Message Structure
```json
{
  "id": "uuid-string",
  "room_id": "uuid-string", 
  "user_id": "uuid-string",
  "username": "string",
  "content": "string",
  "type": "text",
  "created_at": "iso-datetime",
  "updated_at": "iso-datetime"
}
```

### Database Schema
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_room_created ON messages(room_id, created_at);
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at);
```

## Frontend Implementation

### Message State Management
```javascript
const [messages, setMessages] = useState([])
const [newMessage, setNewMessage] = useState('')
const [loading, setLoading] = useState(false)
const [sending, setSending] = useState(false)
```

### Message Sending
```javascript
const handleSendMessage = async (e) => {
  e.preventDefault()
  if (!newMessage.trim() || sending) return

  setSending(true)
  try {
    await sendMessage(roomId, newMessage.trim())
    setNewMessage('')
  } catch (error) {
    console.error('Failed to send message:', error)
    alert('Failed to send message. Please try again.')
  } finally {
    setSending(false)
  }
}
```

### Message Receiving
```javascript
useEffect(() => {
  if (socket) {
    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message])
    })

    return () => {
      socket.off('new_message')
    }
  }
}, [socket])
```

### Message Display
```javascript
const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="h-96 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}
```

### Message Component
```javascript
const MessageItem = ({ message }) => {
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0">
        <UserCircleIcon className="h-8 w-8 text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">
            {message.username}
          </p>
          <p className="text-xs text-gray-500">
            {formatTime(message.created_at)}
          </p>
        </div>
        <p className="text-sm text-gray-700 mt-1">
          {message.content}
        </p>
      </div>
    </div>
  )
}
```

## Backend Implementation

### Message Service
```python
class MessageService:
    def __init__(self, db: Session):
        self.db = db
    
    async def create_message(self, room_id: str, user_id: str, content: str, message_type: str = "text"):
        message = Message(
            room_id=room_id,
            user_id=user_id,
            content=content,
            type=message_type
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    async def get_room_messages(self, room_id: str, limit: int = 50, offset: int = 0):
        messages = self.db.query(Message)\
            .filter(Message.room_id == room_id)\
            .order_by(Message.created_at.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()
        
        return {
            "messages": [
            {
                "id": msg.id,
                "room_id": msg.room_id,
                "user_id": msg.user_id,
                "username": msg.user.username,
                "content": msg.content,
                "type": msg.type,
                "created_at": msg.created_at.isoformat()
            } for msg in messages
            ],
            "total": len(messages),
            "limit": limit,
            "offset": offset
        }
```

### WebSocket Message Handler
```python
async def handle_send_message(user_id: str, data: dict):
    try:
        room_id = data.get("room_id")
        content = data.get("content")
        message_type = data.get("type", "text")
        
        # Validate message
        if not room_id or not content:
            await send_error(websocket, "INVALID_MESSAGE", "Missing required fields")
            return
        
        # Create message in database
        message = await message_service.create_message(
            room_id=room_id,
            user_id=user_id,
            content=content.strip(),
            message_type=message_type
        )
        
        # Broadcast to room
        await broadcast_to_room(room_id, {
            "event": "new_message",
            "data": {
                "id": str(message.id),
                "room_id": room_id,
                "user_id": user_id,
                "username": message.user.username,
                "content": message.content,
                "type": message.type,
                "created_at": message.created_at.isoformat()
            }
        })
        
    except Exception as e:
        logger.error(f"Error handling message: {e}")
        await send_error(websocket, "MESSAGE_ERROR", "Failed to send message")
```

### API Endpoints
```python
@router.get("/messages/{room_id}")
async def get_room_messages(
    room_id: str,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify user is member of room
    if not await room_service.is_user_member(db, room_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    messages = await message_service.get_room_messages(db, room_id, limit, offset)
    return messages
```

## Real-time Features

### Typing Indicators (Future Enhancement)
```javascript
// Client sends typing event
socket.emit('typing_start', { room_id: roomId })

// Client receives typing events
socket.on('user_typing', (data) => {
  showTypingIndicator(data.user_id)
})

socket.on('user_stop_typing', (data) => {
  hideTypingIndicator(data.user_id)
})
```

### Read Receipts (Future Enhancement)
```javascript
// Mark messages as read
socket.emit('mark_read', { 
  room_id: roomId, 
  message_ids: readMessageIds 
})

// Receive read status
socket.on('message_read', (data) => {
  updateMessageReadStatus(data.message_id, data.read_by)
})
```

### Message Reactions (Future Enhancement)
```javascript
// Add reaction to message
socket.emit('add_reaction', {
  message_id: messageId,
  reaction: '👍'
})

// Receive reaction updates
socket.on('reaction_added', (data) => {
  updateMessageReactions(data.message_id, data.reaction)
})
```

## Performance Optimizations

### Frontend Optimizations
- **Virtual Scrolling**: For large message histories
- **Message Caching**: Local storage for recent messages
- **Lazy Loading**: Load older messages on scroll
- **Debounced Input**: Prevent excessive typing events
- **Image Optimization**: Lazy load images in messages

### Backend Optimizations
- **Database Indexing**: Optimized queries for message retrieval
- **Connection Pooling**: Efficient database connections
- **Message Pagination**: Limit message history requests
- **Caching**: Redis cache for recent messages
- **Batch Processing**: Group multiple operations

### Network Optimizations
- **Message Compression**: Compress large messages
- **Delta Updates**: Send only changes for message updates
- **Connection Reuse**: Maintain persistent connections
- **Binary Protocol**: Consider MessagePack for efficiency

## Security Considerations

### Input Validation
```python
def validate_message_content(content: str):
    if not content or len(content.strip()) == 0:
        raise ValueError("Message cannot be empty")
    
    if len(content) > 2000:  # Configurable limit
        raise ValueError("Message too long")
    
    # Sanitize content
    import html
    content = html.escape(content)
    
    return content.strip()
```

### Content Filtering
- Profanity filtering
- Spam detection
- Link validation
- File type restrictions (for future file sharing)

### Rate Limiting
```python
# Per-user rate limiting
@limiter.limit("10/minute")  # 10 messages per minute per user
async def send_message(user_id: str, data: dict):
    # Message sending logic
```

## Analytics and Monitoring

### Message Metrics
- Messages per room
- Messages per user
- Peak usage times
- Average message length

### Performance Metrics
- Message delivery latency
- WebSocket connection stability
- Database query performance
- Memory usage per connection

### Error Tracking
- Failed message deliveries
- Connection drops
- Validation errors
- System exceptions

## Testing Strategy

### Unit Tests
```python
def test_create_message():
    message = MessageService.create_message(
        room_id="test-room",
        user_id="test-user", 
        content="Hello World"
    )
    assert message.content == "Hello World"
    assert message.room_id == "test-room"
```

### Integration Tests
```python
async def test_message_flow():
    # Connect WebSocket
    websocket = await test_client.connect()
    
    # Join room
    await websocket.send_json({"event": "join_room", "room_id": "test-room"})
    
    # Send message
    await websocket.send_json({
        "event": "send_message",
        "data": {"content": "Hello World"}
    })
    
    # Verify message received
    response = await websocket.receive_json()
    assert response["event"] == "new_message"
    assert response["data"]["content"] == "Hello World"
```

### Load Testing
- Concurrent message sending
- High-frequency message bursts
- Large room participant counts
- Memory leak detection

This live chat system provides a robust foundation for real-time communication while ensuring performance, security, and scalability.
