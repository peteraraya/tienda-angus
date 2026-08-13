'use client'

import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'
import type { Venta as DBVenta, VentaItem } from '@/types/database'

export interface Venta extends DBVenta {
  items?: VentaItem[]
  cliente?: { nombre: string }
}

export function useAdminVentas(fechaInicio: string, fechaFin: string) {
  const fetchVentas = async (): Promise<Venta[]> => {
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
    if (error) throw error
    return data || []
  }

  const { data: ventas = [], isLoading: isLoadingVentas, refetch: refetchVentas } = useQuery({
    queryKey: ['adminVentas', fechaInicio, fechaFin],
    queryFn: fetchVentas,
  })

  return {
    ventas,
    isLoadingVentas,
    refetchVentas
  }
}
