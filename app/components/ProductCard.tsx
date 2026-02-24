'use client'

import { useState } from 'react'
import Image from 'next/image'
import ProductModal from './ProductModal'
import { formatPrice } from '@/lib/formatPrice'

interface Variante {
  talla: string
  colegio: string
  stock: number
}

interface ProductCardProps {
  producto: {
    id: string
    nombre: string
    descripcion: string
    precio: number
    categoria: string
    imagen_url?: string
    imagenes?: string[]
    variantes: Variante[]
    stock_total: number
    descuento_porcentaje?: number
    en_oferta?: boolean
  }
}

export default function ProductCard({ producto }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))]
  const colegiosDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.colegio))]
  
  const precioFinal = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
    ? producto.precio - (producto.precio * producto.descuento_porcentaje / 100)
    : producto.precio

  // Obtener array de imágenes (priorizar imagenes, luego imagen_url)
  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : producto.imagen_url 
    ? [producto.imagen_url] 
    : []

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % imagenes.length)
  }

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  }

  return (
    <>
      <div 
        className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-500 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="relative h-72 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
          {imagenes.length > 0 ? (
            <>
              <Image
                src={imagenes[currentImageIndex]}
                alt={`${producto.nombre} - Imagen ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                priority={currentImageIndex === 0}
              />
              
              {/* Navegación de imágenes */}
              {imagenes.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-20 opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Indicadores de imagen */}
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                    {imagenes.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentImageIndex(index)
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'bg-white w-6' 
                            : 'bg-white/50 hover:bg-white/75'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
              <svg className="w-24 h-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {/* Badge de Descuento */}
          {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 && (
            <div className="absolute top-4 left-4 z-10">
              <div className="bg-linear-to-br from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-black text-lg">-{producto.descuento_porcentaje}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Badge de Oferta */}
          {producto.en_oferta && (
            <div className="absolute top-4 right-4 z-10">
              <div className="bg-linear-to-br from-orange-500 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg animate-pulse">
                <div className="flex items-center gap-1 font-black text-sm">
                  <span>🔥</span>
                  <span>OFERTA</span>
                </div>
              </div>
            </div>
          )}
          
          {producto.stock_total === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm z-20">
              <div className="text-center">
                <span className="text-white text-2xl font-bold">AGOTADO</span>
                <p className="text-gray-300 text-sm mt-2">Próximamente disponible</p>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 right-4">
            <span className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-600">
              {producto.categoria}
            </span>
          </div>

          {/* Botón Ver Detalles en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
            <button className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold transform scale-90 group-hover:scale-100 transition-transform shadow-xl">
              Ver Detalles
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {producto.nombre}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
            {producto.descripcion}
          </p>
          
          {tallasDisponibles.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Tallas</p>
              <div className="flex flex-wrap gap-2">
                {tallasDisponibles.slice(0, 6).map(talla => (
                  <span 
                    key={talla} 
                    className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    {talla}
                  </span>
                ))}
                {tallasDisponibles.length > 6 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
                    +{tallasDisponibles.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          {colegiosDisponibles.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Colegios</p>
              <div className="flex flex-wrap gap-2">
                {colegiosDisponibles.slice(0, 3).map(colegio => (
                  <span 
                    key={colegio} 
                    className="bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  >
                    {colegio}
                  </span>
                ))}
                {colegiosDisponibles.length > 3 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
                    +{colegiosDisponibles.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio</p>
              {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                <div>
                  <span className="text-lg text-gray-500 dark:text-gray-400 line-through block">
                    {formatPrice(producto.precio)}
                  </span>
                  <span className="text-3xl font-bold bg-linear-to-br from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                    {formatPrice(precioFinal)}
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold bg-linear-to-br from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                  {formatPrice(producto.precio)}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-block text-xs font-bold px-4 py-2 rounded-full ${
                producto.stock_total > 10 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700' 
                  : producto.stock_total > 0 
                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
              }`}>
                {producto.stock_total > 0 ? `${producto.stock_total} unid.` : 'Sin stock'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <ProductModal producto={producto} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
