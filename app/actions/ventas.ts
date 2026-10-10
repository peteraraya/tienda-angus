'use server'

import { createClient } from '@/utils/supabase/server'
import type { Venta as DBVenta, VentaItem } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/utils/supabase/admin'

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

export async function fetchVentaItemsAction(ventaId: string): Promise<VentaItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('venta_items')
    .select('*')
    .eq('venta_id', ventaId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data ?? []
}

export interface CrearVentaInput {
  notas?: string | null
  cliente_id: string
  items: {
    producto_id: string
    variante_id: string
    precio_unitario: number
    descuento_porcentaje: number
    precio_final: number
    cantidad: number
  }[]
}

export interface VentaRegistrada {
  id: string
  fecha: string
  total: number
  subtotal: number
  descuento_total: number
  cantidad_items: number
  vendedor: string
  cliente: { nombre: string }
  items: Pick<VentaItem, 'producto_nombre' | 'talla' | 'colegio' | 'precio_final' | 'cantidad'>[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function crearVentaAction(input: CrearVentaInput, requestKey: string): Promise<VentaRegistrada> {
  if (!await isAdminRequest()) throw new Error('Acceso restringido al administrador')
  if (!input || typeof input !== 'object' ||
      !UUID_PATTERN.test(requestKey) || !UUID_PATTERN.test(input.cliente_id)) {
    throw new Error('La solicitud de venta no es válida')
  }
  if (
    !Array.isArray(input.items) ||
    input.items.length === 0 ||
    input.items.length > 100 ||
    (input.notas !== undefined && input.notas !== null &&
      (typeof input.notas !== 'string' || input.notas.length > 2000))
  ) {
    throw new Error('Los datos de la venta no son válidos')
  }
  const variantIds = new Set<string>()
  for (const item of input.items) {
    if (
      !item ||
      !UUID_PATTERN.test(item.producto_id) ||
      !UUID_PATTERN.test(item.variante_id) ||
      variantIds.has(item.variante_id) ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad < 1 ||
      !Number.isSafeInteger(item.precio_unitario) ||
      item.precio_unitario < 0 ||
      !Number.isInteger(item.descuento_porcentaje) ||
      item.descuento_porcentaje < 0 ||
      item.descuento_porcentaje > 100 ||
      !Number.isSafeInteger(item.precio_final) ||
      item.precio_final < 0
    ) {
      throw new Error('Los productos, cantidades o precios de la venta no son válidos')
    }
    variantIds.add(item.variante_id)
  }

  const supabase = await createClient()

  const { data: { user }, error: errorUsuario } = await supabase.auth.getUser()
  if (errorUsuario) throw new Error(errorUsuario.message)
  if (!user) throw new Error('No se pudo verificar la sesión administrativa')

  const payload = {
    notas: input.notas ?? null,
    cliente_id: input.cliente_id,
    items: input.items.map(({ producto_id, variante_id, precio_unitario, descuento_porcentaje, precio_final, cantidad }) => ({
      producto_id,
      variante_id,
      precio_unitario,
      descuento_porcentaje,
      precio_final,
      cantidad
    }))
  }

  const { data: ventaId, error } = await supabase.rpc('crear_venta_atomica', {
    p_request_key: requestKey,
    p_payload: payload,
    p_vendedor: user.email || 'Administrador'
  })
  if (error) throw new Error(error.message)
  if (!ventaId) throw new Error('No se pudo registrar la venta')

  const [
    { data: venta, error: errorVenta },
    { data: items, error: errorItems }
  ] = await Promise.all([
    supabase
      .from('ventas')
      .select('id, fecha, total, subtotal, descuento_total, cantidad_items, vendedor, cliente_nombre')
      .eq('id', ventaId)
      .single(),
    supabase
      .from('venta_items')
      .select('producto_nombre, talla, colegio, precio_final, cantidad')
      .eq('venta_id', ventaId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
  ])
  if (errorVenta) throw new Error(`La venta se registró, pero no se pudo cargar su comprobante: ${errorVenta.message}`)
  if (errorItems) throw new Error(`La venta se registró, pero no se pudieron cargar sus productos: ${errorItems.message}`)
  if (!items || items.length !== input.items.length) {
    throw new Error('La venta se registró, pero el detalle del comprobante está incompleto')
  }

  revalidatePath('/admin/ventas')
  return {
    id: venta.id,
    fecha: venta.fecha,
    total: venta.total,
    subtotal: venta.subtotal,
    descuento_total: venta.descuento_total ?? 0,
    cantidad_items: venta.cantidad_items,
    vendedor: venta.vendedor || user.email || 'Administrador',
    cliente: { nombre: venta.cliente_nombre || '' },
    items
  }
}
