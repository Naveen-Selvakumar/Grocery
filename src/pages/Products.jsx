import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { getProducts, getCategories } from '../services/api'
import ProductCard from '../components/ProductCard'
import { ProductCardSkeleton } from '../components/Loader'
import '../styles/product.css'

const SORT_OPTIONS = [
  { value: '', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
]

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const searchQ = searchParams.get('search') || ''
  const categoryQ = searchParams.get('category') || ''
  const sortQ = searchParams.get('sort') || ''
  const pageQ = parseInt(searchParams.get('page') || '1')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || 5000)

  const fetchProducts = useCallback(() => {
    setLoading(true)
    const params = { page: pageQ, limit: 12 }
    if (searchQ) params.search = searchQ
    if (categoryQ) params.category = categoryQ
    if (sortQ) params.sort = sortQ
    if (maxPrice && maxPrice < 5000) params.maxPrice = maxPrice

    getProducts(params)
      .then(({ data }) => {
        setProducts(data.data || [])
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 })
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [searchQ, categoryQ, sortQ, pageQ, maxPrice])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.data || [])).catch(() => {})
  }, [])

  const updateParam = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page')
    setSearchParams(p)
  }

  const goPage = (pg) => {
    const p = new URLSearchParams(searchParams)
    p.set('page', pg)
    setSearchParams(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => setSearchParams({})

  const hasFilters = searchQ || categoryQ || sortQ

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Home</a><span className="breadcrumb-sep">/</span>
            <span>Products</span>
          </div>
          <h1>All Products</h1>
          <p>{pagination.total > 0 ? `${pagination.total} products found` : 'Browse our complete collection'}</p>
        </div>
      </div>

      <div className="container">
        <div className="products-page-layout">
          {/* ── Sidebar Filters ──────────────────────────────────── */}
          <aside className="filter-sidebar">
            <div className="filter-title">
              <span><Icon name="filter_list" size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Filters</span>
              {hasFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters} style={{ padding: '4px 8px', fontSize: '0.78rem', color: 'var(--primary)' }}><Icon name="close" size={12} /> Clear</button>}
            </div>

            {/* Search */}
            <div className="filter-section">
              <div className="filter-section-label">Search</div>
              <input className="form-control" placeholder="Search products..." defaultValue={searchQ}
                onKeyDown={(e) => { if (e.key === 'Enter') updateParam('search', e.target.value) }}
                onBlur={(e) => updateParam('search', e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="filter-section">
              <div className="filter-section-label">Category</div>
              <label className="filter-option">
                <input type="radio" name="category" checked={!categoryQ} onChange={() => updateParam('category', '')} />
                All Categories
              </label>
              {categories.map((cat) => (
                <label key={cat._id} className="filter-option">
                  <input type="radio" name="category" value={cat.slug}
                    checked={categoryQ === cat.slug}
                    onChange={() => updateParam('category', cat.slug)}
                  />
                  {cat.name}
                </label>
              ))}
            </div>

            {/* Price Range */}
            <div className="filter-section">
              <div className="filter-section-label">Max Price</div>
              <div className="price-range">
                <input type="range" min={0} max={5000} step={50} value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  onMouseUp={(e) => updateParam('maxPrice', e.target.value < 5000 ? e.target.value : '')}
                  onTouchEnd={(e) => updateParam('maxPrice', e.target.value < 5000 ? e.target.value : '')}
                />
                <div className="price-labels">
                  <span>₹0</span><span style={{ color: 'var(--primary)', fontWeight: 600 }}>₹{maxPrice}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Products Grid ────────────────────────────────────── */}
          <div>
            {/* Topbar */}
            <div className="products-topbar">
              <div className="products-count">
                {loading ? 'Loading...' : `${pagination.total} Products`}
                {searchQ && <span style={{ color: 'var(--primary)', marginLeft: 6 }}>for "{searchQ}"</span>}
              </div>
              <div className="sort-control">
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sort by:</span>
                <select value={sortQ} onChange={(e) => updateParam('sort', e.target.value)}>
                  {SORT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="products-grid">
              {loading
                ? Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                : products.length > 0
                  ? products.map((p) => <ProductCard key={p._id} product={p} />)
                  : (
                    <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                      <div className="empty-icon">🔍</div>
                      <h3>No products found</h3>
                      <p>Try adjusting your filters or search term</p>
                      <button className="btn btn-primary" onClick={clearFilters}>Clear Filters</button>
                    </div>
                  )
              }
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button className="pg-btn" onClick={() => goPage(pageQ - 1)} disabled={pageQ <= 1}>‹</button>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((pg) => pg === 1 || pg === pagination.pages || Math.abs(pg - pageQ) <= 2)
                  .map((pg, idx, arr) => (
                    <>
                      {idx > 0 && arr[idx - 1] !== pg - 1 && <span key={`sep-${pg}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>...</span>}
                      <button key={pg} className={`pg-btn ${pg === pageQ ? 'active' : ''}`} onClick={() => goPage(pg)}>{pg}</button>
                    </>
                  ))}
                <button className="pg-btn" onClick={() => goPage(pageQ + 1)} disabled={pageQ >= pagination.pages}>›</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
