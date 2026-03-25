import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
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

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email,
      password
    })
    return response.data
  },

  register: async (username, email, password) => {
    const response = await api.post('/api/auth/register', {
      username,
      email,
      password
    })
    return response.data
  },

  getCurrentUser: async (token) => {
    const response = await api.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    return response.data
  }
}

export const roomService = {
  createRoom: async (name, description) => {
    const response = await api.post('/api/rooms', {
      name,
      description
    })
    return response.data
  },

  getRooms: async () => {
    const response = await api.get('/api/rooms')
    return response.data
  },

  getRoom: async (roomId) => {
    const response = await api.get(`/api/rooms/${roomId}`)
    return response.data
  },

  joinRoom: async (roomId) => {
    const response = await api.post(`/api/rooms/${roomId}/join`)
    return response.data
  },

  leaveRoom: async (roomId) => {
    const response = await api.post(`/api/rooms/${roomId}/leave`)
    return response.data
  }
}

export const messageService = {
  getMessages: async (roomId, limit = 50, offset = 0) => {
    const response = await api.get(`/api/messages/${roomId}?limit=${limit}&offset=${offset}`)
    return response.data
  }
}
