interface ProductVariantPrice {
  precio?: number | null
  stock: number
}

interface ProductPriceInput {
  precio: number
  descuento_porcentaje?: number | null
  variantes: ProductVariantPrice[]
}

export function getProductBasePrice(product: ProductPriceInput): number {
  const availablePrices = product.variantes
    .filter(variant => variant.stock > 0)
    .map(variant => variant.precio ?? product.precio)

  return availablePrices.length > 0 ? Math.min(...availablePrices) : product.precio
}

export function getProductFinalPrice(product: ProductPriceInput): number {
  const discount = Math.min(100, Math.max(0, product.descuento_porcentaje ?? 0))
  return Math.round(getProductBasePrice(product) * (1 - discount / 100))
}
