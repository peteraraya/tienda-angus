'use client'

import { useState, useEffect } from 'react'
// Use LazyImage for insignia previews
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input, LazyImage } from '@/app/components/ui'
import type { Colegio } from '@/types/database'

export default function ColegiosPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [colegios, setColegios] = useState<Colegio[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nuevoColegio, setNuevoColegio] = useState({ nombre: '', insignia_url: '' })
  const [editando, setEditando] = useState<string | null>(null)
  const [colegioEditado, setColegioEditado] = useState({ nombre: '', insignia_url: '' })

  async function loadColegios() {
    const { data } = await supabase
      .from('colegios')
      .select('*')
      .order('nombre', { ascending: true })

    if (data) {
      setColegios(data)
    }
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
    if (session) {
      loadColegios()
    }
    setLoading(false)
  }

  useEffect(() => {
    async function run() {
      await checkAuth()
    }
    run()
  }, [])

  async function agregarColegio() {
    if (!nuevoColegio.nombre.trim()) {
      toast.error('Ingresa el nombre del colegio')
      return
    }

    const { error } = await supabase
      .from('colegios')
      .insert([{ 
        nombre: nuevoColegio.nombre.trim(), 
        insignia_url: nuevoColegio.insignia_url.trim() || null,
        activo: true 
      }])

    if (error) {
      if (error.code === '23505') {
        toast.error('Este colegio ya existe')
      } else {
        toast.error('Error al agregar colegio')
      }
      return
    }

    toast.success('Colegio agregado exitosamente')
    setNuevoColegio({ nombre: '', insignia_url: '' })
    loadColegios()
  }

  async function toggleActivo(id: string, activo: boolean) {
    const confirmed = await confirm({
      title: activo ? '¿Desactivar colegio?' : '¿Activar colegio?',
      message: activo 
        ? 'Los productos con este colegio seguirán existiendo pero no aparecerá en los selectores'
        : 'El colegio volverá a estar disponible en los selectores',
      variant: 'warning'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('colegios')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar colegio')
      return
    }

    toast.success(activo ? 'Colegio desactivado' : 'Colegio activado')
    loadColegios()
  }

  async function actualizarColegio(id: string) {
    if (!colegioEditado.nombre.trim()) {
      toast.error('Ingresa un nombre válido')
      return
    }

    const { error } = await supabase
      .from('colegios')
      .update({ 
        nombre: colegioEditado.nombre.trim(),
        insignia_url: colegioEditado.insignia_url.trim() || null
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        toast.error('Este nombre ya existe')
      } else {
        toast.error('Error al actualizar colegio')
      }
      return
    }

    toast.success('Colegio actualizado exitosamente')
    setEditando(null)
    setColegioEditado({ nombre: '', insignia_url: '' })
    loadColegios()
  }

  async function eliminarColegio(id: string) {
    const confirmed = await confirm({
      title: '¿Eliminar colegio?',
      message: 'Los productos con este colegio podrían verse afectados. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('colegios')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar colegio. Puede que esté en uso.')
      return
    }

    toast.success('Colegio eliminado exitosamente')
    loadColegios()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-gray-800 ml-2">
                <img 
                  src="/logo-confecciones.png" 
                  alt="Confecciones Angus" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Colegios</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Administra los colegios disponibles para los productos</p>
              </div>
            </div>
          </div>

          {/* Agregar Nuevo Colegio */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Colegio
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-5">
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Nombre del Colegio</label>
                <Input
                  type="text"
                  value={nuevoColegio.nombre}
                  onChange={(e) => setNuevoColegio({...nuevoColegio, nombre: e.target.value})}
                  className="w-full p-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  placeholder="Ej: Colegio San José"
                />
              </div>
              <div className="sm:col-span-5">
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">URL de Insignia (Opcional)</label>
                <Input
                  type="url"
                  value={nuevoColegio.insignia_url}
                  onChange={(e) => setNuevoColegio({...nuevoColegio, insignia_url: e.target.value})}
                  className="w-full p-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  placeholder="https://ejemplo.com/insignia.png"
                />
              </div>
              
              <div className="sm:col-span-2">
                <Button
                  onClick={agregarColegio}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-sm hover:shadow"
                >
                  + Agregar
                </Button>
              </div>
            </div>

            {nuevoColegio.insignia_url && (
              <div className="mt-4 flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-max">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center p-1">
                  <LazyImage
                    src={nuevoColegio.insignia_url}
                    alt="Vista previa"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    unoptimized
                  />
                </div>
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Vista previa</span>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Colegios */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Colegios Registrados ({colegios.length})
            </h2>
          </div>

          {colegios.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-purple-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Sin colegios</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">Aún no has registrado ningún colegio en el sistema.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {colegios.map((colegio) => (
                <div key={colegio.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* Insignia */}
                    <div className="shrink-0 flex justify-center sm:justify-start">
                      {colegio.insignia_url ? (
                        <LazyImage
                          src={colegio.insignia_url}
                          alt={`Insignia ${colegio.nombre}`}
                          width={80}
                          height={80}
                          className="w-20 h-20 object-contain rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-1 shadow-sm"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden')
                          }}
                          unoptimized
                        />
                      ) : null}
                      <div className={`w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800 ${colegio.insignia_url ? 'hidden' : ''}`}>
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="flex-1">
                      {editando === colegio.id ? (
                        <div className="space-y-3">
                          <Input
                            type="text"
                            value={colegioEditado.nombre}
                            onChange={(e) => setColegioEditado({...colegioEditado, nombre: e.target.value})}
                            placeholder="Nombre del colegio"
                            className="w-full p-2.5 border-2 border-blue-500 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                            autoFocus
                          />
                          <Input
                            type="url"
                            value={colegioEditado.insignia_url}
                            onChange={(e) => setColegioEditado({...colegioEditado, insignia_url: e.target.value})}
                            placeholder="URL de insignia (opcional)"
                            className="w-full p-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div className="text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{colegio.nombre}</h3>
                            <span className={`inline-flex self-center text-xs font-bold px-3 py-1 rounded-full ${
                              colegio.activo 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {colegio.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          {colegio.insignia_url ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono truncate max-w-sm mx-auto sm:mx-0">
                              {colegio.insignia_url}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 italic">Sin URL de insignia</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 mt-4 sm:mt-0">
                      {editando === colegio.id ? (
                        <>
                          <button
                            onClick={() => actualizarColegio(colegio.id)}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditando(null)
                              setColegioEditado({ nombre: '', insignia_url: '' })
                            }}
                            className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-all shadow-sm"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditando(colegio.id)
                              setColegioEditado({ 
                                nombre: colegio.nombre, 
                                insignia_url: colegio.insignia_url || '' 
                              })
                            }}
                            className="p-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-all font-bold shadow-sm"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => toggleActivo(colegio.id, colegio.activo)}
                            className={`p-2.5 rounded-xl transition-all font-bold shadow-sm ${
                              colegio.activo 
                                ? 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400' 
                                : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400'
                            }`}
                            title={colegio.activo ? 'Desactivar' : 'Activar'}
                          >
                            {colegio.activo ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.293M3 3l3.29 3.29M3 3l3.29 3.29M21 21l-3.29-3.29" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => eliminarColegio(colegio.id)}
                            className="p-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all font-bold shadow-sm"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <ConfirmDialog />
    </div>
  )
}
