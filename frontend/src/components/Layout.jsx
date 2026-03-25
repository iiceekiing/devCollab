import React from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from './Navbar'

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

export default Layout
