/**
 * Thin wrapper around Google Material Icons web font.
 * Usage: <Icon name="shopping_cart" size={20} style={{ color: 'red' }} />
 */
export function Icon({ name, size = 20, style, className = '', onClick }) {
  return (
    <span
      className={`material-icons${className ? ` ${className}` : ''}`}
      onClick={onClick}
      style={{
        fontSize: size,
        lineHeight: 1,
        verticalAlign: 'middle',
        userSelect: 'none',
        display: 'inline-flex',
        alignItems: 'center',
        ...style,
      }}
    >
      {name}
    </span>
  )
}

export default Icon
