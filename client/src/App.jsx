// Instructor pattern: App.jsx defines all Routes (same as instructor's App.jsx)
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'

import Home            from './pages/Home'
import Login           from './pages/Login'
import Register        from './pages/Register'
import Checkout        from './pages/Checkout'
import VendorDashboard from './pages/VendorDashboard'
import AdminDashboard  from './pages/AdminDashboard'
import ProfilePage     from './pages/ProfilePage'
import AddProduct      from './pages/AddProduct'
import NotFound        from './pages/NotFound'

const App = () => {
  const location = useLocation()
  // Admin has its own full-page layout (dark sidebar + topbar) — suppress public shell
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="d-flex flex-column min-vh-100">
      {!isAdminRoute && <Navbar />}

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Home />} />
          <Route path="/shop"     element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/signup"   element={<Register />} />
          <Route path="/register" element={<Register />} />

          {/* Protected checkout */}
          <Route path="/checkout" element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } />

          {/* Protected profile */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Vendor only */}
          <Route path="/vendor" element={
            <ProtectedRoute role="vendor">
              <VendorDashboard />
            </ProtectedRoute>
          } />
          <Route path="/vendor/add-product" element={
            <ProtectedRoute role="vendor">
              <AddProduct />
            </ProtectedRoute>
          } />

          {/* Admin only — full-page enterprise dashboard, no cart code */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Redirect old paths */}
          <Route path="/dashboard" element={<Navigate to="/vendor" />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  )
}

export default App

