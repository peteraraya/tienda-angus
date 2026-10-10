'use server'

import { createClient } from '@/utils/supabase/server'
import { getProductFinalPrice } from '@/lib/productPricing'

export interface AssistantProductResult {
  name: string
  price: number
  category: string
  variants: { size: string; school: string; stock: number }[]
}

export type AssistantActionResult<T> = { success: true; data: T } | { success: false; error: string }

const normalizeText = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-CL')

const ignoredTerms = new Set([
  'hay', 'tienen', 'tiene', 'stock', 'disponible', 'disponibles', 'producto', 'productos',
  'quiero', 'busco', 'necesito', 'para', 'del', 'de', 'la', 'el', 'los', 'las', 'un', 'una',
  'por', 'favor', 'precio', 'cuanto', 'cuesta', 'colegio', 'talla', 'tallas', 'uniforme',
  'escolar', 'en', 'con', 'que', 'me', 'pueden', 'mostrar', 'ver', 'saber'
])

export async function buscarInventarioAsistenteAction(
  question: string
): Promise<AssistantActionResult<AssistantProductResult[]>> {
  if (typeof question !== 'string' || question.trim().length < 2 || question.length > 160) {
    return { success: false, error: 'Escribe el nombre de una prenda o producto (máximo 160 caracteres).' }
  }

  const normalized = normalizeText(question)
  const terms = normalized.match(/[a-z0-9]+/g) ?? []
  const searchTerm = terms.find(term => term.length >= 3 && !ignoredTerms.has(term))
  if (!searchTerm) {
    return { success: false, error: 'Cuéntame qué prenda buscas, por ejemplo: “buzo talla 10”.' }
  }

  const supabase = await createClient()
  const { data: products, error: productError } = await supabase
    .from('productos')
    .select('id, nombre, precio, categoria, descuento_porcentaje')
    .or('activo.is.null,activo.eq.true')
    .ilike('nombre', `%${searchTerm}%`)
    .order('nombre', { ascending: true })
    .limit(8)

  if (productError) {
    console.error('Assistant inventory product lookup failed:', productError.message)
    return { success: false, error: 'No pude consultar el inventario ahora. Inténtalo nuevamente o escríbenos por WhatsApp.' }
  }
  if (!products?.length) return { success: true, data: [] }

  const variants: { producto_id: string; talla: string; colegio: string; stock: number; precio: number | null }[] = []
  let variantOffset = 0
  while (true) {
    const { data, error } = await supabase
      .from('variantes')
      .select('producto_id, talla, colegio, stock, precio')
      .in('producto_id', products.map(product => product.id))
      .gt('stock', 0)
      .range(variantOffset, variantOffset + 499)

    if (error) {
      console.error('Assistant inventory variant lookup failed:', error.message)
      return { success: false, error: 'No pude consultar las tallas disponibles ahora. Inténtalo nuevamente o escríbenos por WhatsApp.' }
    }
    variants.push(...(data ?? []))
    if (!data || data.length < 500) break
    variantOffset += 500
  }

  const requestedSize = terms.find(term => /^\d{1,3}$/.test(term)) ??
    terms.find(term => variants.some(variant => normalizeText(variant.talla) === term))
  const schoolWords = terms.filter(term =>
    term.length >= 3 && !ignoredTerms.has(term) && term !== searchTerm && term !== requestedSize && !/^\d+$/.test(term)
  )
  const results = products.map(product => {
    const productVariants = variants.filter(variant => variant.producto_id === product.id)
    const schoolFilterTerm = schoolWords.find(term =>
      productVariants.some(variant => normalizeText(variant.colegio).includes(term))
    )
    const matchingVariants = productVariants
      .filter(variant => {
        if (requestedSize && !normalizeText(variant.talla).includes(requestedSize)) return false
        if (schoolFilterTerm && !normalizeText(variant.colegio).includes(schoolFilterTerm)) return false
        return true
      })
      .map(variant => ({
        size: variant.talla,
        school: variant.colegio,
        stock: variant.stock
      }))
    return {
      name: product.nombre,
      category: product.categoria,
      price: getProductFinalPrice({
        precio: product.precio,
        descuento_porcentaje: product.descuento_porcentaje,
        variantes: productVariants
      }),
      variants: matchingVariants
    }
  }).filter(product => product.variants.length > 0)

  return { success: true, data: results.slice(0, 4) }
}

export async function consultarEstadoReparacionAsistenteAction(
  trackingCode: string
): Promise<AssistantActionResult<{ status: string; updatedAt: string }>> {
  if (typeof trackingCode !== 'string' || !/^[a-f0-9]{64}$/i.test(trackingCode.trim())) {
    return { success: false, error: 'El código no coincide. Revisa los 64 caracteres que recibiste al registrar tu solicitud.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('consultar_estado_reparacion_publico', {
    p_tracking_token: trackingCode.trim().toLowerCase()
  })

  if (error) {
    console.error('Assistant repair status lookup failed:', error.message)
    return { success: false, error: 'No se pudo verificar el estado en este momento. Inténtalo nuevamente o contáctanos por WhatsApp.' }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, error: 'No encontramos una solicitud con ese código. Revisa el código o contáctanos por WhatsApp.' }
  }

  const result = data as { estado?: unknown; updated_at?: unknown }
  if (
    typeof result.estado !== 'string' ||
    typeof result.updated_at !== 'string' ||
    !['pendiente', 'cotizada', 'aceptada', 'completada', 'cancelada'].includes(result.estado)
  ) {
    console.error('Assistant repair status lookup returned an invalid response')
    return { success: false, error: 'No se pudo verificar el estado en este momento. Inténtalo nuevamente o contáctanos por WhatsApp.' }
  }

  return { success: true, data: { status: result.estado, updatedAt: result.updated_at } }
}
