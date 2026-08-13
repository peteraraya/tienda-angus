'use client'

import { useState } from 'react'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'
import type { Categoria } from '@/types/database'
import AdminHeader from '../components/AdminHeader'
import { useAdminCategorias } from '@/app/hooks/useAdminCategorias'

export default function CategoriasPage() {
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const { 
    categorias, 
    isLoadingCategorias, 
    createCategoriaMutation, 
    updateCategoriaMutation, 
    deleteCategoriaMutation, 
    toggleActivoMutation 
  } = useAdminCategorias()

  const [searchTerm, setSearchTerm] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre de la categoría es obligatorio')
      return
    }

    const data = {
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || undefined,
      activo: true
    }

    try {
      if (editingId) {
        await updateCategoriaMutation.mutateAsync({ id: editingId, data: data as Partial<Categoria> })
        toast.success('Categoría actualizada')
      } else {
        await createCategoriaMutation.mutateAsync(data as Partial<Categoria>)
        toast.success('Categoría creada')
      }
      resetForm()
    } catch (err) {
      toast.error(editingId ? 'Error al actualizar categoría' : 'Error al crear categoría')
      console.error(err)
    }
  }

  function resetForm() {
    setFormData({ nombre: '', descripcion: '' })
    setEditingId(null)
    setShowNewForm(false)
  }

  function startEdit(categoria: Categoria) {
    setFormData({
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || ''
    })
    setEditingId(categoria.id)
    setShowNewForm(true)
  }

  async function toggleActivo(id: string, currentState: boolean) {
    try {
      await toggleActivoMutation.mutateAsync({ id, currentState })
      toast.success(currentState ? 'Categoría desactivada' : 'Categoría activada')
    } catch (err) {
      toast.error('Error al actualizar estado')
      console.error(err)
    }
  }

  async function deleteCategoria(id: string, nombre: string) {
    const confirmed = await confirm({
      title: '¿Eliminar categoría?',
      message: `Se eliminará "${nombre}". Los productos con esta categoría podrían verse afectados.`,
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteCategoriaMutation.mutateAsync(id)
      toast.success('Categoría eliminada')
    } catch (err) {
      toast.error('Error al eliminar categoría. Puede que esté en uso.')
      console.error(err)
    }
  }

  const categoriasFiltradas = categorias.filter(c => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      c.nombre.toLowerCase().includes(search) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(search))
    )
  })

  if (isLoadingCategorias) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando categorías...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pb-12">
      <AdminHeader 
        title="🏷️ Gestión de Categorías" 
        subtitle="Administra las categorías de productos"
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Categorías</p>
                <p className="text-3xl font-bold">{categorias.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-100 font-semibold text-sm">Activas</p>
                <p className="text-3xl font-bold">
                  {categorias.filter(c => c.activo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <p className="text-purple-100 font-semibold text-sm">Inactivas</p>
                <p className="text-3xl font-bold">
                  {categorias.filter(c => !c.activo).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="🔍 Buscar categoría..."
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white transition-colors"
              />
            </div>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            >
              {showNewForm ? 'Cancelar' : '+ Nueva Categoría'}
            </button>
          </div>
        </div>

        {showNewForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-blue-300 dark:border-blue-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la categoría *"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-white"
                  required
                />
                <Input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción (opcional)"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
                  {editingId ? 'Actualizar' : 'Crear'} Categoría
                </Button>
                <Button type="button" onClick={resetForm} className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold">
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {categoriasFiltradas.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-blue-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin resultados</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron categorías con este filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Categoría</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Descripción</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {categoriasFiltradas.map(categoria => (
                    <tr key={categoria.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{categoria.nombre}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{categoria.descripcion || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActivo(categoria.id, categoria.activo)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            categoria.activo
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {categoria.activo ? 'Activa' : 'Inactiva'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(categoria)}
                            className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors shadow-sm font-bold"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteCategoria(categoria.id, categoria.nombre)}
                            className="p-2.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors shadow-sm font-bold"
                            title="Eliminar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}
