import React from 'react'
import { PlusCircleIcon } from '@heroicons/react/24/outline'

const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your collaboration rooms</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Room Card */}
          <div className="bg-white rounded-lg shadow-sm border-2 border-dashed border-gray-300 p-6 hover:border-blue-400 transition-colors cursor-pointer">
            <div className="text-center">
              <PlusCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Create New Room</h3>
              <p className="mt-1 text-sm text-gray-500">Start a new collaboration space</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500">
          <p>Room management features coming soon...</p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
