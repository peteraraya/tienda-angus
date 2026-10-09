'use server'

import { createClient } from '@/utils/supabase/server'

export interface SolicitudReparacionInput {
  requestKey: string
  nombre: string
  telefono: string
  prenda: string
  descripcion: string
  fechaDeseada: string
  consentimiento: boolean
  website: string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function crearSolicitudReparacionAction(
  input: SolicitudReparacionInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  if (!input || typeof input !== 'object' || !UUID_PATTERN.test(input.requestKey)) {
    return { success: false, error: 'No se pudo identificar esta solicitud. Intenta nuevamente.' }
  }

  if (
    typeof input.nombre !== 'string' ||
    typeof input.telefono !== 'string' ||
    typeof input.prenda !== 'string' ||
    typeof input.descripcion !== 'string' ||
    typeof input.fechaDeseada !== 'string' ||
    typeof input.website !== 'string' ||
    input.consentimiento !== true
  ) {
    return { success: false, error: 'Revisa los datos e inténtalo nuevamente.' }
  }

  const fechaDeseada = input.fechaDeseada.trim()
  const fechaParseada = fechaDeseada ? new Date(`${fechaDeseada}T00:00:00.000Z`) : null
  if (
    fechaDeseada &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(fechaDeseada) ||
      !fechaParseada ||
      Number.isNaN(fechaParseada.getTime()) ||
      fechaParseada.toISOString().slice(0, 10) !== fechaDeseada)
  ) {
    return { success: false, error: 'La fecha seleccionada no es válida.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('crear_solicitud_reparacion_publica', {
    p_request_key: input.requestKey,
    p_cliente_nombre: input.nombre.trim(),
    p_cliente_telefono: input.telefono.trim(),
    p_prenda: input.prenda.trim(),
    p_descripcion: input.descripcion.trim(),
    p_fecha_deseada: fechaDeseada || null,
    p_consent: input.consentimiento,
    p_website: input.website
  })

  if (error) return { success: false, error: error.message }
  if (typeof data !== 'string' || !UUID_PATTERN.test(data)) {
    return { success: false, error: 'No se pudo confirmar el registro. Intenta nuevamente.' }
  }
  return { success: true, id: data }
}
