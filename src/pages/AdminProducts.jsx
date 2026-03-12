import { useState, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import { getProducts, getCategories, createProduct, updateProduct, deleteProduct } from '../services/api'
import { PageLoader } from '../components/Loader'
import AdminLayout from '../components/AdminLayout'

const INIT = { name: '', description: '', price: '', discount: 0, category: '', brand: '', quantity: '', unit: 'piece', weight: '' }
const UNITS = ['piece', 'kg', 'g', 'litre', 'ml', 'pack', 'dozen']

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const fileRef = useRef(null)

  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(INIT)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const loadProducts = () => {
    setLoading(true)
    getProducts({ page, limit: 10, search: search || undefined })
      .then(({ data }) => { setProducts(data.data || []); setPages(data.pagination?.pages || 1) })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProducts() }, [page, search])
  useEffect(() => { getCategories().then(({ data }) => setCategories(data.data || [])).catch(() => {}) }, [])

  const openAdd = () => { setEditId(null); setForm(INIT); setImageFile(null); setImagePreview(''); setFormError(''); setShowModal(true) }
  const openEdit = (p) => {
    setEditId(p._id)
    setForm({ name: p.name, description: p.description || '', price: p.price, discount: p.discount || 0, category: p.category?._id || p.category || '', brand: p.brand || '', quantity: p.quantity ?? 0, unit: p.unit || 'piece', weight: p.weight || '' })
    setImagePreview(p.image || '')
    setImageFile(null); setFormError(''); setShowModal(true)
  }
  const closeModal = () => setShowModal(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    // Compress image client-side so it never exceeds Vercel's 4.5 MB limit
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1200 // max width/height in px
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl)
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          setImageFile(compressed)
          setImagePreview(URL.createObjectURL(compressed))
        },
        'image/jpeg',
        0.82, // 82% quality — good balance of size vs clarity
      )
    }
    img.src = objectUrl
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name || !form.price || !form.category || form.quantity === '') { setFormError('Name, price, category and stock are required'); return }
    setSaving(true); setFormError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== undefined) fd.append(k, v) })
    if (imageFile) fd.append('image', imageFile)
    try {
      if (editId) await updateProduct(editId, fd); else await createProduct(fd)
      setShowModal(false); loadProducts()
    } catch (err) { setFormError(err.response?.data?.message || 'Failed to save product') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    await deleteProduct(id).catch(() => {})
    loadProducts()
  }

  const PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Crect width='44' height='44' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'%3ENo img%3C/text%3E%3C/svg%3E`
  const imgBase = (path) => path?.startsWith('/') ? path : path || PLACEHOLDER

  if (loading && products.length === 0) return <PageLoader />

  return (
    <AdminLayout subtitle="Add, update and manage your product catalogue">
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f1d35' }}>Manage Products</h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: '#6b7280' }}>{products.length} products listed</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Icon name="add" style={{ marginRight: 6 }} size={16} />Add Product</button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: 360 }}>
        <Icon name="search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
        <input className="form-control" style={{ paddingLeft: 40 }} placeholder="Search products..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
            <tr>
              {['Product', 'Category', 'Price', 'Stock', 'Discount', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#6b7280', whiteSpace: 'nowrap', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '.4px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p._id} style={{ borderBottom: '1px solid #f3f4f6' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={imgBase(p.image)} alt={p.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e7eb' }}
                      onError={(e) => { e.target.onerror = null; e.target.src = PLACEHOLDER }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#0f1d35' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{p.brand || '—'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{p.category?.name || '—'}</td>
                <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f1d35' }}>₹{p.price}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: p.quantity > 10 ? '#f0fdf4' : p.quantity > 0 ? '#fffbeb' : '#fef2f2', color: p.quantity > 10 ? '#16a34a' : p.quantity > 0 ? '#d97706' : '#dc2626', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem' }}>
                    {p.quantity}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>{p.discount > 0 ? <span style={{ color: '#e53935', fontWeight: 600 }}>{p.discount}%</span> : '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}><Icon name="edit" size={14} /></button>
                    <button className="btn btn-sm" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }} onClick={() => handleDelete(p._id, p.name)}><Icon name="delete" size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && !loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No products found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>‹ Prev</button>
          <span style={{ padding: '6px 12px', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.85rem', fontWeight: 600 }}>{page} / {pages}</span>
          <button className="btn btn-outline btn-sm" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>Next ›</button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>{editId ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="btn btn-ghost" onClick={closeModal}><Icon name="close" size={20} /></button>
            </div>
            {formError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{formError}</div>}
            <form onSubmit={handleSave}>
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ width: 120, height: 120, borderRadius: 12, border: '2px dashed #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', overflow: 'hidden', cursor: 'pointer', background: '#f9fafb' }} onClick={() => fileRef.current?.click()}>
                  {imagePreview ? <img src={imagePreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Icon name="upload" size={28} style={{ color: '#9ca3af' }} />}
                </div>
                <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                <button type="button" className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                  <Icon name="upload" size={13} style={{ marginRight: 4 }} />Upload Image
                </button>
              </div>
              <div className="form-grid-2">
                <div className="form-group"><label className="form-label">Product Name *</label><input className="form-control" name="name" value={form.name} onChange={handleChange} required /></div>
                <div className="form-group"><label className="form-label">Brand</label><input className="form-control" name="brand" value={form.brand} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Category *</label>
                  <select className="form-control" name="category" value={form.category} onChange={handleChange} required>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Price (₹) *</label><input className="form-control" type="number" min="0" step="0.01" name="price" value={form.price} onChange={handleChange} required /></div>
                <div className="form-group"><label className="form-label">Discount (%)</label><input className="form-control" type="number" min="0" max="100" name="discount" value={form.discount} onChange={handleChange} /></div>
                <div className="form-group"><label className="form-label">Stock *</label><input className="form-control" type="number" min="0" name="quantity" value={form.quantity} onChange={handleChange} required /></div>
                <div className="form-group"><label className="form-label">Unit</label>
                  <select className="form-control" name="unit" value={form.unit} onChange={handleChange}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Weight</label><input className="form-control" name="weight" placeholder="500g, 1kg..." value={form.weight} onChange={handleChange} /></div>
              </div>
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} name="description" value={form.description} onChange={handleChange} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editId ? 'Update Product' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
