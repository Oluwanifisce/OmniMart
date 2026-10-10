// NotFound — same as instructor's Notfound.jsx
import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '24px',
    }}>
      <div style={{ fontSize: '80px', fontWeight: 700, color: '#E2E8F0', lineHeight: 1 }}>
        404
      </div>
      <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '12px' }}>
        Page Not Found
      </h1>
      <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px', maxWidth: '320px' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      {/* Same Link pattern as instructor */}
      <Link to="/" className="btn btn-primary mt-4">← Back to Shop</Link>
    </div>
  )
}

export default NotFound
