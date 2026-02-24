'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formatPrice } from '@/lib/formatPrice'

interface Variante {
  talla: string
  colegio: string
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
    imagenes?: string[]
    variantes: Variante[]
    stock_total: number
    descuento_porcentaje?: number
    en_oferta?: boolean
  }
  onClose: () => void
}

export default function ProductModal({ producto, onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedTalla, setSelectedTalla] = useState<string>('')
  const [selectedColegio, setSelectedColegio] = useState<string>('')
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const precioFinal = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
    ? producto.precio - (producto.precio * producto.descuento_porcentaje / 100)
    : producto.precio

  // Obtener array de imágenes
  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : producto.imagen_url 
    ? [producto.imagen_url] 
    : []

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagenes.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  }

  // Obtener tallas y colegios únicos disponibles
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))]
    .sort((a, b) => {
      const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
      return order.indexOf(a) - order.indexOf(b)
    })
  
  const colegiosDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.colegio))]

  // Verificar disponibilidad según selección
  const getStockDisponible = () => {
    if (!selectedTalla && !selectedColegio) return producto.stock_total
    
    const variantesFiltradas = producto.variantes.filter(v => {
      const matchTalla = !selectedTalla || v.talla === selectedTalla
      const matchColegio = !selectedColegio || v.colegio === selectedColegio
      return matchTalla && matchColegio && v.stock > 0
    })
    
    return variantesFiltradas.reduce((sum, v) => sum + v.stock, 0)
  }

  const stockDisponible = getStockDisponible()

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
            {/* Galería de Imágenes */}
            <div className="space-y-4">
              {/* Imagen Principal */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group">
                {imagenes.length > 0 ? (
                  <>
                    <Image
                      src={imagenes[currentImageIndex]}
                      alt={`${producto.nombre} - Imagen ${currentImageIndex + 1}`}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
                      priority
                      style={{ objectFit: 'cover' }}
                    />
                    
                    {/* Navegación de imágenes */}
                    {imagenes.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all z-10"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all z-10"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Contador de imágenes */}
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                          {currentImageIndex + 1} / {imagenes.length}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-32 h-32 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {producto.stock_total === 0 && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                    <span className="text-white text-3xl font-bold">AGOTADO</span>
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {imagenes.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {imagenes.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-600/50 dark:ring-blue-400/50' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`Miniatura ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                        style={{ objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Información */}
            <div className="flex flex-col">
              {/* Header con categoría y oferta */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full">
                    {producto.categoria}
                  </span>
                  {producto.en_oferta && (
                    <span className="inline-block bg-linear-to-br from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full animate-pulse">
                      🔥 EN OFERTA
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{producto.nombre}</h3>
              </div>

              {/* Precio */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline gap-3">
                  {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-gray-400 dark:text-gray-500 line-through">
                        {formatPrice(producto.precio)}
                      </span>
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(precioFinal)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(producto.precio)}
                    </span>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  {producto.nombre}
                </h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  {producto.descripcion.split('\n').map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selector de Colegio */}
              {colegiosDisponibles.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      Colegio:
                    </h4>
                    {selectedColegio && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{selectedColegio}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colegiosDisponibles.map(colegio => (
                      <button
                        key={colegio}
                        onClick={() => setSelectedColegio(selectedColegio === colegio ? '' : colegio)}
                        className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                          selectedColegio === colegio
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {colegio}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Talla */}
              {tallasDisponibles.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                        ¿Cuál es mi talla?
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Talla: {selectedTalla || '-'}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {tallasDisponibles.map(talla => {
                      // Verificar si esta talla está disponible con el colegio seleccionado
                      const disponible = producto.variantes.some(v => 
                        v.talla === talla && 
                        (!selectedColegio || v.colegio === selectedColegio) && 
                        v.stock > 0
                      )
                      
                      return (
                        <button
                          key={talla}
                          onClick={() => disponible && setSelectedTalla(selectedTalla === talla ? '' : talla)}
                          disabled={!disponible}
                          className={`aspect-square flex items-center justify-center rounded-lg border-2 font-bold text-lg transition-all ${
                            selectedTalla === talla
                              ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                              : disponible
                              ? 'border-gray-300 dark:border-gray-600 hover:border-gray-900 dark:hover:border-white text-gray-700 dark:text-gray-300'
                              : 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {talla}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Disponibilidad */}
              <div className="mb-6">
                {stockDisponible > 0 ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">HAY EXISTENCIAS</span>
                    <span className="text-sm">({stockDisponible} disponibles)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">SIN STOCK</span>
                  </div>
                )}
              </div>

              {/* Botón Cerrar */}
              <div className="mt-auto pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onClose}
                  className="w-full bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl"
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
