# Architecture Documentation

## Overview

devCollab is a real-time collaboration platform built with a modern, scalable architecture that separates concerns between frontend, backend, and infrastructure layers.

## System Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │    Redis    │
│   (React)   │◄──►│  (FastAPI)  │◄──►│   (Pub/Sub) │
└─────────────┘    └─────────────┘    └─────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │ PostgreSQL  │
                   │ (Database)  │
                   └─────────────┘
```

## Components

### Frontend (React)
- **Framework**: React 18 with Vite for fast development
- **Routing**: React Router for client-side navigation
- **State Management**: React Context API for global state
- **Styling**: Tailwind CSS for utility-first styling
- **Real-time**: Socket.IO client for WebSocket connections
- **HTTP Client**: Axios for API communication

### Backend (FastAPI)
- **Framework**: FastAPI for high-performance API
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Real-time**: Socket.IO for WebSocket connections
- **Caching**: Redis for session management and pub/sub
- **Validation**: Pydantic for data validation

### Infrastructure
- **Containerization**: Docker for consistent deployment
- **Orchestration**: Docker Compose for multi-container setup
- **Database**: PostgreSQL 15 for reliable data storage
- **Cache**: Redis 7 for fast data access and pub/sub
- **Web Server**: Uvicorn for FastAPI deployment

## Data Flow

### Authentication Flow
1. User submits login/registration form
2. Frontend sends credentials to `/api/auth/login` or `/api/auth/register`
3. Backend validates credentials and generates JWT token
4. Backend returns token and user data
5. Frontend stores token in localStorage
6. Frontend includes token in subsequent API requests

### Real-time Communication Flow
1. Frontend establishes WebSocket connection with JWT token
2. Backend validates token and authenticates WebSocket connection
3. User joins room via `join_room` event
4. Backend adds user to room and broadcasts to Redis pub/sub
5. Messages flow through Redis pub/sub for horizontal scaling
6. All connected users in room receive real-time updates

### Room Management Flow
1. User creates room via `/api/rooms` endpoint
2. Backend validates and creates room in PostgreSQL
3. User joins room via WebSocket or HTTP endpoint
4. Backend tracks room membership and active users
5. Real-time events update all room participants

## Security Considerations

### Authentication
- JWT tokens with configurable expiration
- Password hashing with bcrypt
- Token validation on all protected routes
- Automatic token refresh handling

### WebSocket Security
- Token-based WebSocket authentication
- Room-based access control
- Connection lifecycle management
- Automatic cleanup on disconnect

### Data Validation
- Pydantic schemas for all API inputs
- SQL injection prevention via ORM
- XSS protection through proper escaping
- CORS configuration for cross-origin requests

## Scalability Features

### Horizontal Scaling
- Redis pub/sub enables multiple backend instances
- Stateless JWT authentication
- Database connection pooling
- Container-based deployment

### Performance Optimizations
- Efficient WebSocket connection management
- Database query optimization
- Caching with Redis
- Lazy loading in frontend

## Technology Stack Details

### Frontend Dependencies
- React 19.2.4 - Modern React with hooks
- React Router 7.13.2 - Client-side routing
- Socket.IO Client 4.8.3 - WebSocket client
- Axios 1.13.6 - HTTP client library
- Tailwind CSS 4.2.2 - Utility-first CSS
- Heroicons 2.2.0 - Icon library

### Backend Dependencies
- FastAPI 0.104.1 - Modern Python web framework
- SQLAlchemy 2.0.23 - Python SQL ORM
- Alembic 1.12.1 - Database migration tool
- PostgreSQL client 2.9.9 - PostgreSQL adapter
- Redis 5.0.1 - Redis Python client
- Socket.IO 5.10.0 - WebSocket server
- JWT library 3.3.0 - JWT token handling
- Bcrypt 1.7.4 - Password hashing

## Development Workflow

### Local Development
```bash
# Start all services
make up

# View logs
make logs

# Stop services
make down
```

### Branching Strategy
- `main` - Production-ready code
- `feature/*` - Individual feature development
- `feature/frontend-setup` - Frontend infrastructure
- `feature/backend-auth` - Authentication system
- `feature/websockets-realtime` - Real-time features
- `feature/frontend-rooms` - Room management
- `feature/documentation` - Project documentation

## Deployment Architecture

### Development Environment
- Docker Compose with all services
- Hot reloading for development
- Local database and Redis instances

### Production Environment
- Frontend: Vercel (static hosting)
- Backend: Render (container hosting)
- Database: Managed PostgreSQL
- Cache: Managed Redis
- CDN: Vercel Edge Network

## Monitoring and Observability

### Health Checks
- `/health` endpoint for backend status
- Docker health checks for all services
- WebSocket connection status monitoring

### Logging
- Structured logging in backend
- Client-side error tracking
- WebSocket event logging
- Database query logging (development)

This architecture provides a solid foundation for a scalable, maintainable real-time collaboration platform.
