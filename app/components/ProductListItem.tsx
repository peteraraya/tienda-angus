'use client'

import { useState } from 'react'
import { LazyImage } from './ui'
import ProductModal from './ProductModal'
import { formatPrice } from '@/lib/formatPrice'

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

type Variante = Pick<DBVariante, 'talla' | 'colegio' | 'stock' | 'precio'>

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
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))].filter(t => t !== 'Única')
  const colegiosDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.colegio))].filter(c => c !== 'General')
  
  // Determinar si hay diferentes precios entre las variantes
  const preciosVariantes = producto.variantes.map(v => v.precio).filter(p => p !== null && p !== undefined) as number[];
  const tienePreciosDiferentes = preciosVariantes.length > 0 && preciosVariantes.some(p => p !== producto.precio);
  const precioMinimo = preciosVariantes.length > 0 ? Math.min(producto.precio, ...preciosVariantes) : producto.precio;

  const precioFinal = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
    ? precioMinimo - (precioMinimo * producto.descuento_porcentaje / 100)
    : precioMinimo

  const [isHovered, setIsHovered] = useState(false)

  // Obtener primera imagen
  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : producto.imagen_url ? [producto.imagen_url] : []
  
  const primeraImagen = imagenes.length > 0 ? imagenes[0] : null
  const displayImageIndex = isHovered && imagenes.length > 1 ? 1 : 0
  const totalImagenes = imagenes.length

  return (
    <>
      <div 
        role="button"
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
            {imagenes.length > 0 ? (
              <>
                <LazyImage
                  src={imagenes[displayImageIndex]}
                  alt={`${producto.nombre} - Imagen ${displayImageIndex + 1}`}
                  width={400}
                  height={400}
                  className="w-full h-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
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
            
            {/* Consolidador de Badges Superiores */}
            <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
              {typeof producto.descuento_porcentaje === 'number' && producto.descuento_porcentaje > 0 ? (
                <div className="bg-linear-to-br from-red-600 to-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg font-black text-sm">
                  -{producto.descuento_porcentaje}%
                </div>
              ) : null}
              
              {producto.en_oferta && (
                <div className="bg-linear-to-br from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg font-black text-xs animate-pulse">
                  🔥 OFERTA
                </div>
              )}
            </div>
            
            {producto.stock_total === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-10">
                <span className="text-white text-xl font-bold tracking-widest">AGOTADO</span>
              </div>
            )}
          </div>

          {/* Contenido */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                {producto.categoria}
              </p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                {producto.nombre}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
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

            <div className="flex justify-between items-end pt-5 mt-4 border-t border-gray-100 dark:border-gray-700/50">
              <div className="flex flex-col">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-1.5 uppercase font-bold tracking-widest">Precio Final</p>
                {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                  <>
                    <span className="text-lg text-gray-400 dark:text-gray-500 line-through decoration-red-500/50">
                      {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none mt-1 tracking-tighter">
                      {tienePreciosDiferentes ? <span className="text-sm font-normal text-gray-500 mr-1">Desde</span> : ''}{formatPrice(precioFinal)}
                    </span>
                  </>
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-none mt-1 tracking-tighter">
                    {tienePreciosDiferentes ? <span className="text-sm font-normal text-gray-500 mr-1">Desde</span> : ''}{formatPrice(precioMinimo)}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                {producto.stock_total > 0 && producto.stock_total <= 5 && (
                  <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-md text-red-600 dark:text-red-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">¡Quedan {producto.stock_total}!</span>
                  </div>
                )}
                {producto.stock_total > 5 ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">En stock disponible</span>
                  </div>
                ) : producto.stock_total === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Agotado Temporalmente</span>
                  </div>
                ) : null}
                <button className="bg-gray-900 hover:bg-blue-600 dark:bg-white dark:text-gray-900 dark:hover:bg-blue-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg mt-1 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Vista Rápida
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
