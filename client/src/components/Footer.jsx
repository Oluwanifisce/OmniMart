// Footer.jsx — Modern, responsive 4-column horizontal e-commerce footer
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Footer = () => {
  const { isLoggedIn, user } = useAuth()
  const location = useLocation()

  // Hide footer on distraction-free checkout page
  if (location.pathname === '/checkout') return null

  return (
    <footer className="site-footer">
      <div className="footer-inner">

        {/* ── Newsletter Banner ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          alignItems: 'center',
          padding: '48px 0',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
              color: '#10B981', marginBottom: '10px' }}>Stay Updated</p>
            <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.8rem',
              fontWeight: 700, color: '#fff', margin: '0 0 10px' }}>
              Get the Best Deals First
            </h3>
            <p style={{ fontSize: '14px', color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>
              Subscribe and be the first to know about new arrivals, exclusive offers, and verified vendor drops.
            </p>
          </div>
          <form onSubmit={e => e.preventDefault()}
            style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input type="email" placeholder="Your email address"
              style={{ flex: 1, minWidth: '180px', padding: '12px 18px', borderRadius: '8px',
                border: '1.5px solid #334155', background: 'rgba(255,255,255,0.07)', color: '#fff',
                fontSize: '13.5px', fontFamily: 'inherit', outline: 'none' }} />
            <button type="submit"
              style={{ padding: '12px 24px', background: '#10B981', color: '#fff', border: 'none',
                borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background .18s' }}>
              Subscribe →
            </button>
          </form>
        </div>

        <hr className="text-muted opacity-25 my-4" />

        {/* 4-Column Horizontal Layout Container */}
        <div className="footer-links-container">

          {/* Column 1: Get to Know Us — About OmniMart */}
          <div className="footer-column">
            <h4 className="footer-title">About OmniMart</h4>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.7, marginBottom: '12px' }}>
              OmniMart is a premier multi-vendor marketplace built to empower independent vendors
              and deliver buyers a world-class shopping experience — all in one place.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                '✓ Verified & trusted vendors',
                '✓ Secure checkout & payments',
                '✓ Thousands of curated products',
                '✓ Buyer protection guarantee',
              ].map(point => (
                <li key={point} style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '5px' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Shop & Categories */}
          <div className="footer-column">
            <h4 className="footer-title">Shop &amp; Categories</h4>
            <ul className="footer-list">
              <li><Link to="/?category=Apparel">Apparel</Link></li>
              <li><Link to="/?category=Electronics">Electronics</Link></li>
              <li><Link to="/?category=Home+Goods">Home Goods</Link></li>
              <li><Link to="/?sort=newest">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Column 3: Customer Support */}
          <div className="footer-column">
            <h4 className="footer-title">Customer Support</h4>
            <ul className="footer-list">
              <li><Link to="/support/track-order">Track Order</Link></li>
              <li><Link to="/support/shipping">Shipping &amp; Delivery</Link></li>
              <li><Link to="/support/returns">Returns &amp; Replacements</Link></li>
              <li><Link to="/support/help">Help Center</Link></li>
            </ul>
          </div>

          {/* Column 4: Account / Quick Links */}
          <div className="footer-column">
            <h4 className="footer-title">
              {isLoggedIn ? 'Your Account' : 'Quick Links'}
            </h4>
            <ul className="footer-list">
              {isLoggedIn ? (
                <>
                  <li><Link to={user?.role === 'vendor' ? '/vendor' : user?.role === 'admin' ? '/admin' : '/'}>Profile</Link></li>
                  <li><Link to="/support/track-order">Order History</Link></li>
                  <li><Link to="/">Wishlist</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/register">Create an Account</Link></li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Copyright & Socials Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-bottom-left">
            <Link to="/" className="footer-brand-logo">
              Omni<span className="brand-accent">Mart</span>
            </Link>
            <span className="footer-copyright-text">
              &copy; {new Date().getFullYear()} OmniMart Inc. All rights reserved.
            </span>
          </div>

          <div className="footer-bottom-right">
            <nav className="footer-legal-links" aria-label="Legal terms">
              <Link to="/privacy">Privacy Policy</Link>
              <span className="legal-dot">&bull;</span>
              <Link to="/terms">Terms of Service</Link>
            </nav>

            <div className="footer-social-icons">
              {/* GitHub */}
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </a>

              {/* LinkedIn */}
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* Twitter / X */}
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer
