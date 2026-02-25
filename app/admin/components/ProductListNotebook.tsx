'use client'

import { Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'

interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string
  stock: number
  insignia_url?: string
}

interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string
  stock_total?: number
  variantes_count?: number
  descuento_porcentaje?: number
  en_oferta?: boolean
  variantes?: Variante[]
}

interface Props {
  productos: Producto[]
  expandedProduct: string | null
  editingVariant: string | null
  onToggleExpand: (id: string) => void
  onUpdateDescuento: (id: string, descuento: number) => void
  onToggleOferta: (id: string, currentState: boolean) => void
  onUpdateVarianteStock: (varianteId: string, newStock: number) => void
  onSetEditingVariant: (id: string | null) => void
  onDuplicate: (producto: Producto) => void
  onDelete: (id: string) => void
}

export default function ProductListNotebook({
  productos,
  expandedProduct,
  editingVariant,
  onToggleExpand,
  onUpdateDescuento,
  onToggleOferta,
  onUpdateVarianteStock,
  onSetEditingVariant,
  onDuplicate,
  onDelete
}: Props) {
  const router = useRouter()

  const calcularPrecioFinal = (precio: number, descuento?: number) => {
    if (!descuento || descuento === 0) return precio
    return precio - (precio * descuento / 100)
  }

  if (productos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-12 text-center border-2 border-slate-200 dark:border-slate-700">
        <div className="inline-block p-6 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
          <svg className="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-xl font-bold">No se encontraron productos</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Intenta con otros términos de búsqueda</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header estilo cuaderno */}
      <div className="bg-linear-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl px-6 py-3 shadow-sm border-2 border-slate-300 dark:border-slate-600">
        <div className="grid grid-cols-12 gap-4 items-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          <div className="col-span-1">Imagen</div>
          <div className="col-span-2">Nombre</div>
          <div className="col-span-1">Categoría</div>
          <div className="col-span-1">Precio</div>
          <div className="col-span-2">Descuento</div>
          <div className="col-span-1">Oferta</div>
          <div className="col-span-1">Stock</div>
          <div className="col-span-3 text-center">Acciones</div>
        </div>
      </div>

      {/* Lista de productos */}
      {productos.map((producto) => (
        <div key={producto.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-200 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 overflow-hidden">
          {/* Fila principal */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Imagen */}
              <div className="col-span-1">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-sm border-2 border-slate-200 dark:border-slate-600">
                  {producto.imagen_url ? (
                    <img 
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre */}
              <div className="col-span-2">
                <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{producto.nombre}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{producto.descripcion}</p>
              </div>

              {/* Categoría */}
              <div className="col-span-1">
                <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {producto.categoria}
                </span>
              </div>

              {/* Precio */}
              <div className="col-span-1">
                {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-through block">{formatPrice(producto.precio)}</span>
                    <span className="font-bold text-base text-green-600 dark:text-green-400">
                      {formatPrice(calcularPrecioFinal(producto.precio, producto.descuento_porcentaje))}
                    </span>
                  </div>
                ) : (
                  <span className="font-bold text-base text-slate-900 dark:text-white">{formatPrice(producto.precio)}</span>
                )}
              </div>

              {/* Descuento */}
              <div className="col-span-2">
                <select
                  value={producto.descuento_porcentaje || 0}
                  onChange={(e) => onUpdateDescuento(producto.id, parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
                >
                  <option value="0">Sin descuento</option>
                  <option value="5">5%</option>
                  <option value="10">10%</option>
                  <option value="15">15%</option>
                  <option value="20">20%</option>
                  <option value="30">30%</option>
                  <option value="40">40%</option>
                  <option value="50">50%</option>
                  <option value="60">60%</option>
                  <option value="70">70%</option>
                  <option value="80">80%</option>
                  <option value="90">90%</option>
                </select>
              </div>

              {/* En Oferta */}
              <div className="col-span-1">
                <button
                  onClick={() => onToggleOferta(producto.id, producto.en_oferta || false)}
                  className={`w-full px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    producto.en_oferta
                      ? 'bg-linear-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  {producto.en_oferta ? '🔥 Sí' : 'No'}
                </button>
              </div>

              {/* Stock */}
              <div className="col-span-1">
                <button
                  onClick={() => onToggleExpand(producto.id)}
                  className="w-full"
                >
                  <div className={`text-center px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    (producto.stock_total || 0) > 10 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                      : (producto.stock_total || 0) > 0 
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    <div className="text-lg">{producto.stock_total || 0}</div>
                    <div className="text-xs opacity-75">{expandedProduct === producto.id ? '▼' : '▶'} {producto.variantes_count || 0} var</div>
                  </div>
                </button>
              </div>

              {/* Acciones */}
              <div className="col-span-3">
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => router.push(`/admin/editar/${producto.id}`)}
                    className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDuplicate(producto)}
                    className="p-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                    title="Duplicar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(producto.id)}
                    className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel expandible de variantes */}
          {expandedProduct === producto.id && producto.variantes && producto.variantes.length > 0 && (
            <div className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-6 py-4">
              <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Gestión Rápida de Variantes
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {producto.variantes
                  .sort((a, b) => {
                    const colegioCompare = a.colegio.localeCompare(b.colegio)
                    if (colegioCompare !== 0) return colegioCompare
                    const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
                    return order.indexOf(a.talla) - order.indexOf(b.talla)
                  })
                  .map((variante) => (
                  <div 
                    key={variante.id} 
                    className="bg-white dark:bg-slate-800 p-3 rounded-lg border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 p-0.5">
                          {variante.insignia_url ? (
                            <img 
                              src={variante.insignia_url}
                              alt={variante.colegio}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                              <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block text-sm truncate">{variante.colegio}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">Talla: <span className="font-semibold">{variante.talla}</span></span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold flex-shrink-0 ${
                        variante.stock > 10 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : variante.stock > 0 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {variante.stock}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {editingVariant === variante.id ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            defaultValue={variante.stock}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onUpdateVarianteStock(variante.id, parseInt((e.target as HTMLInputElement).value) || 0)
                              }
                            }}
                            className="flex-1 px-2 py-1 text-sm border-2 border-blue-500 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              const input = document.querySelector(`input[type="number"]`) as HTMLInputElement
                              onUpdateVarianteStock(variante.id, parseInt(input.value) || 0)
                            }}
                            className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs font-bold"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => onSetEditingVariant(null)}
                            className="px-2 py-1 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors text-xs font-bold"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onUpdateVarianteStock(variante.id, Math.max(0, variante.stock - 1))}
                            className="flex-1 bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600 transition-colors text-xs font-bold"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => onSetEditingVariant(variante.id)}
                            className="flex-1 bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-colors text-xs font-bold"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onUpdateVarianteStock(variante.id, variante.stock + 1)}
                            className="flex-1 bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 transition-colors text-xs font-bold"
                          >
                            +1
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
