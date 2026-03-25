import React from 'react'
import { useParams } from 'react-router-dom'

const RoomPage = () => {
  const { roomId } = useParams()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Room: {roomId}</h1>
          <p className="mt-2 text-gray-600">Real-time collaboration space</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-6">
            <div className="text-center text-gray-500 py-12">
              <p>Chat interface and real-time features coming soon...</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Users</h3>
            <div className="text-center text-gray-500">
              <p>User list coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomPage
