'use client'

import { formatPrice } from '@/lib/formatPrice'

interface Producto {
  id: string
  precio: number
  stock_total?: number
  descuento_porcentaje?: number
}

interface Props {
  productos: Producto[]
}

export default function DashboardSummary({ productos }: Props) {
  // Calcular estadísticas
  const totalProductos = productos.length
  
  const productosConStockBajo = productos.filter(p => 
    (p.stock_total || 0) > 0 && (p.stock_total || 0) <= 10
  ).length
  
  const productosAgotados = productos.filter(p => 
    (p.stock_total || 0) === 0
  ).length
  
  const productosDisponibles = productos.filter(p => 
    (p.stock_total || 0) > 10
  ).length

  // Calcular valor total del inventario
  const valorInventario = productos.reduce((total, producto) => {
    const stock = producto.stock_total || 0
    const precioFinal = producto.descuento_porcentaje 
      ? producto.precio - (producto.precio * producto.descuento_porcentaje / 100)
      : producto.precio
    return total + (precioFinal * stock)
  }, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Productos */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-4xl font-bold">{totalProductos}</span>
        </div>
        <p className="text-blue-100 font-semibold text-sm">Total Productos</p>
      </div>

      {/* Stock Disponible */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-4xl font-bold">{productosDisponibles}</span>
        </div>
        <p className="text-green-100 font-semibold text-sm">🟢 Stock Disponible</p>
        <p className="text-green-200 text-xs mt-1">Más de 10 unidades</p>
      </div>

      {/* Stock Bajo */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-4xl font-bold">{productosConStockBajo}</span>
        </div>
        <p className="text-yellow-100 font-semibold text-sm">🟡 Stock Bajo</p>
        <p className="text-yellow-200 text-xs mt-1">Entre 1 y 10 unidades</p>
      </div>

      {/* Agotados */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-4xl font-bold">{productosAgotados}</span>
        </div>
        <p className="text-red-100 font-semibold text-sm">🔴 Agotados</p>
        <p className="text-red-200 text-xs mt-1">Sin stock disponible</p>
      </div>

      {/* Valor Inventario - Ocupa 2 columnas en desktop */}
      <div className="md:col-span-2 lg:col-span-4 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-purple-100 font-semibold text-sm mb-1">💰 Valor Total del Inventario</p>
              <p className="text-5xl font-bold">{formatPrice(valorInventario)}</p>
            </div>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-purple-200 text-sm">Calculado con precios actuales</p>
            <p className="text-purple-200 text-sm">Incluye descuentos aplicados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
