import { useState, useEffect, useCallback } from 'react'
import { Icon } from '../components/Icon'
import { getAllUsers, deleteUser } from '../services/api'
import AdminLayout from '../components/AdminLayout'
import '../styles/admin.css'

export default function AdminCustomers() {
  const [users,    setUsers]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [deleting, setDeleting] = useState(null)

  const LIMIT = 12

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: LIMIT }
      if (search) params.search = search
      const { data } = await getAllUsers(params)
      setUsers(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await deleteUser(id)
      setUsers(u => u.filter(x => x._id !== id))
      setTotal(t => t - 1)
    } catch (err) {
      alert(err?.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(null)
    }
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT))

  const initials = (name = '') =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'

  return (
    <AdminLayout>
      <div className="admin-page-header">
        <div className="admin-page-title">
          <Icon name="group" size={22} />
          <div>
            <h1>Customers</h1>
            <p>{total} registered users</p>
          </div>
        </div>
      </div>

      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Icon name="search" size={15} />
          <input
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="admin-empty">Loading…</div>
        ) : users.length === 0 ? (
          <div className="admin-empty">No customers found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>
                    <div className="admin-user-cell">
                      <div className="admin-avatar" style={u.role === 'admin' ? { background: '#e53935' } : {}}>
                        {initials(u.name)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.73rem', color: '#9ca3af' }}>#{u._id.slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.83rem', color: '#374151' }}>{u.email}</td>
                  <td>
                    {u.role === 'admin'
                      ? <span className="admin-status-badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                          <Icon name="admin_panel_settings" size={11} style={{ marginRight: 4 }} /> Admin
                        </span>
                      : <span className="admin-status-badge" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                          Customer
                        </span>
                    }
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    {u.role !== 'admin' && (
                      <button
                        className="admin-icon-btn danger"
                        title="Delete"
                        disabled={deleting === u._id}
                        onClick={() => handleDelete(u._id, u.name)}
                      >
                        <Icon name="delete" size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {pages > 1 && (
          <div className="admin-pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}><Icon name="chevron_left" size={18} /></button>
            <span>Page {page} / {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)}><Icon name="chevron_right" size={18} /></button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
