'use client'

import { formatPrice } from '@/lib/formatPrice'

interface Variante {
  id: string
  stock: number
}

interface Producto {
  id: string
  precio: number
  stock_total?: number
  descuento_porcentaje?: number
  variantes?: Variante[]
}

interface Props {
  productos: Producto[]
}

export default function DashboardSummary({ productos }: Props) {
  // Obtener todas las variantes de todos los productos
  const todasLasVariantes = productos.flatMap(p => p.variantes || [])
  
  // Calcular estadísticas por UNIDADES DE STOCK (no por cantidad de variantes)
  const totalVariantes = todasLasVariantes.length
  
  // Sumar UNIDADES de stock disponible (stock > 6)
  const unidadesDisponibles = todasLasVariantes.reduce((total, v) => {
    return v.stock > 6 ? total + v.stock : total
  }, 0)
  
  // Sumar UNIDADES de stock bajo (1-6)
  const unidadesStockBajo = todasLasVariantes.reduce((total, v) => {
    return v.stock > 0 && v.stock <= 6 ? total + v.stock : total
  }, 0)
  
  // Contar variantes agotadas (0 unidades)
  const variantesAgotadas = todasLasVariantes.filter(v => v.stock === 0).length

  // Calcular valor total del inventario
  const valorInventario = productos.reduce((total, producto) => {
    const stock = producto.stock_total || 0
    const precioFinal = producto.descuento_porcentaje 
      ? producto.precio - (producto.precio * producto.descuento_porcentaje / 100)
      : producto.precio
    return total + (precioFinal * stock)
  }, 0)

  // Calcular total de productos únicos
  const totalProductos = productos.length

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* Total Productos */}
      <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 text-white shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <span className="text-3xl lg:text-4xl font-bold">{totalProductos}</span>
        </div>
        <p className="text-blue-100 font-semibold text-sm">Productos</p>
        <p className="text-blue-200 text-xs mt-1">{totalVariantes} variantes</p>
      </div>

      {/* Stock Disponible */}
      <div className="bg-white dark:bg-slate-800 border border-green-100 dark:border-slate-700 dark:from-green-600 dark:to-green-700 rounded-xl p-6 text-white shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-3xl lg:text-4xl font-bold">{unidadesDisponibles}</span>
        </div>
        <p className="text-green-100 font-semibold text-sm">🟢 Disponibles</p>
        <p className="text-green-200 text-xs mt-1">Unidades con +6 stock</p>
      </div>

      {/* Stock Bajo */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 rounded-xl p-6 text-white shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-3xl lg:text-4xl font-bold">{unidadesStockBajo}</span>
        </div>
        <p className="text-yellow-100 font-semibold text-sm">🟡 Stock Bajo</p>
        <p className="text-yellow-200 text-xs mt-1">Unidades entre 1-6</p>
      </div>

      {/* Agotados */}
      <div className="bg-white dark:bg-slate-800 border border-red-100 dark:border-slate-700 dark:from-red-600 dark:to-red-700 rounded-xl p-6 text-white shadow-sm hover:shadow-xl transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="p-3 bg-white/20 rounded-xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <span className="text-4xl font-bold">{variantesAgotadas}</span>
        </div>
        <p className="text-red-100 font-semibold text-sm">🔴 Agotados</p>
        <p className="text-red-200 text-xs mt-1">Variantes sin stock</p>
      </div>

      {/* Valor Inventario */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl p-6 text-white shadow-sm hover:shadow-xl transition-all">
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-purple-100 font-semibold text-xs mb-1">💰 Valor Inventario</p>
              <p className="text-2xl font-bold truncate">{formatPrice(valorInventario)}</p>
            </div>
          </div>
          <p className="text-purple-200 text-xs">Con precios actuales</p>
        </div>
      </div>
    </div>
  )
}
