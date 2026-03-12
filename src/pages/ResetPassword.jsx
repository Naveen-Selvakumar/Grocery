import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { resetPassword } from '../services/api'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { setMsg({ type: 'error', text: 'Passwords do not match' }); return }
    if (password.length < 6) { setMsg({ type: 'error', text: 'Password must be at least 6 characters' }); return }
    setLoading(true)
    setMsg(null)
    try {
      const { data } = await resetPassword(token, { password })
      setMsg({ type: 'success', text: data.message })
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Reset failed. Link may be expired.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, var(--secondary) 0%, #2d2d47 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 48, height: 48, background: 'var(--primary)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🛒</div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>Arunachalam Grocery</span>
          </Link>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,.4)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="lock" size={26} style={{ color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: '1.4rem', marginBottom: 6 }}>Set New Password</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Enter a strong password to secure your account.</p>
          </div>

          {msg && (
            <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 18, fontSize: '.85rem', fontWeight: 500, background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', color: msg.type === 'success' ? '#166534' : '#dc2626', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Icon name="lock" size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-control" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={{ paddingLeft: 42, paddingRight: 44 }} required />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Icon name={showPass ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Icon name="lock" size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-control" type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password" style={{ paddingLeft: 42 }} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading || msg?.type === 'success'}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 20, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>← Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
