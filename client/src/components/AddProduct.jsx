import React, { useState } from 'react';
import api from '../api/axios'; // Use our configured axios instance for carrying cross-origin cookies

const AddProduct = () => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    category: '',
  });
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Apparel',
    'Electronics',
    'Computers',
    'Accessories',
    'Home & Living',
    'Beauty & Cosmetics',
    'Sports & Outdoors',
    'General',
    'Audio',
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('category', formData.category);
      if (image) {
        data.append('images', image); // Matches our backend upload.array('images', 5) middleware
      }

      // Dispatch async axios post connection
      const response = await api.post('/products/create', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatus({ type: 'success', message: 'Product created successfully!' });
      // Reset form
      setFormData({ title: '', price: '', description: '', category: '' });
      setImage(null);
      e.target.reset();
    } catch (error) {
      console.error('Upload Error:', error);
      setStatus({ 
        type: 'danger', 
        message: error.response?.data?.message || 'Failed to upload product. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="card shadow-sm border-0" style={{ maxWidth: '600px', margin: '0 auto', borderRadius: '12px' }}>
        <div className="card-header bg-white border-0 pt-4 pb-0">
          <h4 className="fw-bold mb-0 text-dark">Add New Product</h4>
          <p className="text-muted small">Upload a new product to your vendor store</p>
        </div>
        
        <div className="card-body pt-3 pb-4 px-4">
          {status.message && (
            <div className={`alert alert-${status.type} alert-dismissible fade show`} role="alert">
              {status.message}
              <button type="button" className="btn-close" onClick={() => setStatus({type: '', message: ''})} aria-label="Close"></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="title" className="form-label fw-semibold">Product Title</label>
              <input 
                type="text" 
                className="form-control" 
                id="title" 
                name="title" 
                value={formData.title}
                onChange={handleInputChange}
                required 
                placeholder="Enter product title"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="price" className="form-label fw-semibold">Price (₦)</label>
              <input 
                type="number" 
                className="form-control" 
                id="price" 
                name="price" 
                value={formData.price}
                onChange={handleInputChange}
                required 
                min="1" 
                step="1"
                placeholder="e.g. 25000"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="category" className="form-label fw-semibold">Category</label>
              <select 
                className="form-select" 
                id="category" 
                name="category" 
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="description" className="form-label fw-semibold">Description</label>
              <textarea 
                className="form-control" 
                id="description" 
                name="description" 
                rows="4"
                value={formData.description}
                onChange={handleInputChange}
                required
                placeholder="Provide a detailed description of the product"
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="image" className="form-label fw-semibold">Product Image</label>
              <input 
                type="file" 
                className="form-control" 
                id="image" 
                name="image" 
                accept="image/*"
                onChange={handleFileChange}
                required
              />
              <div className="form-text small">Accepted formats: .jpg, .jpeg, .png, .webp</div>
            </div>

            <div className="d-grid">
              <button 
                type="submit" 
                className="btn btn-dark fw-bold py-2" 
                disabled={isSubmitting}
                style={{ borderRadius: '8px' }}
              >
                {isSubmitting ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                ) : null}
                {isSubmitting ? 'Uploading...' : 'Publish Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProduct;
