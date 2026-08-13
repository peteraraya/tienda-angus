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

export async function fetchProductosAction(): Promise<Producto[]> {
  const supabase = await createClient()

  const { data: productosData, error: productosError } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false })

  if (productosError) throw new Error(productosError.message)

  const { data: colegiosData } = await supabase
    .from('colegios')
    .select('nombre, insignia_url')

  const colegiosMap = new Map(
    colegiosData?.map(c => [c.nombre.trim(), c.insignia_url]) || []
  )

  if (!productosData) return []

  const productosConInfo = await Promise.all(
    productosData.map(async (producto) => {
      const { data: variantes } = await supabase
        .from('variantes')
        .select('*')
        .eq('producto_id', producto.id)

      const variantesConInsignia = variantes?.map(v => ({
        ...v,
        insignia_url: colegiosMap.get(v.colegio.trim())
      })) || []

      const stock_total = variantes?.reduce((sum, v) => sum + v.stock, 0) || 0
      const variantes_count = variantes?.length || 0

      return {
        ...producto,
        stock_total,
        variantes_count,
        variantes: variantesConInsignia
      }
    })
  )

  return productosConInfo
}

export async function deleteProductoAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateOfertaAction(id: string, nuevoEstado: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ en_oferta: nuevoEstado }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return nuevoEstado
}

export async function updateDescuentoAction(id: string, descuento: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ descuento_porcentaje: descuento }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return descuento
}

export async function duplicateProductAction(producto: Producto) {
  const supabase = await createClient()
  const { data: newProduct, error } = await supabase
    .from('productos')
    .insert({
      nombre: `${producto.nombre} (Copia)`,
      descripcion: producto.descripcion,
      precio: producto.precio,
      categoria: producto.categoria,
      imagen_url: producto.imagen_url,
      descuento_porcentaje: producto.descuento_porcentaje,
      en_oferta: producto.en_oferta
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  if (newProduct && producto.variantes) {
    const variantesToInsert = producto.variantes.map(v => ({
      producto_id: newProduct.id,
      talla: v.talla,
      colegio: v.colegio,
      stock: v.stock
    }))
    const { error: variantError } = await supabase.from('variantes').insert(variantesToInsert)
    if (variantError) throw new Error(variantError.message)
  }
  revalidatePath('/admin')
}

export async function updateVarianteStockAction(varianteId: string, newStock: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('variantes').update({ stock: newStock }).eq('id', varianteId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateProductNameAction(id: string, nombre: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ nombre: nombre.trim() }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateProductPriceAction(id: string, precio: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ precio }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
}

export async function updateProductNotasAction(id: string, notas: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('productos').update({ notas: notas.trim() || null }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return notas
}
