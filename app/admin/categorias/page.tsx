'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
}

export default function CategoriasPage() {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' })
  const [editando, setEditando] = useState<string | null>(null)
  const [categoriaEditada, setCategoriaEditada] = useState({ nombre: '', descripcion: '' })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
    if (session) {
      loadCategorias()
    }
    setLoading(false)
  }

  async function loadCategorias() {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true })

    if (data) {
      setCategorias(data)
    }
  }

  async function agregarCategoria() {
    if (!nuevaCategoria.nombre.trim()) {
      alert('Ingresa el nombre de la categoría')
      return
    }

    const { error } = await supabase
      .from('categorias')
      .insert([{ 
        nombre: nuevaCategoria.nombre.trim(), 
        descripcion: nuevaCategoria.descripcion.trim() || null,
        activo: true 
      }])

    if (error) {
      if (error.code === '23505') {
        alert('Esta categoría ya existe')
      } else {
        alert('Error al agregar categoría')
      }
      return
    }

    setNuevaCategoria({ nombre: '', descripcion: '' })
    loadCategorias()
  }

  async function toggleActivo(id: string, activo: boolean) {
    const { error } = await supabase
      .from('categorias')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar categoría')
      return
    }

    loadCategorias()
  }

  async function actualizarCategoria(id: string) {
    if (!categoriaEditada.nombre.trim()) {
      alert('Ingresa un nombre válido')
      return
    }

    const { error } = await supabase
      .from('categorias')
      .update({ 
        nombre: categoriaEditada.nombre.trim(),
        descripcion: categoriaEditada.descripcion.trim() || null
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        alert('Este nombre ya existe')
      } else {
        alert('Error al actualizar categoría')
      }
      return
    }

    setEditando(null)
    setCategoriaEditada({ nombre: '', descripcion: '' })
    loadCategorias()
  }

  async function eliminarCategoria(id: string) {
    if (!confirm('¿Eliminar esta categoría? Los productos con esta categoría podrían verse afectados.')) {
      return
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar categoría. Puede que esté en uso.')
      return
    }

    loadCategorias()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!isAuthenticated) {
    router.push('/admin')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-8">
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Categorías</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Administra las categorías de productos</p>
              </div>
            </div>
          </div>

          {/* Agregar Nueva Categoría */}
          <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Agregar Nueva Categoría</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nombre de la Categoría</label>
                <input
                  type="text"
                  value={nuevaCategoria.nombre}
                  onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
                  placeholder="Ej: Pantalones"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Descripción (Opcional)</label>
                <input
                  type="text"
                  value={nuevaCategoria.descripcion}
                  onChange={(e) => setNuevaCategoria({...nuevaCategoria, descripcion: e.target.value})}
                  placeholder="Ej: Pantalones escolares y deportivos"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <button
                onClick={agregarCategoria}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
              >
                Agregar Categoría
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Categorías */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Categorías Registradas ({categorias.length})
            </h2>
          </div>

          {categorias.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No hay categorías registradas</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icono */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="flex-1">
                      {editando === categoria.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={categoriaEditada.nombre}
                            onChange={(e) => setCategoriaEditada({...categoriaEditada, nombre: e.target.value})}
                            placeholder="Nombre de la categoría"
                            className="w-full p-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={categoriaEditada.descripcion}
                            onChange={(e) => setCategoriaEditada({...categoriaEditada, descripcion: e.target.value})}
                            placeholder="Descripción (opcional)"
                            className="w-full p-2 border border-green-500 rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{categoria.nombre}</h3>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                              categoria.activo 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {categoria.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          {categoria.descripcion && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {categoria.descripcion}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2">
                      {editando === categoria.id ? (
                        <>
                          <button
                            onClick={() => actualizarCategoria(categoria.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                          >
                            ✓ Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditando(null)
                              setCategoriaEditada({ nombre: '', descripcion: '' })
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
                              setEditando(categoria.id)
                              setCategoriaEditada({ 
                                nombre: categoria.nombre, 
                                descripcion: categoria.descripcion || '' 
                              })
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-semibold"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => toggleActivo(categoria.id, categoria.activo)}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
                              categoria.activo
                                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {categoria.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            onClick={() => eliminarCategoria(categoria.id)}
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
