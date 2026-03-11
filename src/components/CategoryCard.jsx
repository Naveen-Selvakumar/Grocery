import { useNavigate } from 'react-router-dom'

const CATEGORY_COLORS = [
  '#FF6B00', '#7c3aed', '#0891b2', '#16a34a',
  '#dc2626', '#0284c7', '#ca8a04', '#db2777',
]

const CATEGORY_EMOJIS = {
  fruits: '🍎', vegetables: '🥦', dairy: '🥛', meat: '🥩',
  bakery: '🍞', beverages: '🧃', snacks: '🍿', spices: '🌶️',
  default: '🛒',
}

export default function CategoryCard({ category, index = 0 }) {
  const navigate = useNavigate()
  const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  const lowerName = category.name?.toLowerCase() || ''
  const emoji = Object.entries(CATEGORY_EMOJIS).find(([k]) => lowerName.includes(k))?.[1] || CATEGORY_EMOJIS.default

  return (
    <div
      onClick={() => navigate(`/products?category=${category.slug || lowerName}`)}
      style={{
        background: `${color}14`,
        border: `1.5px solid ${color}30`,
        borderRadius: 'var(--radius-md)',
        padding: '20px 14px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'var(--transition)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.background = `${color}22`
        e.currentTarget.style.boxShadow = `0 6px 20px ${color}22`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.background = `${color}14`
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 56, height: 56,
        background: `${color}20`,
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.6rem',
        border: `2px solid ${color}30`,
      }}>
        {category.image
          ? <img src={category.image} alt={category.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          : emoji}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{category.name}</div>
      </div>
    </div>
  )
}
