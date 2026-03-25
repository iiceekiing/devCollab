import React, { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const { token, isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:8000', {
        auth: {
          token: token
        },
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

      newSocket.on('error', (error) => {
        console.error('WebSocket error:', error)
        setConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setConnected(false)
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [isAuthenticated, token])

  const joinRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('join_room', { room_id: roomId })
    }
  }

  const leaveRoom = (roomId) => {
    if (socket && connected) {
      socket.emit('leave_room', { room_id: roomId })
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

  const value = {
    socket,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
