'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { Button } from '@/app/components/ui'
import type { Venta as DBVenta, VentaItem } from '@/types/database'

interface Venta extends DBVenta {
  items?: VentaItem[]
}

export default function HistorialVentasPage() {
  const router = useRouter()
  const toast = useToast()
  
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedVenta, setExpandedVenta] = useState<string | null>(null)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  async function loadVentas() {
    setLoading(true)
    
    let query = supabase
      .from('ventas')
      .select('*')
      .order('fecha', { ascending: false })

    if (fechaInicio) {
      query = query.gte('fecha', new Date(fechaInicio).toISOString())
    }
    if (fechaFin) {
      const fechaFinDate = new Date(fechaFin)
      fechaFinDate.setHours(23, 59, 59, 999)
      query = query.lte('fecha', fechaFinDate.toISOString())
    }

    const { data: ventasData } = await query

    if (ventasData) {
      setVentas(ventasData)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    loadVentas()
  }, [])

  async function loadVentaItems(ventaId: string) {
    const venta = ventas.find(v => v.id === ventaId)
    if (venta?.items) {
      // Ya están cargados
      setExpandedVenta(expandedVenta === ventaId ? null : ventaId)
      return
    }

    const { data: items } = await supabase
      .from('venta_items')
      .select('*')
      .eq('venta_id', ventaId)
      .order('created_at', { ascending: true })

    if (items) {
      setVentas(ventas.map(v => 
        v.id === ventaId ? { ...v, items } : v
      ))
      setExpandedVenta(ventaId)
    }
  }

  function formatFecha(fecha: string) {
    const date = new Date(fecha)
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  function formatFechaCorta(fecha: string) {
    const date = new Date(fecha)
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const calcularEstadisticas = () => {
    const totalVentas = ventas.reduce((sum, v) => sum + v.total, 0)
    const totalItems = ventas.reduce((sum, v) => sum + v.cantidad_items, 0)
    const promedioVenta = ventas.length > 0 ? totalVentas / ventas.length : 0

    return { totalVentas, totalItems, promedioVenta, cantidadVentas: ventas.length }
  }

  const stats = calcularEstadisticas()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando historial...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin/ventas')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm overflow-hidden bg-white dark:bg-gray-800 ml-2">
                <img 
                  src="/logo-confecciones.png" 
                  alt="Confecciones Angus" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  📊 Historial de Ventas
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Registro completo de transacciones</p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/admin')}
              className="bg-gradient-to-br from-gray-600 to-gray-700 text-gray-900 dark:text-white px-5 py-2.5 rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-sm"
            >
              Volver al Admin
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Ventas</p>
                <p className="text-3xl font-bold">{stats.cantidadVentas}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-100 font-semibold text-sm">Ingresos</p>
                <p className="text-3xl font-bold">{formatPrice(stats.totalVentas)}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-purple-100 font-semibold text-sm">Items Vendidos</p>
                <p className="text-3xl font-bold">{stats.totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-orange-100 font-semibold text-sm">Promedio de Venta</p>
                <p className="text-3xl font-bold">{formatPrice(stats.promedioVenta)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha Inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fecha Fin</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex items-end gap-3">
              <Button
                onClick={loadVentas}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white py-3 rounded-xl font-bold transition-all shadow-sm"
              >
                Filtrar
              </Button>
              <Button
                onClick={() => {
                  setFechaInicio('')
                  setFechaFin('')
                  loadVentas()
                }}
                className="px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-900 dark:text-white py-3 rounded-xl font-bold transition-all shadow-sm"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {/* Lista de ventas */}
        <div className="space-y-4">
          {ventas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-blue-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2-2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin ventas</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron ventas para este rango de fechas.</p>
            </div>
          ) : (
            ventas.map(venta => (
              <div key={venta.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => loadVentaItems(venta.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400">
                          #{venta.id.slice(0, 8)}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatFechaCorta(venta.fecha)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          👤 {venta.vendedor}
                        </span>
                        {venta.cliente_nombre && (
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            🛍️ {venta.cliente_nombre}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          📦 {venta.cantidad_items} items
                        </span>
                        {venta.notas && (
                          <span className="text-sm text-gray-600 dark:text-gray-400 italic">
                            📝 {venta.notas}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {venta.descuento_total > 0 && (
                          <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                            Descuento: {formatPrice(venta.descuento_total)}
                          </p>
                        )}
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(venta.total)}
                        </p>
                      </div>
                      <svg 
                        className={`w-6 h-6 text-gray-400 transition-transform ${expandedVenta === venta.id ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Detalle de items */}
                {expandedVenta === venta.id && venta.items && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
                    {/* Información del cliente */}
                    {venta.cliente_nombre && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Información del Cliente
                        </h4>
                        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                          <p><strong>Nombre:</strong> {venta.cliente_nombre}</p>
                          {venta.cliente_telefono && <p><strong>Teléfono:</strong> {venta.cliente_telefono}</p>}
                          {venta.cliente_contacto && <p><strong>Contacto:</strong> {venta.cliente_contacto}</p>}
                        </div>
                      </div>
                    )}

                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detalle de la venta:</h3>
                    <div className="space-y-3">
                      {venta.items.map(item => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{item.producto_nombre}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {item.colegio} - Talla {item.talla}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cantidad: {item.cantidad} × {formatPrice(item.precio_final)}
                                {item.descuento_porcentaje > 0 && (
                                  <span className="text-green-600 dark:text-green-400 ml-2">
                                    (-{item.descuento_porcentaje}%)
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">{formatPrice(item.subtotal)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
