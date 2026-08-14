'use client'

import { useState, useEffect } from 'react'
import { useMounted } from '@/app/hooks/useMounted'
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { LazyImage } from './ui'
import ProductModal from './ProductModal'
import { formatPrice } from '@/lib/formatPrice'

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

type Variante = Pick<DBVariante, 'talla' | 'colegio' | 'stock' | 'precio'>

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
  const isMounted = useMounted()
  const [isFavorite, setIsFavorite] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const favs = JSON.parse(localStorage.getItem('favoritos') || '[]')
      return favs.includes(producto.id)
    } catch {
      return false
    }
  })
  const [isHovered, setIsHovered] = useState(false)

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
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))].filter(t => t !== 'Única')
  const colegiosDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.colegio))].filter(c => c !== 'General')
  
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

  const displayImageIndex = isHovered && imagenes.length > 1 && currentImageIndex === 0 ? 1 : currentImageIndex

  return (
    <>
      <div 
        role="button"
        tabIndex={0}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setCurrentImageIndex(0)
        }}
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
                src={imagenes[displayImageIndex]}
                alt={`${producto.nombre} - Imagen ${displayImageIndex + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="w-full h-full object-contain p-2 transition-transform duration-700 ease-in-out group-hover:scale-110"
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
          
          {/* Consolidador de Badges Superiores */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
            {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
              <div className="bg-linear-to-br from-red-600 to-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg">
                <span className="font-black text-sm">-{producto.descuento_porcentaje}%</span>
              </div>
            ) : null}

            {producto.en_oferta && (
              <div className="bg-linear-to-br from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-lg shadow-lg animate-pulse">
                <span className="font-black text-xs">🔥 OFERTA</span>
              </div>
            )}
          </div>
          
          {producto.stock_total === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
              <span className="text-white text-xl font-bold tracking-widest">AGOTADO</span>
            </div>
          )}

          {/* Botón Ver Detalles y Vista Previa de Tallas en Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent transition-all duration-300 flex flex-col justify-end opacity-0 group-hover:opacity-100 z-10 pointer-events-none p-4">
            
            {/* Tallas disponibles preview */}
            {tallasDisponibles.length > 0 && (
              <div className="mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                <p className="text-[10px] text-white/80 font-semibold mb-1.5 uppercase tracking-widest">Tallas Disponibles</p>
                <div className="flex flex-wrap gap-1">
                  {tallasDisponibles.slice(0, 5).map(talla => (
                    <span key={talla} className="flex items-center justify-center min-w-[24px] h-[24px] bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-1 rounded-md border border-white/30">
                      {talla}
                    </span>
                  ))}
                  {tallasDisponibles.length > 5 && (
                    <span className="flex items-center justify-center min-w-[24px] h-[24px] bg-white/10 backdrop-blur-md text-white/70 text-[10px] font-bold px-1 rounded-md">
                      +{tallasDisponibles.length - 5}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <span className="bg-white text-gray-900 w-full py-2.5 rounded-xl font-bold transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl pointer-events-auto flex items-center justify-center gap-2 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista Rápida
            </span>
          </div>
        </div>
        
        <div className="p-4 sm:p-5 flex flex-col flex-1 relative bg-white dark:bg-gray-800 z-20">
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1.5">
            {producto.categoria}
          </p>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-auto line-clamp-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors tracking-tight">
            {producto.nombre}
          </h2>
          
          <div className="mt-4 flex justify-between items-end">
            <div className="flex flex-col">
              {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                <>
                  <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                    {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                  </span>
                  <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-none mt-0.5">
                    {tienePreciosDiferentes ? <span className="text-xs font-normal text-gray-500 mr-1">Desde</span> : ''}{formatPrice(precioFinal)}
                  </span>
                </>
              ) : (
                <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-none">
                  {tienePreciosDiferentes ? <span className="text-xs font-normal text-gray-500 mr-1">Desde</span> : ''}{formatPrice(precioMinimo)}
                </span>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5">
              {producto.stock_total > 0 && producto.stock_total <= 5 && (
                <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded text-red-600 dark:text-red-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span className="text-[10px] font-bold">¡Quedan {producto.stock_total}!</span>
                </div>
              )}
              {producto.stock_total > 5 ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span className="text-[10px] font-bold text-green-700 dark:text-green-400">En stock</span>
                </div>
              ) : producto.stock_total === 0 ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Agotado</span>
                </div>
              ) : null}
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
