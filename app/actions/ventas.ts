'use server'

import { createClient } from '@/utils/supabase/server'
import type { Venta as DBVenta, VentaItem } from '@/types/database'

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
