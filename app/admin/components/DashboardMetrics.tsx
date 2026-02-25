'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/formatPrice'

interface Metrics {
  ventasHoy: {
    total: number
    cantidad: number
  }
  ventasSemana: {
    total: number
    cantidad: number
  }
  ventasMes: {
    total: number
    cantidad: number
  }
  stockBajo: number
  pedidosPendientes: number
  clientesNuevos: number
  productosMasVendidos: Array<{
    nombre: string
    cantidad: number
  }>
}

export function DashboardMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [])

  async function loadMetrics() {
    try {
      const now = new Date()
      const hoyInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const semanaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const mesInicio = new Date(now.getFullYear(), now.getMonth(), 1)

      // Ventas de hoy
      const { data: ventasHoy } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', hoyInicio.toISOString())

      // Ventas de la semana
      const { data: ventasSemana } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', semanaInicio.toISOString())

      // Ventas del mes
      const { data: ventasMes } = await supabase
        .from('ventas')
        .select('total')
        .gte('fecha', mesInicio.toISOString())

      // Stock bajo
      const { count: stockBajo } = await supabase
        .from('variantes')
        .select('*', { count: 'exact', head: true })
        .lte('stock', 10)

      // Pedidos pendientes
      const { count: pedidosPendientes } = await supabase
        .from('pedidos')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Clientes nuevos este mes
      const { count: clientesNuevos } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', mesInicio.toISOString())

      // Productos más vendidos (últimos 30 días)
      const treintaDiasAtras = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const { data: ventasRecientes } = await supabase
        .from('venta_items')
        .select(`
          cantidad,
          variante_id,
          variantes!inner(producto_id),
          productos:variantes(productos!inner(nombre))
        `)
        .gte('created_at', treintaDiasAtras.toISOString())

      // Procesar productos más vendidos
      const productosMap = new Map<string, number>()
      ventasRecientes?.forEach((item: any) => {
        const nombre = item.productos?.productos?.nombre
        if (nombre) {
          productosMap.set(nombre, (productosMap.get(nombre) || 0) + item.cantidad)
        }
      })

      const productosMasVendidos = Array.from(productosMap.entries())
        .map(([nombre, cantidad]) => ({ nombre, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5)

      setMetrics({
        ventasHoy: {
          total: ventasHoy?.reduce((sum, v) => sum + v.total, 0) || 0,
          cantidad: ventasHoy?.length || 0
        },
        ventasSemana: {
          total: ventasSemana?.reduce((sum, v) => sum + v.total, 0) || 0,
          cantidad: ventasSemana?.length || 0
        },
        ventasMes: {
          total: ventasMes?.reduce((sum, v) => sum + v.total, 0) || 0,
          cantidad: ventasMes?.length || 0
        },
        stockBajo: stockBajo || 0,
        pedidosPendientes: pedidosPendientes || 0,
        clientesNuevos: clientesNuevos || 0,
        productosMasVendidos
      })
    } catch (error) {
      console.error('Error al cargar métricas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6 mb-8">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ventas de hoy */}
        <MetricCard
          title="Ventas Hoy"
          value={formatPrice(metrics.ventasHoy.total)}
          subtitle={`${metrics.ventasHoy.cantidad} ventas`}
          icon="💰"
          color="blue"
        />

        {/* Ventas de la semana */}
        <MetricCard
          title="Ventas Semana"
          value={formatPrice(metrics.ventasSemana.total)}
          subtitle={`${metrics.ventasSemana.cantidad} ventas`}
          icon="📊"
          color="green"
        />

        {/* Ventas del mes */}
        <MetricCard
          title="Ventas Mes"
          value={formatPrice(metrics.ventasMes.total)}
          subtitle={`${metrics.ventasMes.cantidad} ventas`}
          icon="📈"
          color="purple"
        />

        {/* Clientes nuevos */}
        <MetricCard
          title="Clientes Nuevos"
          value={metrics.clientesNuevos.toString()}
          subtitle="Este mes"
          icon="👥"
          color="indigo"
        />
      </div>

      {/* Alertas y productos más vendidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>⚠️</span>
            Alertas
          </h3>
          <div className="space-y-3">
            <AlertItem
              label="Stock Bajo"
              value={metrics.stockBajo}
              color="orange"
              link="/admin"
            />
            <AlertItem
              label="Pedidos Pendientes"
              value={metrics.pedidosPendientes}
              color="yellow"
              link="/admin/pedidos"
            />
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🏆</span>
            Top 5 Productos (30 días)
          </h3>
          <div className="space-y-2">
            {metrics.productosMasVendidos.length > 0 ? (
              metrics.productosMasVendidos.map((producto, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-400 dark:text-gray-500 w-6">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {producto.nombre}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
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
  )
}

interface MetricCardProps {
  title: string
  value: string
  subtitle: string
  icon: string
  color: 'blue' | 'green' | 'purple' | 'indigo' | 'orange' | 'yellow'
}

function MetricCard({ title, value, subtitle, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-orange-600',
    yellow: 'from-yellow-500 to-yellow-600'
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {subtitle}
          </p>
        </div>
        <div className={`text-3xl p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]} bg-opacity-10`}>
          {icon}
        </div>
      </div>
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
      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <span className={`px-3 py-1 rounded-full text-sm font-bold ${colorClasses[color]}`}>
        {value}
      </span>
    </a>
  )
}
