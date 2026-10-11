'use client'

import { useState, useEffect } from 'react'
import { useMounted } from '@/app/hooks/useMounted'
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { LazyImage } from './ui'
import ProductModal from './ProductModal'
import Link from 'next/link'
import { formatPrice } from '@/lib/formatPrice'
import { getProductBasePrice, getProductFinalPrice } from '@/lib/productPricing'
import { productPath } from '@/lib/productSlug'
import { useToast } from './ui/ToastContainer'

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

type Variante = Pick<DBVariante, 'id' | 'talla' | 'colegio' | 'stock' | 'precio'>

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
  const toast = useToast()
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
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('favoritos') || '[]')
      const favs = Array.isArray(saved) && saved.every(id => typeof id === 'string') ? saved : []
      const newFavs = favs.includes(producto.id)
        ? favs.filter((id: string) => id !== producto.id)
        : [...favs, producto.id]
      localStorage.setItem('favoritos', JSON.stringify(newFavs))
      setIsFavorite(newFavs.includes(producto.id))
      window.dispatchEvent(new CustomEvent('favoritos-changed', { detail: newFavs }))
    } catch (error) {
      console.error('No se pudo actualizar el favorito:', error)
      toast.error('No se pudo actualizar el favorito. Revisa el almacenamiento del navegador.')
    }
  }
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))].filter(t => t !== 'Única')
  
  const variantesDisponibles = producto.variantes.filter(variante => variante.stock > 0)
  const preciosDisponibles = producto.variantes
    .filter(variante => variante.stock > 0)
    .map(variante => variante.precio ?? producto.precio)
  const tienePreciosDiferentes = preciosDisponibles.some(precio => precio !== preciosDisponibles[0])
  const precioMinimo = getProductBasePrice({ ...producto, variantes: variantesDisponibles })
  const precioFinal = getProductFinalPrice({ ...producto, variantes: variantesDisponibles })

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
      <article
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
          setCurrentImageIndex(0)
        }}
        className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[#123f3d]/10 bg-[linear-gradient(180deg,#ffffff_0%,#f9f6f1_100%)] shadow-[0_18px_38px_rgba(17,31,30,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_26px_52px_rgba(17,31,30,0.14)] dark:border-white/10 dark:bg-[#142b2a] dark:hover:shadow-[0_22px_48px_rgba(3,8,18,0.35)]"
      >
                {/* Botón de favorito - solo mostrar cuando está montado */}
                {isMounted && (
                  <button
                    onClick={toggleFavorite}
                    type="button"
                    aria-label={isFavorite ? `Quitar ${producto.nombre} de favoritos` : `Agregar ${producto.nombre} a favoritos`}
                    aria-pressed={isFavorite}
                    className="absolute right-4 top-4 z-30 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-colors hover:bg-[#f6efdf] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:bg-gray-900/90 dark:hover:bg-gray-800"
                    title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                  >
                    {isFavorite ? (
                      <FavoriteIcon className="text-[#123f3d] dark:text-[#e7c77c]" fontSize="medium" />
                    ) : (
                      <FavoriteBorderIcon className="text-[#4d6d5f] dark:text-[#bfd4d0]" fontSize="medium" />
                    )}
                  </button>
                )}
        <div className="relative aspect-[4/4.2] bg-[radial-gradient(circle_at_top,#f9f2e7_0%,#f2ece0_45%,#ece3d4_100%)] dark:bg-[#1b2f2d] overflow-hidden border-b border-[#123f3d]/8 dark:border-gray-700/50">
          {imagenes.length > 0 ? (
            <>
              <LazyImage
                src={imagenes[displayImageIndex]}
                alt={`${producto.nombre} - Imagen ${displayImageIndex + 1}`}
                fallbackLabel="Foto temporalmente no disponible"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="w-full h-full object-contain p-2 transition-transform duration-700 ease-in-out group-hover:scale-110"
              />
              
              {/* Navegación de imágenes */}
              {imagenes.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    type="button"
                    aria-label={`Imagen anterior de ${producto.nombre}`}
                    className="absolute left-2 top-1/2 z-20 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-3 text-white transition-all hover:bg-black/80 md:opacity-0 md:group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={nextImage}
                    type="button"
                    aria-label={`Imagen siguiente de ${producto.nombre}`}
                    className="absolute right-2 top-1/2 z-20 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-black/60 p-3 text-white transition-all hover:bg-black/80 md:opacity-0 md:group-hover:opacity-100"
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
                        type="button"
                        aria-label={`Ver imagen ${index + 1} de ${imagenes.length}`}
                        aria-pressed={index === currentImageIndex}
                        onClick={(e) => {
                          e.stopPropagation()
                          setCurrentImageIndex(index)
                        }}
                        className="grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        <span
                          aria-hidden="true"
                          className={`h-3 rounded-full transition-all ${
                            index === currentImageIndex ? 'w-6 bg-white' : 'w-3 bg-white/50 group-hover:bg-white/75'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,#fbf6ed_0%,#e9eee8_70%)] px-4 text-center text-[#52716a] dark:bg-[radial-gradient(circle_at_top,#294341_0%,#172d2c_70%)] dark:text-[#c6d8d3]">
              <svg className="w-24 h-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold">Foto en preparación</span>
            </div>
          )}
          
          {/* Consolidador de Badges Superiores */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
            {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
              <div className="rounded-full border border-white/30 bg-[#123f3d]/95 px-3 py-1.5 text-white shadow-lg dark:bg-[#e7c77c] dark:text-[#123f3d]">
                <span className="font-black text-[11px] tracking-[0.08em]">-{producto.descuento_porcentaje}%</span>
              </div>
            ) : null}

            {producto.en_oferta && (
              <div className="rounded-full border border-[#123f3d]/10 bg-[#d3a954] px-3 py-1.5 text-[#123f3d] shadow-lg dark:bg-[#e7c77c]">
                <span className="font-black text-[10px] tracking-[0.08em]">OFERTA</span>
              </div>
            )}
          </div>
          
          {producto.stock_total === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
              <span className="text-white text-xl font-bold tracking-widest">AGOTADO</span>
            </div>
          )}

          {/* Botón Ver Detalles y Vista Previa de Tallas en Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent transition-all duration-300 flex flex-col justify-end opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 z-10 pointer-events-none p-4">
            
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
            
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="pointer-events-auto flex w-full translate-y-4 items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#ffffff_0%,#f4efe7_100%)] py-2.5 font-bold text-[#123f3d] shadow-xl transition-all duration-300 hover:bg-[#f2eadb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] group-hover:translate-y-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Vista Rápida
            </button>
          </div>
        </div>
        
        <div className="relative z-20 flex flex-1 flex-col bg-white p-4 dark:bg-[#142b2a] sm:p-5 lg:p-6">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#123f3d]/75 dark:text-[#e7c77c]">
            {producto.categoria}
          </p>
          <Link
            href={productPath(producto.id, producto.nombre)}
            className="mb-auto line-clamp-2 text-left text-base font-black leading-snug tracking-[-0.02em] text-[#173b39] transition-colors hover:text-[#123f3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:text-white dark:hover:text-[#e7c77c] sm:text-lg lg:text-[1.1rem]"
          >
            {producto.nombre}
          </Link>
          
          <div className="mt-5 flex justify-between items-end gap-3">
            <div className="flex min-w-0 flex-col">
              {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                <>
                  <span className="text-xs text-gray-600 dark:text-[#bfd4d0] line-through">
                    {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                  </span>
                  <span className="mt-1 text-xl font-black leading-none tracking-[-0.04em] text-[#123f3d] dark:text-white sm:text-2xl">
                    {tienePreciosDiferentes ? <span className="mr-1.5 align-middle text-xs font-bold text-[#4f6967] dark:text-[#bfd4d0]">Desde</span> : ''}{formatPrice(precioFinal)}
                  </span>
                </>
              ) : (
                <span className="text-xl font-black leading-none tracking-[-0.04em] text-[#123f3d] dark:text-white sm:text-2xl">
                  {tienePreciosDiferentes ? <span className="mr-1.5 align-middle text-xs font-bold text-[#4f6967] dark:text-[#bfd4d0]">Desde</span> : ''}{formatPrice(precioMinimo)}
                </span>
              )}
              {tienePreciosDiferentes && (
                <p className="mt-2 text-[11px] leading-4 text-[#5f7a73] dark:text-[#bfd4d0]">
                  El precio puede variar según la talla o el colegio.
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5 text-xs p-0">
              {producto.stock_total > 0 && producto.stock_total <= 5 && (
                <div className="flex items-center gap-1 rounded bg-[#f6efdf] px-2 py-0.5 text-[#76581c] dark:bg-[#e7c77c]/15 dark:text-[#f3d79a]">
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#b98a2f] dark:bg-[#e7c77c]"></span>
                  </span>
                  <span className="text-[10px] font-bold">Stock limitado</span>
                </div>
              )}
              {producto.stock_total > 5 ? (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 rounded  ">
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
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[#123f3d] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#0d2f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 dark:bg-[#e7c77c] dark:text-[#123f3d] dark:hover:bg-[#f3d79a] dark:focus-visible:ring-offset-[#142b2a]"
            >
              Ver detalles y tallas
            </button>
        </div>
        </article>

      {showModal && (
        <ProductModal producto={producto} relatedProducts={relatedProducts} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
