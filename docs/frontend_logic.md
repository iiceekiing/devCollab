# Frontend Logic Documentation

## Overview

The devCollab frontend is built with React 18 and follows a component-based architecture with modern hooks for state management. The application uses React Context for global state management and Socket.IO for real-time communication.

## Architecture Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                    │
├─────────────────────────────────────────────────────────────┤
│  Components          │  Contexts       │  Services   │
│  - Pages           │  - AuthContext  │  - API     │
│  - UI Components  │  - SocketCtx    │  - Utils    │
│  - Layout          │  - State Mgmt   │  - Hooks    │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
frontend/src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Navbar.jsx      # Navigation component
│   └── ProtectedRoute.jsx # Route protection
├── contexts/           # Global state management
│   ├── AuthContext.jsx # Authentication state
│   └── SocketContext.jsx # WebSocket state
├── pages/              # Page components
│   ├── LandingPage.jsx  # Landing page
│   ├── LoginPage.jsx    # Login page
│   ├── RegisterPage.jsx # Registration page
│   ├── DashboardPage.jsx # Room dashboard
│   └── RoomPage.jsx    # Chat room page
├── services/           # API and utilities
│   └── authService.jsx # API client
├── hooks/              # Custom hooks (future)
├── utils/              # Utility functions (future)
└── styles/             # Styling
    ├── App.css        # Custom styles
    └── index.css      # Tailwind + custom
```

## State Management

### Authentication Context (`contexts/AuthContext.jsx`)

The AuthContext provides global authentication state and methods.

#### State Structure
```javascript
const [user, setUser] = useState(null)
const [token, setToken] = useState(localStorage.getItem('token'))
const [loading, setLoading] = useState(true)
```

#### Core Methods
```javascript
const login = async (email, password) => {
  try {
    const response = await authService.login(email, password)
    const { access_token, user: userData } = response
    
    localStorage.setItem('token', access_token)
    setToken(access_token)
    setUser(userData)
    
    return response
  } catch (error) {
    throw error
  }
}

const logout = () => {
  localStorage.removeItem('token')
  setToken(null)
  setUser(null)
}
```

#### Custom Hook
```javascript
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

### Socket Context (`contexts/SocketContext.jsx`)

Manages WebSocket connections and real-time events.

#### Connection Management
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

#### Event Handling
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

#### Room Operations
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

## Component Architecture

### Layout Component (`components/Layout.jsx`)

Provides consistent layout across all pages.

```javascript
const Layout = ({ children }) => {
  const location = useLocation()
  const { user } = useAuth()

  const hideNavbarRoutes = ['/login', '/register']
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen bg-white">
      {!shouldHideNavbar && <Navbar />}
      <main className={!shouldHideNavbar ? 'pt-16' : ''}>
        {children}
      </main>
    </div>
  )
}
```

### Protected Route Component (`components/ProtectedRoute.jsx`)

HOC for protecting authenticated routes.

```javascript
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

## Page Components

### Landing Page (`pages/LandingPage.jsx`)

Marketing and information page with call-to-action.

#### Key Features
- Hero section with value proposition
- Feature cards highlighting capabilities
- Call-to-action buttons for registration/login
- Responsive design with Tailwind CSS

#### State Management
```javascript
const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  // Dynamic CTA based on auth state
  const ctaButton = isAuthenticated ? (
    <Link to="/dashboard" className="...">
      Go to Dashboard
    </Link>
  ) : (
    <Link to="/register" className="...">
      Get Started Free
    </Link>
  )
}
```

### Login Page (`pages/LoginPage.jsx`)

User authentication interface.

#### Form Handling
```javascript
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }
}
```

#### Input Validation
- Email format validation
- Password presence check
- Real-time error display
- Loading state management

### Dashboard Page (`pages/DashboardPage.jsx`)

Room management interface.

#### Room Management
```javascript
const DashboardPage = () => {
  const [rooms, setRooms] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: '', description: '' })

  const fetchRooms = async () => {
    try {
      const response = await roomService.getRooms()
      setRooms(response.rooms || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    try {
      await roomService.createRoom(newRoom.name, newRoom.description)
      setNewRoom({ name: '', description: '' })
      setShowCreateModal(false)
      fetchRooms()
    } catch (error) {
      alert('Failed to create room')
    }
  }
}
```

#### UI Features
- Grid layout for room cards
- Modal for room creation
- Real-time room count updates
- Responsive design

### Room Page (`pages/RoomPage.jsx`)

Real-time chat interface.

#### Message Management
```javascript
const RoomPage = () => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeUsers, setActiveUsers] = useState([])
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])
}
```

#### Real-time Features
- Live message updates via WebSocket
- Active users list
- Connection status indicator
- Auto-scroll to new messages
- Message input with send on Enter

## Service Layer

### API Service (`services/authService.jsx`)

Centralized API communication with axios.

#### Configuration
```javascript
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

