import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { productPath } from '@/lib/productSlug'

const SITE_URL = 'https://www.confeccionesangus.cl'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pageSize = 500
  const productEntries: MetadataRoute.Sitemap = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, created_at')
      .or('activo.is.null,activo.eq.true')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) throw new Error(`No se pudieron cargar los productos para el sitemap: ${error.message}`)
    const products = data ?? []
    productEntries.push(...products.map(product => ({
      url: `${SITE_URL}${productPath(product.id, product.nombre)}`,
      lastModified: product.created_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7
    })))

    if (products.length < pageSize) break
    offset += pageSize
  }

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1
    },
    ...productEntries
  ]
}
