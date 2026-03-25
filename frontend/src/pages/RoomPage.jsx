import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { roomService, messageService } from '../services/authService'
import { 
  PaperAirplaneIcon, 
  UserGroupIcon, 
  ArrowLeftOnRectangleIcon,
  UserCircleIcon 
} from '@heroicons/react/24/outline'

const RoomPage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { socket, connected, joinRoom, leaveRoom, sendMessage } = useSocket()
  
  const [room, setRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeUsers, setActiveUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (roomId && connected) {
      joinRoom(roomId)
      return () => leaveRoom(roomId)
    }
  }, [roomId, connected, joinRoom, leaveRoom])

  useEffect(() => {
    if (socket) {
      // Listen for new messages
      socket.on('new_message', (message) => {
        setMessages(prev => [...prev, message])
      })

      // Listen for active users updates
      socket.on('active_users', (users) => {
        setActiveUsers(users)
      })

      // Listen for user joined/left
      socket.on('user_joined', (data) => {
        console.log('User joined:', data)
      })

      socket.on('user_left', (data) => {
        console.log('User left:', data)
      })

      return () => {
        socket.off('new_message')
        socket.off('active_users')
        socket.off('user_joined')
        socket.off('user_left')
      }
    }
  }, [socket])

  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const [roomData, messagesData] = await Promise.all([
          roomService.getRoom(roomId),
          messageService.getMessages(roomId)
        ])
        
        setRoom(roomData)
        setMessages(messagesData.messages || [])
      } catch (error) {
        console.error('Failed to fetch room data:', error)
        if (error.response?.status === 404) {
          navigate('/dashboard')
        }
      } finally {
        setLoading(false)
      }
    }

    if (roomId) {
      fetchRoomData()
    }
  }, [roomId, navigate])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      sendMessage(roomId, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await roomService.leaveRoom(roomId)
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to leave room:', error)
      navigate('/dashboard')
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{room?.name || 'Loading...'}</h1>
              <p className="text-sm text-gray-600">{room?.description || 'No description'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-sm text-gray-500">
                <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                {connected ? 'Connected' : 'Disconnected'}
              </div>
              <button
                onClick={handleLeaveRoom}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4 mr-2" />
                Leave Room
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">{message.username}</p>
                        <p className="text-xs text-gray-500">{formatTime(message.created_at)}</p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{message.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={!connected}
                />
                <button
                  type="submit"
                  disabled={!connected || sending || !newMessage.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Active Users</h3>
              <span className="ml-2 text-sm text-gray-500">({activeUsers.length})</span>
            </div>
            
            <div className="space-y-3">
              {activeUsers.length === 0 ? (
                <p className="text-sm text-gray-500">No active users</p>
              ) : (
                activeUsers.map((activeUser, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activeUser.username}
                        {activeUser.id === user?.id && ' (You)'}
                      </p>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        <p className="text-xs text-green-600">Online</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p>Room ID: {roomId}</p>
                <p>Total Messages: {messages.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomPage
