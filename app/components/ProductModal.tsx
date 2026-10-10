 'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SearchIcon from '@mui/icons-material/Search'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import { LazyImage } from './ui'
import ImageLightbox from './ImageLightbox'
import { formatPrice } from '@/lib/formatPrice'
import { getProductFinalPrice } from '@/lib/productPricing'
import SizeGuideModal from './SizeGuideModal'
import { useCart } from '../contexts/CartContext'
import { useToast } from './ui/ToastContainer'
import { useMounted } from '../hooks/useMounted'
import { trackStorefrontMetric } from '@/lib/storefrontMetrics'

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

type Variante = Pick<DBVariante, 'id' | 'talla' | 'colegio' | 'stock' | 'precio'>

interface Producto extends Pick<DBProducto, 'id' | 'nombre' | 'descripcion' | 'precio' | 'categoria' | 'imagen_url' | 'imagenes' | 'descuento_porcentaje' | 'en_oferta'> {
  variantes: Variante[]
  stock_total: number
}

interface ProductModalProps {
  producto: Producto
  relatedProducts?: Producto[]
  onClose: () => void
}

export default function ProductModal({ producto, relatedProducts = [], onClose }: ProductModalProps) {
  const [productoActivo, setProductoActivo] = useState(producto)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedTalla, setSelectedTalla] = useState<string>('')
  const [selectedColegio, setSelectedColegio] = useState<string>('')
  const [openLightbox, setOpenLightbox] = useState(false)
  const [showSizeGuide, setShowSizeGuide] = useState(false)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const trackedProductViewRef = useRef<string | null>(null)
  const [open, setOpen] = useState(true)
  const mounted = useMounted()
  const handleClose = useCallback(() => {
    setOpen(false)
    window.setTimeout(() => onClose(), 180)
  }, [onClose])
  
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Manejo de foco y teclado (Esc)
  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null
    const initialFocus = window.setTimeout(() => modalRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!openLightbox && !showSizeGuide) handleClose()
        return
      }
      if (e.key !== 'Tab' || !modalRef.current || openLightbox || showSizeGuide) return

      const focusableElements = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(element => element.getAttribute('aria-hidden') !== 'true')
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) {
        e.preventDefault()
        modalRef.current.focus()
      } else if (e.shiftKey && (document.activeElement === firstElement || !modalRef.current.contains(document.activeElement))) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && (document.activeElement === lastElement || !modalRef.current.contains(document.activeElement))) {
        e.preventDefault()
        firstElement.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(initialFocus)
      window.removeEventListener('keydown', onKey)
      prevActive?.focus()
    }
  }, [handleClose, openLightbox, showSizeGuide])

  useEffect(() => {
    if (trackedProductViewRef.current === productoActivo.id) return
    trackedProductViewRef.current = productoActivo.id
    trackStorefrontMetric('product_view')
  }, [productoActivo.id])

  // Obtener tallas y colegios únicos disponibles
  const tallasDisponibles = [...new Set(productoActivo.variantes.filter(v => v.stock > 0).map(v => v.talla))]
    .sort((a, b) => {
      const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
      return order.indexOf(a) - order.indexOf(b)
    })
  
  const colegiosDisponibles = [...new Set(productoActivo.variantes.filter(v => v.stock > 0).map(v => v.colegio))]

  // Auto-selección derivada: usar la única opción disponible
  const tallaEfectiva = selectedTalla || (tallasDisponibles.length === 1 ? tallasDisponibles[0] : '')
  const colegioEfectivo = selectedColegio || (colegiosDisponibles.length === 1 ? colegiosDisponibles[0] : '')

  const varianteSeleccionada = productoActivo.variantes.find(variante =>
    variante.talla === tallaEfectiva &&
    variante.colegio === colegioEfectivo &&
    variante.stock > 0
  )

  const preciosVariantes = productoActivo.variantes
    .filter(variante => variante.stock > 0)
    .map(variante => variante.precio ?? productoActivo.precio)
  const tienePreciosDiferentes = new Set(preciosVariantes).size > 1
  const precioActual = varianteSeleccionada
    ? varianteSeleccionada.precio ?? productoActivo.precio
    : preciosVariantes.length > 0 ? Math.min(...preciosVariantes) : productoActivo.precio
  const precioFinal = varianteSeleccionada
    ? Math.round(precioActual * (1 - Math.min(100, Math.max(0, productoActivo.descuento_porcentaje ?? 0)) / 100))
    : getProductFinalPrice(productoActivo)
  const requiereSeleccionColegio = colegiosDisponibles.length > 1 ||
    (colegiosDisponibles.length === 1 && colegiosDisponibles[0] !== 'General')
  const requiereSeleccionTalla = tallasDisponibles.length > 1 ||
    (tallasDisponibles.length === 1 && tallasDisponibles[0] !== 'Única')
  const seleccionCompleta = (!requiereSeleccionTalla || Boolean(tallaEfectiva)) &&
    (!requiereSeleccionColegio || Boolean(colegioEfectivo))

  // Obtener array de imágenes
  const imagenes = productoActivo.imagenes && productoActivo.imagenes.length > 0
    ? productoActivo.imagenes
    : productoActivo.imagen_url
    ? [productoActivo.imagen_url]
    : []

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagenes.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagenes.length) % imagenes.length)
  }

  const { addToCart } = useCart()
  const toast = useToast()

  const selectRelatedProduct = (relatedProduct: Producto) => {
    setProductoActivo(relatedProduct)
    setCurrentImageIndex(0)
    setSelectedTalla('')
    setSelectedColegio('')
    setOpenLightbox(false)
  }

  const variantesCoincidentes = productoActivo.variantes.filter(variante =>
    (!tallaEfectiva || variante.talla === tallaEfectiva) &&
    (!colegioEfectivo || variante.colegio === colegioEfectivo) &&
    variante.stock > 0
  )
  const stockDisponible = seleccionCompleta
    ? varianteSeleccionada?.stock ?? 0
    : variantesCoincidentes.reduce((total, variante) => total + variante.stock, 0)

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-[14px] cursor-pointer" onClick={handleClose} aria-hidden={false}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        tabIndex={-1}
        ref={modalRef}
        className={`relative z-[2147483647] flex max-h-[100vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(15,24,26,0.28)] transition-all duration-300 dark:bg-gray-800 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} cursor-default`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between border-b border-gray-200 bg-white/90 px-4 py-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/90 sm:px-6">
          <h2 id="product-modal-title" className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">Detalles del Producto</h2>
          <button type="button"
            onClick={handleClose}
            className="p-2.5 min-w-[46px] min-h-[46px] flex items-center justify-center bg-[#123f3d] text-white hover:bg-[#0d2f2d] rounded-full transition-all shadow-lg hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-[#123f3d]/25"
            aria-label="Cerrar diálogo"
            title="Cerrar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            {/* Galería de Imágenes */}
            <div className="space-y-4">
              {/* Imagen Principal */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 group">
                {imagenes.length > 0 ? (
                  <>
                    <LazyImage
                      src={imagenes[currentImageIndex]}
                      alt={`${productoActivo.nombre} - Imagen ${currentImageIndex + 1}`}
                      width={800}
                      height={800}
                      fallbackLabel="Foto temporalmente no disponible"
                      className="w-full h-full object-contain"
                      priority
                      style={{ objectFit: 'contain' }}
                    />
                    
                    {/* Navegación de imágenes */}
                    {imagenes.length > 1 && (
                      <>
                        <button type="button"
                          onClick={prevImage}
                          aria-label={`Imagen anterior de ${productoActivo.nombre}`}
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full transition-all z-10 focus:outline-none focus:ring-2 focus:ring-white"
                        >
                          <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button type="button"
                          onClick={nextImage}
                          aria-label={`Imagen siguiente de ${productoActivo.nombre}`}
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
                        aria-label={`Ampliar imagen de ${productoActivo.nombre}`}
                        className="absolute bottom-4 right-4 rounded-full bg-white/90 p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-[#123f3d] dark:bg-gray-800/90 dark:focus:ring-[#e7c77c]"
                        title="Ver imagen"
                      >
                        <SearchIcon className="w-5 h-5 text-gray-900 dark:text-white" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,#fbf6ed_0%,#e9eee8_70%)] px-4 text-center text-[#52716a] dark:bg-[radial-gradient(circle_at_top,#294341_0%,#172d2c_70%)] dark:text-[#c6d8d3]">
                    <svg className="w-32 h-32 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-semibold">Foto en preparación</span>
                  </div>
                )}
                {productoActivo.stock_total === 0 && (
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
                          ? 'border-[#123f3d] ring-2 ring-[#123f3d]/50 dark:border-[#e7c77c] dark:ring-[#e7c77c]/50'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-[#123f3d] dark:focus:ring-[#e7c77c]`}
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
                  <span className="inline-block bg-[#edf3ee] dark:bg-[#244341] text-[#123f3d] dark:text-[#e7c77c] text-xs font-bold px-3 py-1.5 rounded-full">
                    {productoActivo.categoria}
                  </span>
                  {productoActivo.en_oferta && (
                    <span className="inline-block bg-[#f6efdf] dark:bg-[#e7c77c]/15 text-[#76581c] dark:text-[#f3d79a] text-xs font-bold px-3 py-1.5 rounded-full">
                      En oferta
                    </span>
                  )}
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3 text-balance">{productoActivo.nombre}</h3>
              </div>
                {openLightbox && (
                  <ImageLightbox images={imagenes} startIndex={currentImageIndex} onClose={() => setOpenLightbox(false)} />
                )}

              {/* Precio */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                {!varianteSeleccionada && preciosVariantes.some(precio => precio !== precioActual) && (
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Desde</p>
                )}
                <div className="flex items-baseline gap-3">
                  {productoActivo.descuento_porcentaje && productoActivo.descuento_porcentaje > 0 ? (
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
                {tienePreciosDiferentes && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    El precio varía según la talla o el colegio; selecciona una opción para ver su valor.
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-wide">
                  {productoActivo.nombre}
                </h4>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                  {productoActivo.descripcion.split('\n').map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 text-[#123f3d] dark:text-[#e7c77c]">•</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Selector de Colegio */}
              {colegiosDisponibles.length > 1 || (colegiosDisponibles.length === 1 && colegiosDisponibles[0] !== 'General') ? (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      Colegio:
                    </h4>
                    {colegioEfectivo && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">{colegioEfectivo}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {colegiosDisponibles.map(colegio => (
                      <button type="button"
                        key={colegio}
                        aria-pressed={colegioEfectivo === colegio}
                        onClick={() => {
                          const nextColegio = colegioEfectivo === colegio ? '' : colegio
                          if (nextColegio) trackStorefrontMetric('variant_selected')
                          setSelectedColegio(nextColegio)
                          if (
                            selectedTalla &&
                            nextColegio &&
                            !productoActivo.variantes.some(variante =>
                              variante.colegio === nextColegio &&
                              variante.talla === selectedTalla &&
                              variante.stock > 0
                            )
                          ) {
                            setSelectedTalla('')
                          }
                        }}
                        className={`px-4 py-2 min-h-[44px] rounded-xl border-2 font-bold transition-all ${
                          colegioEfectivo === colegio
                            ? 'border-[#123f3d] bg-[#123f3d] text-white shadow-md dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                            : 'border-gray-200 dark:border-gray-700 hover:border-[#123f3d]/50 dark:hover:border-[#e7c77c]/50 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900`}
                      >
                        {colegio}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Selector de Talla */}
              {tallasDisponibles.length > 1 || (tallasDisponibles.length === 1 && tallasDisponibles[0] !== 'Única') ? (
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
                      className="min-h-11 text-xs text-[#123f3d] dark:text-[#e7c77c] font-semibold underline underline-offset-2 hover:text-[#0d2f2d] dark:hover:text-[#f3d79a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c]"
                      onClick={() => setShowSizeGuide(true)}
                    >
                      Ver Guía de Tallas
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Talla: {tallaEfectiva || '-'}
                  </p>
                  <div className="grid grid-cols-8 gap-2">
                    {tallasDisponibles.map(talla => {
                      // Verificar si esta talla está disponible con el colegio seleccionado
                      const disponible = productoActivo.variantes.some(v =>
                        v.talla === talla && 
                        (!colegioEfectivo || v.colegio === colegioEfectivo) && 
                        v.stock > 0
                      )
                      
                      return (
                        <button type="button"
                          key={talla}
                          aria-label={`${talla}${disponible ? '' : ', agotada para la selección actual'}`}
                          aria-pressed={tallaEfectiva === talla}
                          onClick={() => {
                            if (!disponible) return
                            const nextTalla = tallaEfectiva === talla ? '' : talla
                            if (nextTalla) trackStorefrontMetric('variant_selected')
                            setSelectedTalla(nextTalla)
                          }}
                          disabled={!disponible}
                          className={`aspect-square h-12 w-12 flex items-center justify-center rounded-xl border-2 font-black text-lg transition-all ${
                            tallaEfectiva === talla
                              ? 'border-[#123f3d] bg-[#123f3d] text-white shadow-md dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                              : disponible
                              ? 'border-gray-200 dark:border-gray-700 hover:border-[#123f3d]/50 dark:hover:border-[#e7c77c]/50 text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800'
                              : 'border-gray-100 dark:border-gray-800 bg-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          } focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900`}
                        >
                          {talla}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Disponibilidad */}
              <div className="mb-2">
                {stockDisponible > 0 ? (
                  <div className="flex items-start gap-2 text-green-700 dark:text-green-400">
                    <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-semibold">
                        {seleccionCompleta ? 'Disponible para esta selección' : 'Hay unidades disponibles'}
                      </p>
                      <p className="text-sm">
                        {seleccionCompleta
                          ? `${stockDisponible} ${stockDisponible === 1 ? 'unidad disponible' : 'unidades disponibles'}`
                          : `${stockDisponible} ${stockDisponible === 1 ? 'unidad en variantes disponibles' : 'unidades en variantes disponibles'}. Elige colegio y talla para confirmar.`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <CancelIcon className="h-5 w-5" />
                    <span className="font-semibold">No hay stock para esta selección</span>
                  </div>
                )}
              </div>

              {/* Instrucciones de compra breves */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-2">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2">¿Cómo comprar?</h4>
                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal pl-4">
                  <li>Elige una variante disponible.</li>
                  <li>Añádela a tu pedido o consúltala por WhatsApp.</li>
                  <li>Confirmamos stock, pago y entrega contigo.</li>
                </ol>
                <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Añadir al pedido registra una solicitud; no reserva stock ni confirma una compra.
                </p>
              </div>

              {/* Productos Relacionados */}
              {relatedProducts && relatedProducts.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wide">
                    También te podría interesar
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {relatedProducts.filter(relProduct => relProduct.id !== productoActivo.id).map((relProduct) => (
                      <button key={relProduct.id} type="button" onClick={() => selectRelatedProduct(relProduct)} aria-label={`Ver detalles de ${relProduct.nombre}`} className="block w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left transition-colors hover:border-[#123f3d]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:border-gray-600 dark:bg-gray-700/50 dark:hover:border-[#e7c77c]/50 dark:focus-visible:ring-[#e7c77c]">
                        <div className="relative aspect-square bg-[#f7f4ee] dark:bg-gray-800">
                          {relProduct.imagen_url || (relProduct.imagenes && relProduct.imagenes.length > 0) ? (
                            <LazyImage 
                              src={relProduct.imagen_url || (relProduct.imagenes && relProduct.imagenes[0]) || ''} 
                              alt={relProduct.nombre}
                              fallbackLabel="Foto no disponible"
                              width={200}
                              height={200}
                              className="w-full h-full object-contain p-2 transition-transform"
                            />
                          ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#52716a] dark:text-[#c6d8d3]">
                              <span className="text-2xl" aria-hidden="true">◇</span>
                              <span className="text-xs font-semibold">Foto en preparación</span>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{relProduct.nombre}</p>
                          <p className="mt-1 text-xs font-bold text-[#123f3d] dark:text-[#e7c77c]">{formatPrice(relProduct.precio)}</p>
                        </div>
                      </button>
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
                    if (!seleccionCompleta) {
                      const faltantes = [
                        requiereSeleccionColegio && !colegioEfectivo ? 'colegio' : '',
                        requiereSeleccionTalla && !tallaEfectiva ? 'talla' : ''
                      ].filter(Boolean).join(' y ')
                      toast.error(`Por favor selecciona ${faltantes} primero.`)
                      return
                    }
                    if (!varianteSeleccionada || varianteSeleccionada.stock < 1) {
                      toast.error('La variante seleccionada ya no está disponible.')
                      return
                    }
                    const added = addToCart({
                      producto_id: productoActivo.id,
                      variante_id: varianteSeleccionada.id,
                      nombre: productoActivo.nombre,
                      precio: Math.round(precioFinal),
                      talla: tallaEfectiva,
                      colegio: colegioEfectivo || 'General',
                      cantidad: 1,
                      imagen_url: imagenes[0] || undefined,
                      stock_disponible: stockDisponible
                    })
                    if (added === 'added') {
                      trackStorefrontMetric('added_to_order')
                      toast.success('¡Añadido a tu pedido!')
                      handleClose()
                    } else if (added === 'stock-limit') {
                      toast.error('Ya alcanzaste el stock disponible de esta variante.')
                    } else {
                      toast.error('El pedido alcanzó el máximo permitido de 20 variantes o 99 prendas.')
                    }
                  }}
                  disabled={!seleccionCompleta || !varianteSeleccionada || varianteSeleccionada.stock <= 0}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#123f3d] px-4 py-3.5 font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#0d2f2d] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 disabled:hover:translate-y-0 dark:bg-[#e7c77c] dark:text-[#123f3d] dark:hover:bg-[#f3d79a] dark:disabled:bg-gray-700 dark:disabled:text-gray-400 dark:focus-visible:ring-offset-gray-900 text-sm sm:text-base"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Añadir a mi pedido
                </button>

                  <a
                    href={`https://wa.me/56983852967?text=${encodeURIComponent(
                    `Hola, me interesa el producto "${productoActivo.nombre}".${tallaEfectiva ? ` Talla: ${tallaEfectiva}.` : ''}${colegioEfectivo ? ` Colegio: ${colegioEfectivo}.` : ''} Valor referencial: ${formatPrice(precioFinal)}. ¿Me confirman disponibilidad, precio final y opciones de entrega?`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackStorefrontMetric('whatsapp_opened')}
                    className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#128C7E] px-4 py-3.5 font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#0d7065] hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 text-sm sm:text-base"
                    title="Comprar sólo este producto"
                  >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Consultar esta prenda
                  </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
