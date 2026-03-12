import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { scanBill, addToCart } from '../services/api'
import { useCart } from '../context/CartContext'

const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000'

export default function OCRScanner() {
  const [file, setFile]         = useState(null)
  const [preview, setPreview]   = useState('')
  // step: idle | scanning | matching | done
  const [step, setStep]         = useState('idle')
  const [rawItems, setRawItems] = useState([])     // strings from OCR
  const [rawText, setRawText]   = useState('')
  const [confidence, setConf]   = useState(null)
  const [aiResult, setAiResult] = useState(null)   // {matched, not_available}
  const [addedItems, setAdded]  = useState(new Set())
  const [error, setError]       = useState('')
  const inputRef = useRef(null)
  const { fetchCart } = useCart()

  /* ── File helpers ─────────────────────────────────────── */
  const handleFile = (f) => {
    if (!f) return
    setFile(f); setPreview(URL.createObjectURL(f))
    setStep('idle'); setRawItems([]); setRawText(''); setConf(null)
    setAiResult(null); setError(''); setAdded(new Set())
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  const clearAll = () => {
    setFile(null); setPreview(''); setStep('idle')
    setRawItems([]); setRawText(''); setConf(null)
    setAiResult(null); setError(''); setAdded(new Set())
  }

  /* ── Main scan + AI match flow ────────────────────────── */
  const handleScan = async () => {
    if (!file) { setError('Please upload an image first'); return }
    setError('')

    // ── Step 1: OCR (Node backend) ──
    setStep('scanning')
    let items = []
    try {
      const fd = new FormData()
      fd.append('bill', file)
      const { data } = await scanBill(fd)
      items = data.data?.detectedItems || []
      setRawText(data.data?.rawText || '')
      setConf(data.data?.confidence ?? null)
      setRawItems(items)
    } catch (err) {
      setError(err.response?.data?.message || 'OCR scan failed. Try a clearer image.')
      setStep('idle')
      return
    }

    if (items.length === 0) {
      setError('No grocery items detected. Try a clearer photo of a grocery bill.')
      setStep('done')
      return
    }

    // ── Step 2: AI matching (FastAPI) ──
    setStep('matching')
    try {
      const res = await fetch(`${AI_URL}/match-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAiResult(await res.json())
    } catch {
      // AI service not running — show all as not_available with warning
      setAiResult({ matched: [], not_available: items, _aiDown: true })
    }
    setStep('done')
  }

  /* ── Cart helpers ─────────────────────────────────────── */
  const handleAddOne = async (productId) => {
    try {
      await addToCart({ productId, quantity: 1 })
      await fetchCart()
      setAdded(prev => new Set([...prev, productId]))
    } catch {}
  }

  const handleAddAll = () => {
    if (!aiResult) return
    aiResult.matched
      .filter(i => !addedItems.has(i.product_id) && i.quantity_in_stock > 0)
      .forEach(i => handleAddOne(i.product_id))
  }

  /* ── Derived ──────────────────────────────────────────── */
  const pendingCount = aiResult
    ? aiResult.matched.filter(i => !addedItems.has(i.product_id) && i.quantity_in_stock > 0).length
    : 0

  /* ── Render ───────────────────────────────────────────── */
  return (
    <div>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep">/</span>
            <span>AI Bill Scanner</span>
          </div>
          <h1>AI Bill Scanner</h1>
          <p>Upload a grocery bill — OCR reads the text, AI matches items to your store</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 820, paddingTop: '2rem', paddingBottom: '3rem' }}>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}

        {/* ── Upload zone ───────────────────────────────── */}
        {!preview ? (
          <div
            onClick={() => inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => e.currentTarget.classList.add('drag-over')}
            onDragLeave={(e) => e.currentTarget.classList.remove('drag-over')}
            style={{ border: '2px dashed var(--border)', borderRadius: 16, padding: '4rem 2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--surface)', transition: 'border-color .2s, background .2s' }}
          >
            <Icon name="document_scanner" size={52} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: 8 }}>Drop your grocery bill here</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>JPG · PNG · WEBP — AI will match items to your store catalogue</p>
            <button type="button" className="btn btn-primary">Browse Files</button>
            <input type="file" ref={inputRef} accept="image/*" style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="image" size={18} style={{ color: 'var(--primary)' }} /> Uploaded Bill
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={clearAll}>
                <Icon name="close" size={16} /> Clear
              </button>
            </div>

            <img src={preview} alt="Bill"
              style={{ width: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--border)', marginBottom: '1.25rem' }} />

            {/* ── Progress indicator ──────────────────── */}
            {(step === 'scanning' || step === 'matching') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem', padding: '14px 16px', background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid #16a34a', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#15803d' }}>
                    {step === 'scanning' ? '🔍 Step 1 / 2 — OCR Scanning…' : '🤖 Step 2 / 2 — AI Matching Products…'}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#16a34a', marginTop: 2 }}>
                    {step === 'scanning'
                      ? 'Tesseract.js is reading text from your bill image'
                      : 'Sentence Transformer is comparing items with your store catalogue'}
                  </div>
                </div>
              </div>
            )}

            {/* ── Scan button (only when idle / done) ─── */}
            {step !== 'scanning' && step !== 'matching' && (
              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleScan}
              >
                <Icon name="auto_awesome" size={18} />
                {step === 'done' ? 'Scan Again' : 'Scan & Match with AI'}
              </button>
            )}
          </div>
        )}

        {/* ── AI Results ────────────────────────────────── */}
        {step === 'done' && aiResult && (
          <div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: '1.5rem' }}>
              {[
                { icon: 'manage_search', label: 'OCR Detected',  value: rawItems.length,                       color: '#2563eb', bg: '#eff6ff' },
                { icon: 'check_circle', label: 'AI Matched',     value: aiResult.matched?.length ?? 0,          color: '#16a34a', bg: '#f0fdf4' },
                { icon: 'cancel',       label: 'Not in Store',   value: aiResult.not_available?.length ?? 0,    color: '#dc2626', bg: '#fef2f2' },
                ...(confidence !== null ? [{ icon: 'psychology', label: 'OCR Confidence', value: `${(confidence * 100).toFixed(0)}%`, color: '#7c3aed', bg: '#faf5ff' }] : []),
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${s.color}22`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name={s.icon} size={20} style={{ color: s.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: '.7rem', color: '#6b7280', fontWeight: 500, marginTop: 2 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI service down warning */}
            {aiResult._aiDown && (
              <div style={{ padding: '10px 16px', borderRadius: 9, marginBottom: '1.25rem', fontSize: '.83rem', background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <Icon name="warning" size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  <strong>AI service is not running.</strong> Start it with:{' '}
                  <code style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4, fontSize: '.8rem' }}>
                    cd ai-service &amp;&amp; uvicorn main:app --reload
                  </code>
                  {' '}then re-scan.
                </span>
              </div>
            )}

            {/* ── Matched products ─────────────────────── */}
            {aiResult.matched?.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: 8 }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 7, color: '#15803d', fontSize: '.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                    <Icon name="check_circle" size={15} style={{ color: '#16a34a' }} />
                    Matched Products ({aiResult.matched.length})
                  </h3>
                  {pendingCount > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAddAll}
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <Icon name="add_shopping_cart" size={14} />
                      Add All to Cart ({pendingCount})
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                  {aiResult.matched.map((item, i) => {
                    const added      = addedItems.has(item.product_id)
                    const outOfStock = item.quantity_in_stock === 0
                    const renamed    = item.ocr_item.toLowerCase() !== item.matched_name.toLowerCase()
                    return (
                      <div key={i} style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid #bbf7d0', padding: '0.9rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>

                        {/* Product image */}
                        <img
                          src={item.image || 'https://placehold.co/52x52/f0fdf4/16a34a?text=🛒'}
                          alt={item.matched_name}
                          style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', border: '1px solid #d1fae5', flexShrink: 0 }}
                        />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 120 }}>
                          {renamed && (
                            <div style={{ fontSize: '.68rem', color: '#9ca3af', marginBottom: 1 }}>
                              OCR: &ldquo;{item.ocr_item}&rdquo; &rarr;
                            </div>
                          )}
                          <div style={{ fontWeight: 700, color: '#111827', fontSize: '.92rem' }}>{item.matched_name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                            <span style={{ background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 10, fontSize: '.68rem', fontWeight: 700 }}>
                              {(item.similarity * 100).toFixed(0)}% match
                            </span>
                            {outOfStock
                              ? <span style={{ background: '#fef2f2', color: '#dc2626', padding: '1px 7px', borderRadius: 10, fontSize: '.68rem', fontWeight: 600 }}>Out of stock</span>
                              : <span style={{ color: '#9ca3af', fontSize: '.7rem' }}>{item.quantity_in_stock} in stock</span>
                            }
                          </div>
                        </div>

                        {/* Price */}
                        <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                          ₹{item.price?.toFixed(2)}
                        </div>

                        {/* Add to Cart */}
                        <button
                          className="btn btn-sm"
                          disabled={added || outOfStock}
                          onClick={() => handleAddOne(item.product_id)}
                          style={{
                            minWidth: 116,
                            background: added ? '#ecfdf5' : outOfStock ? '#f3f4f6' : 'var(--primary)',
                            color:      added ? '#10b981' : outOfStock ? '#9ca3af' : 'white',
                            border:     added ? '1px solid #10b981' : outOfStock ? '1px solid #e5e7eb' : 'none',
                          }}
                        >
                          {added
                            ? <><Icon name="check_circle" size={13} style={{ marginRight: 4 }} />Added</>   
                            : outOfStock
                              ? <><Icon name="block" size={13} style={{ marginRight: 4 }} />Out of Stock</>
                              : <><Icon name="add_shopping_cart" size={13} style={{ marginRight: 4 }} />Add to Cart</>
                          }
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Not available ────────────────────────── */}
            {aiResult.not_available?.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 .85rem', display: 'flex', alignItems: 'center', gap: 7, color: '#dc2626', fontSize: '.92rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  <Icon name="cancel" size={15} style={{ color: '#dc2626' }} />
                  Not Available in Store ({aiResult.not_available.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {aiResult.not_available.map((item, i) => (
                    <div key={i} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1.2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name="remove_circle_outline" size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                      <span style={{ color: '#991b1b', fontSize: '.88rem', fontWeight: 500 }}>{item}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '.72rem', color: '#ef4444', fontStyle: 'italic', whiteSpace: 'nowrap' }}>Not in store</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── No matches at all ────────────────────── */}
            {aiResult.matched?.length === 0 && aiResult.not_available?.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <Icon name="image_not_supported" size={40} style={{ color: '#d1d5db', marginBottom: 10 }} />
                <p style={{ color: 'var(--text-secondary)' }}>No grocery items could be extracted. Try a clearer image.</p>
              </div>
            )}

            {/* ── Raw OCR text toggle ───────────────────── */}
            {rawText && (
              <details style={{ marginBottom: '1rem', background: 'var(--bg)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-secondary)', userSelect: 'none', fontSize: '.85rem' }}>View Raw OCR Text</summary>
                <pre style={{ marginTop: '0.75rem', whiteSpace: 'pre-wrap', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, maxHeight: 200, overflowY: 'auto' }}>{rawText}</pre>
              </details>
            )}

            <button className="btn btn-ghost" style={{ marginTop: '.5rem' }} onClick={clearAll}>
              <Icon name="refresh" size={16} style={{ marginRight: 6 }} />
              Scan Another Bill
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
