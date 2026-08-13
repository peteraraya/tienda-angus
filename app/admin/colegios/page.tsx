'use client'

import { useState } from 'react'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input, LazyImage } from '@/app/components/ui'
import type { Colegio } from '@/types/database'
import AdminHeader from '../components/AdminHeader'
import { useAdminColegios } from '@/app/hooks/useAdminColegios'

export default function ColegiosPage() {
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  const { 
    colegios, 
    isLoadingColegios, 
    createColegioMutation, 
    updateColegioMutation, 
    deleteColegioMutation, 
    toggleActivoMutation 
  } = useAdminColegios()

  const [searchTerm, setSearchTerm] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    insignia_url: ''
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre del colegio es obligatorio')
      return
    }

    const data = {
      nombre: formData.nombre.trim(),
      insignia_url: formData.insignia_url.trim() || undefined,
      activo: true
    }

    try {
      if (editingId) {
        await updateColegioMutation.mutateAsync({ id: editingId, data: data as Partial<Colegio> })
        toast.success('Colegio actualizado')
      } else {
        await createColegioMutation.mutateAsync(data as Partial<Colegio>)
        toast.success('Colegio creado')
      }
      resetForm()
    } catch (err) {
      toast.error(editingId ? 'Error al actualizar colegio' : 'Error al crear colegio')
      console.error(err)
    }
  }

  function resetForm() {
    setFormData({ nombre: '', insignia_url: '' })
    setEditingId(null)
    setShowNewForm(false)
  }

  function startEdit(colegio: Colegio) {
    setFormData({
      nombre: colegio.nombre,
      insignia_url: colegio.insignia_url || ''
    })
    setEditingId(colegio.id)
    setShowNewForm(true)
  }

  async function toggleActivo(id: string, currentState: boolean) {
    try {
      await toggleActivoMutation.mutateAsync({ id, currentState })
      toast.success(currentState ? 'Colegio desactivado' : 'Colegio activado')
    } catch (err) {
      toast.error('Error al actualizar estado')
      console.error(err)
    }
  }

  async function deleteColegio(id: string, nombre: string) {
    const confirmed = await confirm({
      title: '¿Eliminar colegio?',
      message: `Se eliminará "${nombre}". Los productos con este colegio podrían verse afectados.`,
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteColegioMutation.mutateAsync(id)
      toast.success('Colegio eliminado')
    } catch (err) {
      toast.error('Error al eliminar colegio. Puede que esté en uso.')
      console.error(err)
    }
  }

  const colegiosFiltrados = colegios.filter(c => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return c.nombre.toLowerCase().includes(search)
  })

  if (isLoadingColegios) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando colegios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pb-12">
      <AdminHeader 
        title="🏫 Gestión de Colegios" 
        subtitle="Administra los colegios disponibles para los productos"
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Colegios</p>
                <p className="text-3xl font-bold">{colegios.length}</p>
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
                <p className="text-emerald-100 font-semibold text-sm">Activos</p>
                <p className="text-3xl font-bold">
                  {colegios.filter(c => c.activo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.293M3 3l3.29 3.29M3 3l3.29 3.29M21 21l-3.29-3.29" />
                </svg>
              </div>
              <div>
                <p className="text-purple-100 font-semibold text-sm">Inactivos</p>
                <p className="text-3xl font-bold">
                  {colegios.filter(c => !c.activo).length}
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
                placeholder="🔍 Buscar colegio..."
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white transition-colors"
              />
            </div>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            >
              {showNewForm ? 'Cancelar' : '+ Nuevo Colegio'}
            </button>
          </div>
        </div>

        {showNewForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-blue-300 dark:border-blue-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Editar Colegio' : 'Nuevo Colegio'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del colegio *"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-white"
                  required
                />
                <Input
                  type="url"
                  value={formData.insignia_url}
                  onChange={(e) => setFormData({ ...formData, insignia_url: e.target.value })}
                  placeholder="URL de insignia (opcional)"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-white"
                />
              </div>

              {formData.insignia_url && (
                <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm w-max">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center p-1">
                    <LazyImage
                      src={formData.insignia_url}
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

              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold">
                  {editingId ? 'Actualizar' : 'Crear'} Colegio
                </Button>
                <Button type="button" onClick={resetForm} className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold">
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {colegiosFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-purple-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin resultados</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron colegios con este filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Insignia</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Colegio</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {colegiosFiltrados.map(colegio => (
                    <tr key={colegio.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        {colegio.insignia_url ? (
                          <LazyImage
                            src={colegio.insignia_url}
                            alt={`Insignia ${colegio.nombre}`}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-contain rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-0.5"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            unoptimized
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{colegio.nombre}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActivo(colegio.id, colegio.activo)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            colegio.activo
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {colegio.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(colegio)}
                            className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors shadow-sm font-bold"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteColegio(colegio.id, colegio.nombre)}
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
