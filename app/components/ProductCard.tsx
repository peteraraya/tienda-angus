'use client'

import { useState, useEffect } from 'react'
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { LazyImage } from './ui'
import ProductModal from './ProductModal'
import { formatPrice } from '@/lib/formatPrice'

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

interface Variante extends Pick<DBVariante, 'talla' | 'colegio' | 'stock' | 'precio'> {}

interface Producto extends Pick<DBProducto, 'id' | 'nombre' | 'descripcion' | 'precio' | 'categoria' | 'imagen_url' | 'imagenes' | 'descuento_porcentaje' | 'en_oferta'> {
  variantes: Variante[]
  stock_total: number
}

interface ProductCardProps {
  producto: Producto
  relatedProducts?: Producto[]
}

export default function ProductCard({ producto, relatedProducts = [] }: ProductCardProps) {
  const [showModal, setShowModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isMounted, setIsMounted] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Montar el componente y cargar favoritos solo en el cliente
  useEffect(() => {
    setIsMounted(true)
    try {
      const favs = JSON.parse(localStorage.getItem('favoritos') || '[]')
      setIsFavorite(favs.includes(producto.id))
    } catch {
      setIsFavorite(false)
    }
  }, [producto.id])

  // Sincronizar favoritos con localStorage (escuchar cambios de la app)
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const newFavs = (e as CustomEvent<string[]>)?.detail ?? JSON.parse(localStorage.getItem('favoritos') || '[]')
        setIsFavorite(newFavs.includes(producto.id))
      } catch {
        // no-op
      }
    }
    window.addEventListener('favoritos-changed', handler)
    return () => {
      window.removeEventListener('favoritos-changed', handler)
    }
  }, [producto.id])

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    const favs = JSON.parse(localStorage.getItem('favoritos') || '[]')
    let newFavs
    if (favs.includes(producto.id)) {
      newFavs = favs.filter((id: string) => id !== producto.id)
      setIsFavorite(false)
    } else {
      newFavs = [...favs, producto.id]
      setIsFavorite(true)
    }
    localStorage.setItem('favoritos', JSON.stringify(newFavs))
    try {
      // Notificar otras partes de la app en la misma pestaña
      window.dispatchEvent(new CustomEvent('favoritos-changed', { detail: newFavs }))
    } catch {
      // no-op en entornos donde window no está disponible
    }
  }
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))]
  const colegiosDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.colegio))]
  
  // Determinar si hay diferentes precios entre las variantes
  const preciosVariantes = producto.variantes.map(v => v.precio).filter(p => p !== null && p !== undefined) as number[];
  const tienePreciosDiferentes = preciosVariantes.length > 0 && preciosVariantes.some(p => p !== producto.precio);
  const precioMinimo = preciosVariantes.length > 0 ? Math.min(producto.precio, ...preciosVariantes) : producto.precio;

  const precioFinal = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
    ? precioMinimo - (precioMinimo * producto.descuento_porcentaje / 100)
    : precioMinimo

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
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowModal(true);
          }
        }}
        className="group bg-white dark:bg-gray-800 rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/20 transition-all duration-300 transform hover:-translate-y-1.5 border border-gray-200 dark:border-gray-700 cursor-pointer relative focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 flex flex-col h-full"
        onClick={() => setShowModal(true)}
      >
                {/* Botón de favorito - solo mostrar cuando está montado */}
                {isMounted && (
                  <button
                    onClick={toggleFavorite}
                    className="absolute top-4 right-4 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full p-3 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center shadow-md hover:bg-pink-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    {isFavorite ? (
                      <FavoriteIcon className="text-pink-500" fontSize="medium" />
                    ) : (
                      <FavoriteBorderIcon className="text-pink-400" fontSize="medium" />
                    )}
                  </button>
                )}
        <div className="relative aspect-square bg-white dark:bg-gray-800 overflow-hidden border-b border-gray-100 dark:border-gray-700/50">
          {imagenes.length > 0 ? (
            <>
              <LazyImage
                src={imagenes[currentImageIndex]}
                alt={`${producto.nombre} - Imagen ${currentImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                priority={currentImageIndex === 0}
              />
              
              {/* Navegación de imágenes */}
              {imagenes.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Indicadores de imagen */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {imagenes.map((_: string, index: number) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentImageIndex(index)
                        }}
                        className={`w-3 h-3 rounded-full transition-all ${
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

          {/* Badge de Últimas unidades (poco stock) */}
          {producto.stock_total > 0 && producto.stock_total <= 2 && (
            <div className="absolute top-0 left-0 z-10">
              <div className="bg-red-600 text-white px-3 py-1 rounded-lg shadow-md">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span>¡Últimas unidades!</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{producto.stock_total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Badge de Oferta */}
          {producto.en_oferta && (
            <div className="absolute top-16 right-4 z-10">
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

          <div className="absolute bottom-3 right-3">
            <span className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-gray-200 dark:border-gray-600">
              {producto.categoria}
            </span>
          </div>

          {/* Botón Ver Detalles en hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 pointer-events-none">
            <span className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-2xl font-bold transform scale-90 group-hover:scale-100 transition-transform duration-300 shadow-xl pointer-events-auto">
              Ver Detalles
            </span>
          </div>
        </div>
        
        <div className="p-4 flex flex-col  flex-1">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
            {producto.nombre}
          </h2>
          
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2 leading-relaxed">
            {producto.descripcion}
          </p>
          
          {tallasDisponibles.length > 0 && (
            <div className="mb-2.5">
              <div className="flex flex-wrap gap-1">
                {tallasDisponibles.slice(0, 5).map(talla => (
                  <span 
                    key={talla} 
                    className="flex items-center justify-center min-w-[22px] h-[22px] bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-[10px] font-bold px-1 rounded-sm"
                  >
                    {talla}
                  </span>
                ))}
                {tallasDisponibles.length > 5 && (
                  <span className="flex items-center justify-center min-w-[22px] h-[22px] bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-1 rounded-sm border border-gray-200 dark:border-gray-600">
                    +{tallasDisponibles.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {colegiosDisponibles.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1.5">
                {colegiosDisponibles.slice(0, 2).map(colegio => (
                  <span 
                    key={colegio} 
                    className="bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[10px] font-semibold px-2 py-0.5 rounded-md truncate max-w-[120px]"
                  >
                    {colegio}
                  </span>
                ))}
                {colegiosDisponibles.length > 2 && (
                  <span className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                    +{colegiosDisponibles.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-auto flex justify-between items-end pt-3 border-t border-gray-100 dark:border-gray-700/50">
            <div>
              {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                    {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                  </span>
                  <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                    {tienePreciosDiferentes ? <span className="text-xs font-normal text-gray-500 mr-1">Desde</span> : ''}{formatPrice(precioFinal)}
                  </span>
                </div>
              ) : (
                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                  {tienePreciosDiferentes ? <span className="text-xs font-normal text-gray-500 mr-1">Desde</span> : ''}{formatPrice(precioMinimo)}
                </span>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
                producto.stock_total > 6 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                  : producto.stock_total > 0 
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
              }`}>
                {producto.stock_total > 0 ? `${producto.stock_total} unid.` : 'Agotado'}
              </span>
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
