'use server'

import { createClient } from '@/utils/supabase/server'

export interface AdminNotificationData {
  id: string
  type: 'stock_bajo' | 'pedido_pendiente'
  title: string
  message: string
  read: false
}

export async function fetchAdminNotificationsAction(): Promise<AdminNotificationData[]> {
  const supabase = await createClient()
  const [insumosResult, pedidosResult] = await Promise.all([
    supabase
      .from('insumos')
      .select('id, nombre, stock_actual, stock_minimo, unidad_medida')
      .eq('activo', true),
    supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente')
  ])

  if (insumosResult.error) throw new Error(insumosResult.error.message)
  if (pedidosResult.error) throw new Error(pedidosResult.error.message)

  const notifications: AdminNotificationData[] = (insumosResult.data ?? [])
    .filter(insumo => insumo.stock_actual <= insumo.stock_minimo)
    .map(insumo => ({
      id: `stock-${insumo.id}`,
      type: 'stock_bajo',
      title: 'Stock bajo',
      message: `${insumo.nombre}: ${insumo.stock_actual} ${insumo.unidad_medida} (mínimo: ${insumo.stock_minimo})`,
      read: false
    }))

  if (pedidosResult.count) {
    notifications.push({
      id: 'pedidos-pendientes',
      type: 'pedido_pendiente',
      title: 'Pedidos pendientes',
      message: `Tienes ${pedidosResult.count} pedido(s) pendiente(s) de recibir`,
      read: false
    })
  }

  return notifications
}
