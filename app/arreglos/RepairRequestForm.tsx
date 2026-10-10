'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { crearSolicitudReparacionAction } from '@/app/actions/solicitudes-reparacion'

const phonePattern = /^[0-9+() -]{8,24}$/
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function RepairRequestForm() {
  const requestRef = useRef<{ fingerprint: string; key: string; trackingToken: string } | null>(null)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [prenda, setPrenda] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaDeseada, setFechaDeseada] = useState('')
  const [consentimiento, setConsentimiento] = useState(false)
  const [website, setWebsite] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [requestId, setRequestId] = useState('')
  const [trackingToken, setTrackingToken] = useState('')
  const [trackingCodeCopied, setTrackingCodeCopied] = useState(false)
  const [trackingCodeCopyError, setTrackingCodeCopyError] = useState('')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    let fingerprint = ''

    try {
      const fingerprintPayload = JSON.stringify({
        nombre: nombre.trim(),
        telefono: telefono.replace(/\D/g, ''),
        prenda: prenda.trim(),
        descripcion: descripcion.trim(),
        fechaDeseada
      })
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprintPayload))
      fingerprint = Array.from(new Uint8Array(hash))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')

      const saved = localStorage.getItem('repair_request_pending')
      if (saved) {
        const parsed: unknown = JSON.parse(saved)
        if (
          parsed !== null &&
          typeof parsed === 'object' &&
          'fingerprint' in parsed &&
          parsed.fingerprint === fingerprint &&
          'key' in parsed &&
          typeof parsed.key === 'string' &&
          UUID_PATTERN.test(parsed.key) &&
          'trackingToken' in parsed &&
          typeof parsed.trackingToken === 'string' &&
          /^[a-f0-9]{64}$/i.test(parsed.trackingToken)
        ) {
          requestRef.current = { fingerprint, key: parsed.key, trackingToken: parsed.trackingToken }
        }
      }

      if (!requestRef.current || requestRef.current.fingerprint !== fingerprint) {
        const tokenBytes = crypto.getRandomValues(new Uint8Array(32))
        const token = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('')
        requestRef.current = { fingerprint, key: crypto.randomUUID(), trackingToken: token }
      }
      localStorage.setItem('repair_request_pending', JSON.stringify(requestRef.current))

      const result = await crearSolicitudReparacionAction({
        requestKey: requestRef.current.key,
        trackingToken: requestRef.current.trackingToken,
        nombre,
        telefono,
        prenda,
        descripcion,
        fechaDeseada,
        consentimiento,
        website
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      localStorage.removeItem('repair_request_pending')
      setTrackingToken(requestRef.current.trackingToken)
      requestRef.current = null
      setRequestId(result.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo registrar la solicitud. Intenta nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (requestId) {
    const text = `Hola, registré la solicitud de arreglo ${requestId.slice(0, 8)} para ${prenda}. ¿Me ayudan a coordinar la evaluación?`
    const whatsappUrl = `https://wa.me/56983852967?text=${encodeURIComponent(text)}`

    return (
      <div role="status" aria-live="polite" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
        <h2 className="font-bold text-emerald-900 dark:text-emerald-200">Solicitud registrada</h2>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">Código de referencia: {requestId.slice(0, 8)}.</p>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">Aún no se ha confirmado precio ni fecha de entrega.</p>
        <p className="mt-3 text-sm font-semibold text-emerald-900 dark:text-emerald-200">Código privado para consultar el estado:</p>
        <code className="mt-1 block break-all rounded-lg bg-white/70 p-3 text-xs text-emerald-950 dark:bg-black/20 dark:text-emerald-100">{trackingToken}</code>
        <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">Guárdalo en un lugar seguro. Permite consultar el estado y no se puede recuperar si lo pierdes.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-[#128C7E] px-4 text-sm font-bold text-white">
            Coordinar por WhatsApp
          </a>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800/20 px-4 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Volver al catálogo
          </Link>
          <button
            type="button"
            onClick={async () => {
              setTrackingCodeCopyError('')
              try {
                await navigator.clipboard.writeText(trackingToken)
                setTrackingCodeCopied(true)
              } catch {
                setTrackingCodeCopyError('No se pudo copiar el código. Selecciónalo y cópialo manualmente.')
              }
            }}
            className="inline-flex min-h-11 items-center rounded-lg border border-emerald-800/20 px-4 text-sm font-semibold text-emerald-900 dark:text-emerald-200"
          >
            {trackingCodeCopied ? 'Código copiado' : 'Copiar código'}
          </button>
        </div>
        {trackingCodeCopyError && <p role="alert" className="mt-2 text-sm text-red-800 dark:text-red-200">{trackingCodeCopyError}</p>}
      </div>
    )
  }

  const today = new Date()
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset())

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Nombre
          <input required minLength={2} maxLength={100} autoComplete="name" value={nombre} onChange={event => setNombre(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#123f3d]/15 bg-white px-3 font-normal dark:border-white/10 dark:bg-[#0d1a1a]" />
        </label>
        <label className="text-sm font-semibold">
          Teléfono de contacto
          <input required type="tel" inputMode="tel" autoComplete="tel" minLength={8} maxLength={24} pattern={phonePattern.source} value={telefono} onChange={event => setTelefono(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#123f3d]/15 bg-white px-3 font-normal dark:border-white/10 dark:bg-[#0d1a1a]" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Prenda
          <input required minLength={2} maxLength={80} placeholder="Ej.: pantalón escolar" value={prenda} onChange={event => setPrenda(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#123f3d]/15 bg-white px-3 font-normal dark:border-white/10 dark:bg-[#0d1a1a]" />
        </label>
        <label className="text-sm font-semibold">
          Fecha ideal (opcional)
          <input type="date" min={today.toISOString().slice(0, 10)} value={fechaDeseada} onChange={event => setFechaDeseada(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-[#123f3d]/15 bg-white px-3 font-normal dark:border-white/10 dark:bg-[#0d1a1a]" />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        ¿Qué arreglo necesitas?
        <textarea required minLength={10} maxLength={1000} rows={5} value={descripcion} onChange={event => setDescripcion(event.target.value)} placeholder="Describe el daño o ajuste y, si puedes, indica la zona de la prenda." className="mt-1 w-full resize-y rounded-lg border border-[#123f3d]/15 bg-white px-3 py-2 font-normal dark:border-white/10 dark:bg-[#0d1a1a]" />
        <span className="mt-1 block text-right text-xs font-normal text-[#6e827f]">{descripcion.length}/1000</span>
      </label>
      <label aria-hidden="true" className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        Sitio web
        <input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)} />
      </label>
      <p className="text-xs leading-5 text-[#5f7a73] dark:text-[#bfd4d0]">
        Esta primera versión no admite fotos. Puedes enviarlas al coordinar por WhatsApp; el precio y la fecha se confirman después de revisar la prenda.
      </p>
      <label className="flex items-start gap-2 text-xs leading-5 text-[#5f7a73] dark:text-[#bfd4d0]">
        <input required type="checkbox" checked={consentimiento} onChange={event => setConsentimiento(event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#123f3d]" />
        Autorizo el uso de mi nombre y teléfono para gestionar esta solicitud y coordinar el arreglo.
      </label>
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="min-h-12 w-full rounded-lg bg-[#123f3d] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0d302e] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
        {isSubmitting ? 'Registrando solicitud…' : 'Enviar solicitud de arreglo'}
      </button>
    </form>
  )
}
