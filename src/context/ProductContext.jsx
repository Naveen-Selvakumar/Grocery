import { createContext, useContext, useState, useEffect } from 'react'
import { getCategories } from '../services/api'

const ProductContext = createContext()

export function ProductProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    getCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {})
  }, [])

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))

  return (
    <ProductContext.Provider value={{ categories, theme, toggleTheme }}>
      {children}
    </ProductContext.Provider>
  )
}

export const useProduct = () => useContext(ProductContext)
