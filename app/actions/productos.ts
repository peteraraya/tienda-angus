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

export async function fetchProductosAction(): Promise<Producto[]> {
  const supabase = await createClient()

  const productosData: DBProducto[] = []
  let productoOffset = 0
  const pageSize = 500

  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })
      .range(productoOffset, productoOffset + pageSize - 1)

    if (error) throw new Error(error.message)
    productosData.push(...(data ?? []))
    if (!data || data.length < pageSize) break
    productoOffset += pageSize
  }

  const variantesData: DBVariante[] = []
  let varianteOffset = 0
  while (true) {
    const { data, error } = await supabase
      .from('variantes')
      .select('*')
      .order('created_at', { ascending: true })
      .range(varianteOffset, varianteOffset + pageSize - 1)

    if (error) throw new Error(error.message)
    variantesData.push(...(data ?? []))
    if (!data || data.length < pageSize) break
    varianteOffset += pageSize
  }

  const { data: colegiosData, error: colegiosError } = await supabase
    .from('colegios')
    .select('nombre, insignia_url')

  if (colegiosError) throw new Error(colegiosError.message)

  const colegiosMap = new Map(
    colegiosData?.map(c => [c.nombre.trim(), c.insignia_url]) ?? []
  )

  const variantesPorProducto = new Map<string, Variante[]>()
  for (const variante of variantesData) {
    const variantes = variantesPorProducto.get(variante.producto_id) ?? []
    variantes.push({
      ...variante,
      insignia_url: colegiosMap.get(variante.colegio.trim())
    })
    variantesPorProducto.set(variante.producto_id, variantes)
  }

  return productosData.map(producto => {
    const variantes = variantesPorProducto.get(producto.id) ?? []
    return {
      ...producto,
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
