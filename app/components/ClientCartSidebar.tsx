'use client'

import React, { useEffect, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Image from 'next/image'
import { useCart } from '../contexts/CartContext'
import { formatPrice } from '@/lib/formatPrice'
import { crearSolicitudPublicaAction } from '@/app/actions/solicitudes-publicas'

export default function ClientCartSidebar() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [orderLink, setOrderLink] = useState('')
  const cartExceedsLimit = cart.length > 20 || cartCount > 99 || cart.some(item => item.cantidad > 99)

  // Cerrar al presionar Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false)
      }
      if (e.key !== 'Tab' || !isCartOpen || !sidebarRef.current) return

      const focusableElements = Array.from(sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) {
        e.preventDefault()
        sidebarRef.current.focus()
      } else if (e.shiftKey && (document.activeElement === firstElement || !sidebarRef.current.contains(document.activeElement))) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && (document.activeElement === lastElement || !sidebarRef.current.contains(document.activeElement))) {
        e.preventDefault()
        firstElement.focus()
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isCartOpen, setIsCartOpen])

  useEffect(() => {
    if (!isCartOpen) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusTimer = window.setTimeout(() => {
      sidebarRef.current?.querySelector<HTMLElement>('button')?.focus()
    }, 0)

    return () => {
      window.clearTimeout(focusTimer)
      previouslyFocused?.focus()
    }
  }, [isCartOpen])

  // Evitar scroll del body cuando el carrito está abierto
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = previousOverflow }
  }, [isCartOpen])

  if (!isCartOpen) return null

  const handleCheckout = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cart.length === 0) return
    if (cartExceedsLimit) {
      setCheckoutError('El pedido admite hasta 20 variantes y 99 prendas en total. Ajusta las cantidades antes de continuar.')
      return
    }

    setCheckoutError('')
    setIsSubmitting(true)
    const requestItems = cart
      .map(item => ({ varianteId: item.variante_id, cantidad: item.cantidad }))
      .sort((a, b) => a.varianteId.localeCompare(b.varianteId))
    const fingerprintPayload = JSON.stringify({
      nombre: nombre.trim(),
      telefono: telefono.replace(/\D/g, ''),
      items: requestItems
    })
    let pendingWindow: Window | null = null

    try {
      const fingerprintDigest = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(fingerprintPayload)
      )
      const fingerprint = Array.from(new Uint8Array(fingerprintDigest))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
      const savedRequest = localStorage.getItem('public_order_request')
      if (savedRequest) {
        const parsed: unknown = JSON.parse(savedRequest)
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'fingerprint' in parsed &&
          parsed.fingerprint === fingerprint &&
          'key' in parsed &&
          typeof parsed.key === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parsed.key)
        ) {
          requestRef.current = { fingerprint, key: parsed.key }
        }
      }

      if (!requestRef.current || requestRef.current.fingerprint !== fingerprint) {
        requestRef.current = { fingerprint, key: crypto.randomUUID() }
      }
      localStorage.setItem('public_order_request', JSON.stringify(requestRef.current))

      pendingWindow = window.open('about:blank', '_blank')
      if (pendingWindow) pendingWindow.opener = null

      const response = await crearSolicitudPublicaAction({
        requestKey: requestRef.current.key,
        nombre,
        telefono,
        consentimiento,
        website,
        items: requestItems
      })

      if (!response.success) {
        pendingWindow?.close()
        setCheckoutError(response.error)
        return
      }

      const { data } = response
      let text = `Hola, registré la solicitud de pedido ${data.id.slice(0, 8)} a nombre de ${nombre.trim()}:\n\n`
      data.items.forEach((item, index) => {
        text += `${index + 1}. *${item.nombre}*\n`
        text += `   Talla: ${item.talla} | Colegio: ${item.colegio}\n`
        text += `   Cantidad: ${item.cantidad} x ${formatPrice(item.precio_unitario)} = ${formatPrice(item.subtotal)}\n\n`
      })
      text += `*Total registrado: ${formatPrice(data.total)}*\n\n`
      text += 'La solicitud está pendiente de confirmación. ¿Me indican los pasos para realizar el pago y coordinar la entrega?'

      const url = `https://wa.me/56983852967?text=${encodeURIComponent(text)}`
      setOrderLink(url)
      localStorage.removeItem('public_order_request')
      requestRef.current = null
      clearCart()
      if (pendingWindow) pendingWindow.location.href = url
    } catch (error) {
      pendingWindow?.close()
      setCheckoutError(error instanceof Error ? error.message : 'No se pudo registrar la solicitud. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay oscuro */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-sidebar-title"
        tabIndex={-1}
        className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col animate-slideInRight"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 id="cart-sidebar-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-[#123f3d] dark:text-[#e7c77c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Mi Pedido
          </h2>
          <button 
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Cerrar pedido"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:hover:bg-gray-800 dark:focus-visible:ring-[#e7c77c]"
          >
            <CloseIcon className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 && orderLink ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <span aria-hidden="true" className="text-xl font-bold">✓</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Solicitud registrada</h3>
                <p className="mt-1 max-w-xs text-sm text-gray-600 dark:text-gray-400">
                  Aún no se reserva el stock. Confirma los detalles por WhatsApp.
                </p>
              </div>
              <a href={orderLink} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-[#128C7E] px-5 py-3 text-sm font-bold text-white">
                Continuar por WhatsApp
              </a>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4">
              <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <p className="text-lg font-medium">Tu pedido está vacío</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="min-h-11 text-[#123f3d] dark:text-[#e7c77c] font-bold hover:underline"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-700">
                    {item.imagen_url ? (
                      <Image src={item.imagen_url} alt={item.nombre} width={80} height={80} unoptimized className="h-full w-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white truncate text-sm">{item.nombre}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.colegio} • Talla: <span className="font-semibold">{item.talla}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                        <button 
                          onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                          aria-label={`Reducir cantidad de ${item.nombre}`}
                          className="min-h-11 min-w-11 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#123f3d] dark:hover:text-[#e7c77c] font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">{item.cantidad}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                          disabled={item.cantidad >= item.stock_disponible || cartCount >= 99}
                          aria-label={`Aumentar cantidad de ${item.nombre}`}
                          className="min-h-11 min-w-11 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-[#123f3d] dark:hover:text-[#e7c77c] font-bold disabled:opacity-50 disabled:hover:text-gray-600"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-bold text-[#123f3d] dark:text-[#e7c77c]">
                          {formatPrice(item.precio * item.cantidad)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Eliminar ${item.nombre} del pedido`}
                    className="flex min-h-11 min-w-11 items-center justify-center self-start text-gray-400 transition-colors hover:text-red-500"
                    title="Eliminar del pedido"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </button>
                </div>
              ))}

              <div className="flex justify-end">
                <button 
                  onClick={clearCart}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-medium underline"
                >
                  Vaciar pedido
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <form onSubmit={handleCheckout} className="space-y-3 border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50 sm:p-5">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Subtotal ({cartCount} prendas)</span>
              <span className="text-xl font-black text-gray-900 dark:text-white">{formatPrice(cartTotal)}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Nombre
                <input required minLength={2} maxLength={100} autoComplete="name" value={nombre} onChange={event => setNombre(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal dark:border-gray-700 dark:bg-gray-900" />
              </label>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Teléfono de contacto
                <input required type="tel" inputMode="tel" autoComplete="tel" minLength={8} maxLength={24} pattern="[0-9+() -]{8,24}" value={telefono} onChange={event => setTelefono(event.target.value)} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-normal dark:border-gray-700 dark:bg-gray-900" />
              </label>
            </div>
            <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
              Sitio web
              <input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} />
            </label>
            <label className="flex items-start gap-2 text-xs leading-5 text-gray-600 dark:text-gray-400">
              <input required type="checkbox" checked={consentimiento} onChange={event => setConsentimiento(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#123f3d]" />
              Autorizo el uso de mi nombre y teléfono para registrar esta solicitud y coordinar el pedido conmigo.
            </label>
            {cartExceedsLimit && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">El pedido admite hasta 20 variantes y 99 prendas en total. Ajusta las cantidades antes de continuar.</p>}
            {checkoutError && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{checkoutError}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              La solicitud no reserva productos. El stock y el precio se verifican al enviarla; el pago y la entrega se coordinan por WhatsApp.
            </p>

            <button 
              type="submit"
              disabled={isSubmitting || cartExceedsLimit}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#128C7E] px-4 py-3 font-bold text-white transition-colors hover:bg-[#0d7065] disabled:cursor-wait disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              {isSubmitting ? 'Registrando solicitud…' : 'Registrar y continuar por WhatsApp'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
