// ProductCard — redesigned to match editorial UI
const ProductCard = ({ product, inCartCount = 0, onAddToCart, isPreview = false }) => {
  const vendorName = product.vendor?.storeName || product.vendorName || 'Vendor'

  const formatPrice = (n) =>
    `₦${Number(n || 0).toLocaleString('en-NG')}`

  const stars = (avg = 0) => {
    const full  = Math.round(avg)
    const empty = 5 - full
    return '★'.repeat(full) + '☆'.repeat(empty)
  }

  const availableStock = Math.max(0, (product.stock || 0) - inCartCount)
  const isOutOfStock   = availableStock <= 0

  return (
    <div className="product-card">

      {/* Image */}
      <div className="product-img-wrap">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name || product.title} />
        ) : (
          <div className="product-img-placeholder">📦</div>
        )}
        <span className="vendor-chip">{vendorName}</span>
      </div>

      {/* Body */}
      <div className="product-card-body">
        <p className="product-category-tag">
          {Array.isArray(product.categories) && product.categories.length > 0
            ? product.categories[0]
            : (product.category || 'General')}
        </p>
        <h3 className="product-title">
          {product.title || product.name}
        </h3>
        <div className="product-stars">
          {stars(product.averageRating)}
          <span>({product.numReviews || 0})</span>
        </div>

        <div className="product-footer">
          <span className="price-text">{formatPrice(product.price)}</span>
          <span className={`stock-badge ${isOutOfStock ? 'out' : 'in'}`}>
            {isOutOfStock ? 'Out of stock' : `${availableStock} left`}
          </span>
        </div>

        {!isPreview && (
          <button
            className="add-cart-btn"
            disabled={isOutOfStock}
            onClick={() => onAddToCart && onAddToCart(product)}
          >
            {isOutOfStock
              ? (inCartCount > 0 ? 'Max in Cart' : 'Out of Stock')
              : inCartCount > 0
                ? `In Cart (${inCartCount}) — Add More`
                : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard
