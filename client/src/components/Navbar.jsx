// Navbar — redesigned with shopping bag logo + editorial nav style
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── OmniMart Shopping Bag SVG Logo (from Logo 1 concept) ──
const BagIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Handle */}
    <path d="M35 30 Q35 10 50 10 Q65 10 65 30" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" fill="none"/>
    {/* Bag body */}
    <path d="M18 30 L82 30 L88 95 L12 95 Z" fill="#0F172A"/>
    {/* Green accent stripe */}
    <rect x="12" y="55" width="76" height="8" fill="#10B981" opacity="0.9"/>
  </svg>
)

const CATEGORIES = [
  { label: 'Apparel',           emoji: '👕' },
  { label: 'Electronics',       emoji: '⚡' },
  { label: 'Computers',         emoji: '💻' },
  { label: 'Accessories',       emoji: '👜' },
  { label: 'Home & Living',     emoji: '🏠' },
  { label: 'Beauty & Cosmetics',emoji: '💄' },
  { label: 'Sports & Outdoors', emoji: '⚽' },
]

const Navbar = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout, isLoggedIn } = useAuth()
  const [catOpen, setCatOpen] = useState(false)

  const isVendorOrAdminPath = location.pathname.startsWith('/vendor') || location.pathname.startsWith('/admin')

  const getCartCount = () => {
    try {
      if (!isLoggedIn) {
        const items = JSON.parse(localStorage.getItem('cartItems') || '[]')
        return items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      }
    } catch { /* silent */ }
    return parseInt(localStorage.getItem('cartCount') || '0')
  }

  const cartCount = getCartCount()

  const handleLogout = () => { logout(); navigate('/login') }

  const handleCartClick = () => {
    if (location.pathname !== '/') navigate('/?openCart=true')
    else window.dispatchEvent(new Event('openCart'))
  }

  const goCategory = (cat) => {
    setCatOpen(false)
    if (cat) navigate(`/shop?category=${encodeURIComponent(cat)}`)
    else     navigate('/shop')
  }

  // ── Minimal secure checkout header ──
  if (location.pathname === '/checkout') {
    return (
      <nav style={{ height: '60px', background: '#fff', borderBottom: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', position: 'sticky', top: 0, zIndex: 1030 }}>
        <Link to="/" className="omni-brand">
          <BagIcon />
          <span>Omni<span className="omni-brand-accent">Mart</span></span>
        </Link>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>🔒 Secure Checkout</span>
      </nav>
    )
  }

  return (
    <nav className="omni-navbar">
      <div className="omni-navbar-inner">

        {/* ── Logo ── */}
        <Link to="/" className="omni-brand">
          <BagIcon />
          <span>Omni<span className="omni-brand-accent">Mart</span></span>
        </Link>

        {/* ── Nav Links ── */}
        <div className="omni-nav-links">
          <Link to="/" className={`omni-nav-link ${location.pathname === '/' && !location.search ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/shop" className="omni-nav-link">Shop</Link>

          {/* Categories dropdown */}
          <div className="omni-dropdown-wrap" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <button className="omni-nav-link omni-nav-btn">
              Categories <span style={{ fontSize: '10px', marginLeft: '3px' }}>▾</span>
            </button>
            {catOpen && (
              <div className="omni-dropdown">
                <button className="omni-dropdown-item omni-dropdown-all"
                  onClick={() => goCategory('')}>All Categories</button>
                <hr className="omni-dropdown-divider" />
                {CATEGORIES.map(c => (
                  <button key={c.label} className="omni-dropdown-item" onClick={() => goCategory(c.label)}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/shop?sort=newest" className="omni-nav-link">New Arrivals</Link>
          <Link to="/shop?category=Beauty+%26+Cosmetics" className="omni-nav-link omni-nav-sale">Sale</Link>

          {user?.role === 'vendor' && (
            <Link to="/vendor" className="omni-nav-link">Vendor Portal</Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className="omni-nav-link">Admin Panel</Link>
          )}
        </div>

        {/* ── Right Actions ── */}
        <div className="omni-nav-actions">
          {/* Cart */}
          {!isVendorOrAdminPath && (
            <button className="omni-cart-btn" onClick={handleCartClick} aria-label="Open cart">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
              </svg>
              {cartCount > 0 && <span className="omni-cart-badge">{cartCount}</span>}
            </button>
          )}

          {isLoggedIn && user ? (
            <div className="omni-user-wrap">
              <div className="omni-avatar">{(user.firstname?.[0] || '').toUpperCase()}</div>
              <div className="omni-user-dropdown">
                <div className="omni-user-info">Hi, <strong>{user.firstname}</strong></div>
                <Link to="/profile" className="omni-user-link">My Account / Profile</Link>
                {user.role === 'vendor' && (
                  <Link to="/vendor" className="omni-user-link">Vendor Portal →</Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" className="omni-user-link">Admin Panel →</Link>
                )}
                <button className="omni-user-signout" onClick={handleLogout}>Sign Out</button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="omni-btn-ghost">Sign In</Link>
              <Link to="/signup" className="omni-btn-solid">Join Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
