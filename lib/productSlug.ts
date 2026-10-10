export function productSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'producto'
}

export function productPath(id: string, name: string): string {
  return `/productos/${encodeURIComponent(id)}/${productSlug(name)}`
}
