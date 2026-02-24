'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Colegio {
  id: string
  nombre: string
  insignia_url?: string
  activo: boolean
  created_at: string
}

export default function ColegiosPage() {
  const router = useRouter()
  const [colegios, setColegios] = useState<Colegio[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nuevoColegio, setNuevoColegio] = useState({ nombre: '', insignia_url: '' })
  const [editando, setEditando] = useState<string | null>(null)
  const [colegioEditado, setColegioEditado] = useState({ nombre: '', insignia_url: '' })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
    if (session) {
      loadColegios()
    }
    setLoading(false)
  }

  async function loadColegios() {
    const { data } = await supabase
      .from('colegios')
      .select('*')
      .order('nombre', { ascending: true })

    if (data) {
      setColegios(data)
    }
  }

  async function agregarColegio() {
    if (!nuevoColegio.nombre.trim()) {
      alert('Ingresa el nombre del colegio')
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
        alert('Este colegio ya existe')
      } else {
        alert('Error al agregar colegio')
      }
      return
    }

    setNuevoColegio({ nombre: '', insignia_url: '' })
    loadColegios()
  }

  async function toggleActivo(id: string, activo: boolean) {
    const { error } = await supabase
      .from('colegios')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar colegio')
      return
    }

    loadColegios()
  }

  async function actualizarColegio(id: string) {
    if (!colegioEditado.nombre.trim()) {
      alert('Ingresa un nombre válido')
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
        alert('Este nombre ya existe')
      } else {
        alert('Error al actualizar colegio')
      }
      return
    }

    setEditando(null)
    setColegioEditado({ nombre: '', insignia_url: '' })
    loadColegios()
  }

  async function eliminarColegio(id: string) {
    if (!confirm('¿Eliminar este colegio? Los productos con este colegio podrían verse afectados.')) {
      return
    }

    const { error } = await supabase
      .from('colegios')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar colegio. Puede que esté en uso.')
      return
    }

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
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Colegios</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Administra los colegios disponibles para los productos</p>
              </div>
            </div>
          </div>

          {/* Agregar Nuevo Colegio */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Agregar Nuevo Colegio</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre del Colegio</label>
                <input
                  type="text"
                  value={nuevoColegio.nombre}
                  onChange={(e) => setNuevoColegio({...nuevoColegio, nombre: e.target.value})}
                  placeholder="Ej: Colegio San José"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">URL de Insignia</label>
                <input
                  type="url"
                  value={nuevoColegio.insignia_url}
                  onChange={(e) => setNuevoColegio({...nuevoColegio, insignia_url: e.target.value})}
                  placeholder="https://ejemplo.com/insignia.png"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {nuevoColegio.insignia_url && (
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <img 
                    src={nuevoColegio.insignia_url} 
                    alt="Vista previa" 
                    className="w-16 h-16 object-contain rounded-lg border border-gray-300 dark:border-gray-600"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Vista previa de la insignia</span>
                </div>
              )}
              <button
                onClick={agregarColegio}
                className="w-full bg-linear-to-br from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
              >
                Agregar Colegio
              </button>
            </div>
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
            <div className="p-12 text-center">
              <div className="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No hay colegios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {colegios.map((colegio) => (
                <div key={colegio.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Insignia */}
                    <div className="flex-shrink-0">
                      {colegio.insignia_url ? (
                        <img 
                          src={colegio.insignia_url} 
                          alt={`Insignia ${colegio.nombre}`}
                          className="w-16 h-16 object-contain rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 p-1"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ${colegio.insignia_url ? 'hidden' : ''}`}>
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="flex-1">
                      {editando === colegio.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={colegioEditado.nombre}
                            onChange={(e) => setColegioEditado({...colegioEditado, nombre: e.target.value})}
                            placeholder="Nombre del colegio"
                            className="w-full p-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <input
                            type="url"
                            value={colegioEditado.insignia_url}
                            onChange={(e) => setColegioEditado({...colegioEditado, insignia_url: e.target.value})}
                            placeholder="URL de insignia"
                            className="w-full p-2 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{colegio.nombre}</h3>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              colegio.activo 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {colegio.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          {colegio.insignia_url && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {colegio.insignia_url}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      {editando === colegio.id ? (
                        <>
                          <button
                            onClick={() => actualizarColegio(colegio.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                          >
                            ✓ Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditando(null)
                              setColegioEditado({ nombre: '', insignia_url: '' })
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-semibold"
                          >
                            ✕ Cancelar
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
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(colegio.id, colegio.activo)}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                              colegio.activo
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {colegio.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => eliminarColegio(colegio.id)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                          >
                            Eliminar
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
    </div>
  )
}