#### API Methods
```javascript
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data
  },

  register: async (username, email, password) => {
    const response = await api.post('/api/auth/register', {
      username, email, password
    })
    return response.data
  }
}

export const roomService = {
  createRoom: async (name, description) => {
    const response = await api.post('/api/rooms', { name, description })
    return response.data
  },

  getRooms: async () => {
    const response = await api.get('/api/rooms')
    return response.data
  }
}
```

## Routing Configuration

### App Router (`App.jsx`)

Main application routing setup.

```javascript
function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/room/:roomId" 
                element={
                  <ProtectedRoute>
                    <RoomPage />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}
```

## Styling Architecture

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#3B82F6',
          orange: '#F97316',
          red: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}
```

### Custom Styles (`App-custom.css`)

```css
/* Smooth transitions */
* {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

/* Loading spinner */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Card hover effects */
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}
```

## Performance Optimizations

### Component Optimization
```javascript
// React.memo for expensive components
const MessageItem = React.memo(({ message }) => {
  return (
    <div className="flex items-start space-x-3">
      {/* Message content */}
    </div>
  )
})

// useMemo for expensive calculations
const formattedMessages = useMemo(() => {
  return messages.map(msg => ({
    ...msg,
    formattedTime: formatTime(msg.created_at)
  }))
}, [messages])
```

### State Management Optimization
```javascript
// useCallback to prevent unnecessary re-renders
const handleSendMessage = useCallback(async (e) => {
  e.preventDefault()
  // Send message logic
}, [socket, connected, roomId])

// Debounced input handling
const debouncedMessageChange = useMemo(
  () => debounce(setNewMessage, 300),
  []
)
```

### Bundle Optimization
```javascript
// vite.config.js
export default {
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          api: ['axios'],
          ui: ['@heroicons/react']
        }
      }
    }
  }
}
```

## Error Handling

### Error Boundaries
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600">
              Please refresh the page and try again.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

### Global Error Handling
```javascript
// Service error handling
export const handleApiError = (error) => {
  if (error.response) {
    // HTTP error
    console.error('API Error:', error.response.status, error.response.data)
  } else if (error.request) {
    // Network error
    console.error('Network Error:', error.request)
  } else {
    // Other error
    console.error('Error:', error.message)
  }
}
```

## Testing Strategy

### Component Testing
```javascript
// Example test for LoginPage
import { render, screen, fireEvent } from '@testing-library/react'
import { AuthProvider } from '../contexts/AuthContext'

test('login form submission', async () => {
  const mockLogin = jest.fn()
  
  render(
    <AuthProvider value={{ login: mockLogin }}>
      <LoginPage />
    </AuthProvider>
  )

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  })
  
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  
  expect(mockLogin).toHaveBeenCalledWith('test@example.com', '')
})
```

### Integration Testing
```javascript
// Test API integration
import { authService } from '../services/authService'

test('authentication service', async () => {
  // Mock axios
  jest.spyOn(axios, 'post').mockResolvedValue({
    data: { access_token: 'token', user: { id: '1', username: 'test' } }
  })

  const result = await authService.login('test@example.com', 'password')
  
  expect(result.access_token).toBe('token')
  expect(result.user.username).toBe('test')
})
```

This frontend architecture provides a scalable, maintainable foundation for the devCollab application with modern React patterns and comprehensive error handling.
