'use server'

import { createClient } from '@/utils/supabase/server'

export interface AdminDashboardMetrics {
  ventasHoy: { total: number; cantidad: number }
  ventasSemana: { total: number; cantidad: number }
  ventasMes: { total: number; cantidad: number }
  stockBajo: number
  pedidosPendientes: number
  clientesNuevos: number
  productosMasVendidos: Array<{ nombre: string; cantidad: number }>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parsePeriod(value: unknown, field: string) {
  if (!isRecord(value) || typeof value.total !== 'number' || typeof value.cantidad !== 'number') {
    throw new Error(`La métrica ${field} tiene un formato inválido`)
  }
  return { total: value.total, cantidad: value.cantidad }
}

function parseCount(value: unknown, field: string) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`La métrica ${field} tiene un formato inválido`)
  }
  return value
}

export async function fetchAdminDashboardMetricsAction(): Promise<AdminDashboardMetrics> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_dashboard_metrics')

  if (error) throw new Error(`No se pudieron cargar las métricas: ${error.message}`)
  if (!isRecord(data) || !Array.isArray(data.productosMasVendidos)) {
    throw new Error('El servidor devolvió métricas con un formato inválido')
  }

  const productosMasVendidos = data.productosMasVendidos.map(item => {
    if (!isRecord(item) || typeof item.nombre !== 'string' || typeof item.cantidad !== 'number') {
      throw new Error('El servidor devolvió un producto más vendido con un formato inválido')
    }
    return { nombre: item.nombre, cantidad: item.cantidad }
  })

  return {
    ventasHoy: parsePeriod(data.ventasHoy, 'ventasHoy'),
    ventasSemana: parsePeriod(data.ventasSemana, 'ventasSemana'),
    ventasMes: parsePeriod(data.ventasMes, 'ventasMes'),
    stockBajo: parseCount(data.stockBajo, 'stockBajo'),
    pedidosPendientes: parseCount(data.pedidosPendientes, 'pedidosPendientes'),
    clientesNuevos: parseCount(data.clientesNuevos, 'clientesNuevos'),
    productosMasVendidos
  }
}
