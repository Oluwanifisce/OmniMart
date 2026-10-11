import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const AddProduct = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: 'Apparel',
  })
  const [imageFile, setImageFile] = useState(null)

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const handleFileChange = (e) => setImageFile(e.target.files[0])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ show: false, message: '', type: '' })

    try {
      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('price', formData.price)
      payload.append('description', formData.description)
      payload.append('category', formData.category)
      if (imageFile) {
        payload.append('image', imageFile)
      }

      const res = await api.post('/products/create', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      if (res.data) {
        setAlert({ show: true, message: 'Product created successfully! It is now live in your catalog.', type: 'success' })
        setFormData({ title: '', price: '', description: '', category: 'Apparel' })
        setImageFile(null)
        // Reset file input manually
        document.getElementById('productImage').value = ''
      }
    } catch (err) {
      console.error(err)
      setAlert({ 
        show: true, 
        message: err.response?.data?.message || 'Error creating product. Please try again.', 
        type: 'danger' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="d-flex align-items-center justify-content-between mb-4">
            <h2 className="fw-bold mb-0">Upload New Product</h2>
            <button onClick={() => navigate('/vendor')} className="btn btn-outline-secondary fw-medium">
              &larr; Back to Dashboard
            </button>
          </div>

          {alert.show && (
            <div className={`alert alert-${alert.type} alert-dismissible fade show shadow-sm`} role="alert">
              <strong>{alert.type === 'success' ? 'Success!' : 'Error!'}</strong> {alert.message}
              <button type="button" className="btn-close" onClick={() => setAlert({ show: false, message: '', type: '' })}></button>
            </div>
          )}

          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4 p-lg-5">
              <form onSubmit={handleSubmit}>
                
                <div className="mb-4">
                  <label className="form-label fw-bold text-muted small text-uppercase">Product Title</label>
                  <input type="text" className="form-control form-control-lg" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Vintage Leather Jacket" required />
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small text-uppercase">Price (₦)</label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light">₦</span>
                      <input type="number" step="1" min="1" className="form-control" name="price" value={formData.price} onChange={handleChange} placeholder="e.g. 25000" required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold text-muted small text-uppercase">Category</label>
                    <select className="form-select form-select-lg" name="category" value={formData.category} onChange={handleChange} required>
                      <option value="" disabled>Select category</option>
                      <option value="Apparel">Apparel</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Computers">Computers</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Home & Living">Home &amp; Living</option>
                      <option value="Beauty & Cosmetics">Beauty &amp; Cosmetics</option>
                      <option value="Sports & Outdoors">Sports &amp; Outdoors</option>
                      <option value="General">General</option>
                      <option value="Audio">Audio</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-bold text-muted small text-uppercase">Description</label>
                  <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="4" placeholder="Detail the features, material, and highlights of this product..." required></textarea>
                </div>

                <div className="mb-5">
                  <label className="form-label fw-bold text-muted small text-uppercase">Product Image (Cloudinary)</label>
                  <div className="p-4 border rounded bg-light">
                    <input type="file" id="productImage" className="form-control" accept="image/*" onChange={handleFileChange} required />
                    <div className="form-text mt-2">Only .jpg, .jpeg, .png formats allowed.</div>
                  </div>
                </div>

                <button type="submit" className="btn btn-lg w-100 fw-bold shadow-sm" style={{ backgroundColor: '#0F172A', color: '#fff' }} disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Uploading to Cloudinary...</>
                  ) : (
                    'Publish Product'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddProduct
