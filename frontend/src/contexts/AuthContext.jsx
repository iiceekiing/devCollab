import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token'))

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          const userData = await authService.getCurrentUser(storedToken)
          setUser(userData)
          setToken(storedToken)
        } catch (error) {
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

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

  const register = async (username, email, password) => {
    try {
      const response = await authService.register(username, email, password)
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

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
