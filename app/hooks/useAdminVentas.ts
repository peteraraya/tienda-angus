'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchVentasAction, type Venta } from '@/app/actions/ventas'

export type { Venta }

export function useAdminVentas(fechaInicio: string, fechaFin: string) {
  const { data: ventas = [], isLoading: isLoadingVentas, refetch: refetchVentas } = useQuery({
    queryKey: ['adminVentas', fechaInicio, fechaFin],
    queryFn: () => fetchVentasAction(fechaInicio, fechaFin),
  })

  return {
    ventas,
    isLoadingVentas,
    refetchVentas
  }
}
