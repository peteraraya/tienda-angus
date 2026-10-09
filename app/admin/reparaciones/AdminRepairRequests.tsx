'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  actualizarEstadoReparacionAction,
  fetchSolicitudesReparacionAdminAction
} from '@/app/actions/reparaciones-admin'
import AdminHeader from '../components/AdminHeader'
import type { SolicitudReparacion, SolicitudReparacionEstado } from '@/types/database'

type FiltroEstado = 'todas' | SolicitudReparacionEstado

const estadoLabels: Record<SolicitudReparacionEstado, string> = {
  pendiente: 'Pendiente',
  cotizada: 'Cotizada',
  aceptada: 'Aceptada',
  completada: 'Completada',
  cancelada: 'Cancelada'
}

const estados: SolicitudReparacionEstado[] = ['pendiente', 'cotizada', 'aceptada', 'completada', 'cancelada']

export default function AdminRepairRequests() {
  const [solicitudes, setSolicitudes] = useState<SolicitudReparacion[]>([])
  const [filtro, setFiltro] = useState<FiltroEstado>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    fetchSolicitudesReparacionAdminAction()
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

  const filtered = useMemo(() => {
    const term = busqueda.trim().toLocaleLowerCase('es-CL')
    return solicitudes.filter(solicitud => {
      const matchesStatus = filtro === 'todas' || solicitud.estado === filtro
      const matchesSearch = !term ||
        solicitud.cliente_nombre.toLocaleLowerCase('es-CL').includes(term) ||
        solicitud.cliente_telefono.includes(term) ||
        solicitud.prenda.toLocaleLowerCase('es-CL').includes(term) ||
        solicitud.id.toLocaleLowerCase().includes(term)
      return matchesStatus && matchesSearch
    })
  }, [busqueda, filtro, solicitudes])

  async function updateStatus(id: string, estado: SolicitudReparacionEstado) {
    setUpdatingId(id)
    setError('')
    try {
      const result = await actualizarEstadoReparacionAction(id, estado)
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
        title="Solicitudes de arreglo"
        subtitle="Evaluación y seguimiento de servicios"
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

      <div className="grid gap-3 rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:grid-cols-[minmax(0,1fr)_190px] sm:p-4">
        <label className="text-xs font-semibold text-[#4f6967] dark:text-[#bfd4d0]">
          Buscar por cliente, teléfono o prenda
          <input value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder="Nombre, teléfono, prenda o código" className="mt-1 min-h-10 w-full rounded-md border border-[#123f3d]/15 bg-white px-3 text-sm font-normal text-[#173b39] dark:border-white/10 dark:bg-[#0d1a1a] dark:text-[#edf5f2]" />
        </label>
        <label className="text-xs font-semibold text-[#4f6967] dark:text-[#bfd4d0]">
          Estado
          <select value={filtro} onChange={event => setFiltro(event.target.value as FiltroEstado)} className="mt-1 min-h-10 w-full rounded-md border border-[#123f3d]/15 bg-white px-3 text-sm font-normal text-[#173b39] dark:border-white/10 dark:bg-[#0d1a1a] dark:text-[#edf5f2]">
            <option value="todas">Todos</option>
            {estados.map(estado => <option key={estado} value={estado}>{estadoLabels[estado]}</option>)}
          </select>
        </label>
        <p className="text-xs text-[#5f7a73] dark:text-[#bfd4d0] sm:col-span-2">
          {isLoading ? 'Cargando solicitudes…' : `${filtered.length} solicitudes visibles · máximo 100 recientes`}
        </p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {isLoading ? (
        <div className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-6 text-sm text-[#5f7a73] dark:border-white/10 dark:bg-[#142b2a]">Cargando…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#123f3d]/20 bg-[#fffdf9] p-8 text-center text-sm text-[#5f7a73] dark:border-white/10 dark:bg-[#142b2a] dark:text-[#bfd4d0]">
          {solicitudes.length === 0 ? 'Todavía no hay solicitudes de arreglo.' : 'No hay solicitudes que coincidan con los filtros.'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(solicitud => {
            const whatsappPhone = solicitud.cliente_telefono.startsWith('56') || solicitud.cliente_telefono.length !== 9
              ? solicitud.cliente_telefono
              : `56${solicitud.cliente_telefono}`
            const message = `Hola ${solicitud.cliente_nombre}, te contactamos por la solicitud de arreglo ${solicitud.id.slice(0, 8)} para ${solicitud.prenda}.`
            return (
              <article key={solicitud.id} className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#173b39] dark:text-[#edf5f2]">{solicitud.prenda}</h2>
                      <span className="rounded-full bg-[#edf3f1] px-2 py-0.5 text-[11px] font-bold text-[#123f3d] dark:bg-white/10 dark:text-[#d6e3e0]">{estadoLabels[solicitud.estado]}</span>
                      <span className="font-mono text-[11px] text-[#718580]">#{solicitud.id.slice(0, 8)}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[#4f6967] dark:text-[#bfd4d0]">{solicitud.cliente_nombre} · {solicitud.cliente_telefono}</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-[#173b39] dark:text-[#edf5f2]">{solicitud.descripcion}</p>
                    <p className="mt-2 text-xs text-[#6e827f] dark:text-[#aec7c4]">
                      Recibida {new Date(solicitud.created_at).toLocaleString('es-CL')}
                      {solicitud.fecha_deseada ? ` · Fecha ideal ${new Date(`${solicitud.fecha_deseada}T12:00:00`).toLocaleDateString('es-CL')}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <a href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-md border border-[#128C7E]/25 px-3 text-xs font-semibold text-[#11675f] hover:bg-[#eaf4f1] dark:text-[#9dd5cb] dark:hover:bg-white/5">
                      WhatsApp
                    </a>
                    <label className="sr-only" htmlFor={`repair-state-${solicitud.id}`}>Estado</label>
                    <select id={`repair-state-${solicitud.id}`} value={solicitud.estado} disabled={updatingId === solicitud.id} onChange={event => updateStatus(solicitud.id, event.target.value as SolicitudReparacionEstado)} className="min-h-10 max-w-36 rounded-md border border-[#123f3d]/15 bg-white px-2 text-xs font-semibold text-[#173b39] disabled:opacity-50 dark:border-white/10 dark:bg-[#0d1a1a] dark:text-[#edf5f2]">
                      {estados.map(estado => <option key={estado} value={estado}>{estadoLabels[estado]}</option>)}
                    </select>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
