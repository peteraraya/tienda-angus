'use server'

import { createClient } from '@/utils/supabase/server'

export interface SolicitudPublicaInput {
  requestKey: string
  nombre: string
  telefono: string
  consentimiento: boolean
  website: string
  items: {
    varianteId: string
    cantidad: number
  }[]
}

export interface SolicitudPublicaResult {
  id: string
  total: number
  items: {
    nombre: string
    talla: string
    colegio: string
    cantidad: number
    precio_unitario: number
    subtotal: number
  }[]
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function crearSolicitudPublicaAction(
  input: SolicitudPublicaInput
): Promise<{ success: true; data: SolicitudPublicaResult } | { success: false; error: string }> {
  if (!input || typeof input !== 'object') {
    return { success: false, error: 'Revisa los datos de tu pedido e inténtalo nuevamente.' }
  }

  if (!UUID_PATTERN.test(input.requestKey)) {
    return { success: false, error: 'No se pudo identificar esta solicitud. Intenta nuevamente.' }
  }

  if (
    typeof input.nombre !== 'string' ||
    typeof input.telefono !== 'string' ||
    input.consentimiento !== true ||
    typeof input.website !== 'string' ||
    !Array.isArray(input.items) ||
    input.items.length < 1 ||
    input.items.length > 20 ||
    input.items.some(item =>
      !item ||
      typeof item !== 'object' ||
      typeof item.varianteId !== 'string' ||
      !UUID_PATTERN.test(item.varianteId) ||
      !Number.isInteger(item.cantidad) ||
      item.cantidad < 1 ||
      item.cantidad > 99
    )
  ) {
    return { success: false, error: 'Revisa los datos de tu pedido e inténtalo nuevamente.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('crear_solicitud_pedido_publica', {
    p_request_key: input.requestKey,
    p_cliente_nombre: input.nombre.trim(),
    p_cliente_telefono: input.telefono.trim(),
    p_consent: input.consentimiento,
    p_items: input.items.map(item => ({
      variante_id: item.varianteId,
      cantidad: item.cantidad
    })),
    p_website: input.website
  })

  if (error) return { success: false, error: error.message }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, error: 'No se pudo confirmar el registro del pedido. Intenta nuevamente.' }
  }

  const response = data as Record<string, unknown>
  if (
    typeof response.id !== 'string' ||
    !Number.isFinite(Number(response.total)) ||
    !Array.isArray(response.items)
  ) {
    return { success: false, error: 'No se pudo confirmar el registro del pedido. Intenta nuevamente.' }
  }

  const items: SolicitudPublicaResult['items'] = []
  for (const item of response.items) {
    if (!item || typeof item !== 'object') {
      return { success: false, error: 'No se pudo confirmar el registro del pedido. Intenta nuevamente.' }
    }

    const row = item as Record<string, unknown>
    if (
      typeof row.nombre !== 'string' ||
      typeof row.talla !== 'string' ||
      typeof row.colegio !== 'string' ||
      !Number.isInteger(row.cantidad) ||
      !Number.isFinite(Number(row.precio_unitario)) ||
      !Number.isFinite(Number(row.subtotal))
    ) {
      return { success: false, error: 'No se pudo confirmar el registro del pedido. Intenta nuevamente.' }
    }

    items.push({
      nombre: row.nombre,
      talla: row.talla,
      colegio: row.colegio,
      cantidad: Number(row.cantidad),
      precio_unitario: Number(row.precio_unitario),
      subtotal: Number(row.subtotal)
    })
  }

  return {
    success: true,
    data: {
      id: response.id,
      total: Number(response.total),
      items
    }
  }
}
