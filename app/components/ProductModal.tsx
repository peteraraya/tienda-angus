 'use client'

import { useEffect, useState, useRef } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { LazyImage } from './ui'
import ImageLightbox from './ImageLightbox'
import { formatPrice } from '@/lib/formatPrice'
import SizeGuideModal from './SizeGuideModal'
import { useCart } from '../contexts/CartContext'
import { useToast } from './ui/ToastContainer'

interface Variante {
  talla: string
  colegio: string
  stock: number
  precio?: number | null
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
  relatedProducts?: any[]
  onClose: () => void
}

export default function ProductModal({ producto, relatedProducts = [], onClose }: ProductModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedTalla, setSelectedTalla] = useState<string>('')
  const [selectedColegio, setSelectedColegio] = useState<string>('')
  const modalRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(true)
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Manejo de foco y teclado (Esc)
  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null
    // focus en el contenedor para accesibilidad
    setTimeout(() => modalRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prevActive?.focus()
    }
  }, [onClose])

  // Obtener precio basado en la selección
  const getPrecioActual = () => {
    if (selectedTalla) {
      // Buscar variante con esa talla
      const variante = producto.variantes.find(v => 
        v.talla === selectedTalla && 
        (!selectedColegio || v.colegio === selectedColegio)
      );
      if (variante && variante.precio) {
        return variante.precio;
      }
    }
    return producto.precio;
  }

  const precioActual = getPrecioActual();
  const precioFinal = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
    ? precioActual - (precioActual * producto.descuento_porcentaje / 100)
    : precioActual;

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

  const [openLightbox, setOpenLightbox] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const { addToCart } = useCart()
  const toast = useToast()

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden={false}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        ref={modalRef}
        className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 flex justify-between items-center z-10">
          <h2 id="product-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">Detalles del Producto</h2>
          <button type="button"
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Cerrar diálogo"
          >
            <CloseIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Galería de Imágenes */}
            <div className="space-y-4">
              {/* Imagen Principal */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group">
                {imagenes.length > 0 ? (
                  <>
                    <LazyImage
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
                        <button type="button"
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white"
                        >
                          <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button type="button"
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white"
                        >
                          <ChevronRightIcon className="w-6 h-6" />
                        </button>
                        
                        {/* Contador de imágenes */}
                        <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                          {currentImageIndex + 1} / {imagenes.length}
                        </div>
                      </>
                    )}
                    {/* Botón de lupa (abrir lightbox) - mostrar también cuando solo hay 1 imagen */}
                    {imagenes.length > 0 && (
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setOpenLightbox(true) }}
                        className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 rounded-full p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Ver imagen"
                      >
                        <SearchIcon className="w-5 h-5 text-gray-900 dark:text-white" />
                      </button>
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
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {imagenes.map((img, index) => (
                    <button type="button"
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex 
                          ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-600/50 dark:ring-blue-400/50' 
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <LazyImage
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
                <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3 text-balance">{producto.nombre}</h3>
              </div>
                {openLightbox && (
                  <ImageLightbox images={imagenes} startIndex={currentImageIndex} onClose={() => setOpenLightbox(false)} />
                )}

              {/* Precio */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline gap-3">
                  {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl text-gray-400 dark:text-gray-500 line-through">
                        {formatPrice(precioActual)}
                      </span>
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {formatPrice(precioFinal)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(precioActual)}
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
                      <button type="button"
                        key={colegio}
                        onClick={() => setSelectedColegio(selectedColegio === colegio ? '' : colegio)}
                        className={`px-4 py-2 min-h-[44px] rounded-xl border-2 font-bold transition-all ${
                          selectedColegio === colegio
                            ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        } focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900`}
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
                    <button 
                      type="button"
                      className="text-xs text-blue-600 dark:text-blue-400 font-semibold underline hover:text-blue-800 dark:hover:text-blue-300 focus:outline-none"
                      onClick={() => setShowSizeGuide(true)}
                    >
                      Ver Guía de Tallas
                    </button>
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
                        <button type="button"
                          key={talla}
                          onClick={() => disponible && setSelectedTalla(selectedTalla === talla ? '' : talla)}
                          disabled={!disponible}
                          className={`aspect-square min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl border-2 font-black text-lg transition-all ${
                            selectedTalla === talla
                              ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                              : disponible
                              ? 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800'
                              : 'border-gray-100 dark:border-gray-800 bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          } focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900`}
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
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-semibold">HAY EXISTENCIAS</span>
                    <span className="text-sm">({stockDisponible} disponibles)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <CancelIcon className="w-5 h-5" />
                    <span className="font-semibold">SIN STOCK</span>
                  </div>
                )}
              </div>

              {/* Instrucciones de compra breves */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">¿Cómo comprar?</h4>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal pl-4">
                  <li>Selecciona tu colegio y talla.</li>
                  <li>Haz clic en el botón de WhatsApp.</li>
                  <li>Coordinamos el pago y la entrega por chat.</li>
                </ol>
              </div>

              {/* Productos Relacionados */}
              {relatedProducts && relatedProducts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                    También te podría interesar
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {relatedProducts.map((relProduct) => (
                      <div key={relProduct.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 group cursor-pointer" onClick={() => {
                        // Aquí podríamos cambiar de producto, pero por ahora solo es visual o requiere reload.
                        // Idealmente deberíamos manejar una navegación o cambiar el estado del modal.
                        // Como es un MVP, lo dejamos como sugerencia visual o redirigimos.
                        window.location.href = `/#catalogo`;
                      }}>
                        <div className="relative aspect-square">
                          {relProduct.imagen_url || (relProduct.imagenes && relProduct.imagenes[0]) ? (
                            <LazyImage 
                              src={relProduct.imagen_url || relProduct.imagenes[0]} 
                              alt={relProduct.nombre}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600">
                              <span className="text-xs text-gray-500">Sin foto</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{relProduct.nombre}</p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">{formatPrice(relProduct.precio)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
                {showSizeGuide && <SizeGuideModal onClose={() => setShowSizeGuide(false)} />}
                
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedTalla || (colegiosDisponibles.length > 0 && !selectedColegio)) {
                      alert('Por favor selecciona talla y colegio primero.')
                      return
                    }
                    addToCart({
                      producto_id: producto.id,
                      nombre: producto.nombre,
                      precio: precioFinal,
                      talla: selectedTalla,
                      colegio: selectedColegio || 'General',
                      cantidad: 1,
                      imagen_url: imagenes[0] || undefined,
                      stock_disponible: stockDisponible
                    })
                    toast.success('¡Añadido a tu pedido!')
                  }}
                  disabled={!selectedTalla || (colegiosDisponibles.length > 0 && !selectedColegio) || stockDisponible <= 0}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Añadir a mi pedido
                </button>

                  <a
                    href={`https://wa.me/56983852967?text=${encodeURIComponent(
                      `Hola, me interesa el producto "${producto.nombre}".${selectedTalla ? ` Talla: ${selectedTalla}.` : ''}${selectedColegio ? ` Colegio: ${selectedColegio}.` : ''} Valor: ${formatPrice(precioFinal)}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 text-sm sm:text-base"
                    title="Comprar sólo este producto"
                  >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Consulta Rápida
                  </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
