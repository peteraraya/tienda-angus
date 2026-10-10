'use server'

import { createClient } from '@/utils/supabase/server'
import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'
import { revalidatePath } from 'next/cache'

export interface Variante extends DBVariante {
  insignia_url?: string
}

export interface Producto extends DBProducto {
  stock_total?: number
  variantes_count?: number
  variantes?: Variante[]
}

export type ProductoData = Partial<Omit<DBProducto, 'imagen_url' | 'imagenes'>> & {
  imagen_url?: string | null
  imagenes?: string[] | null
}

export interface AdminInventoryFilters {
  searchTerm: string
  category: string
  school: string
  size: string
  stockFilter: string
  statusFilter: string
}

export interface AdminInventorySummary {
  totalProductos: number
  totalVariantes: number
  unidadesDisponibles: number
  unidadesStockBajo: number
  variantesAgotadas: number
  valorInventario: number
}

export interface AdminInventoryFacets {
  categories: string[]
  schools: string[]
  sizes: string[]
}

export interface AdminProductPage {
  items: Producto[]
  total: number
  facets: AdminInventoryFacets
  summary: AdminInventorySummary
  stockEspecifico: { totalStock: number; variantesEncontradas: number } | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function parseFiniteNumber(record: Record<string, unknown>, field: string): number {
  const value = record[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`La respuesta del inventario contiene un valor inválido en ${field}`)
  }
  return value
}

function parseStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) throw new Error(`La respuesta del inventario contiene una lista inválida en ${field}`)
  return value.map(item => {
    if (typeof item !== 'string') {
      throw new Error(`La respuesta del inventario contiene un valor inválido en ${field}`)
    }
    return item
  })
}

function parseAdminProductPage(value: unknown): AdminProductPage {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.facets) || !isRecord(value.summary)) {
    throw new Error('La respuesta del inventario tiene un formato inválido')
  }

  const productos = value.items.map(item => {
    if (
      !isRecord(item) ||
      typeof item.id !== 'string' ||
      typeof item.nombre !== 'string' ||
      typeof item.descripcion !== 'string' ||
      typeof item.precio !== 'number' ||
      typeof item.categoria !== 'string' ||
      typeof item.activo !== 'boolean' ||
      typeof item.created_at !== 'string' ||
      typeof item.stock_total !== 'number' ||
      typeof item.variantes_count !== 'number' ||
      !Array.isArray(item.variantes)
    ) {
      throw new Error('La respuesta contiene un producto con formato inválido')
    }

    const variantes = item.variantes.map(variante => {
      if (
        !isRecord(variante) ||
        typeof variante.id !== 'string' ||
        typeof variante.producto_id !== 'string' ||
        typeof variante.talla !== 'string' ||
        typeof variante.colegio !== 'string' ||
        typeof variante.stock !== 'number' ||
        typeof variante.created_at !== 'string' ||
        (variante.precio !== null && typeof variante.precio !== 'number') ||
        (variante.insignia_url !== null && typeof variante.insignia_url !== 'string')
      ) {
        throw new Error('La respuesta contiene una variante con formato inválido')
      }
      return {
        id: variante.id,
        producto_id: variante.producto_id,
        talla: variante.talla,
        colegio: variante.colegio,
        stock: variante.stock,
        precio: variante.precio,
        created_at: variante.created_at,
        insignia_url: variante.insignia_url ?? undefined
      }
    })

    if (
      (item.imagen_url !== null && item.imagen_url !== undefined && typeof item.imagen_url !== 'string') ||
      (item.imagenes !== null && item.imagenes !== undefined &&
        (!Array.isArray(item.imagenes) || !item.imagenes.every(image => typeof image === 'string'))) ||
      (item.descuento_porcentaje !== null && item.descuento_porcentaje !== undefined &&
        typeof item.descuento_porcentaje !== 'number') ||
      (item.en_oferta !== null && item.en_oferta !== undefined && typeof item.en_oferta !== 'boolean') ||
      (item.notas !== null && item.notas !== undefined && typeof item.notas !== 'string')
    ) {
      throw new Error('La respuesta contiene datos de producto con formato inválido')
    }

    return {
      id: item.id,
      nombre: item.nombre,
      descripcion: item.descripcion,
      precio: item.precio,
      categoria: item.categoria,
      imagen_url: typeof item.imagen_url === 'string' ? item.imagen_url : undefined,
      imagenes: Array.isArray(item.imagenes) ? item.imagenes : undefined,
      activo: item.activo,
      created_at: item.created_at,
      descuento_porcentaje: typeof item.descuento_porcentaje === 'number' ? item.descuento_porcentaje : undefined,
      en_oferta: typeof item.en_oferta === 'boolean' ? item.en_oferta : undefined,
      notas: typeof item.notas === 'string' ? item.notas : undefined,
      stock_total: item.stock_total,
      variantes_count: item.variantes_count,
      variantes
    }
  })

  const summary = value.summary
  const parsedSummary: AdminInventorySummary = {
    totalProductos: parseFiniteNumber(summary, 'totalProductos'),
    totalVariantes: parseFiniteNumber(summary, 'totalVariantes'),
    unidadesDisponibles: parseFiniteNumber(summary, 'unidadesDisponibles'),
    unidadesStockBajo: parseFiniteNumber(summary, 'unidadesStockBajo'),
    variantesAgotadas: parseFiniteNumber(summary, 'variantesAgotadas'),
    valorInventario: parseFiniteNumber(summary, 'valorInventario')
  }

  const stockEspecifico = value.stockEspecifico
  let parsedStockEspecifico: AdminProductPage['stockEspecifico'] = null
  if (stockEspecifico !== null) {
    if (!isRecord(stockEspecifico)) throw new Error('El resumen de stock filtrado tiene un formato inválido')
    parsedStockEspecifico = {
      totalStock: parseFiniteNumber(stockEspecifico, 'totalStock'),
      variantesEncontradas: parseFiniteNumber(stockEspecifico, 'variantesEncontradas')
    }
  }

  if (typeof value.total !== 'number' || !Number.isInteger(value.total) || value.total < 0) {
    throw new Error('El total de productos filtrados tiene un formato inválido')
  }

  return {
    items: productos,
    total: value.total,
    facets: {
      categories: parseStringArray(value.facets.categories, 'categories'),
      schools: parseStringArray(value.facets.schools, 'schools'),
      sizes: parseStringArray(value.facets.sizes, 'sizes')
    },
    summary: parsedSummary,
    stockEspecifico: parsedStockEspecifico
  }
}

