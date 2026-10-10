// AuthContext — shared reactive auth state for entire app
// Fixes Bug 2: ProtectedRoute and Navbar now react to login/logout instantly
// No more window.location.reload() needed

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback } from 'react'


const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  // Initialize from localStorage so refresh doesn't log you out
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null }
    catch { return null }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)

  // Call this after successful login or register
  const login = useCallback((userData, tokenData) => {
    if (tokenData && tokenData !== 'undefined') {
      localStorage.setItem('token', tokenData)
      setToken(tokenData)   // triggers re-render of every component using useAuth()
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)     // ProtectedRoute + Navbar both update immediately
    }
  }, [])


  // Call this to sign out
  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('cartCount')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!token, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook — import this in every component that needs auth state
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
