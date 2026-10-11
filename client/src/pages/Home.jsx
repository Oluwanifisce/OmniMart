// Home page — editorial redesign inspired by reference UI
import { useState, useEffect, useRef } from 'react'
import { Offcanvas } from 'react-bootstrap'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import ProductCard from '../components/ProductCard'

const DEFAULT_CATEGORIES = [
  'Apparel', 'Electronics', 'Computers',
  'Accessories', 'Home & Living', 'Beauty & Cosmetics', 'Sports & Outdoors', 'General',
]

const SUBCATEGORIES_MAP = {
  Apparel:             ['Clothing', 'Bags & Luggage', 'Shoes', 'Watches & Accessories'],
  Electronics:         ['Headphones & Speakers', 'Smartphones & Tablets', 'Gadgets & Wearables'],
  Computers:           ['Laptops', 'Desktops', 'Monitors & Displays', 'Peripherals'],
  Accessories:         ['Jewelry', 'Sunglasses', 'Belts & Wallets'],
  'Home & Living':     ['Kitchenware', 'Decor & Furniture', 'Lighting'],
  'Beauty & Cosmetics':['Skincare', 'Makeup', 'Haircare', 'Fragrances & Perfumes', 'Nail Care'],
  'Sports & Outdoors': ['Fitness & Gym', 'Outdoor Gear', 'Athletic Wear', 'Sports Equipment'],
}

// Category tile config — gradient background + Bootstrap Icon class
const CAT_TILES = [
  { label: 'Apparel',            icon: 'bi-handbag',          bg: 'linear-gradient(135deg,#FDE68A,#FCD34D)' },
  { label: 'Electronics',        icon: 'bi-lightning-charge', bg: 'linear-gradient(135deg,#A5F3FC,#67E8F9)' },
  { label: 'Home & Living',      icon: 'bi-house-door',       bg: 'linear-gradient(135deg,#BBF7D0,#6EE7B7)' },
  { label: 'Beauty & Cosmetics', icon: 'bi-sparkles',         bg: 'linear-gradient(135deg,#FBCFE8,#F9A8D4)' },
  { label: 'Computers',          icon: 'bi-laptop',           bg: 'linear-gradient(135deg,#C7D2FE,#A5B4FC)' },
  { label: 'Accessories',        icon: 'bi-gem',              bg: 'linear-gradient(135deg,#E9D5FF,#C084FC)' },
  { label: 'Sports & Outdoors',  icon: 'bi-trophy',           bg: 'linear-gradient(135deg,#FED7AA,#F97316)' },
  { label: 'General',            icon: 'bi-grid',             bg: 'linear-gradient(135deg,#BAE6FD,#7DD3FC)' },
]

