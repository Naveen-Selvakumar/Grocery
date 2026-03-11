import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import RatingStars from './RatingStars'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { addToWishlist, removeFromWishlist } from '../services/api'
import '../styles/product.css'

const FALLBACK = 'https://placehold.co/300x300/f5f5f5/888?text=Product'

export default function ProductCard({ product, wishlisted = false, onWishlistChange }) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [adding, setAdding] = useState(false)
  const [inWishlist, setInWishlist] = useState(wishlisted)

  const discountedPrice = product.discount > 0
    ? product.price - (product.price * product.discount) / 100
    : null

  const handleAddToCart = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    try {
      setAdding(true)
      await addItem(product._id)
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const handleWishlist = async (e) => {
    e.stopPropagation()
    if (!user) { navigate('/login'); return }
    try {
      if (inWishlist) {
        await removeFromWishlist({ productId: product._id })
        setInWishlist(false)
      } else {
        await addToWishlist({ productId: product._id })
        setInWishlist(true)
      }
      onWishlistChange?.()
    } catch {}
  }

  const imgSrc = product.image
    ? (product.image.startsWith('/') ? product.image : product.image)
    : FALLBACK

  return (
    <div className="product-card" onClick={() => navigate(`/products/${product._id}`)}>
      <div className="product-card-image">
        <img src={imgSrc} alt={product.name} onError={(e) => { e.target.src = FALLBACK }} loading="lazy" />

        {/* Badges */}
        {product.discount > 0 && (
          <span className="product-discount-badge">-{product.discount}%</span>
        )}
        {product.quantity === 0 && (
          <span className="product-stock-badge">Out of Stock</span>
        )}

        {/* Hover Actions */}
        <div className="product-card-actions">
          <button className={`product-action-btn ${inWishlist ? 'active' : ''}`} onClick={handleWishlist} title="Wishlist">
            <Icon name={inWishlist ? 'favorite' : 'favorite_border'} size={15} />
          </button>
          <button className="product-action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}`) }} title="Quick view">
            <Icon name="visibility" size={15} />
          </button>
        </div>
      </div>

      <div className="product-card-body">
        <div className="product-category">{product.category?.name || 'Grocery'}</div>
        <div className="product-name">{product.name}</div>
        <div className="product-rating-row">
          <RatingStars rating={product.rating?.average || 0} count={product.rating?.count} size={12} />
        </div>
        <div className="product-price-row">
          <span className="product-price">₹{discountedPrice ? discountedPrice.toFixed(0) : product.price}</span>
          {discountedPrice && <span className="product-price-orig">₹{product.price}</span>}
        </div>

        <button
          className="product-card-btn"
          onClick={handleAddToCart}
          disabled={adding || product.quantity === 0}
        >
          <Icon name="shopping_cart" size={14} />
          {adding ? 'Adding...' : product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
