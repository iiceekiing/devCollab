import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircleIcon, ChatBubbleLeftRightIcon, UserGroupIcon, ClockIcon } from '@heroicons/react/24/outline'
import { roomService } from '../services/authService'

const DashboardPage = () => {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRoom, setNewRoom] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await roomService.getRooms()
      setRooms(response.rooms || [])
    } catch (error) {
      console.error('Failed to fetch rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!newRoom.name.trim()) return

    setCreating(true)
    try {
      await roomService.createRoom(newRoom.name, newRoom.description)
      setNewRoom({ name: '', description: '' })
      setShowCreateModal(false)
      fetchRooms()
    } catch (error) {
      console.error('Failed to create room:', error)
      alert('Failed to create room. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Rooms</h1>
            <p className="mt-2 text-gray-600">Manage your collaboration spaces</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Create Room
          </button>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-12">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating your first collaboration room.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
              >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Create Room
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow card-hover">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">{room.name}</h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{room.description || 'No description'}</p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <ChatBubbleLeftRightIcon className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <UserGroupIcon className="h-4 w-4 mr-1" />
                      {room.member_count || 0}
                    </div>
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {room.created_at ? formatDate(room.created_at) : 'Recently'}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link
                    to={`/room/${room.id}`}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Join Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Room Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Create New Room</h3>
                <form onSubmit={handleCreateRoom} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="room-name" className="block text-sm font-medium text-gray-700">
                      Room Name
                    </label>
                    <input
                      id="room-name"
                      type="text"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter room name"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="room-description" className="block text-sm font-medium text-gray-700">
                      Description (optional)
                    </label>
                    <textarea
                      id="room-description"
                      rows="3"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="What's this room about?"
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false)
                        setNewRoom({ name: '', description: '' })
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !newRoom.name.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? 'Creating...' : 'Create Room'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
