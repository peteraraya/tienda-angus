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
}

export async function crearVentaAction(input: CrearVentaInput, requestKey: string): Promise<string> {
  const supabase = await createClient()

  const { data: { user }, error: errorUsuario } = await supabase.auth.getUser()
  if (errorUsuario) throw new Error(errorUsuario.message)
  const vendedor = user?.email || input.vendedor

  const payload = {
    total: input.total,
    subtotal: input.subtotal,
    descuento_total: input.descuento_total,
    cantidad_items: input.cantidad_items,
    notas: input.notas ?? null,
    cliente_id: input.cliente_id,
    cliente_nombre: input.cliente_nombre,
    cliente_telefono: input.cliente_telefono ?? null,
    cliente_contacto: input.cliente_contacto ?? null,
    items: input.items
  }

  const { data: ventaId, error } = await supabase.rpc('crear_venta_atomica', {
    p_request_key: requestKey,
    p_payload: payload,
    p_vendedor: vendedor
  })
  if (error) throw new Error(error.message)
  if (!ventaId) throw new Error('No se pudo registrar la venta')

  revalidatePath('/admin/ventas')
  return ventaId
}
