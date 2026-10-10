export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

export function matchesSearchText(content: string, query: string): boolean {
  const normalizedContent = normalizeSearchText(content)
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean)
  return terms.every(term => normalizedContent.includes(term))
}
