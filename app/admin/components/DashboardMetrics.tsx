'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '@/lib/formatPrice'
import { fetchAdminDashboardMetricsAction } from '@/app/actions/dashboard'
import Link from 'next/link'

export function DashboardMetrics() {
  const {
    data: metrics,
    isLoading: loading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['adminDashboardMetrics'],
    queryFn: fetchAdminDashboardMetricsAction,
    staleTime: 60_000
  })
  const [isExpanded, setIsExpanded] = useState(false)

  if (loading) {
    return (
      <div className="mb-4">
        <div className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-4 shadow-sm animate-pulse dark:border-white/10 dark:bg-[#142b2a]">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        </div>
      </div>
    )
  }

  if (isError || !metrics) {
    return (
      <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
        <p>{error instanceof Error ? error.message : 'No se pudieron cargar las métricas.'}</p>
        <button onClick={() => void refetch()} className="mt-2 min-h-11 rounded-lg px-3 font-semibold underline">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] shadow-sm dark:border-white/10 dark:bg-[#142b2a]">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="dashboard-metrics-content"
        className="w-full px-3 py-3 text-left transition-colors hover:bg-[#f7f1e7] dark:hover:bg-white/5 sm:px-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#173b39] dark:text-[#edf5f2]">
              Ventas y actividad
            </h2>
          </div>
          
          {/* Resumen compacto cuando está cerrado */}
          {!isExpanded && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-[#5f7a73] dark:text-[#bfd4d0]">Hoy</span>
                <span className="font-semibold text-[#2f6f5a] dark:text-[#8ac7ae]">
                  {formatPrice(metrics.ventasHoy.total)}
                </span>
              </div>
              {metrics.pedidosPendientes > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#9a681a] dark:text-[#e7c77c]">
                    {metrics.pedidosPendientes} compras
                  </span>
                </div>
              )}
              {metrics.solicitudesPendientes > 0 && (
                <Link href="/admin/solicitudes" className="font-semibold text-[#9a681a] hover:underline dark:text-[#e7c77c]">
                  {metrics.solicitudesPendientes} solicitudes web
                </Link>
              )}
              {metrics.reparacionesPendientes > 0 && (
                <Link href="/admin/reparaciones" className="font-semibold text-[#9a681a] hover:underline dark:text-[#e7c77c]">
                  {metrics.reparacionesPendientes} arreglos
                </Link>
              )}
            </div>
          )}

          {/* Icono de expandir/colapsar */}
          <svg
            className={`w-5 h-5 text-[#5f7a73] dark:text-[#bfd4d0] transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div id="dashboard-metrics-content" className="space-y-4 border-t border-[#123f3d]/10 p-3 dark:border-white/10 sm:p-4">
          <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            <MetricCard
              title="Ventas Hoy"
              value={formatPrice(metrics.ventasHoy.total)}
              subtitle={`${metrics.ventasHoy.cantidad} ventas`}
            />
            <MetricCard
              title="Ventas Semana"
              value={formatPrice(metrics.ventasSemana.total)}
              subtitle={`${metrics.ventasSemana.cantidad} ventas`}
            />
            <MetricCard
              title="Ventas Mes"
              value={formatPrice(metrics.ventasMes.total)}
              subtitle={`${metrics.ventasMes.cantidad} ventas`}
            />
            <MetricCard
              title="Clientes Nuevos"
              value={metrics.clientesNuevos.toString()}
              subtitle="Este mes"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-lg border border-[#123f3d]/10 p-3 dark:border-white/10 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#173b39] dark:text-[#edf5f2]">
                Pendientes
              </h3>
              <div className="space-y-3">
                <AlertItem
                  label="Compras Pendientes"
                  value={metrics.pedidosPendientes}
                  color="yellow"
                  link="/admin/pedidos"
                />
                <AlertItem
                  label="Solicitudes Web"
                  value={metrics.solicitudesPendientes}
                  color="orange"
                  link="/admin/solicitudes"
                />
                <AlertItem
                  label="Arreglos por revisar"
                  value={metrics.reparacionesPendientes}
                  color="yellow"
                  link="/admin/reparaciones"
                />
              </div>
            </div>

            <div className="rounded-lg border border-[#123f3d]/10 p-3 dark:border-white/10 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold text-[#173b39] dark:text-[#edf5f2]">
                Top 5 Productos (30 días)
              </h3>
              <div className="space-y-2">
                {metrics.productosMasVendidos.length > 0 ? (
                  metrics.productosMasVendidos.map((producto, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-[#123f3d]/5 px-2 py-2 last:border-0 hover:bg-[#f7f1e7] dark:border-white/5 dark:hover:bg-white/5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 text-xs font-semibold text-[#6e827f] dark:text-[#aec7c4]">
                          {index + 1}
                        </span>
                        <span className="text-sm text-[#173b39] dark:text-[#edf5f2]">
                          {producto.nombre}
                        </span>
                      </div>
                      <span className="text-xs font-medium text-[#123f3d] dark:text-[#8ac7ae]">
                        {producto.cantidad} vendidos
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No hay datos de ventas
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
}

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="min-w-0 rounded-md border border-[#123f3d]/10 px-3 py-3 dark:border-white/10">
      <p className="truncate text-xs font-medium text-[#5f7a73] dark:text-[#bfd4d0]">{title}</p>
      <p className="mt-1 truncate text-lg font-semibold text-[#173b39] dark:text-[#edf5f2]">{value}</p>
      <p className="mt-0.5 text-[11px] text-[#6e827f] dark:text-[#aec7c4]">{subtitle}</p>
    </div>
  )
}

interface AlertItemProps {
  label: string
  value: number
  color: 'orange' | 'yellow'
  link: string
}

function AlertItem({ label, value, color, link }: AlertItemProps) {
  const colorClasses = {
    orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300'
  }

  return (
    <a
      href={link}
      className="flex min-h-10 items-center justify-between border-b border-[#123f3d]/5 px-2 py-2 last:border-0 hover:bg-[#f7f1e7] dark:border-white/5 dark:hover:bg-white/5"
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <span className={`min-w-8 rounded-md px-2 py-1 text-center text-xs font-semibold ${colorClasses[color]}`}>
        {value}
      </span>
    </a>
  )
}
