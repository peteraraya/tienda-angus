'use server'

import { createClient } from '@/utils/supabase/server'
import type { Pedido, PedidoItem } from '@/types/database'
import { revalidatePath } from 'next/cache'

export interface PedidoConProveedor extends Pedido {
  proveedor?: {
    nombre: string
  }
  items?: PedidoItem[]
}

export async function fetchPedidosAction(): Promise<PedidoConProveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, proveedor:proveedores(nombre)')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function updatePedidoEstadoAction(id: string, estado: 'pendiente' | 'recibido' | 'cancelado') {
  const supabase = await createClient()
  const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/pedidos')
}

export async function deletePedidoAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/pedidos')
}

export async function fetchPedidoItemsAction(pedidoId: string): Promise<PedidoItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pedido_items')
    .select('*')
    .eq('pedido_id', pedidoId)
  if (error) throw new Error(error.message)
  return data || []
}

export async function recibirPedidoAction(pedidoId: string) {
  const supabase = await createClient()

  const { data: items, error: errorItems } = await supabase
    .from('pedido_items')
    .select('*')
    .eq('pedido_id', pedidoId)
  if (errorItems) throw new Error(errorItems.message)
  if (!items) throw new Error('No se encontraron items del pedido')

  const { error: errorPedido } = await supabase
    .from('pedidos')
    .update({
      estado: 'recibido',
      fecha_recepcion: new Date().toISOString()
    })
    .eq('id', pedidoId)
  if (errorPedido) throw new Error(errorPedido.message)

  for (const item of items) {
    if (item.variante_id) {
      const { data: variante, error: errorVariante } = await supabase
        .from('variantes')
        .select('stock')
        .eq('id', item.variante_id)
        .single()
      if (errorVariante) throw new Error(errorVariante.message)

      if (variante) {
        const nuevoStock = variante.stock + (item.cantidad_recibida || item.cantidad)
        const { error: errorStock } = await supabase
          .from('variantes')
          .update({ stock: nuevoStock })
          .eq('id', item.variante_id)
        if (errorStock) throw new Error(errorStock.message)
      }
    }

    const { error: errorItem } = await supabase
      .from('pedido_items')
      .update({
        recibido: true,
        cantidad_recibida: item.cantidad_recibida || item.cantidad
      })
      .eq('id', item.id)
    if (errorItem) throw new Error(errorItem.message)
  }

  const { data: pedido, error: errorBase } = await supabase
    .from('pedidos')
    .select('proveedor_id, total')
    .eq('id', pedidoId)
    .single()
  if (errorBase) throw new Error(errorBase.message)
  if (!pedido) throw new Error('No se encontró el pedido')

  const { data: proveedor, error: errorProveedor } = await supabase
    .from('proveedores')
    .select('total_pedidos, cantidad_pedidos')
    .eq('id', pedido.proveedor_id)
    .single()
  if (errorProveedor) throw new Error(errorProveedor.message)

  if (proveedor) {
    const { error: errorProveedorUpdate } = await supabase
      .from('proveedores')
      .update({
        total_pedidos: proveedor.total_pedidos + pedido.total,
        cantidad_pedidos: proveedor.cantidad_pedidos + 1,
        ultimo_pedido: new Date().toISOString()
      })
      .eq('id', pedido.proveedor_id)
    if (errorProveedorUpdate) throw new Error(errorProveedorUpdate.message)
  }

  revalidatePath('/admin/pedidos')
}
