'use server'

import { createClient } from '@/utils/supabase/server'
import type { SolicitudPedido, SolicitudPedidoEstado } from '@/types/database'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function createAdminSupabaseClient() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw new Error(`No se pudo verificar la sesión: ${error.message}`)
  if (user?.app_metadata?.role !== 'admin') {
    throw new Error('Acceso restringido al administrador')
  }
  return supabase
}

export async function fetchSolicitudesPedidosAdminAction(): Promise<SolicitudPedido[]> {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('solicitudes_pedido')
    .select('*, items:solicitud_pedido_items(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`)
  return (data ?? []) as SolicitudPedido[]
}

export async function actualizarEstadoSolicitudPedidoAction(
  id: string,
  estado: SolicitudPedidoEstado
): Promise<{ success: true } | { success: false; error: string }> {
  if (!UUID_PATTERN.test(id) || !['pendiente', 'confirmado', 'cancelado'].includes(estado)) {
    return { success: false, error: 'La solicitud o el estado no son válidos.' }
  }

  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('solicitudes_pedido')
    .update({ estado, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) return { success: false, error: `No se pudo actualizar la solicitud: ${error.message}` }
  if (!data) return { success: false, error: 'No se encontró la solicitud o no tienes permisos para modificarla.' }
  return { success: true }
}
