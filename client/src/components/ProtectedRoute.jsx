// ProtectedRoute — HTTP-Only cookie session migration route guard
// Injects custom loading context flag and array-validated RBAC filtering

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, role, roles, allowedRoles }) => {
  const { isLoggedIn, user, loading } = useAuth()

  // Defensive fallback spinner layout while loading is active
  if (loading === true) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Not logged in → redirect to login
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />
  }

  // Explicit Role-Based Access Control (RBAC) filtering using array validations against user.role
  const targetRoles = roles || allowedRoles || (role ? (Array.isArray(role) ? role : [role]) : null)
  if (targetRoles) {
    const rolesArray = Array.isArray(targetRoles) ? targetRoles : [targetRoles]
    if (!rolesArray.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute
