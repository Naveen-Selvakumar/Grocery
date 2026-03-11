import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'

export default function SearchBar({ onSearch, placeholder = 'Search products...' }) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (onSearch) { onSearch(query); return }
    if (query.trim()) navigate(`/products?search=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 0, width: '100%', maxWidth: 600 }}>
      <div style={{ position: 'relative', flex: 1 }}>
        <Icon name="search" size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text" value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%', padding: '12px 44px 12px 46px',
            border: '1.5px solid var(--border)', borderRight: 'none',
            borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
            background: 'var(--bg-card)', color: 'var(--text-primary)',
            fontSize: '0.95rem', outline: 'none', fontFamily: 'var(--font-main)',
          }}
        />
        {query && (
          <button type="button" onClick={() => setQuery('')}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>
            <Icon name="close" size={18} />
          </button>
        )}
      </div>
      <button type="submit" className="btn btn-primary"
        style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', padding: '12px 24px', flexShrink: 0 }}>
        Search
      </button>
    </form>
  )
}
