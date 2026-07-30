'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'
import { clearAllCache } from '@/app/hooks/useStaticData'

interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
}

export default function CategoriasPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: '', descripcion: '' })
  const [editando, setEditando] = useState<string | null>(null)
  const [categoriaEditada, setCategoriaEditada] = useState({ nombre: '', descripcion: '' })

  async function loadCategorias() {
    const { data } = await supabase
      .from('categorias')
      .select('*')
      .order('nombre', { ascending: true })

    if (data) {
      setCategorias(data)
    }
  }

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
    if (session) {
      loadCategorias()
    }
    setLoading(false)
  }

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      if (session) {
        loadCategorias()
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  async function agregarCategoria() {
    if (!nuevaCategoria.nombre.trim()) {
      toast.error('Ingresa el nombre de la categoría')
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
        toast.error('Esta categoría ya existe')
      } else {
        toast.error('Error al agregar categoría')
      }
      return
    }

    toast.success('Categoría agregada exitosamente')
    setNuevaCategoria({ nombre: '', descripcion: '' })
    clearAllCache()
    loadCategorias()
  }

  async function toggleActivo(id: string, activo: boolean) {
    const confirmed = await confirm({
      title: activo ? '¿Desactivar categoría?' : '¿Activar categoría?',
      message: activo 
        ? 'Los productos con esta categoría seguirán existiendo pero no aparecerá en los selectores'
        : 'La categoría volverá a estar disponible en los selectores',
      variant: 'warning'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('categorias')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar categoría')
      return
    }

    toast.success(activo ? 'Categoría desactivada' : 'Categoría activada')
    clearAllCache()
    loadCategorias()
  }

  async function actualizarCategoria(id: string) {
    if (!categoriaEditada.nombre.trim()) {
      toast.error('Ingresa un nombre válido')
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
        toast.error('Este nombre ya existe')
      } else {
        toast.error('Error al actualizar categoría')
      }
      return
    }

    toast.success('Categoría actualizada exitosamente')
    setEditando(null)
    setCategoriaEditada({ nombre: '', descripcion: '' })
    clearAllCache()
    loadCategorias()
  }

  async function eliminarCategoria(id: string) {
    const confirmed = await confirm({
      title: '¿Eliminar categoría?',
      message: 'Los productos con esta categoría podrían verse afectados. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar categoría. Puede que esté en uso.')
      return
    }

    toast.success('Categoría eliminada exitosamente')
    clearAllCache()
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Categorías</h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Administra las categorías de productos</p>
              </div>
            </div>
          </div>

          {/* Agregar Nueva Categoría */}
          <div className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Categoría
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-4">
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Nombre</label>
                <Input
                  type="text"
                  value={nuevaCategoria.nombre}
                  onChange={(e) => setNuevaCategoria({...nuevaCategoria, nombre: e.target.value})}
                  className="w-full p-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  placeholder="Ej: Pantalones"
                />
              </div>
              <div className="sm:col-span-6">
                <label className="block mb-2 text-sm font-bold text-gray-700 dark:text-gray-300">Descripción (Opcional)</label>
                <Input
                  type="text"
                  value={nuevaCategoria.descripcion}
                  onChange={(e) => setNuevaCategoria({...nuevaCategoria, descripcion: e.target.value})}
                  className="w-full p-3.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
                  placeholder="Ej: Pantalones escolares y deportivos"
                />
              </div>
              
              <div className="sm:col-span-2">
                <Button
                  onClick={agregarCategoria}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl hover:bg-blue-700 font-bold transition-all shadow-sm hover:shadow"
                >
                  + Agregar
                </Button>
              </div>
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
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-indigo-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Sin categorías</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">Aún no has registrado ninguna categoría en el sistema.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {categorias.map((categoria) => (
                <div key={categoria.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                    {/* Icono */}
                    <div className="shrink-0 flex justify-center sm:justify-start">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center shadow-sm">
                        <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                    </div>

                    {/* Información */}
                    <div className="flex-1">
                      {editando === categoria.id ? (
                        <div className="space-y-3">
                          <Input
                            type="text"
                            value={categoriaEditada.nombre}
                            onChange={(e) => setCategoriaEditada({...categoriaEditada, nombre: e.target.value})}
                            placeholder="Nombre de la categoría"
                            className="w-full p-2.5 border-2 border-blue-500 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                            autoFocus
                          />
                          <Input
                            type="text"
                            value={categoriaEditada.descripcion}
                            onChange={(e) => setCategoriaEditada({...categoriaEditada, descripcion: e.target.value})}
                            placeholder="Descripción (opcional)"
                            className="w-full p-2.5 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div className="text-center sm:text-left">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{categoria.nombre}</h3>
                            <span className={`inline-flex self-center text-xs font-bold px-3 py-1 rounded-full ${
                              categoria.activo 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {categoria.activo ? 'Activa' : 'Inactiva'}
                            </span>
                          </div>
                          {categoria.descripcion ? (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">
                              {categoria.descripcion}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 italic">Sin descripción</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex flex-wrap sm:flex-nowrap justify-center gap-2 mt-4 sm:mt-0">
                      {editando === categoria.id ? (
                        <>
                          <button
                            onClick={() => actualizarCategoria(categoria.id)}
                            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditando(null)
                              setCategoriaEditada({ nombre: '', descripcion: '' })
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
                              setEditando(categoria.id)
                              setCategoriaEditada({ 
                                nombre: categoria.nombre, 
                                descripcion: categoria.descripcion || '' 
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
                            onClick={() => toggleActivo(categoria.id, categoria.activo)}
                            className={`p-2.5 rounded-xl transition-all font-bold shadow-sm ${
                              categoria.activo 
                                ? 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 text-orange-600 dark:text-orange-400' 
                                : 'bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400'
                            }`}
                            title={categoria.activo ? 'Desactivar' : 'Activar'}
                          >
                            {categoria.activo ? (
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
                            onClick={() => eliminarCategoria(categoria.id)}
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
