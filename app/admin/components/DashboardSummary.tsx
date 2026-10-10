'use client'

import { formatPrice } from '@/lib/formatPrice'
import type { AdminInventorySummary } from '@/app/actions/productos'

interface Props {
  summary: AdminInventorySummary
}

export default function DashboardSummary({ summary }: Props) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <SummaryCard label="Productos" value={summary.totalProductos.toLocaleString('es-CL')} detail={`${summary.totalVariantes} variantes`} />
      <SummaryCard label="Stock disponible" value={summary.unidadesDisponibles.toLocaleString('es-CL')} detail="Más de 6 unidades" tone="positive" />
      <SummaryCard label="Stock bajo" value={summary.unidadesStockBajo.toLocaleString('es-CL')} detail="Entre 1 y 6 unidades" tone="warning" />
      <SummaryCard label="Variantes agotadas" value={summary.variantesAgotadas.toLocaleString('es-CL')} detail="Sin unidades" tone="critical" />
      <SummaryCard label="Valor del inventario" value={formatPrice(summary.valorInventario)} detail="A precios vigentes" />
    </div>
  )
}

function SummaryCard({ label, value, detail, tone = 'neutral' }: {
  label: string
  value: string
  detail: string
  tone?: 'neutral' | 'positive' | 'warning' | 'critical'
}) {
  const valueColor = {
    neutral: 'text-[#173b39] dark:text-[#edf5f2]',
    positive: 'text-[#2f6f5a] dark:text-[#8ac7ae]',
    warning: 'text-[#9a681a] dark:text-[#e7c77c]',
    critical: 'text-[#a23f37] dark:text-[#f0a59e]'
  }[tone]

  return (
    <article className="min-w-0 rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] px-3 py-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:px-4">
      <p className="truncate text-xs font-medium text-[#5f7a73] dark:text-[#bfd4d0]">{label}</p>
      <p className={`mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl ${valueColor}`}>{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-[#6e827f] dark:text-[#aec7c4]">{detail}</p>
    </article>
  )
}