async function getAdminProductPage(
  filters: AdminInventoryFilters,
  offset: number,
  limit: number
): Promise<AdminProductPage> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_product_page', {
    p_search: filters.searchTerm,
    p_category: filters.category,
    p_school: filters.school,
    p_size: filters.size,
    p_stock_filter: filters.stockFilter,
    p_status_filter: filters.statusFilter,
    p_offset: offset,
    p_limit: limit
  })

  if (error) throw new Error(`No se pudo cargar el inventario: ${error.message}`)
  return parseAdminProductPage(data)
}

const EMPTY_ADMIN_FILTERS: AdminInventoryFilters = {
  searchTerm: '',
  category: '',
  school: '',
  size: '',
  stockFilter: '',
  statusFilter: ''
}

export async function fetchProductosAction(
  filters: AdminInventoryFilters = EMPTY_ADMIN_FILTERS,
  page = 1,
  pageSize = 20
): Promise<AdminProductPage> {
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    throw new Error('La página solicitada no es válida')
  }
  return getAdminProductPage(filters, (page - 1) * pageSize, pageSize)
}

export async function exportProductosAction(filters: AdminInventoryFilters): Promise<Producto[]> {
  const items: Producto[] = []
  let offset = 0
  const pageSize = 100
  let total = 0

  do {
    const result = await getAdminProductPage(filters, offset, pageSize)
    items.push(...result.items)
    total = result.total
    offset += result.items.length
    if (result.items.length === 0 && offset < total) {
      throw new Error('La exportación no pudo avanzar por los resultados del inventario')
    }
  } while (offset < total)

  return items
}

