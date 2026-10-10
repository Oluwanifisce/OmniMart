import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProfilePage = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    firstname: user?.firstname || '',
    lastname: user?.lastname || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  
  const [showToast, setShowToast] = useState(false)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleUpdate = (e) => {
    e.preventDefault()
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  return (
    <>
      {showToast && (
        <div className="alert alert-success position-fixed top-0 start-50 translate-middle-x m-3 shadow" style={{ zIndex: 9999 }}>
          <i className="bi bi-check-circle-fill me-2"></i> Profile Updated Successfully!
        </div>
      )}

      <div className="container py-5">
        {/* Header Summary */}
        <div className="mb-4">
          <h2 className="fw-bold mb-2">Welcome Back, {user?.firstname}!</h2>
          <div className="d-flex align-items-center gap-3">
            <span className="text-muted small">
              <i className="bi bi-cart me-1"></i>Active Cart Status: Good
            </span>
          </div>
        </div>

        <div className="row">
          {/* Navigation Sidebar (3-column) */}
          <div className="col-md-3 mb-4 mb-md-0">
            <div className="list-group shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
              <button 
                className={`list-group-item list-group-item-action py-3 fw-medium ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
                style={activeTab === 'profile' ? { backgroundColor: '#0F172A', borderColor: '#0F172A' } : {}}
              >
                Personal Profile
              </button>
              <button 
                className={`list-group-item list-group-item-action py-3 fw-medium ${activeTab === 'address' ? 'active' : ''}`}
                onClick={() => setActiveTab('address')}
                style={activeTab === 'address' ? { backgroundColor: '#0F172A', borderColor: '#0F172A' } : {}}
              >
                Saved Addresses
              </button>
            </div>
          </div>

          {/* Content Section (9-column) */}
          <div className="col-md-9">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-body p-4 p-lg-5">
                
                {activeTab === 'profile' && (
                  <div>
                    <h4 className="fw-bold mb-4">Personal Profile</h4>
                    <form onSubmit={handleUpdate}>
                      <div className="row g-3 mb-3">
                        <div className="col-sm-6">
                          <label className="form-label text-muted small fw-semibold">First Name</label>
                          <input type="text" className="form-control form-control-lg" name="firstname" value={formData.firstname} onChange={handleChange} required />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small fw-semibold">Last Name</label>
                          <input type="text" className="form-control form-control-lg" name="lastname" value={formData.lastname} onChange={handleChange} required />
                        </div>
                      </div>
                      <div className="row g-3 mb-4">
                        <div className="col-sm-6">
                          <label className="form-label text-muted small fw-semibold">Email Address</label>
                          <input type="email" className="form-control form-control-lg" name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="col-sm-6">
                          <label className="form-label text-muted small fw-semibold">Phone Number</label>
                          <input type="text" className="form-control form-control-lg" name="phone" value={formData.phone} onChange={handleChange} placeholder="+1 555-0199" />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-lg w-100 fw-bold" style={{ backgroundColor: '#10B981', color: '#fff', border: 'none' }}>
                        Update Details
                      </button>
                    </form>
                  </div>
                )}

                {activeTab === 'address' && (
                  <div>
                    <h4 className="fw-bold mb-4">Saved Addresses</h4>
                    <div className="card border p-4 mb-3" style={{ borderRadius: '10px' }}>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-secondary mb-2">Default Shipping</span>
                        <button className="btn btn-sm btn-outline-dark fw-medium">Edit</button>
                      </div>
                      <h6 className="fw-bold mb-1">{user?.firstname} {user?.lastname}</h6>
                      <p className="text-muted mb-0">
                        1234 Commerce Street<br/>
                        Suite 500<br/>
                        New York, NY 10001<br/>
                        United States
                      </p>
                    </div>
                    <button className="btn btn-outline-secondary fw-bold w-100">+ Add New Address</button>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProfilePage
