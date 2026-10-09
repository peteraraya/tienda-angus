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

export async function updatePedidoEstadoAction(id: string, estado: 'cancelado') {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .update({ estado })
    .eq('id', id)
    .eq('estado', 'pendiente')
    .select('id')
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) {
    const { data: pedido, error: errorPedido } = await supabase
      .from('pedidos')
      .select('estado')
      .eq('id', id)
      .maybeSingle()

    if (errorPedido) throw new Error(errorPedido.message)
    if (pedido?.estado !== 'cancelado') {
      throw new Error('Solo se pueden cancelar pedidos pendientes')
    }
  }

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

export interface CrearPedidoInput {
  proveedor_id: string
  proveedor_nombre: string
  fecha_pedido: string
  fecha_esperada: string | null
  total: number
  cantidad_items: number
  notas: string | null
  items: {
    insumo_id: string
    insumo_nombre: string
    unidad_medida: string
    precio_unitario: number
    cantidad: number
    subtotal: number
  }[]
}

export async function crearPedidoAction(input: CrearPedidoInput, requestKey: string): Promise<string> {
  const supabase = await createClient()
  const { data: { user }, error: errorUsuario } = await supabase.auth.getUser()
  if (errorUsuario) throw new Error(errorUsuario.message)

  const { data: pedidoId, error } = await supabase.rpc('crear_pedido_atomico', {
    p_request_key: requestKey,
    p_payload: input,
    p_usuario: user?.email || 'Administrador'
  })
  if (error) throw new Error(error.message)
  if (!pedidoId) throw new Error('No se pudo crear el pedido')

  revalidatePath('/admin/pedidos')
  return pedidoId
}

export async function recibirPedidoAction(pedidoId: string) {
  const supabase = await createClient()
  const { error } = await supabase.rpc('recibir_pedido_atomico', {
    p_pedido_id: pedidoId
  })
  if (error) throw new Error(error.message)

  revalidatePath('/admin/pedidos')
  revalidatePath('/admin')
  revalidatePath('/')
}
