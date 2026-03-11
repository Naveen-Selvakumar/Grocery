import { useState, useEffect, useRef } from 'react'
import { Icon } from '../components/Icon'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api'
import AdminLayout from '../components/AdminLayout'
import '../styles/admin.css'

const EMPTY_FORM = { name: '', description: '', image: null }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [editId,     setEditId]     = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(null)
  const fileRef = useRef()

  const fetchCats = async () => {
    setLoading(true)
    try {
      const { data } = await getCategories()
      setCategories(data.data || data || [])
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCats() }, [])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setPreview(null)
    setEditId(null)
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', image: null })
    setPreview(cat.image || null)
    setEditId(cat._id)
    setShowModal(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setForm(f => ({ ...f, image: file }))
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return alert('Category name is required')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name)
      fd.append('description', form.description)
      if (form.image) fd.append('image', form.image)

      if (editId) {
        await updateCategory(editId, fd)
      } else {
        await createCategory(fd)
      }
      setShowModal(false)
      fetchCats()
    } catch (err) {
      alert(err?.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    setDeleting(id)
    try {
      await deleteCategory(id)
      setCategories(c => c.filter(x => x._id !== id))
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Icon name="local_offer" size={22} />
          <div>
            <h1>Categories</h1>
            <p>{categories.length} categories</p>
          </div>
        </div>
        <button className="admin-btn-primary" onClick={openAdd}>
          <Icon name="add" size={15} /> Add Category
        </button>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Icon name="search" size={15} />
          <input
            placeholder="Search categories…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-empty">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">No categories found.</div>
      ) : (
        <div className="admin-categories-grid">
          {filtered.map(cat => (
            <div key={cat._id} className="admin-cat-card">
              <div className="admin-cat-img-wrap">
                {cat.image
                  ? <img src={cat.image} alt={cat.name} />
                  : <Icon name="image" size={32} style={{ color: '#9ca3af' }} />
                }
              </div>
              <div className="admin-cat-body">
                <h4>{cat.name}</h4>
                {cat.description && <p>{cat.description}</p>}
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: 4 }}>
                  {cat.productCount ?? 0} products
                </div>
              </div>
              <div className="admin-cat-actions">
                <button className="admin-icon-btn" title="Edit" onClick={() => openEdit(cat)}>
                  <Icon name="edit" size={14} />
                </button>
                <button className="admin-icon-btn danger" title="Delete"
                  disabled={deleting === cat._id}
                  onClick={() => handleDelete(cat._id)}>
                  <Icon name="delete" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: 460, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>{editId ? 'Edit Category' : 'Add Category'}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><Icon name="close" size={18} /></button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '20px 24px 24px' }}>
              <div className="admin-form-group">
                <label>Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Vegetables" required />
              </div>
              <div className="admin-form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Short description (optional)…" />
              </div>
              <div className="admin-form-group">
                <label>Image</label>
                <div className="admin-img-upload" onClick={() => fileRef.current.click()}>
                  {preview
                    ? <img src={preview} alt="preview" style={{ maxHeight: 120, borderRadius: 8 }} />
                    : <><Icon name="image" size={24} style={{ color: '#9ca3af' }} /><span>Click to upload image</span></>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="admin-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
