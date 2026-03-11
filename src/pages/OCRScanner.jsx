import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { scanBill, addToCart } from '../services/api'
import { useCart } from '../context/CartContext'

export default function OCRScanner() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [addedItems, setAddedItems] = useState([])
  const inputRef = useRef(null)
  const { fetchCart } = useCart()
  const dropRef = useRef(null)

  const handleFile = (f) => {
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f)); setResult(null); setError(''); setAddedItems([])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const handleScan = async () => {
    if (!file) { setError('Please upload an image first'); return }
    setScanning(true); setError('')
    const fd = new FormData()
    fd.append('bill', file)
    try {
      const { data } = await scanBill(fd)
      setResult(data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'OCR scan failed. Please try a clearer image.')
    } finally { setScanning(false) }
  }

  const handleAddToCart = async (item) => {
    if (!item.productId) return
    try {
      await addToCart({ productId: item.productId, quantity: item.quantity || 1 })
      await fetchCart()
      setAddedItems((prev) => [...prev, item.productId])
    } catch (e) {}
  }

  const clearAll = () => { setFile(null); setPreview(''); setResult(null); setError(''); setAddedItems([]) }

  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb"><Link to="/">Home</Link><span className="breadcrumb-sep">/</span><span>OCR Scanner</span></div>
          <h1>Bill / Receipt Scanner</h1>
          <p>Upload a grocery bill image and we'll automatically parse the items</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800, paddingTop: '2rem', paddingBottom: '3rem' }}>
        {error && <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        {/* Upload Area */}
        {!preview ? (
          <div
            ref={dropRef}
            className="drop-zone"
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.currentTarget.classList.add('drag-over')}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
            style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)', transition: 'border-color 0.2s, background 0.2s' }}
          >
            <Icon name="cloud_upload" size={52} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: 8 }}>Drop your bill image here</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Supports JPG, PNG, WEBP, BMP · Max 5 MB</p>
            <button type="button" className="btn btn-primary">Browse Files</button>
            <input type="file" ref={inputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Uploaded Image</h3>
              <button className="btn btn-ghost btn-sm" onClick={clearAll}><Icon name="close" size={18} /> Clear</button>
            </div>
            <img src={preview} alt="Bill preview" style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)' }} />
            <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.25rem' }} onClick={handleScan} disabled={scanning}>
              <Icon name="bolt" size={18} style={{ marginRight: 8 }} />
              {scanning ? 'Scanning Bill...' : 'Scan Bill with OCR'}
            </button>
          </div>
        )}

        {/* Scan Results */}
        {result && (
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Extracted Items ({result.items?.length || 0})</h3>
              {result.confidence && (
                <span style={{ fontSize: '0.85rem', background: '#ecfdf5', color: '#10b981', padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </span>
              )}
            </div>

            {/* Raw Text Toggle */}
            {result.rawText && (
              <details style={{ marginBottom: '1rem', background: 'var(--bg)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', userSelect: 'none' }}>View Raw OCR Text</summary>
                <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{result.rawText}</pre>
              </details>
            )}

            {result.items?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {result.items.map((item, i) => {
                  const added = addedItems.includes(item.productId)
                  return (
                    <div key={i} style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        {item.quantity && <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>Qty: {item.quantity}</div>}
                      </div>
                      {item.price && <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>₹{item.price}</div>}
                      {item.productId && (
                        <button className="btn btn-sm" style={{ background: added ? '#ecfdf5' : 'var(--primary)', color: added ? '#10b981' : 'white', border: added ? '1px solid #10b981' : 'none', minWidth: 110 }}
                          onClick={() => handleAddToCart(item)} disabled={added}>
                          {added ? <><Icon name="check_circle" size={13} style={{ marginRight: 4 }} />Added</> : <><Icon name="shopping_cart" size={13} style={{ marginRight: 4 }} />Add to Cart</>}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <p style={{ color: 'var(--text-secondary)' }}>No grocery items could be extracted. Try a clearer image.</p>
              </div>
            )}

            {result.totalAmount && (
              <div style={{ marginTop: '1.25rem', textAlign: 'right', background: 'var(--bg)', borderRadius: 10, padding: '1rem 1.5rem', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Total: </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>₹{result.totalAmount}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
