'use client'

import { useQuery } from '@tanstack/react-query'
import {
  fetchStorefrontFunnelMetricsAction,
  type StorefrontMetric
} from '@/app/actions/storefront-metrics'

const METRIC_LABELS: Record<StorefrontMetric, string> = {
  search: 'Búsquedas',
  no_results: 'Búsquedas sin resultados',
  product_view: 'Detalles de producto abiertos',
  variant_selected: 'Tallas o colegios seleccionados',
  added_to_order: 'Productos añadidos al pedido',
  request_started: 'Solicitudes iniciadas',
  request_registered: 'Solicitudes registradas',
  whatsapp_opened: 'Clics para continuar por WhatsApp'
}

const METRIC_ORDER: StorefrontMetric[] = [
  'search',
  'no_results',
  'product_view',
  'variant_selected',
  'added_to_order',
  'request_started',
  'request_registered',
  'whatsapp_opened'
]

export function StorefrontFunnelMetrics() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['adminStorefrontFunnelMetrics'],
    queryFn: fetchStorefrontFunnelMetricsAction,
    staleTime: 60_000
  })

  if (isLoading) {
    return (
      <section aria-label="Embudo de la tienda" className="mb-4 animate-pulse rounded-xl border border-[#123f3d]/10 bg-[#fffdf9] p-4 dark:border-white/10 dark:bg-[#142b2a]">
        <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-700" />
      </section>
    )
  }

  if (isError || !data) {
    return (
      <section role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
        <p>{error instanceof Error ? error.message : 'No se pudieron cargar las métricas de la tienda.'}</p>
        <button type="button" onClick={() => void refetch()} className="mt-2 min-h-11 rounded-lg px-3 font-semibold underline">
          Reintentar
        </button>
      </section>
    )
  }

  const counts = new Map(data.map(({ metric, count }) => [metric, count]))

  return (
    <section className="mb-4 rounded-xl border border-[#123f3d]/10 bg-[#fffdf9] p-4 shadow-sm dark:border-white/10 dark:bg-[#142b2a]">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold text-[#173b39] dark:text-[#edf5f2]">Embudo de la tienda · últimos 30 días</h2>
        <p className="text-xs text-[#5f7a73] dark:text-[#bfd4d0]">Conteos de acciones, no visitantes únicos ni ventas confirmadas.</p>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {METRIC_ORDER.map(metric => (
          <div key={metric} className="rounded-lg border border-[#123f3d]/10 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
            <dt className="text-xs leading-5 text-[#5f7a73] dark:text-[#bfd4d0]">{METRIC_LABELS[metric]}</dt>
            <dd className="mt-1 text-xl font-black tabular-nums text-[#123f3d] dark:text-[#e7c77c]">
              {(counts.get(metric) ?? 0).toLocaleString('es-CL')}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
