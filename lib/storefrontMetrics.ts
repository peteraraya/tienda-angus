'use client'

import { trackStorefrontMetricAction, type StorefrontMetric } from '@/app/actions/storefront-metrics'

export function trackStorefrontMetric(metric: StorefrontMetric): void {
  void trackStorefrontMetricAction(metric).catch(error => {
    console.error('No se pudo enviar una métrica agregada de la tienda:', error)
  })
}
