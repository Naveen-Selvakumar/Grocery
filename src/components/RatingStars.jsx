import { Icon } from './Icon'

export default function RatingStars({ rating = 0, count, size = 14, showCount = true }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<Icon key={i} name="star" size={size} style={{ color: '#f59e0b' }} />)
    else if (rating >= i - 0.5) stars.push(<Icon key={i} name="star_half" size={size} style={{ color: '#f59e0b' }} />)
    else stars.push(<Icon key={i} name="star_border" size={size} style={{ color: '#d1d5db' }} />)
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      <span style={{ display: 'flex', gap: 1 }}>{stars}</span>
      {showCount && count !== undefined && (
        <span style={{ fontSize: size - 2, color: 'var(--text-muted)', marginLeft: 2 }}>({count})</span>
      )}
    </span>
  )
}
