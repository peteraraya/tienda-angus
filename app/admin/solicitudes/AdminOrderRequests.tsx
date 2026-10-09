'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  actualizarEstadoSolicitudPedidoAction,
  fetchSolicitudesPedidosAdminAction
} from '@/app/actions/solicitudes-admin'
import AdminHeader from '../components/AdminHeader'
import { formatPrice } from '@/lib/formatPrice'
import type { SolicitudPedido, SolicitudPedidoEstado } from '@/types/database'

type FiltroEstado = 'todas' | SolicitudPedidoEstado

const estadoLabels: Record<SolicitudPedidoEstado, string> = {
  pendiente: 'Pendiente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado'
}

const estadoStyles: Record<SolicitudPedidoEstado, string> = {
  pendiente: 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
  confirmado: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200',
  cancelado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

function getWhatsAppNumber(phone: string) {
  if (phone.startsWith('56') || phone.length !== 9) return phone
  return `56${phone}`
}

export default function AdminOrderRequests() {
  const [solicitudes, setSolicitudes] = useState<SolicitudPedido[]>([])
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    fetchSolicitudesPedidosAdminAction()
      .then(data => {
        if (active) setSolicitudes(data)
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar las solicitudes.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const solicitudesFiltradas = useMemo(() => {
    const term = busqueda.trim().toLocaleLowerCase('es-CL')
    return solicitudes.filter(solicitud => {
      const matchesStatus = filtro === 'todas' || solicitud.estado === filtro
      const matchesSearch = !term ||
        solicitud.cliente_nombre.toLocaleLowerCase('es-CL').includes(term) ||
        solicitud.cliente_telefono.includes(term) ||
        solicitud.id.toLocaleLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [busqueda, filtro, solicitudes])

  async function updateStatus(id: string, estado: SolicitudPedidoEstado) {
    setUpdatingId(id)
    setError('')
    try {
      const result = await actualizarEstadoSolicitudPedidoAction(id, estado)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSolicitudes(current => current.map(solicitud =>
        solicitud.id === id
          ? { ...solicitud, estado, updated_at: new Date().toISOString() }
          : solicitud
      ))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo actualizar la solicitud.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="space-y-4">
      <AdminHeader
        title="Solicitudes web"
        subtitle="Pedidos recibidos desde el catálogo público"
        actions={(
          <button
            type="button"
            disabled={isLoading}
            onClick={() => {
              setError('')
              setIsLoading(true)
              setReloadKey(current => current + 1)
            }}
            className="min-h-10 rounded-md border border-[#123f3d]/15 px-3 text-xs font-semibold text-[#173b39] disabled:opacity-50 dark:border-white/10 dark:text-[#edf5f2]"
          >
            {isLoading ? 'Actualizando…' : 'Actualizar'}
          </button>
        )}
      />

      <div className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
          <label className="text-xs font-semibold text-[#4f6967] dark:text-[#bfd4d0]">
            Buscar por cliente, teléfono o código
            <input
              value={busqueda}
              onChange={event => setBusqueda(event.target.value)}
              placeholder="Nombre, teléfono o ID"
              className="mt-1 min-h-10 w-full rounded-md border border-[#123f3d]/15 bg-white px-3 text-sm font-normal text-[#173b39] outline-none focus:border-[#123f3d]/50 dark:border-white/10 dark:bg-[#0d1a1a] dark:text-[#edf5f2]"
            />
          </label>
          <label className="text-xs font-semibold text-[#4f6967] dark:text-[#bfd4d0]">
            Estado
            <select
              value={filtro}
              onChange={event => setFiltro(event.target.value as FiltroEstado)}
              className="mt-1 min-h-10 w-full rounded-md border border-[#123f3d]/15 bg-white px-3 text-sm font-normal text-[#173b39] dark:border-white/10 dark:bg-[#0d1a1a] dark:text-[#edf5f2]"
            >
              <option value="todas">Todos</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </label>
        </div>
        <p className="mt-3 text-xs text-[#5f7a73] dark:text-[#bfd4d0]">
          {isLoading ? 'Cargando solicitudes…' : `${solicitudesFiltradas.length} solicitudes visibles · máximo 100 recientes`}
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}

      {isLoading ? (
        <div className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-6 text-sm text-[#5f7a73] dark:border-white/10 dark:bg-[#142b2a] dark:text-[#bfd4d0]">Cargando…</div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#123f3d]/20 bg-[#fffdf9] p-8 text-center text-sm text-[#5f7a73] dark:border-white/10 dark:bg-[#142b2a] dark:text-[#bfd4d0]">
          {solicitudes.length === 0 ? 'Todavía no hay solicitudes de clientes.' : 'No hay solicitudes que coincidan con los filtros.'}
        </div>
      ) : (
        <div className="space-y-2">
          {solicitudesFiltradas.map(solicitud => {
            const phone = getWhatsAppNumber(solicitud.cliente_telefono)
            const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${solicitud.cliente_nombre}, te contactamos por tu solicitud ${solicitud.id.slice(0, 8)}.`)}`

            return (
              <article key={solicitud.id} className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#173b39] dark:text-[#edf5f2]">{solicitud.cliente_nombre}</h2>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${estadoStyles[solicitud.estado]}`}>
                        {estadoLabels[solicitud.estado]}
                      </span>
                      <span className="font-mono text-[11px] text-[#718580]">#{solicitud.id.slice(0, 8)}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5f7a73] dark:text-[#bfd4d0]">
                      <a href={`tel:+${solicitud.cliente_telefono}`} className="underline-offset-2 hover:underline">{solicitud.cliente_telefono}</a>
                      <time dateTime={solicitud.created_at}>{new Date(solicitud.created_at).toLocaleString('es-CL')}</time>
                      <span>{solicitud.cantidad_items} prendas · {formatPrice(solicitud.total)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-md border border-[#128C7E]/25 px-3 text-xs font-semibold text-[#11675f] hover:bg-[#eaf4f1] dark:text-[#9dd5cb] dark:hover:bg-white/5">
                      WhatsApp
                    </a>
                    <label className="sr-only" htmlFor={`estado-${solicitud.id}`}>Estado de solicitud</label>
                    <select
                      id={`estado-${solicitud.id}`}
                      value={solicitud.estado}
                      disabled={updatingId === solicitud.id}
                      onChange={event => updateStatus(solicitud.id, event.target.value as SolicitudPedidoEstado)}
                      className="min-h-10 rounded-md border border-[#123f3d]/15 bg-white px-2 text-xs font-semibold text-[#173b39] disabled:opacity-50 dark:border-white/10 dark:bg-[#0d1a1a] dark:text-[#edf5f2]"
                    >
                      <option value="pendiente">Pendiente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>

                <details className="mt-3 border-t border-[#123f3d]/10 pt-2 dark:border-white/10">
                  <summary className="cursor-pointer text-xs font-semibold text-[#4f6967] dark:text-[#bfd4d0]">Ver detalle del pedido</summary>
                  <ul className="mt-2 divide-y divide-[#123f3d]/10 dark:divide-white/10">
                    {(solicitud.items ?? []).map(item => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2 text-xs">
                        <span className="font-medium text-[#173b39] dark:text-[#edf5f2]">
                          {item.producto_nombre} · {item.colegio} · talla {item.talla}
                        </span>
                        <span className="text-[#5f7a73] dark:text-[#bfd4d0]">
                          {item.cantidad} × {formatPrice(item.precio_unitario)} = {formatPrice(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-right text-sm font-bold text-[#173b39] dark:text-[#edf5f2]">Total: {formatPrice(solicitud.total)}</p>
                </details>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
