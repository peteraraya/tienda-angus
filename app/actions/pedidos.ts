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
