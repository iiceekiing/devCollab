# Authentication Documentation

## Overview

devCollab implements a secure JWT-based authentication system that provides user registration, login, and protected route access. The system ensures secure communication between frontend and backend while maintaining a seamless user experience.

## Authentication Flow

### User Registration
1. User submits registration form with username, email, and password
2. Frontend validates form inputs client-side
3. Frontend sends POST request to `/api/auth/register`
4. Backend validates input and checks if user already exists
5. Backend hashes password using bcrypt
6. Backend creates user record in PostgreSQL database
7. Backend generates JWT token with user information
8. Backend returns token and user data to frontend
9. Frontend stores JWT token in localStorage
10. Frontend redirects user to dashboard

### User Login
1. User submits login form with email and password
2. Frontend sends POST request to `/api/auth/login`
3. Backend validates credentials against database
4. Backend verifies password using bcrypt
5. Backend generates JWT token upon successful authentication
6. Backend returns token and user data to frontend
7. Frontend stores JWT token in localStorage
8. Frontend updates authentication state
9. Frontend redirects user to dashboard

### Token Management
- JWT tokens are stored in localStorage for persistence
- Tokens are automatically included in all API requests via axios interceptors
- Tokens expire after configurable time (default: 30 minutes)
- Frontend handles token expiration by redirecting to login

## API Endpoints

### POST /api/auth/register
**Description**: Register a new user account

**Request Body**:
```json
{
  "username": "string",
  "email": "string", 
  "password": "string"
}
```

**Response (201)**:
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "created_at": "datetime"
  }
}
```

**Error Responses**:
- `400`: Bad Request - Invalid input data
- `409`: Conflict - User already exists
- `422`: Unprocessable Entity - Validation errors

### POST /api/auth/login
**Description**: Authenticate user and return JWT token

**Request Body**:
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200)**:
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "username": "string", 
    "email": "string",
    "created_at": "datetime"
  }
}
```

**Error Responses**:
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid credentials
- `422`: Unprocessable Entity - Validation errors

### GET /api/auth/me
**Description**: Get current user information

**Headers**: `Authorization: Bearer <jwt_token>`

**Response (200)**:
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "created_at": "datetime"
}
```

**Error Responses**:
- `401`: Unauthorized - Invalid or expired token

## Security Implementation

### Password Security
- **Hashing**: All passwords are hashed using bcrypt
- **Salt**: bcrypt automatically generates unique salt per password
- **Rounds**: Configurable bcrypt rounds (default: 12)
- **Storage**: Only hashed passwords stored in database

### JWT Token Security
- **Algorithm**: HS256 for token signing
- **Secret**: Configurable secret key (environment variable)
- **Expiration**: Configurable token lifetime (default: 30 minutes)
- **Payload**: Contains user ID, username, and expiration
- **Validation**: Token validated on every protected request

### Frontend Security
- **Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
- **Automatic Inclusion**: Axios interceptor adds token to all requests
- **Expiration Handling**: Automatic redirect to login on token expiration
- **Cleanup**: Token removed on logout

### Backend Security
- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM prevents SQL injection
- **Rate Limiting**: Consider implementing rate limiting for auth endpoints
- **CORS**: Configured for specific origins only

## Frontend Implementation

### AuthContext
The `AuthContext` provides global authentication state:

```javascript
const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**State Management**:
- `user`: Current user object or null
- `token`: JWT token string or null
- `loading`: Authentication loading state
- `isAuthenticated`: Boolean authentication status

**Methods**:
- `login(email, password)`: Authenticate user
- `register(username, email, password)`: Register new user
- `logout()`: Clear authentication state

### Protected Routes
Protected routes use the `ProtectedRoute` component:

```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

## Backend Implementation

### Authentication Service
The `auth.py` service handles authentication logic:

```python
def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user
```

### JWT Utilities
Token creation and validation:

```python
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt
```

### Dependency Injection
Protected routes use the `get_current_user` dependency:

```python
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401, 
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
```

## WebSocket Authentication

WebSocket connections authenticate using JWT tokens:

```javascript
const socket = io(API_URL, {
  auth: {
    token: localStorage.getItem('token')
  },
  transports: ['websocket', 'polling']
})
```

Backend validates WebSocket tokens:

```python
async def websocket_endpoint(websocket: WebSocket, room_id: str, token: str = None):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        # Validate user and establish connection
    except JWTError:
        await websocket.close(code=4001)
        return
```

## Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

### Security Best Practices
1. **Use strong JWT secrets** in production
2. **Set appropriate token expiration** times
3. **Implement rate limiting** on auth endpoints
4. **Use HTTPS** in production
5. **Consider httpOnly cookies** for token storage
6. **Implement password strength requirements**
7. **Add email verification** for registration
8. **Implement password reset** functionality

## Testing Authentication

### Unit Tests
Test authentication service functions:
- Password hashing and verification
- JWT token creation and validation
- User registration and login logic

### Integration Tests
Test authentication endpoints:
- Successful registration and login
- Invalid credentials handling
- Token validation on protected routes
- WebSocket authentication

### End-to-End Tests
Test complete authentication flows:
- User registration flow
- User login flow
- Protected route access
- Logout functionality

This authentication system provides a secure foundation for user management while maintaining excellent user experience.