export async function fetchAllProductosAction(): Promise<Producto[]> {
  const supabase = await createClient()
  const pageSize = 500
  const productosData: DBProducto[] = []
  const variantesData: DBVariante[] = []

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`)
    productosData.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from('variantes')
      .select('*')
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (error) throw new Error(`No se pudieron cargar las variantes: ${error.message}`)
    variantesData.push(...(data ?? []))
    if (!data || data.length < pageSize) break
  }

  const { data: colegiosData, error: colegiosError } = await supabase
    .from('colegios')
    .select('nombre, insignia_url')
  if (colegiosError) throw new Error(`No se pudieron cargar las insignias: ${colegiosError.message}`)

  const colegiosMap = new Map(colegiosData?.map(colegio => [colegio.nombre.trim(), colegio.insignia_url]) ?? [])
  const variantesPorProducto = new Map<string, Variante[]>()
  for (const variante of variantesData) {
    const variantes = variantesPorProducto.get(variante.producto_id) ?? []
    variantes.push({ ...variante, insignia_url: colegiosMap.get(variante.colegio.trim()) })
    variantesPorProducto.set(variante.producto_id, variantes)
  }

  return productosData.map(producto => {
    const variantes = variantesPorProducto.get(producto.id) ?? []
    return {
      ...producto,
      activo: producto.activo !== false,
      stock_total: variantes.reduce((sum, variante) => sum + variante.stock, 0),
      variantes_count: variantes.length,
      variantes
    }
  })
}

export async function deleteProductoAction(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('No se encontró el producto')
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function updateOfertaAction(id: string, nuevoEstado: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ en_oferta: nuevoEstado }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  return nuevoEstado
}

export async function toggleActivoProductoAction(id: string, currentState: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ activo: !currentState }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  return !currentState
}

export async function updateDescuentoAction(id: string, descuento: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ descuento_porcentaje: descuento }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  return descuento
}

export async function duplicateProductAction(producto: Producto, requestKey: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('crear_producto_con_variantes', {
    p_request_key: requestKey,
    p_data: {
      nombre: `${producto.nombre} (Copia)`,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      imagen_url: producto.imagen_url,
      imagenes: producto.imagenes,
      descuento_porcentaje: producto.descuento_porcentaje,
      en_oferta: producto.en_oferta,
      notas: producto.notas,
      activo: producto.activo
    },
    p_variantes: (producto.variantes ?? []).map(({ talla, colegio, stock, precio }) => ({
      talla,
      colegio,
      stock,
      precio
    }))
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin')
}

export async function updateVarianteStockAction(varianteId: string, expectedStock: number, newStock: number) {
  if (!Number.isInteger(expectedStock) || expectedStock < 0 || !Number.isInteger(newStock) || newStock < 0) {
    throw new Error('El stock debe ser un número entero no negativo')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('variantes')
    .update({ stock: newStock })
    .eq('id', varianteId)
    .eq('stock', expectedStock)
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)

  if (!data) {
    const { data: variante, error: errorVariante } = await supabase
      .from('variantes')
      .select('stock')
      .eq('id', varianteId)
      .maybeSingle()

    if (errorVariante) throw new Error(errorVariante.message)
    if (!variante) throw new Error('No se encontró la variante')
    if (variante.stock !== newStock) {
      throw new Error('El stock cambió mientras editabas. Recarga el catálogo antes de guardar')
    }
  }

  revalidatePath('/admin')
  revalidatePath('/')
}

export async function updateProductNameAction(id: string, nombre: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ nombre: nombre.trim() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function updateProductPriceAction(id: string, precio: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ precio }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
}

export async function updateProductNotasAction(id: string, notas: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ notas: notas.trim() || null }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/')
  return notas
}

export async function fetchProductoConVariantesAction(id: string): Promise<{ producto: DBProducto | null; variantes: DBVariante[] }> {
  const supabase = await createClient()
  const { data: producto, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  const { data: variantes, error: variantesError } = await supabase
    .from('variantes')
    .select('*')
    .eq('producto_id', id)
  if (variantesError) throw new Error(variantesError.message)
  return { producto, variantes: variantes || [] }
}

export async function crearProductoConVariantesAction(
  data: ProductoData,
  variantes: { talla: string; colegio: string; stock: number; precio?: number | null }[],
  requestKey: string
) {
  const supabase = await createClient()
  const { data: productoId, error } = await supabase.rpc('crear_producto_con_variantes', {
    p_request_key: requestKey,
    p_data: { ...data, activo: data.activo ?? true },
    p_variantes: variantes
  })
  if (error) throw new Error(error.message)
  if (!productoId) throw new Error('No se pudo crear el producto')

  const { data: producto, error: errorProducto } = await supabase
    .from('productos')
    .select('*')
    .eq('id', productoId)
    .single()
  if (errorProducto) throw new Error(errorProducto.message)

  revalidatePath('/admin')
  revalidatePath('/admin/nuevo')
  revalidatePath('/')
  return producto
}

export async function updateProductoConVariantesAction(
  id: string,
  data: ProductoData,
  variantes: { id?: string; stock_original?: number; talla: string; colegio: string; stock: number; precio?: number | null }[],
  requestKey: string
) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('actualizar_producto_con_variantes', {
    p_producto_id: id,
    p_data: { ...data, activo: data.activo ?? true },
    p_variantes: variantes,
    p_request_key: requestKey
  })
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  revalidatePath('/admin/editar')
  revalidatePath('/')
}
