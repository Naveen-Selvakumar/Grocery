export default function Loader({ text = 'Loading...', fullPage = false }) {
  const style = fullPage
    ? { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }
    : { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 20px' }

  return (
    <div style={style}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)',
            animation: `bounceDot 1.4s ease-in-out ${i * 0.2}s infinite both`,
          }} />
        ))}
      </div>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{text}</span>
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" style={{ cursor: 'default' }}>
      <div className="skeleton" style={{ aspectRatio: '1/1', borderRadius: 0 }} />
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ height: 12, width: '50%' }} />
        <div className="skeleton" style={{ height: 16, width: '90%' }} />
        <div className="skeleton" style={{ height: 14, width: '60%' }} />
        <div className="skeleton" style={{ height: 18, width: '40%' }} />
        <div className="skeleton" style={{ height: 36, borderRadius: 8 }} />
      </div>
    </div>
  )
}

export function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)' }}>Loading...</span>
    </div>
  )
}
