import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChatBubbleLeftRightIcon, UserGroupIcon, ShieldCheckIcon, RocketLaunchIcon } from '@heroicons/react/24/outline'

const LandingPage = () => {
  const { isAuthenticated } = useAuth()

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Real-time Chat',
      description: 'Instant messaging with WebSocket technology for seamless collaboration.'
    },
    {
      icon: UserGroupIcon,
      title: 'Collaboration Rooms',
      description: 'Create and join dedicated spaces for team discussions and projects.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure Authentication',
      description: 'JWT-based authentication keeping your conversations safe and private.'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Lightning Fast',
      description: 'Built with modern tech stack for optimal performance and reliability.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Real-time Collaboration
              <span className="block text-blue-600">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              devCollab brings teams together with instant messaging, collaborative rooms, 
              and a seamless experience designed for modern development teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need for effective collaboration
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with the latest technologies to ensure your team stays connected and productive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your team collaboration?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using devCollab for their real-time collaboration needs.
          </p>
          {!isAuthenticated && (
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
            >
              Start Collaborating Today
            </Link>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">devCollab</span>
            </div>
            <p className="text-gray-600">
              Built with ❤️ for modern development teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
