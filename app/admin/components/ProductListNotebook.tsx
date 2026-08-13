'use client'

import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

export interface Variante extends DBVariante {
  insignia_url?: string
}

export interface Producto extends DBProducto {
  stock_total?: number
  variantes_count?: number
  variantes?: Variante[]
}

interface Props {
  productos: Producto[]
  expandedProduct: string | null
  editingVariant: string | null
  editingProductName: string | null
  editingProductPrice: string | null
  editingProductNotas: string | null
  variantSearchTerm?: string
  selectedColegio?: string
  selectedTalla?: string
  onToggleExpand: (id: string) => void
  onUpdateDescuento: (id: string, descuento: number) => void
  onToggleOferta: (id: string, currentState: boolean) => void
  onUpdateVarianteStock: (varianteId: string, newStock: number) => void
  onSetEditingVariant: (id: string | null) => void
  onSetEditingProductName: (id: string | null) => void
  onSetEditingProductPrice: (id: string | null) => void
  onSetEditingProductNotas: (id: string | null) => void
  onUpdateProductName: (id: string, nombre: string) => void
  onUpdateProductPrice: (id: string, precio: number) => void
  onUpdateProductNotas: (id: string, notas: string) => void
  onDuplicate: (producto: Producto) => void
  onDelete: (id: string) => void
  onSetVariantSearchTerm?: (term: string) => void
}