// Hero product carousel slides — image background slider
const HERO_PRODUCTS = [
  {
    headline: 'Tech That Inspires',
    sub: 'Top electronics and gadgets curated from our verified vendor network.',
    cta: 'Shop Electronics',
    cat: 'Electronics',
    link: '/shop?category=Electronics',
    badge: '✨ TECH & INNOVATION',
    eyebrow: 'Verified Vendor Network',
    image: '/images/hero-tech.jpg'
  },
  {
    headline: 'New Season Fashion Is Here',
    sub: 'Discover the latest apparel collections from independent fashion brands.',
    cta: 'Shop Apparel',
    cat: 'Apparel',
    link: '/shop?category=Apparel',
    badge: '✨ NEW SEASON FASHION',
    eyebrow: 'Independent Brands',
    image: '/images/hero-fashion.jpg'
  },
  {
    headline: 'Shop From Verified Vendors',
    sub: 'Thousands of curated products from trusted independent sellers — delivered to your door.',
    cta: 'Explore Now',
    cat: '',
    link: '/shop',
    badge: '✨ MULTI-VENDOR MARKETPLACE',
    eyebrow: 'Verified Vendors',
    image: '/images/hero-vendors.jpg'
  }
]

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const productsRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')
  const [userCategory, setUserCategory] = useState('')
  const [selectedSubcat, setSelectedSubcat] = useState('')
  const [categories, setCategories]     = useState(DEFAULT_CATEGORIES)
  const [sort, setSort]                 = useState('')
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const [cartItems, setCartItems]       = useState([])
  const [showCart, setShowCart]         = useState(() => searchParams.get('openCart') === 'true')
  const [heroIdx, setHeroIdx]           = useState(0)
  const isLoggedIn = !!localStorage.getItem('token')

  const category = searchParams.get('category') !== null
    ? searchParams.get('category')
    : userCategory

  const handleCategoryChange = (newCat) => {
    setProducts([])
    setUserCategory(newCat)
    setSelectedSubcat('')
    setSort('')
    setPage(1)
    if (newCat) setSearchParams({ category: newCat })
    else        setSearchParams({})
  }

  // Smooth scroll to catalog view on category or search parameter change
  useEffect(() => {
    if (category || searchParams.get('category') || searchParams.get('sort')) {
      const targetElement = document.getElementById('catalog-view') || productsRef.current
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [category, searchParams])

  // Cycle hero slides every 5s
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_PRODUCTS.length), 5000)
    return () => clearInterval(t)
  }, [])

  // Open cart from event
  useEffect(() => {
    const h = () => setShowCart(true)
    window.addEventListener('openCart', h)
    return () => window.removeEventListener('openCart', h)
  }, [])

  // Map DummyJSON products to standard OmniMart model
  const mapDummyProduct = (item) => {
    let cat = 'General'
    const c = (item.category || '').toLowerCase()
    if (c.includes('shirt') || c.includes('dress') || c.includes('top') || c.includes('shoe') || c.includes('apparel') || c.includes('fashion') || c.includes('clot')) {
      cat = 'Apparel'
    } else if (c.includes('phone') || c.includes('tablet') || c.includes('electric') || c.includes('gadget') || c.includes('audio') || c.includes('headphone') || c.includes('speaker') || c.includes('mobile-accessories')) {
      cat = 'Electronics'
    } else if (c.includes('laptop') || c.includes('computer') || c.includes('desktop')) {
      cat = 'Computers'
    } else if (c.includes('watch') || c.includes('sunglasses') || c.includes('jewel') || c.includes('bag') || c.includes('access')) {
      cat = 'Accessories'
    } else if (c.includes('furniture') || c.includes('home') || c.includes('decor') || c.includes('kitchen')) {
      cat = 'Home & Living'
    } else if (c.includes('beauty') || c.includes('skin') || c.includes('fragrance') || c.includes('cosmetic')) {
      cat = 'Beauty & Cosmetics'
    } else if (c.includes('sport') || c.includes('outdoor') || c.includes('fitness') || c.includes('bicycle')) {
      cat = 'Sports & Outdoors'
    }

    return {
      _id: `dummy-${item.id}`,
      id: `dummy-${item.id}`,
      title: item.title,
      name: item.title,
      description: item.description,
      price: item.price,
      rating: item.rating || 4.5,
      averageRating: item.rating || 4.5,
      category: cat,
      categories: [cat],
      images: item.images && item.images.length > 0 ? item.images : [item.thumbnail],
      thumbnail: item.thumbnail,
      vendor: { storeName: 'Verified Partner Store', isVerified: true },
      isDummy: true,
      createdAt: new Date(Date.now() - (item.id || 1) * 86400000).toISOString()
    }
  }

  // Load products (Hybrid MongoDB + DummyJSON Engine)
  useEffect(() => {
    const makeRequest = async () => {
      try {
        setLoading(true)
        const currentSort = searchParams.get('sort') || sort
        const isNewest = currentSort === 'newest'
        const activeCategory = category || userCategory

        // 1. Fetch Local MongoDB database products
        let localMongoDBProducts = []
        try {
          const res = await api.get('/products', { params: { limit: 100 } })
          localMongoDBProducts = res.data.products || res.data.data || []
        } catch (e) {
          console.error('Local products fetch error:', e)
        }

        let combinedCatalog = []

        if (isNewest) {
          // New Arrivals mode: filter local products to match selection and showcase ONLY local MongoDB products sorted newest first
          const filteredLocal = activeCategory
            ? localMongoDBProducts.filter(p => (p.category || '').toLowerCase() === activeCategory.toLowerCase())
            : localMongoDBProducts
          combinedCatalog = [...filteredLocal].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        } else {
          // Filter local products to ensure they only match the active category selection
          const filteredLocalProducts = activeCategory
            ? localMongoDBProducts.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase() || (Array.isArray(p.categories) && p.categories.some(c => c.toLowerCase() === activeCategory.toLowerCase())))
            : localMongoDBProducts

          // Hybrid mode: fetch 50 testing items from public DummyJSON endpoint
          let dummyJsonProducts = []
          try {
            const dummyRes = await fetch('https://dummyjson.com/products?limit=50')
            if (dummyRes.ok) {
              const dummyData = await dummyRes.json()
              dummyJsonProducts = (dummyData.products || []).map(mapDummyProduct)
            }
          } catch (e) {
            console.error('DummyJSON fetch error:', e)
          }

          // Apply Category Filter to dummy products
          if (activeCategory) {
            const catLower = activeCategory.toLowerCase()
            dummyJsonProducts = dummyJsonProducts.filter(p => (p.category || '').toLowerCase() === catLower)
          }

          // Compile master catalog ensuring local items stay pinned right at the top
          combinedCatalog = [...filteredLocalProducts, ...dummyJsonProducts]

          // Apply Search Filter
          const activeSearch = selectedSubcat || search
          if (activeSearch) {
            const sLower = activeSearch.toLowerCase()
            combinedCatalog = combinedCatalog.filter(p =>
              (p.title || p.name || '').toLowerCase().includes(sLower) ||
              (p.description || '').toLowerCase().includes(sLower)
            )
          }

          // Apply Sorting
          if (currentSort === 'price_asc') {
            combinedCatalog.sort((a, b) => (a.price || 0) - (b.price || 0))
          } else if (currentSort === 'price_desc') {
            combinedCatalog.sort((a, b) => (b.price || 0) - (a.price || 0))
          } else if (currentSort === 'rating') {
            combinedCatalog.sort((a, b) => (b.averageRating || b.rating || 0) - (a.averageRating || a.rating || 0))
          }
        }

        // Pagination calculations
        const pageSize = 12
        const totalItems = combinedCatalog.length
        setTotalPages(Math.max(1, Math.ceil(totalItems / pageSize)))

        const start = (page - 1) * pageSize
        setProducts(combinedCatalog.slice(start, start + pageSize))
      } catch (e) {
        console.error('Data loading error:', e)
      } finally {
        setLoading(false)
      }
    }
    makeRequest()
  }, [page, category, userCategory, sort, search, selectedSubcat, searchParams])

  // Load categories
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/products/categories/all')
        const fetched = res.data.categories || res.data.data || []
        setCategories([...new Set([...DEFAULT_CATEGORIES, ...fetched].filter(Boolean))])
      } catch {
        try {
          const res = await api.get('/products', { params: { limit: 200 } })
          const prods = res.data.products || res.data.data || []
          const cats = [...new Set(
            prods.flatMap(p =>
              Array.isArray(p.categories) && p.categories.length > 0
                ? p.categories
                : p.category ? [p.category] : []
            ).filter(Boolean)
          )]
          setCategories([...new Set([...DEFAULT_CATEGORIES, ...cats])])
        } catch { /* silent */ }
      }
    }
    load()
  }, [])

  // Load cart
  useEffect(() => {
    const loadCart = async () => {
      if (!isLoggedIn) {
        try { setCartItems(JSON.parse(localStorage.getItem('cartItems') || '[]')) }
        catch { setCartItems([]) }
        return
      }
      try {
        const res = await api.get('/cart')
        const items = res.data.cart?.items || res.data.data?.items || []
        setCartItems(items)
        localStorage.setItem('cartCount', items.reduce((s, i) => s + i.quantity, 0).toString())
      } catch { /* silent */ }
    }
    loadCart()
  }, [isLoggedIn])

  const pendingCartUpdatesRef = useRef({})
  const cartDebounceRef       = useRef(null)

  const debouncedSyncBackend = (prodId, targetQty) => {
    pendingCartUpdatesRef.current[prodId] = targetQty
    if (cartDebounceRef.current) clearTimeout(cartDebounceRef.current)
    cartDebounceRef.current = setTimeout(async () => {
      const pending = { ...pendingCartUpdatesRef.current }
      pendingCartUpdatesRef.current = {}
      for (const [id, qty] of Object.entries(pending)) {
        try {
          if (qty <= 0) await api.delete(`/cart/items/${id}`)
          else          await api.put(`/cart/items/${id}`, { quantity: qty })
        } catch (e) { console.error(e) }
      }
    }, 300)
  }

  const handleAddToCart = (product) => {
    if (user && user.role === 'vendor') {
      alert("Vendor profiles are restricted to store management only. Please create a separate Buyer/Customer account to purchase items!");
      return;
    }
    const prodId = product._id
    setCartItems(prev => {
      const idx = prev.findIndex(i => (i.product?._id || i.product || i.productId) === prodId)
      const updated = idx >= 0
        ? prev.map((item, i) => i === idx ? { ...item, quantity: item.quantity + 1 } : item)
        : [...prev, { product, quantity: 1, productId: prodId }]
      const total = updated.reduce((s, i) => s + i.quantity, 0)
      localStorage.setItem('cartCount', total.toString())
      if (!isLoggedIn) localStorage.setItem('cartItems', JSON.stringify(updated))
      return updated
    })
    setShowCart(true)
    if (isLoggedIn) api.post('/cart', { productId: prodId, quantity: 1 }).catch(() => {})
  }

  const handleUpdateQuantity = (product, newQty) => {
    const prodId  = product._id
    const target  = Math.max(0, newQty)
    setCartItems(prev => {
      const updated = target <= 0
        ? prev.filter(i => (i.product?._id || i.product || i.productId) !== prodId)
        : prev.map(i => (i.product?._id || i.product || i.productId) === prodId ? { ...i, quantity: target } : i)
      const total = updated.reduce((s, i) => s + i.quantity, 0)
      localStorage.setItem('cartCount', total.toString())
      if (!isLoggedIn) localStorage.setItem('cartItems', JSON.stringify(updated))
      return updated
    })
    if (isLoggedIn) debouncedSyncBackend(prodId, target)
  }

  const cartTotal = cartItems.reduce((s, i) => s + (i.product?.price || 0) * i.quantity, 0)

  const handleCheckout = () => {
    setShowCart(false)
    navigate(isLoggedIn ? '/checkout' : '/login?redirect=checkout')
  }

  const doSearch = (e) => {
    e.preventDefault()
    setPage(1)
  }

  const hero = HERO_PRODUCTS[heroIdx]

  return (
    <div>

      {/* ══════════════════════════════════════════════
          HERO — Automatic Fading Image Carousel Slider
      ══════════════════════════════════════════════ */}
      <div id="heroCarousel" className="carousel slide carousel-fade mb-5" data-bs-ride="carousel" data-bs-interval="4000" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="carousel-inner">
          {HERO_PRODUCTS.map((slide, index) => {
            const isActive = index === heroIdx
            return (
              <div
                key={index}
                className={`carousel-item hero-carousel-item ${isActive ? 'active' : ''}`}
                style={{
                  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.55)), url(${slide.image})`,
                  display: isActive ? 'flex' : 'none',
                  transition: 'opacity 0.8s ease-in-out'
                }}
              >
                <div className="container text-center text-white py-5" style={{ maxWidth: '800px', zIndex: 2 }}>
                  <span className="badge bg-white text-dark px-3 py-2 rounded-pill mb-3 shadow-sm" style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {slide.badge}
                  </span>
                  <p className="text-uppercase fw-bold text-light mb-2" style={{ letterSpacing: '.14em', fontSize: '12px', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    {slide.eyebrow}
                  </p>
                  <h1 className="display-4 fw-bold text-white mb-3" style={{ fontFamily: 'var(--font-serif)', lineHeight: 1.15, textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
                    {slide.headline}
                  </h1>
                  <p className="lead text-white-50 mx-auto mb-4" style={{ maxWidth: '620px', fontSize: '1.1rem', lineHeight: 1.6, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                    {slide.sub}
                  </p>
                  <div className="d-flex align-items-center justify-content-center">
                    <Link
                      to={slide.link}
                      className="hero-cta text-decoration-none"
                      style={{
                        padding: '13px 28px',
                        background: '#10B981',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 700,
                        borderRadius: '30px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                        transition: 'all .2s ease'
                      }}
                      onClick={() => {
                        if (slide.cat) handleCategoryChange(slide.cat)
                      }}
                    >
                      {slide.cta} →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Carousel Indicators / Slide Dots */}
        <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
          {HERO_PRODUCTS.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                width: i === heroIdx ? '28px' : '8px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: i === heroIdx ? '#10B981' : 'rgba(255, 255, 255, 0.6)',
                transition: 'all .3s ease',
                padding: 0
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 28px' }}>

        {/* ══════════════════════════════════════════════
            CATEGORY TILES
        ══════════════════════════════════════════════ */}
        <section className="cat-section">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <button className="section-link" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              onClick={() => handleCategoryChange('')}>
              View All →
            </button>
          </div>
          <div className="cat-grid">
            {CAT_TILES.map(c => (
              <div key={c.label} className="cat-tile"
                onClick={() => handleCategoryChange(c.label)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && handleCategoryChange(c.label)}>
                <div className="cat-tile-bg" style={{ background: c.bg }}>
                  <i className={`bi ${c.icon}`}
                    style={{ fontSize: '2.2rem', color: 'rgba(15,23,42,0.75)', lineHeight: 1 }} />
                </div>
                <div className="cat-tile-label">{c.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PRODUCTS — filters + grid
        ══════════════════════════════════════════════ */}
        {/* Scroll anchor — hero CTA targets this */}
        <div ref={productsRef} style={{ scrollMarginTop: '80px' }} />
        <section className="products-section" id="catalog-view" style={{ scrollMarginTop: '80px' }}>
          <div className="section-header">
            <h2 className="section-title">
              {category ? category : search ? `"${search}"` : 'New Collections'}
            </h2>
            {/* Cart open button */}
            <button onClick={() => setShowCart(true)}
              style={{ background: 'none', border: '1.5px solid #E2E8F0', borderRadius: '8px',
                padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                color: '#334155', transition: 'border-color .15s' }}>
              🛒 Cart {cartItems.length > 0 && <span style={{ background: '#10B981', color: '#fff',
                borderRadius: '10px', padding: '1px 7px', fontSize: '11px' }}>{cartItems.length}</span>}
            </button>
          </div>

          {/* ── Filters bar ── */}
          <div className="filters-bar">
            <form onSubmit={doSearch} style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '160px' }}>
              <input
                type="text"
                className="filter-input"
                placeholder="Search products…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button type="submit" className="omni-btn-solid"
                style={{ padding: '9px 18px', borderRadius: '8px', fontSize: '13px',
                  fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                Search
              </button>
            </form>
            <select className="filter-select" value={category}
              onChange={e => handleCategoryChange(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={sort}
              onChange={e => { setSort(e.target.value); setPage(1) }}>
              <option value="">Sort: Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
            <button className="filter-clear" onClick={() => { setSearch(''); handleCategoryChange(''); setSort('') }}>
              Clear
            </button>
          </div>

          {/* ── Category pills ── */}
          <div className="cat-pills">
            <button className={`cat-pill ${!category ? 'active' : ''}`} onClick={() => handleCategoryChange('')}>All</button>
            {categories.map(c => (
              <button key={c} className={`cat-pill ${category === c ? 'active' : ''}`}
                onClick={() => handleCategoryChange(c)}>
                {c}
              </button>
            ))}
          </div>

          {/* ── Subcategory row ── */}
          {category && SUBCATEGORIES_MAP[category] && (
            <div className="subcat-row">
              <span className="subcat-label">In {category}:</span>
              <button className={`subcat-pill ${!selectedSubcat ? 'active' : ''}`}
                onClick={() => { setSelectedSubcat(''); setPage(1) }}>
                All {category}
              </button>
              {SUBCATEGORIES_MAP[category].map(sub => (
                <button key={sub} className={`subcat-pill ${selectedSubcat === sub ? 'active' : ''}`}
                  onClick={() => { setSelectedSubcat(sub); setPage(1) }}>
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* ── Product grid ── */}
          {loading ? (
            <div className="row g-3">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="col-6 col-md-4 col-lg-3">
                  <div className="skeleton" style={{ height: '320px', borderRadius: '14px' }} />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-box-seam text-muted display-1 mb-3 d-block"></i>
              <h4 style={{ fontSize: '18px', fontWeight: 700, marginTop: '12px', color: '#0F172A' }}>No Products Found</h4>
              <p className="text-muted" style={{ maxWidth: '460px', margin: '0 auto 16px', fontSize: '14px' }}>
                There are currently no items available in this category. Check back later or adjust your filters.
              </p>
              <button onClick={() => { setSearch(''); handleCategoryChange(''); setSort('') }} className="btn btn-outline-dark rounded-pill mt-2">
                View All Products
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {products.map(product => {
                const inCartItem  = cartItems.find(i => (i.product?._id || i.product || i.productId) === product._id)
                const inCartCount = inCartItem ? inCartItem.quantity : 0
                return (
                  <div key={product._id} className="col-6 col-md-4 col-lg-3">
                    <ProductCard
                      product={product}
                      inCartCount={inCartCount}
                      onAddToCart={handleAddToCart}
                    />
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="omni-pagination">
              <button className="omni-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              {[...Array(totalPages)].map((_, i) => (
                <button key={i} className={`omni-page-btn ${page === i+1 ? 'active' : ''}`}
                  onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button className="omni-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </section>



      </div>

      {/* ══════════════════════════════════════════════
          CART OFF-CANVAS
      ══════════════════════════════════════════════ */}
      <Offcanvas show={showCart} onHide={() => setShowCart(false)} placement="end">
        <Offcanvas.Header closeButton style={{ borderBottom: '1px solid #E2E8F0', padding: '18px 20px' }}>
          <Offcanvas.Title style={{ fontWeight: 700, fontSize: '17px' }}>
            Your Cart {cartItems.length > 0 && <span style={{ fontSize: '13px', fontWeight: 600, color: '#10B981' }}>({cartItems.length} items)</span>}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ padding: '0 20px 20px' }}>
          {cartItems.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ fontSize: '48px', opacity: .2 }}>🛒</div>
              <p style={{ fontSize: '14px', color: '#64748B', marginTop: '14px' }}>Your cart is empty</p>
              <button className="omni-btn-solid" style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
                onClick={() => setShowCart(false)}>
                Start Shopping
              </button>
            </div>
          ) : (
            <>
              {cartItems.map((item, idx) => {
                const prod  = item.product || {}
                const title = prod.title || prod.name || 'Product'
                const price = prod.price || 0
                return (
                  <div key={idx} className="d-flex gap-3 align-items-center py-3"
                    style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <div style={{ width: '56px', height: '56px', background: '#F8FAFC',
                      border: '1px solid #E2E8F0', borderRadius: '10px', overflow: 'hidden', flexShrink: 0 }}>
                      {prod.images?.[0]
                        ? <img src={prod.images[0]} style={{ width:'100%',height:'100%',objectFit:'contain',padding:'4px' }} alt={title} />
                        : <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:'20px' }}>📦</div>}
                    </div>
                    <div className="flex-grow-1">
                      <div style={{ fontSize:'13px',fontWeight:600,lineHeight:1.3 }}>{title.slice(0,34)}</div>
                      <div style={{ color:'#10B981',fontWeight:800,fontSize:'14px',marginTop:'2px' }}>
                        ₦{Number(price * item.quantity).toLocaleString('en-NG')}
                      </div>
                      <div className="d-flex align-items-center gap-2 mt-2">
                        <button style={{ width:28,height:28,borderRadius:'6px',border:'1.5px solid #E2E8F0',
                          background:'#fff',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center' }}
                          onClick={() => handleUpdateQuantity(prod, item.quantity - 1)}>−</button>
                        <span style={{ fontSize:'13px',fontWeight:700,minWidth:'20px',textAlign:'center' }}>{item.quantity}</span>
                        <button style={{ width:28,height:28,borderRadius:'6px',border:'1.5px solid #E2E8F0',
                          background:'#fff',cursor:'pointer',fontSize:'14px',display:'flex',alignItems:'center',justifyContent:'center' }}
                          onClick={() => handleUpdateQuantity(prod, item.quantity + 1)}>+</button>
                        <button style={{ marginLeft:'auto',background:'none',border:'none',cursor:'pointer',fontSize:'16px',opacity:.5 }}
                          onClick={() => handleUpdateQuantity(prod, 0)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="d-flex justify-content-between mt-4"
                style={{ fontWeight:700,fontSize:'16px',borderTop:'2px solid #0F172A',paddingTop:'16px' }}>
                <span>Total</span>
                <span style={{ color:'#10B981' }}>₦{Number(cartTotal).toLocaleString('en-NG')}</span>
              </div>

              <button className="add-cart-btn" style={{ marginTop:'16px',padding:'13px' }} onClick={handleCheckout}>
                Proceed to Checkout →
              </button>
              <button style={{ width:'100%',marginTop:'8px',padding:'11px',background:'none',
                border:'1.5px solid #E2E8F0',borderRadius:'8px',fontSize:'13px',fontWeight:600,
                cursor:'pointer',fontFamily:'inherit',color:'#64748B',transition:'all .15s' }}
                onClick={async () => {
                  try {
                    if (isLoggedIn) await api.delete('/cart')
                    else localStorage.removeItem('cartItems')
                    setCartItems([])
                    localStorage.setItem('cartCount','0')
                  } catch { /* silent */ }
                }}>
                Clear Cart
              </button>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  )
}

export default Home
