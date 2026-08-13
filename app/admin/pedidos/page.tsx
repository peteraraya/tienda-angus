'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button } from '@/app/components/ui'
import type { PedidoItem } from '@/types/database'
import AdminHeader from '../components/AdminHeader'
import { useAdminPedidos, type PedidoConProveedor } from '@/app/hooks/useAdminPedidos'

export default function PedidosPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const {
    pedidos,
    isLoadingPedidos,
    updatePedidoEstadoMutation,
    deletePedidoMutation
  } = useAdminPedidos()

  const [expandedPedido, setExpandedPedido] = useState<string | null>(null)
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [pedidosConItems, setPedidosConItems] = useState<PedidoConProveedor[]>([])

  async function loadPedidoItems(pedidoId: string) {
    const pedidoBase = pedidos.find(p => p.id === pedidoId)
    const pedidoLocal = pedidosConItems.find(p => p.id === pedidoId)

    if (pedidoLocal?.items) {
      setExpandedPedido(expandedPedido === pedidoId ? null : pedidoId)
      return
    }

    if (!pedidoBase) return

    const { data: items } = await supabase
      .from('pedido_items')
      .select('*')
      .eq('pedido_id', pedidoId)

    if (items) {
      setPedidosConItems(prev => [
        ...prev.filter(p => p.id !== pedidoId),
        { ...pedidoBase, items }
      ])
      setExpandedPedido(pedidoId)
    }
  }


  async function marcarComoRecibido(pedidoId: string) {
    let pedido = pedidosConItems.find(p => p.id === pedidoId)
    
    // Si no tenemos los items localmente, los obtenemos para procesar la recepción
    if (!pedido || !pedido.items) {
      const pedidoBase = pedidos.find(p => p.id === pedidoId)
      if (!pedidoBase) return

      const { data: items } = await supabase
        .from('pedido_items')
        .select('*')
        .eq('pedido_id', pedidoId)
        
      if (items) {
        pedido = { ...pedidoBase, items }
      } else {
        return
      }
    }

    const confirmed = await confirm({
      title: '¿Marcar pedido como recibido?',
      message: `Se actualizará el inventario con las cantidades recibidas. Esta acción no se puede deshacer.`,
      confirmText: 'Confirmar Recepción',
      variant: 'warning'
    })

    if (!confirmed) return

    try {
      // 1. Actualizar estado del pedido
      const { error: errorPedido } = await supabase
        .from('pedidos')
        .update({
          estado: 'recibido',
          fecha_recepcion: new Date().toISOString()
        })
        .eq('id', pedidoId)

      if (errorPedido) throw new Error('Error al actualizar pedido')

      // 2. Actualizar inventario para cada item
      for (const item of pedido.items!) {
        if (item.variante_id) {
          // Obtener stock actual
          const { data: variante } = await supabase
            .from('variantes')
            .select('stock')
            .eq('id', item.variante_id)
            .single()

          if (variante) {
            // Sumar la cantidad recibida al stock
            const nuevoStock = variante.stock + (item.cantidad_recibida || item.cantidad)
            
            await supabase
              .from('variantes')
              .update({ stock: nuevoStock })
              .eq('id', item.variante_id)
          }
        }

        // Marcar item como recibido
        await supabase
          .from('pedido_items')
          .update({
            recibido: true,
            cantidad_recibida: item.cantidad_recibida || item.cantidad
          })
          .eq('id', item.id)
      }

      // 3. Actualizar estadísticas del proveedor
      const { data: proveedor } = await supabase
        .from('proveedores')
        .select('total_pedidos, cantidad_pedidos')
        .eq('id', pedido.proveedor_id)
        .single()

      if (proveedor) {
        await supabase
          .from('proveedores')
          .update({
            total_pedidos: proveedor.total_pedidos + pedido.total,
            cantidad_pedidos: proveedor.cantidad_pedidos + 1,
            ultimo_pedido: new Date().toISOString()
          })
          .eq('id', pedido.proveedor_id)
      }

      toast.success('Pedido recibido e inventario actualizado')
      updatePedidoEstadoMutation.mutate({ id: pedidoId, estado: 'recibido' })
      // Invalidar cache de productos para que se refleje el nuevo stock
      // Idealmente haríamos queryClient.invalidateQueries() aquí
      window.location.reload()
    } catch (error) {
      console.error('Error al recibir pedido:', error)
      toast.error('Error al procesar la recepción')
    }
  }

  async function cancelarPedido(pedidoId: string, proveedorNombre: string) {
    const confirmed = await confirm({
      title: '¿Cancelar pedido?',
      message: `Se cancelará el pedido de ${proveedorNombre}. Esta acción no se puede deshacer.`,
      confirmText: 'Cancelar Pedido',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await updatePedidoEstadoMutation.mutateAsync({ id: pedidoId, estado: 'cancelado' })
      toast.success('Pedido cancelado')
    } catch (err) {
      toast.error('Error al cancelar pedido')
      console.error(err)
    }
  }

  function formatFecha(fecha?: string) {
    if (!fecha) return '-'
    const date = new Date(fecha)
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const pedidosFiltrados = pedidos.filter(p => {
    if (!estadoFiltro) return true
    return p.estado === estadoFiltro
  })

  const stats = {
    total: pedidos.length,
    pendientes: pedidos.filter(p => p.estado === 'pendiente').length,
    recibidos: pedidos.filter(p => p.estado === 'recibido').length,
    cancelados: pedidos.filter(p => p.estado === 'cancelado').length
  }

  if (isLoadingPedidos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando pedidos...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pb-12">
      <AdminHeader 
        title="📦 Gestión de Pedidos" 
        subtitle="Administra tus órdenes de compra"
        actions={
          <>
            <Button
              onClick={() => router.push('/admin/proveedores')}
              className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 px-4 py-2.5 rounded-xl font-bold transition-all border border-orange-200 dark:border-orange-800"
            >
              🏭 Proveedores
            </Button>
            <Button
              onClick={() => router.push('/admin/pedidos/nuevo')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-sm hover:-translate-y-0.5"
            >
              + Nuevo Pedido
            </Button>
          </>
        }
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Pedidos</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-100 font-semibold text-sm">Pendientes</p>
                <p className="text-3xl font-bold">{stats.pendientes}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-100 font-semibold text-sm">Recibidos</p>
                <p className="text-3xl font-bold">{stats.recibidos}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-red-100 font-semibold text-sm">Cancelados</p>
                <p className="text-3xl font-bold">{stats.cancelados}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 border border-gray-200 dark:border-gray-700 flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <button
              onClick={() => setEstadoFiltro('')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                estadoFiltro === '' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setEstadoFiltro('pendiente')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                estadoFiltro === 'pendiente' 
                  ? 'bg-yellow-500 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setEstadoFiltro('recibido')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-green-500 ${
                estadoFiltro === 'recibido' 
                  ? 'bg-green-500 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Recibidos
            </button>
            <button
              onClick={() => setEstadoFiltro('cancelado')}
              className={`px-5 py-2.5 rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-red-500 ${
                estadoFiltro === 'cancelado' 
                  ? 'bg-red-500 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Cancelados
            </button>
          </div>
        </div>

        {/* Lista de pedidos */}
        <div className="space-y-4">
          {pedidosFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-blue-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin resultados</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron pedidos con este filtro.</p>
            </div>
          ) : (
            pedidosFiltrados.map(pedido => (
              <div key={pedido.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => loadPedidoItems(pedido.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-gray-600 dark:text-gray-400">
                          #{pedido.id.slice(0, 8)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          pedido.estado === 'pendiente' 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : pedido.estado === 'recibido'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }`}>
                          {pedido.estado.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          🏭 {pedido.proveedor_nombre}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          📅 {formatFecha(pedido.fecha_pedido)}
                        </span>
                        {pedido.fecha_esperada && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            ⏰ Esperado: {formatFecha(pedido.fecha_esperada)}
                          </span>
                        )}
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          📦 {pedido.cantidad_items} items
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(pedido.total)}
                        </p>
                      </div>
                      {pedido.estado === 'pendiente' && (
                        <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  marcarComoRecibido(pedido.id)
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm"
                              >
                                ✓ Recibir
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  cancelarPedido(pedido.id, pedido.proveedor_nombre)
                                }}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl font-bold transition-all shadow-sm"
                              >
                                ✕ Cancelar
                              </button>
                        </div>
                      )}
                      <svg 
                        className={`w-6 h-6 text-gray-400 transition-transform ${expandedPedido === pedido.id ? 'rotate-180' : ''}`}
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
                {expandedPedido === pedido.id && (
                  <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-6">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Detalle del pedido:</h3>
                    <div className="space-y-3">
                      {pedidosConItems.find(p => p.id === pedido.id)?.items?.map(item => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 dark:text-white">{item.producto_nombre}</p>
                              {(item.talla || item.colegio) && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.colegio && `${item.colegio}`}
                                  {item.talla && ` - Talla ${item.talla}`}
                                </p>
                              )}
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cantidad: {item.cantidad} × {formatPrice(item.precio_unitario)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">{formatPrice(item.subtotal)}</p>
                              {item.recibido && (
                                <span className="inline-block mt-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded">
                                  ✓ Recibido
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {pedido.notas && (
                      <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>Notas:</strong> {pedido.notas}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}
