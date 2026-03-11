import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from './Icon'
import { useCart } from '../context/CartContext'

const FALLBACK = 'https://placehold.co/90x90/f5f5f5/888?text=Item'

export default function CartItem({ item }) {
  const { updateItem, removeItem } = useCart()
  const [loading, setLoading] = useState(false)

  const product = item.product
  const imgSrc = product?.image
    ? (product.image.startsWith('/') ? product.image : product.image)
    : FALLBACK

  const handleQtyChange = async (newQty) => {
    if (newQty < 1) return
    try {
      setLoading(true)
      await updateItem(product._id, newQty)
    } catch {} finally { setLoading(false) }
  }

  const handleRemove = async () => {
    try { await removeItem(product._id) } catch {}
  }

  return (
    <div className="cart-item">
      {/* Image */}
      <Link to={`/products/${product?._id}`} className="cart-item-image">
        <img src={imgSrc} alt={item.name || product?.name} onError={(e) => (e.target.src = FALLBACK)} />
      </Link>

      {/* Info */}
      <div className="cart-item-info">
        <div className="cart-item-category">{product?.category?.name || 'Grocery'}</div>
        <Link to={`/products/${product?._id}`} className="cart-item-name">{item.name || product?.name}</Link>
        <div className="cart-item-price">₹{item.price}</div>

        {/* Qty control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginTop: 6, width: 'fit-content' }}>
          <div className="qty-control">
            <button className="qty-btn" onClick={() => handleQtyChange(item.quantity - 1)} disabled={loading || item.quantity <= 1}><Icon name="remove" size={14} /></button>
            <input className="qty-value" type="number" value={item.quantity} min={1} readOnly />
            <button className="qty-btn" onClick={() => handleQtyChange(item.quantity + 1)} disabled={loading}><Icon name="add" size={14} /></button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="cart-item-actions">
        <div className="cart-item-total">₹{(item.price * item.quantity).toFixed(2)}</div>
        <button className="cart-remove-btn" onClick={handleRemove}><Icon name="delete" size={14} /> Remove</button>
      </div>
    </div>
  )
}
