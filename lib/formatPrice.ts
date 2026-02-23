/**
 * Formatea un número como precio en pesos chilenos
 * Ejemplo: 1000 -> "$1.000"
 * Ejemplo: 10000 -> "$10.000"
 * Ejemplo: 150000 -> "$150.000"
 */
export function formatPrice(price: number): string {
  // Redondear a entero (sin decimales)
  const roundedPrice = Math.round(price)
  
  // Formatear con separador de miles (punto)
  const formatted = roundedPrice.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `$${formatted}`
}

/**
 * Parsea un string de precio formateado a número
 * Ejemplo: "$1.000" -> 1000
 * Ejemplo: "10.000" -> 10000
 */
export function parsePrice(priceString: string): number {
  // Remover $ y puntos
  const cleaned = priceString.replace(/[$\.]/g, '')
  return parseInt(cleaned) || 0
}