export default function ProductListNotebook({
  productos,
  expandedProduct,
  editingVariant,
  editingProductName,
  editingProductPrice,
  editingProductNotas,
  variantSearchTerm = '',
  selectedColegio = '',
  selectedTalla = '',
  onToggleExpand,
  onUpdateDescuento,
  onToggleOferta,
  onUpdateVarianteStock,
  onSetEditingVariant,
  onSetEditingProductName,
  onSetEditingProductPrice,
  onSetEditingProductNotas,
  onUpdateProductName,
  onUpdateProductPrice,
  onUpdateProductNotas,
  onDuplicate,
  onDelete,
  onSetVariantSearchTerm
}: Props) {
  const router = useRouter()

  const calcularPrecioFinal = (precio: number, descuento?: number) => {
    if (!descuento || descuento === 0) return precio
    return precio - (precio * descuento / 100)
  }

  // Función para filtrar variantes según filtros globales y búsqueda local
  const filterVariantes = (variantes: Variante[]) => {
    console.log('🔍 Filtrando variantes:', {
      totalVariantes: variantes.length,
      selectedColegio,
      selectedTalla,
      variantSearchTerm
    })
    
    const filtered = variantes.filter(v => {
      // Filtro de búsqueda local (dentro del panel de variantes)
      if (variantSearchTerm) {
        const search = variantSearchTerm.toLowerCase().trim()
        const matchesSearch = v.colegio.toLowerCase().includes(search) || 
                             v.talla.toLowerCase().includes(search) ||
                             v.stock.toString().includes(search)
        if (!matchesSearch) return false
      }

      // Filtro global de colegio (comparación exacta, sin espacios)
      if (selectedColegio && selectedColegio.trim() !== '') {
        const colegioMatch = v.colegio.trim() === selectedColegio.trim()
        if (!colegioMatch) {
          console.log(`❌ Variante "${v.colegio}" no coincide con filtro "${selectedColegio}"`)
          return false
        }
      }

      // Filtro global de talla (comparación exacta, sin espacios)
      if (selectedTalla && selectedTalla.trim() !== '') {
        const tallaMatch = v.talla.trim() === selectedTalla.trim()
        if (!tallaMatch) {
          console.log(`❌ Variante talla "${v.talla}" no coincide con filtro "${selectedTalla}"`)
          return false
        }
      }

      return true
    })
    
    console.log('✅ Variantes filtradas:', filtered.length)
    return filtered
  }

  if (productos.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-12 text-center border border-slate-200 dark:border-slate-700">
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
    <div className="space-y-3 overflow-x-auto pb-8">
      <div className="min-w-[1000px] lg:min-w-[900px]">
      {/* Header estilo cuaderno - Solo visible en desktop */}
      <div className="hidden lg:block bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-xl px-4 py-2 shadow-md border border-slate-300 dark:border-slate-600 sticky  z-30">
        <div className="grid grid-cols-12 gap-4 items-center text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          <div className="col-span-1">Imagen</div>
          <div className="col-span-2">Nombre</div>
          <div className="col-span-1">Categoría</div>
          <div className="col-span-1">Precio</div>
          <div className="col-span-2">Descuento</div>
          <div className="col-span-1">Oferta</div>
          <div className="col-span-1 text-center">Stock</div>
          <div className="col-span-3 text-center">Acciones</div>
        </div>
      </div>

      {/* Lista de productos */}
      {productos.map((producto) => (
        <div key={producto.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 overflow-hidden group/row relative">
          
          {/* Vista Desktop - Grid de 12 columnas */}
          <div className="hidden lg:block px-4 py-2">
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Imagen */}
              <div className="col-span-1">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-sm border border-slate-200 dark:border-slate-600">
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
                {editingProductName === producto.id ? (
                  <div className="flex gap-1 relative z-10">
                    <input
                      type="text"
                      defaultValue={producto.nombre}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateProductName(producto.id, (e.target as HTMLInputElement).value)
                        } else if (e.key === 'Escape') {
                          onSetEditingProductName(null)
                        }
                      }}
                      onBlur={() => onSetEditingProductName(null)}
                      className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded-md bg-white dark:bg-slate-700 text-white font-bold focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevenir que onBlur se dispare antes del click
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input[type="text"]') as HTMLInputElement
                        if (input) {
                          onUpdateProductName(producto.id, input.value)
                        }
                      }}
                      className="px-2 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs flex-shrink-0"
                    >
                      ✓
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onSetEditingProductName(null)
                      }}
                      className="px-2 py-1 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors text-xs flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white text-base leading-tight flex-1">{producto.nombre}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetEditingProductName(producto.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition-all flex-shrink-0"
                        title="Editar nombre"
                      >
                        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetEditingProductNotas(producto.id)
                        }}
                        className={`p-1 rounded transition-all flex-shrink-0 ${producto.notas ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-100' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'}`}
                        title={producto.notas ? "Ver/editar notas" : "Agregar notas"}
                      >
                        <svg className="w-4 h-4" fill={producto.notas ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{producto.descripcion}</p>
                  </div>
                )}
              </div>

              {/* Categoría */}
              <div className="col-span-1">
                <span className="inline-block bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-xs">
                  {producto.categoria}
                </span>
              </div>

              {/* Precio */}
              <div className="col-span-1">
                <div className="group cursor-pointer" onClick={(e) => {
                  e.stopPropagation()
                  onSetEditingProductPrice(producto.id)
                }}>
                  {(() => {
                    const preciosVariantes = producto.variantes?.map(v => v.precio).filter(p => p !== null && p !== undefined) as number[] || [];
                    const tienePreciosDiferentes = preciosVariantes.length > 0 && preciosVariantes.some(p => p !== producto.precio);
                    const precioMinimo = preciosVariantes.length > 0 ? Math.min(producto.precio, ...preciosVariantes) : producto.precio;
                    
                    return producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 line-through block">
                          {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                        </span>
                        <span className="font-bold text-base text-green-600 dark:text-green-400">
                          {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(calcularPrecioFinal(precioMinimo, producto.descuento_porcentaje))}
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-base text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Descuento */}
              <div className="col-span-2">
                <select
                  value={producto.descuento_porcentaje || 0}
                  onChange={(e) => onUpdateDescuento(producto.id, parseInt(e.target.value))}
                  className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer transition-all"
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
                  className={`w-full px-3 py-2 rounded-xl font-bold text-xs transition-all border shadow-sm ${
                    producto.en_oferta
                      ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 hover:bg-orange-100'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {producto.en_oferta ? '🔥 OFERTA' : 'Normal'}
                </button>
              </div>

              {/* Stock */}
              <div className="col-span-1">
                <button
                  onClick={() => onToggleExpand(producto.id)}
                  className="w-full"
                >
                  <div className={`text-center px-3 py-2 rounded-lg font-bold text-sm transition-all ${
                    (producto.stock_total || 0) > 6 
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
                <div className="flex gap-2 justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => router.push(`/admin/editar/${producto.id}`)}
                    className="p-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-all shadow-sm border border-blue-200 dark:border-blue-800"
                    title="Editar producto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDuplicate(producto)}
                    className="p-2 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg transition-all shadow-sm border border-purple-200 dark:border-purple-800"
                    title="Duplicar producto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(producto.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all shadow-sm border border-red-200 dark:border-red-800"
                    title="Eliminar producto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vista Móvil - Diseño tipo tarjeta */}
          <div className="lg:hidden p-4 space-y-3">
            {/* Header con imagen y nombre */}
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex-shrink-0">
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
              <div className="flex-1 min-w-0">
                {editingProductName === producto.id ? (
                  <div className="flex gap-1 mb-2">
                    <input
                      type="text"
                      defaultValue={producto.nombre}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateProductName(producto.id, (e.target as HTMLInputElement).value)
                        } else if (e.key === 'Escape') {
                          onSetEditingProductName(null)
                        }
                      }}
                      onBlur={() => onSetEditingProductName(null)}
                      className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded-md bg-white dark:bg-slate-700 text-white font-bold focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const input = (e.target as HTMLElement).parentElement?.querySelector('input[type="text"]') as HTMLInputElement
                        if (input) {
                          onUpdateProductName(producto.id, input.value)
                        }
                      }}
                      className="px-2 py-1 bg-green-500 text-white rounded-md text-xs flex-shrink-0"
                    >
                      ✓
                    </button>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault()
                        onSetEditingProductName(null)
                      }}
                      className="px-2 py-1 bg-slate-500 text-white rounded-md text-xs flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight flex-1">{producto.nombre}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSetEditingProductName(producto.id)
                      }}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded flex-shrink-0"
                      title="Editar nombre"
                    >
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSetEditingProductNotas(producto.id)
                      }}
                      className={`p-1 rounded flex-shrink-0 ${
                        producto.notas 
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' 
                          : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                      }`}
                      title={producto.notas ? "Ver/editar notas" : "Agregar notas"}
                    >
                      <svg className={`w-4 h-4 ${producto.notas ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{producto.descripcion}</p>
                <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-md mt-2">
                  {producto.categoria}
                </span>
              </div>
            </div>

            {/* Precio y descuento */}
            <div className="flex items-center justify-between">
              <div 
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onSetEditingProductPrice(producto.id)
                }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Precio</p>
                  <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                {(() => {
                  const preciosVariantes = producto.variantes?.map(v => v.precio).filter(p => p !== null && p !== undefined) as number[] || [];
                  const tienePreciosDiferentes = preciosVariantes.length > 0 && preciosVariantes.some(p => p !== producto.precio);
                  const precioMinimo = preciosVariantes.length > 0 ? Math.min(producto.precio, ...preciosVariantes) : producto.precio;
                  
                  return producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400 line-through block">
                        {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                      </span>
                      <span className="font-bold text-xl text-green-600 dark:text-green-400">
                        {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(calcularPrecioFinal(precioMinimo, producto.descuento_porcentaje))}
                      </span>
                    </div>
                  ) : (
                    <span className="font-bold text-xl text-slate-900 dark:text-white">
                      {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                    </span>
                  )
                })()}
              </div>
              <button
                onClick={() => onToggleExpand(producto.id)}
                className="flex-shrink-0"
              >
                <div className={`text-center px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                  (producto.stock_total || 0) > 6 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                    : (producto.stock_total || 0) > 0 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  <div className="text-2xl">{producto.stock_total || 0}</div>
                  <div className="text-xs opacity-75">{expandedProduct === producto.id ? '▼' : '▶'} {producto.variantes_count || 0} var</div>
                </div>
              </button>
            </div>

            {/* Descuento y Oferta */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">Descuento</label>
                <select
                  value={producto.descuento_porcentaje || 0}
                  onChange={(e) => onUpdateDescuento(producto.id, parseInt(e.target.value))}
                  className="w-full px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1 font-semibold">En Oferta</label>
                <button
                  onClick={() => onToggleOferta(producto.id, producto.en_oferta || false)}
                  className={`w-full px-3 py-2 rounded-lg font-semibold text-sm transition-all ${
                    producto.en_oferta
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-gray-900 dark:text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {producto.en_oferta ? '🔥 Sí' : 'No'}
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/admin/editar/${producto.id}`)}
                className="flex-1 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all shadow-sm font-semibold text-sm"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => onDuplicate(producto)}
                className="flex-1 p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-sm font-semibold text-sm"
              >
                📋 Duplicar
              </button>
              <button
                onClick={() => onDelete(producto.id)}
                className="flex-1 p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-sm font-semibold text-sm"
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>

          {/* Panel expandible de variantes */}
          {expandedProduct === producto.id && producto.variantes && producto.variantes.length > 0 && (() => {
            const filteredVariantes = filterVariantes(producto.variantes)
            return (
              <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Gestión Rápida de Variantes
                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                      ({filteredVariantes.length} de {producto.variantes.length})
                    </span>
                  </h4>
                  {onSetVariantSearchTerm && (
                    <div className="relative w-64">
                      <input
                        type="text"
                        value={variantSearchTerm}
                        onChange={(e) => onSetVariantSearchTerm(e.target.value)}
                        placeholder="🔍 Buscar variante..."
                        className="w-full pl-3 pr-8 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {variantSearchTerm && (
                        <button
                          onClick={() => onSetVariantSearchTerm('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {filteredVariantes.length === 0 ? (
                  <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <svg className="w-12 h-12 text-slate-400 dark:text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="text-slate-600 dark:text-slate-300 font-semibold">No se encontraron variantes</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {variantSearchTerm || selectedColegio || selectedTalla 
                        ? 'Intenta con otros filtros' 
                        : 'Este producto no tiene variantes'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredVariantes
                      .sort((a, b) => {
                        const colegioCompare = a.colegio.localeCompare(b.colegio)
                        if (colegioCompare !== 0) return colegioCompare
                        const order = ['6-8', '10-12', '14-16', 'S-M', 'L-XL', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
                        return order.indexOf(a.talla) - order.indexOf(b.talla)
                      })
                      .map((variante) => (
                  <div 
                    key={variante.id} 
                    className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition-all shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 flex-shrink-0 p-0.5">
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
                          {variante.precio !== null && variante.precio !== undefined && (
                            <span className="text-xs font-semibold text-green-600 dark:text-green-400 ml-2 block">
                              {formatPrice(variante.precio)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold flex-shrink-0 ${
                        variante.stock > 6 
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
                            className="flex-1 px-2 py-1 text-sm border border-blue-500 rounded-md bg-white dark:bg-slate-700 text-white font-semibold focus:ring-2 focus:ring-blue-500"
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
                )}
              </div>
            )
          })()}
        </div>
      ))}

      {/* Modal de Notas */}
      {editingProductNotas && productos.find(p => p.id === editingProductNotas) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => onSetEditingProductNotas(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Notas del Producto</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {productos.find(p => p.id === editingProductNotas)?.nombre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSetEditingProductNotas(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <textarea
                defaultValue={productos.find(p => p.id === editingProductNotas)?.notas || ''}
                placeholder="Escribe notas sobre este producto... Ej: Pedir más tela, revisar stock el viernes, etc."
                className="w-full h-40 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-white focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onSetEditingProductNotas(null)
                  }
                }}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={(e) => {
                    const container = (e.target as HTMLElement).closest('.p-6')
                    const textarea = container?.querySelector('textarea') as HTMLTextAreaElement
                    if (textarea && editingProductNotas) {
                      onUpdateProductNotas(editingProductNotas, textarea.value)
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 dark:text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-md hover:shadow-sm"
                >
                  💾 Guardar Notas
                </button>
                <button
                  onClick={() => onSetEditingProductNotas(null)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Modal de Precio */}
      {editingProductPrice && productos.find(p => p.id === editingProductPrice) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => onSetEditingProductPrice(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full border border-slate-200 dark:border-slate-700" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Editar Precio</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {productos.find(p => p.id === editingProductPrice)?.nombre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onSetEditingProductPrice(null)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Nuevo Precio (CLP)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                defaultValue={productos.find(p => p.id === editingProductPrice)?.precio || 0}
                placeholder="Ej: 15000"
                className="w-full px-4 py-3 text-lg border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-white font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const input = e.target as HTMLInputElement
                    if (editingProductPrice) {
                      onUpdateProductPrice(editingProductPrice, parseInt(input.value) || 0)
                    }
                  } else if (e.key === 'Escape') {
                    onSetEditingProductPrice(null)
                  }
                }}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Precio sin puntos ni comas. Ej: 15000 para $15.000
              </p>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={(e) => {
                    const container = (e.target as HTMLElement).closest('.p-6')
                    const input = container?.querySelector('input[type="number"]') as HTMLInputElement
                    if (input && editingProductPrice) {
                      onUpdateProductPrice(editingProductPrice, parseInt(input.value) || 0)
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-gray-900 dark:text-white rounded-xl font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-sm"
                >
                  💰 Actualizar Precio
                </button>
                <button
                  onClick={() => onSetEditingProductPrice(null)}
                  className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
