import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getCart, addToCart, updateCart, removeFromCart, clearCart } from '../services/api'
import { useAuth } from './AuthContext'

const CartContext = createContext()

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [], totalPrice: 0, totalItems: 0 })
  const [cartLoading, setCartLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user) return
    try {
      setCartLoading(true)
      const { data } = await getCart()
      setCart(data.data || { items: [], totalPrice: 0, totalItems: 0 })
    } catch {
      setCart({ items: [], totalPrice: 0, totalItems: 0 })
    } finally {
      setCartLoading(false)
    }
  }, [user])

  useEffect(() => { fetchCart() }, [fetchCart])

  const addItem = async (productId, quantity = 1) => {
    const { data } = await addToCart({ productId, quantity })
    setCart(data.data)
    return data
  }

  const updateItem = async (productId, quantity) => {
    const { data } = await updateCart({ productId, quantity })
    setCart(data.data)
    return data
  }

  const removeItem = async (productId) => {
    const { data } = await removeFromCart({ productId })
    setCart(data.data)
    return data
  }

  const emptyCart = async () => {
    await clearCart()
    setCart({ items: [], totalPrice: 0, totalItems: 0 })
  }

  const cartCount = cart?.totalItems || cart?.items?.reduce((s, i) => s + i.quantity, 0) || 0

  return (
    <CartContext.Provider value={{ cart, cartLoading, cartCount, fetchCart, addItem, updateItem, removeItem, emptyCart }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
