'use server'

import { createClient } from '@/utils/supabase/server'

export type StorefrontMetric =
  | 'search'
  | 'no_results'
  | 'product_view'
  | 'variant_selected'
  | 'added_to_order'
  | 'request_started'
  | 'request_registered'
  | 'whatsapp_opened'

const STOREFRONT_METRICS: StorefrontMetric[] = [
  'search',
  'no_results',
  'product_view',
  'variant_selected',
  'added_to_order',
  'request_started',
  'request_registered',
  'whatsapp_opened'
]

export async function trackStorefrontMetricAction(metric: StorefrontMetric): Promise<boolean> {
  if (!STOREFRONT_METRICS.includes(metric)) {
    console.error('Se rechazó una métrica de tienda desconocida.')
    return false
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('record_public_storefront_metric', {
    p_metric: metric
  })

  if (error) {
    console.error('No se pudo guardar la métrica agregada de la tienda:', error)
    return false
  }

  return true
}

export interface StorefrontFunnelMetric {
  metric: StorefrontMetric
  count: number
}

export async function fetchStorefrontFunnelMetricsAction(): Promise<StorefrontFunnelMetric[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_storefront_funnel_metrics')

  if (error) throw new Error(`No se pudieron cargar las métricas de la tienda: ${error.message}`)
  if (!Array.isArray(data)) throw new Error('La respuesta de métricas de la tienda no es válida.')

  return data.map((row: unknown) => {
    if (!row || typeof row !== 'object') {
      throw new Error('La respuesta de métricas de la tienda contiene un registro inválido.')
    }

    const record = row as Record<string, unknown>
    if (
      typeof record.metric !== 'string' ||
      !STOREFRONT_METRICS.includes(record.metric as StorefrontMetric) ||
      !Number.isFinite(Number(record.count))
    ) {
      throw new Error('La respuesta de métricas de la tienda contiene un registro inválido.')
    }

    return {
      metric: record.metric as StorefrontMetric,
      count: Number(record.count)
    }
  })
}
