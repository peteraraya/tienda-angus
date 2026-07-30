'use client'

import { useState } from 'react'
import { LazyImage } from './ui'
import ProductModal from './ProductModal'
import { formatPrice } from '@/lib/formatPrice'

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

interface Variante extends Pick<DBVariante, 'talla' | 'colegio' | 'stock' | 'precio'> {}

interface Producto extends Pick<DBProducto, 'id' | 'nombre' | 'descripcion' | 'precio' | 'categoria' | 'imagen_url' | 'imagenes' | 'descuento_porcentaje' | 'en_oferta'> {
  variantes: Variante[]
  stock_total: number
}

interface ProductListItemProps {
  producto: Producto
  relatedProducts?: Producto[]
}

export default function ProductListItem({ producto, relatedProducts = [] }: ProductListItemProps) {
  const [showModal, setShowModal] = useState(false)
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))]
  const colegiosDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.colegio))]
  
  // Determinar si hay diferentes precios entre las variantes
  const preciosVariantes = producto.variantes.map(v => v.precio).filter(p => p !== null && p !== undefined) as number[];
  const tienePreciosDiferentes = preciosVariantes.length > 0 && preciosVariantes.some(p => p !== producto.precio);
  const precioMinimo = preciosVariantes.length > 0 ? Math.min(producto.precio, ...preciosVariantes) : producto.precio;

  const precioFinal = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
    ? precioMinimo - (precioMinimo * producto.descuento_porcentaje / 100)
    : precioMinimo

  // Obtener primera imagen
  const primeraImagen = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes[0] 
    : producto.imagen_url

  const totalImagenes = producto.imagenes?.length || (producto.imagen_url ? 1 : 0)

  return (
    <>
      <div 
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowModal(true);
          }
        }}
        className="group bg-white dark:bg-gray-800 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        onClick={() => setShowModal(true)}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Imagen */}
          <div className="relative w-full sm:w-64 h-64 sm:h-48 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shrink-0">
            {primeraImagen ? (
              <>
                <LazyImage
                  src={primeraImagen ?? ''}
                  alt={producto.nombre}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  style={{ objectFit: 'cover' }}
                  priority
                />
                {/* Indicador de múltiples imágenes */}
                {totalImagenes > 1 && (
                  <div className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    {totalImagenes}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
                <svg className="w-16 h-16 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Badges de descuento y oferta */}
            {typeof producto.descuento_porcentaje === 'number' && producto.descuento_porcentaje > 0 && (
              <div className="absolute top-3 left-3 bg-linear-to-br from-red-600 to-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg font-black text-sm">
                -{producto.descuento_porcentaje}%
              </div>
            )}
            
            {producto.en_oferta && (
              <div className="absolute top-3 right-3 bg-linear-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg font-black text-xs">
                🔥 OFERTA
              </div>
            )}
            {/* Badge de Últimas unidades (poco stock) */}
            {producto.stock_total > 0 && producto.stock_total <= 2 && (
              <div className="absolute top-0 left-0 z-10">
                <div className="bg-red-600 text-white px-3 py-1 rounded-lg shadow-md text-sm font-semibold">
                  ¡Últimas unidades! ({producto.stock_total})
                </div>
              </div>
            )}
            
            {producto.stock_total === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
                <span className="text-white text-xl font-bold">AGOTADO</span>
              </div>
            )}

            <div className="absolute bottom-3 right-3">
              <span className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-600">
                {producto.categoria}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {producto.nombre}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {producto.descripcion}
              </p>

              <div className="flex flex-wrap gap-4 mb-4">
                {tallasDisponibles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Tallas disponibles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {tallasDisponibles.slice(0, 8).map(talla => (
                        <span 
                          key={talla} 
                          className="flex items-center justify-center min-w-[28px] h-[28px] bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 text-xs font-bold px-1.5 rounded-sm shadow-sm"
                        >
                          {talla}
                        </span>
                      ))}
                      {tallasDisponibles.length > 8 && (
                        <span className="flex items-center justify-center min-w-[28px] h-[28px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-1.5 rounded-sm border border-gray-300 dark:border-gray-600">
                          +{tallasDisponibles.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {colegiosDisponibles.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase">Colegios</p>
                    <div className="flex flex-wrap gap-2">
                      {colegiosDisponibles.slice(0, 5).map(colegio => (
                        <span 
                          key={colegio} 
                          className="bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded"
                        >
                          {colegio}
                        </span>
                      ))}
                      {colegiosDisponibles.length > 5 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                          +{colegiosDisponibles.length - 5}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio</p>
                {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                  <div>
                    <span className="text-2xl text-gray-500 dark:text-gray-400 line-through block">
                      {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                    </span>
                    <span className="text-4xl font-bold bg-linear-to-br from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioFinal)}
                    </span>
                  </div>
                ) : (
                  <span className="text-4xl font-bold bg-linear-to-br from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {tienePreciosDiferentes ? <span className="text-2xl">Desde </span> : ''}{formatPrice(precioMinimo)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs font-bold px-4 py-2 rounded-full ${
                  producto.stock_total > 6 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700' 
                    : producto.stock_total > 0 
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
                }`}>
                  {producto.stock_total > 0 ? `${producto.stock_total} unidades` : 'Sin stock'}
                </span>
                <button className="text-blue-600 dark:text-blue-400 font-semibold text-sm hover:underline">
                  Ver detalles →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ProductModal producto={producto} relatedProducts={relatedProducts} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
