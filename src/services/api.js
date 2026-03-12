import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const API = axios.create({ baseURL: BASE_URL })

// Attach JWT to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────
export const registerUser = (data) => API.post('/auth/register', data)
export const loginUser = (data) => API.post('/auth/login', data)
export const getUserProfile = () => API.get('/auth/profile')
export const updateUserProfile = (data) => API.put('/auth/profile', data)
export const forgotPassword = (data) => API.post('/auth/forgot-password', data)
export const resetPassword = (token, data) => API.put(`/auth/reset-password/${token}`, data)

// ── Products ──────────────────────────────────────────────────
export const getProducts = (params) => API.get('/products', { params })
export const getProductById = (id) => API.get(`/products/${id}`)
export const createProduct = (data) => API.post('/products', data)
export const updateProduct = (id, data) => API.put(`/products/${id}`, data)
export const deleteProduct = (id) => API.delete(`/products/${id}`)
export const updateStock = (id, data) => API.patch(`/products/${id}/stock`, data)

// ── Categories ────────────────────────────────────────────────
export const getCategories = () => API.get('/categories')
export const createCategory = (data) => API.post('/categories', data)
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data)
export const deleteCategory = (id) => API.delete(`/categories/${id}`)

// ── Cart ─────────────────────────────────────────────────────
export const getCart = () => API.get('/cart')
export const addToCart = (data) => API.post('/cart/add', data)
export const updateCart = (data) => API.put('/cart/update', data)
export const removeFromCart = (data) => API.delete('/cart/remove', { data })
export const clearCart = () => API.delete('/cart/clear')

// ── Wishlist ──────────────────────────────────────────────────
export const getWishlist = () => API.get('/wishlist')
export const addToWishlist = (data) => API.post('/wishlist/add', data)
export const removeFromWishlist = (data) => API.delete('/wishlist/remove', { data })
export const moveToCart = (data) => API.post('/wishlist/move-to-cart', data)

// ── Orders ────────────────────────────────────────────────────
export const placeOrder = (data) => API.post('/orders', data)
export const getMyOrders = (params) => API.get('/orders/myorders', { params })
export const getOrderById = (id) => API.get(`/orders/${id}`)
export const getAllOrders = (params) => API.get('/orders/admin/all', { params })
export const updateOrderStatus = (id, data) => API.put(`/orders/${id}/status`, data)

// ── Reviews ───────────────────────────────────────────────────
export const addReview = (data) => API.post('/reviews', data)
export const getProductReviews = (productId, params) => API.get(`/reviews/${productId}`, { params })
export const deleteReview = (id) => API.delete(`/reviews/${id}`)

// ── Admin Users ───────────────────────────────────────────────
export const getAllUsers = (params) => API.get('/auth/users', { params })
export const deleteUser  = (id)     => API.delete(`/auth/users/${id}`)

// ── Dashboard ─────────────────────────────────────────────────
export const getDashboardStats = () => API.get('/dashboard/stats')

// ── Payment (Razorpay) ───────────────────────────────────────
export const createRazorpayOrder   = (data) => API.post('/payment/create-order', data)
export const verifyRazorpayPayment = (data) => API.post('/payment/verify', data)

// ── Chatbot ───────────────────────────────────────────────────
export const sendChatMessage = (data) => API.post('/chat', data)

// ── OCR ───────────────────────────────────────────────────────
export const scanBill = (formData) => API.post('/ocr/scan-bill', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
})

// ── Offers ────────────────────────────────────────────────────
export const getOfferCustomers = () => API.get('/offers/customers')
export const sendOfferEmail = (data) => API.post('/offers/send', data)

// ── Admin: manual low-stock alert email ──────────────────────
export const triggerLowStockAlert = () => API.post('/products/low-stock-alert')

export default API
