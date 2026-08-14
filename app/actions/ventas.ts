'use server'

import { createClient } from '@/utils/supabase/server'
import type { Venta as DBVenta, VentaItem } from '@/types/database'
import { revalidatePath } from 'next/cache'

export interface Venta extends DBVenta {
  items?: VentaItem[]
  cliente?: { nombre: string }
}

export async function fetchVentasAction(fechaInicio: string, fechaFin: string): Promise<Venta[]> {
  const supabase = await createClient()
  let query = supabase
    .from('ventas')
    .select('*, cliente:clientes(nombre)')
    .order('fecha', { ascending: false })

  if (fechaInicio) {
    query = query.gte('fecha', new Date(fechaInicio).toISOString())
  }
  if (fechaFin) {
    const fechaFinDate = new Date(fechaFin)
    fechaFinDate.setHours(23, 59, 59, 999)
    query = query.lte('fecha', fechaFinDate.toISOString())
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Venta[]) || []
}

export interface CrearVentaInput {
  total: number
  subtotal: number
  descuento_total: number
  cantidad_items: number
  notas?: string | null
  vendedor: string
  cliente_id: string
  cliente_nombre: string
  cliente_telefono?: string
  cliente_contacto?: string
  items: {
    producto_id: string
    variante_id: string
    producto_nombre: string
    talla: string
    colegio: string
    precio_unitario: number
    descuento_porcentaje: number
    precio_final: number
    cantidad: number
    subtotal: number
  }[]
  cliente_stats: {
    id: string
    total_compras: number
    cantidad_compras: number
  }
}

export async function crearVentaAction(input: CrearVentaInput): Promise<string> {
  const supabase = await createClient()

  // 1. Obtener vendedor real de la sesión (fallback al input.vendedor)
  const { data: { user } } = await supabase.auth.getUser()
  const vendedor = user?.email || input.vendedor

  // 2. Insertar venta
  const { data: venta, error: errorVenta } = await supabase
    .from('ventas')
    .insert({
      total: input.total,
      subtotal: input.subtotal,
      descuento_total: input.descuento_total,
      cantidad_items: input.cantidad_items,
      notas: input.notas,
      vendedor,
      cliente_id: input.cliente_id,
      cliente_nombre: input.cliente_nombre,
      cliente_telefono: input.cliente_telefono,
      cliente_contacto: input.cliente_contacto
    })
    .select()
    .single()

  if (errorVenta || !venta) {
    throw new Error(errorVenta?.message || 'Error al crear la venta')
  }

  // 3. Insertar venta_items
  const items = input.items.map(item => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    variante_id: item.variante_id,
    producto_nombre: item.producto_nombre,
    talla: item.talla,
    colegio: item.colegio,
    precio_unitario: item.precio_unitario,
    descuento_porcentaje: item.descuento_porcentaje,
    precio_final: item.precio_final,
    cantidad: item.cantidad,
    subtotal: item.subtotal
  }))

  const { error: errorItems } = await supabase
    .from('venta_items')
    .insert(items)

  if (errorItems) {
    throw new Error(errorItems.message || 'Error al crear los items de venta')
  }

  // 4. Descontar stock de cada variante
  for (const item of input.items) {
    const { data: variante } = await supabase
      .from('variantes')
      .select('stock')
      .eq('id', item.variante_id)
      .single()

    if (variante) {
      const nuevoStock = variante.stock - item.cantidad
      const { error: errorStock } = await supabase
        .from('variantes')
        .update({ stock: Math.max(0, nuevoStock) })
        .eq('id', item.variante_id)
      if (errorStock) throw new Error(errorStock.message)
    }
  }

  // 5. Actualizar estadísticas del cliente
  const { error: errorCliente } = await supabase
    .from('clientes')
    .update({
      total_compras: input.cliente_stats.total_compras + input.total,
      cantidad_compras: input.cliente_stats.cantidad_compras + 1,
      ultima_compra: new Date().toISOString()
    })
    .eq('id', input.cliente_stats.id)

  if (errorCliente) throw new Error(errorCliente.message)

  // 6. Invalidar cache del panel de ventas
  revalidatePath('/admin/ventas')
  return venta.id
}
