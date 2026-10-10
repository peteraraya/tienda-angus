'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  buscarInventarioAsistenteAction,
  consultarEstadoReparacionAsistenteAction,
  type AssistantProductResult
} from '@/app/actions/store-assistant'

type AssistantTopic = 'inventory' | 'store' | 'repair' | null

const repairStatusText: Record<string, string> = {
  pendiente: 'Recibimos tu solicitud. Aún está pendiente de evaluación.',
  cotizada: 'Tu solicitud ya fue cotizada. Escríbenos por WhatsApp para revisar los detalles.',
  aceptada: 'El arreglo fue aceptado y está en proceso de coordinación.',
  completada: 'El arreglo figura como completado. Contáctanos para coordinar la entrega.',
  cancelada: 'La solicitud figura como cancelada. Escríbenos si necesitas ayuda.'
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(price)

function ProductResults({ products }: { products: AssistantProductResult[] }) {
  if (!products.length) {
    return <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">No encontré stock disponible con esos datos. Prueba con otra prenda o consúltanos por WhatsApp.</p>
  }

  return (
    <ul className="mt-3 space-y-2">
      {products.map(product => (
        <li key={product.name} className="rounded-lg border border-[#123f3d]/10 bg-white p-3 text-sm dark:border-white/10 dark:bg-[#102221]">
          <p className="font-bold">{product.name}</p>
          <p className="mt-1">Desde {formatPrice(product.price)}</p>
          <ul className="mt-2 space-y-1 text-xs text-[#49625c] dark:text-[#c4d5d1]">
            {product.variants.slice(0, 5).map((variant, index) => (
              <li key={`${variant.school}-${variant.size}-${index}`}>
                Talla {variant.size} · {variant.school} · {variant.stock} {variant.stock === 1 ? 'unidad' : 'unidades'}
              </li>
            ))}
            {product.variants.length > 5 && <li>Más tallas disponibles.</li>}
          </ul>
        </li>
      ))}
    </ul>
  )
}

export default function StoreAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [topic, setTopic] = useState<AssistantTopic>(null)
  const [question, setQuestion] = useState('')
  const [trackingCode, setTrackingCode] = useState('')
  const [products, setProducts] = useState<AssistantProductResult[] | null>(null)
  const [repairStatus, setRepairStatus] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.querySelector<HTMLElement>('button, input')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (pathname?.startsWith('/admin')) return null

  function selectTopic(nextTopic: Exclude<AssistantTopic, null>) {
    setTopic(nextTopic)
    setProducts(null)
    setRepairStatus('')
    setError('')
  }

  async function searchInventory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setProducts(null)
    setIsLoading(true)
    try {
      const result = await buscarInventarioAsistenteAction(question)
      if (!result.success) setError(result.error)
      else setProducts(result.data)
    } catch {
      setError('No pude consultar el inventario. Inténtalo nuevamente o escríbenos por WhatsApp.')
    } finally {
      setIsLoading(false)
    }
  }

  async function lookupRepair(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setRepairStatus('')
    setIsLoading(true)
    try {
      const result = await consultarEstadoReparacionAsistenteAction(trackingCode)
      if (!result.success) setError(result.error)
      else {
        const updatedAt = new Intl.DateTimeFormat('es-CL', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'America/Santiago'
        }).format(new Date(result.data.updatedAt))
        setRepairStatus(`${repairStatusText[result.data.status]} Última actualización: ${updatedAt}.`)
      }
    } catch {
      setError('No pude verificar el estado. Inténtalo nuevamente o contáctanos por WhatsApp.')
    } finally {
      setIsLoading(false)
    }
  }

  function backToTopics() {
    setTopic(null)
    setQuestion('')
    setTrackingCode('')
    setProducts(null)
    setRepairStatus('')
    setError('')
  }

  return (
    <>
      {isOpen && (
        <section
          id="store-assistant-panel"
          ref={panelRef}
          aria-label="Asistente de Confecciones Angus"
          className="fixed bottom-20 left-4 z-[60] flex max-h-[min(38rem,calc(100dvh-6rem))] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#123f3d]/15 bg-[#fbfaf7] text-[#173b39] shadow-2xl dark:border-white/15 dark:bg-[#142b2a] dark:text-[#edf5f2] sm:bottom-24 sm:left-6"
        >
          <header className="flex items-start justify-between gap-3 bg-[#123f3d] px-4 py-3 text-white dark:bg-[#0d1a1a]">
            <div>
              <h2 className="font-bold">Asistente Angus</h2>
              <p className="mt-0.5 text-xs text-white/85">Elige un tema; no guardamos esta conversación.</p>
            </div>
            <button type="button" onClick={() => { setIsOpen(false); triggerRef.current?.focus() }} aria-label="Cerrar asistente" className="grid size-11 shrink-0 place-items-center rounded-full text-xl hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c77c]">×</button>
          </header>

          <div className="overflow-y-auto p-4">
            {!topic && (
              <div className="space-y-2">
                <p className="mb-3 text-sm">¿En qué te puedo ayudar?</p>
                <button type="button" onClick={() => selectTopic('inventory')} className="min-h-11 w-full rounded-xl border border-[#123f3d]/15 px-3 text-left text-sm font-semibold hover:bg-[#123f3d]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:border-white/15 dark:hover:bg-white/5">Consultar tallas y stock</button>
                <button type="button" onClick={() => selectTopic('store')} className="min-h-11 w-full rounded-xl border border-[#123f3d]/15 px-3 text-left text-sm font-semibold hover:bg-[#123f3d]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:border-white/15 dark:hover:bg-white/5">Información de la tienda</button>
                <button type="button" onClick={() => selectTopic('repair')} className="min-h-11 w-full rounded-xl border border-[#123f3d]/15 px-3 text-left text-sm font-semibold hover:bg-[#123f3d]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:border-white/15 dark:hover:bg-white/5">Consultar un arreglo</button>
              </div>
            )}

            {topic === 'inventory' && (
              <div>
                <button type="button" onClick={backToTopics} className="min-h-11 text-sm font-semibold underline underline-offset-2">← Temas</button>
                <form onSubmit={searchInventory} className="mt-2 space-y-3">
                  <label htmlFor="assistant-product-query" className="block text-sm font-semibold">¿Qué prenda, talla o colegio buscas?</label>
                  <input id="assistant-product-query" value={question} onChange={event => setQuestion(event.target.value)} maxLength={160} required placeholder="Ej.: buzo talla 10" className="min-h-11 w-full rounded-lg border border-[#123f3d]/20 bg-white px-3 text-base text-[#173b39] placeholder:text-[#687d78] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:border-white/20 dark:bg-[#0d1a1a] dark:text-white dark:placeholder:text-[#b4c5c1]" />
                  <button disabled={isLoading} className="min-h-11 w-full rounded-lg bg-[#123f3d] px-4 text-sm font-bold text-white hover:bg-[#0d302e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] disabled:opacity-60 dark:bg-[#d3a954] dark:text-[#123f3d]">{isLoading ? 'Buscando…' : 'Buscar en inventario'}</button>
                </form>
                {products && <ProductResults products={products} />}
              </div>
            )}

            {topic === 'store' && (
              <div className="text-sm leading-6">
                <button type="button" onClick={backToTopics} className="mb-2 min-h-11 font-semibold underline underline-offset-2">← Temas</button>
                <p><strong>Dirección:</strong> Pasaje Santa Olga 288, Quillota.</p>
                <p><strong>Horario:</strong> lunes a viernes, 12:00–19:00; sábado, 12:00–17:00. Domingo cerrado.</p>
                <p><strong>Teléfono y WhatsApp:</strong> +56 9 8385 2967.</p>
                <p className="mt-2">Te asesoramos en tallas, cuidado de prendas y arreglos.</p>
                <a href="https://www.google.com/maps/search/?api=1&query=Pasaje+Santa+Olga+288%2C+Quillota" target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center font-semibold underline underline-offset-2">Abrir ubicación en Maps</a>
              </div>
            )}

            {topic === 'repair' && (
              <div>
                <button type="button" onClick={backToTopics} className="min-h-11 text-sm font-semibold underline underline-offset-2">← Temas</button>
                <form onSubmit={lookupRepair} className="mt-2 space-y-3">
                  <label htmlFor="assistant-repair-code" className="block text-sm font-semibold">Ingresa el código privado de 64 caracteres que recibiste al registrar el arreglo.</label>
                  <input id="assistant-repair-code" value={trackingCode} onChange={event => setTrackingCode(event.target.value)} minLength={64} maxLength={64} pattern="[a-fA-F0-9]{64}" required autoComplete="off" spellCheck={false} className="min-h-11 w-full rounded-lg border border-[#123f3d]/20 bg-white px-3 font-mono text-sm text-[#173b39] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:border-white/20 dark:bg-[#0d1a1a] dark:text-white" />
                  <button disabled={isLoading} className="min-h-11 w-full rounded-lg bg-[#123f3d] px-4 text-sm font-bold text-white hover:bg-[#0d302e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] disabled:opacity-60 dark:bg-[#d3a954] dark:text-[#123f3d]">{isLoading ? 'Verificando…' : 'Consultar estado'}</button>
                </form>
                {repairStatus && <p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">{repairStatus}</p>}
              </div>
            )}

            {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-100">{error}</p>}
            <a href="https://wa.me/56983852967" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[#087367] underline underline-offset-2 dark:text-[#7de0c9]">¿Necesitas ayuda? Escríbenos por WhatsApp</a>
          </div>
        </section>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-label={isOpen ? 'Cerrar asistente Angus' : 'Abrir asistente Angus'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className="fixed bottom-4 left-4 z-[60] flex min-h-12 items-center gap-2 rounded-full bg-[#123f3d] px-4 text-sm font-bold text-white shadow-lg transition-colors hover:bg-[#0d302e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 dark:bg-[#d3a954] dark:text-[#123f3d] dark:hover:bg-[#e7c77c] sm:bottom-6 sm:left-6"
      >
        <span aria-hidden="true">✦</span>
        {isOpen ? 'Cerrar' : 'Ayuda'}
      </button>
    </>
  )
}
