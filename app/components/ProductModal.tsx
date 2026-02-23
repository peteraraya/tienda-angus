'use client'

import { useEffect } from 'react'

interface Variante {
  talla: string
  color: string
  stock: number
}

interface ProductModalProps {
  producto: {
    id: string
    nombre: string
    descripcion: string
    precio: number
    categoria: string
    imagen_url?: string
    variantes: Variante[]
    stock_total: number
  }
  onClose: () => void
}

export default function ProductModal({ producto, onClose }: ProductModalProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))]
  const coloresDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.color))]

  // Agrupar variantes por color
  const variantesPorColor = producto.variantes.reduce((acc, v) => {
    if (!acc[v.color]) acc[v.color] = []
    acc[v.color].push(v)
    return acc
  }, {} as Record<string, Variante[]>)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Detalles del Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Imagen */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
              {producto.imagen_url ? (
                <img 
                  src={producto.imagen_url} 
                  alt={producto.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-32 h-32 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              {producto.stock_total === 0 && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">AGOTADO</span>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="flex flex-col">
              <div className="mb-4">
                <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-sm font-bold px-4 py-2 rounded-full mb-3">
                  {producto.categoria}
                </span>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{producto.nombre}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{producto.descripcion}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    ${producto.precio}
                  </span>
                  <span className={`text-sm font-bold px-4 py-2 rounded-full ${
                    producto.stock_total > 10 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : producto.stock_total > 0 
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {producto.stock_total > 0 ? `${producto.stock_total} disponibles` : 'Sin stock'}
                  </span>
                </div>
              </div>

              {/* Disponibilidad por color */}
              <div className="space-y-6 flex-1">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                    Disponibilidad por Color
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(variantesPorColor).map(([color, variantes]) => {
                      const stockColor = variantes.reduce((sum, v) => sum + v.stock, 0)
                      if (stockColor === 0) return null
                      
                      return (
                        <div key={color} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-gray-900 dark:text-white">{color}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{stockColor} unidades</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {variantes
                              .filter(v => v.stock > 0)
                              .sort((a, b) => {
                                const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
                                return order.indexOf(a.talla) - order.indexOf(b.talla)
                              })
                              .map((v) => (
                                <div 
                                  key={`${v.talla}-${v.color}`}
                                  className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-center"
                                >
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">{v.talla}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">{v.stock} unid.</div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
