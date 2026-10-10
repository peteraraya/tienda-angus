'use server'

import { supabase } from '@/lib/supabase'

export interface PublicCatalogFilters {
  search?: string
  category?: string
  school?: string
  size?: string
  favoritesOnly?: boolean
  favoriteIds?: string[]
  offersOnly?: boolean
  sort?: string
  page?: number
  pageSize?: number
}

export interface PublicCatalogProduct {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url: string | null
  imagenes: string[] | null
  descuento_porcentaje: number | null
  en_oferta: boolean
  created_at: string
  variantes: Array<{
    id: string
    talla: string
    colegio: string
    stock: number
    precio: number | null
  }>
  stock_total: number
}

export interface PublicCatalogPage {
  products: PublicCatalogProduct[]
  total: number
  categories: string[]
  sizes: string[]
  schools: string[]
}

export async function getPublicCatalogPage(filters: PublicCatalogFilters = {}): Promise<PublicCatalogPage> {
  const page = Number.isInteger(filters.page) ? Math.max(1, Math.min(filters.page as number, 100_000)) : 1
  const pageSize = Number.isInteger(filters.pageSize) ? Math.max(1, Math.min(filters.pageSize as number, 24)) : 12
  const favoriteIds = Array.isArray(filters.favoriteIds)
    ? filters.favoriteIds.filter((id): id is string =>
      typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ).slice(0, 500)
    : []
  const allowedSorts = new Set(['newest', 'price-asc', 'price-desc', 'name-asc', 'name-desc', 'stock-desc'])
  const sort = allowedSorts.has(filters.sort ?? '') ? filters.sort! : 'newest'

  const { data, error } = await supabase.rpc('get_public_catalog_page', {
    p_search: typeof filters.search === 'string' ? filters.search.trim().slice(0, 100) : '',
    p_category: typeof filters.category === 'string' ? filters.category.slice(0, 120) : '',
    p_school: typeof filters.school === 'string' ? filters.school.slice(0, 120) : '',
    p_size: typeof filters.size === 'string' ? filters.size.slice(0, 80) : '',
    p_favorites_only: filters.favoritesOnly === true,
    p_favorite_ids: favoriteIds,
    p_offers_only: filters.offersOnly === true,
    p_sort: sort,
    p_page: page,
    p_page_size: pageSize
  })

  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`)
  if (!data || typeof data !== 'object') throw new Error('La respuesta del catálogo no tiene un formato válido.')

  const result = data as unknown as PublicCatalogPage
  if (!Array.isArray(result.products) || !Number.isInteger(result.total)) {
    throw new Error('La respuesta del catálogo no tiene un formato válido.')
  }
  return result
}
