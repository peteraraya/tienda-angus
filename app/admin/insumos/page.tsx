'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'
import ViewToggle from '../components/ViewToggle'
import type { Insumo } from '@/types/database'
import AdminHeader from '../components/AdminHeader'
import { useAdminInsumos } from '@/app/hooks/useAdminInsumos'

export default function InsumosPage() {
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const { 
    insumos, 
    isLoadingInsumos, 
    createInsumoMutation, 
    updateInsumoMutation, 
    deleteInsumoMutation 
  } = useAdminInsumos()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null)
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('expanded')
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad_medida: 'unidades',
    precio_referencia: 0,
    stock_actual: 0,
    stock_minimo: 0,
    imagen_url: '',
    categoria: '',
    notas: '',
    activo: true
  })

  useEffect(() => {
    // Listener para cambios de vista desde atajos de teclado
    const handleViewChange = (e: CustomEvent) => {
      setViewMode(e.detail)
    }
    window.addEventListener('changeView', handleViewChange as EventListener)
    return () => window.removeEventListener('changeView', handleViewChange as EventListener)
  }, [])

  function resetForm() {
    setFormData({
      nombre: '',
      descripcion: '',
      unidad_medida: 'unidades',
      precio_referencia: 0,
      stock_actual: 0,
      stock_minimo: 0,
      imagen_url: '',
      categoria: '',
      notas: '',
      activo: true
    })
    setEditingInsumo(null)
    setShowForm(false)
  }

  function editarInsumo(insumo: Insumo) {
    setFormData({
      nombre: insumo.nombre,
      descripcion: insumo.descripcion || '',
      unidad_medida: insumo.unidad_medida,
      precio_referencia: insumo.precio_referencia,
      stock_actual: insumo.stock_actual,
      stock_minimo: insumo.stock_minimo,
      imagen_url: insumo.imagen_url || '',
      categoria: insumo.categoria || '',
      notas: insumo.notas || '',
      activo: insumo.activo
    })
    setEditingInsumo(insumo)
    setShowForm(true)
  }

  async function guardarInsumo() {
    if (!formData.nombre || !formData.unidad_medida) {
      toast.error('Nombre y unidad de medida son obligatorios')
      return
    }

    try {
      if (editingInsumo) {
        await updateInsumoMutation.mutateAsync({ id: editingInsumo.id, data: formData as Partial<Insumo> })
        toast.success('Insumo actualizado')
      } else {
        await createInsumoMutation.mutateAsync(formData as Partial<Insumo>)
        toast.success('Insumo creado')
      }

      resetForm()
    } catch (error) {
      console.error('Error al guardar insumo:', error)
      toast.error('Error al guardar insumo')
    }
  }

  async function eliminarInsumo(id: string, nombre: string) {
    const confirmed = await confirm({
      title: '¿Eliminar insumo?',
      message: `Se eliminará el insumo "${nombre}". Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteInsumoMutation.mutateAsync(id)
      toast.success('Insumo eliminado')
    } catch (error) {
      console.error('Error al eliminar insumo:', error)
      toast.error('Error al eliminar insumo')
    }
  }

  const categorias = [...new Set(insumos.map(i => i.categoria).filter(Boolean))].sort()

  const insumosFiltrados = insumos.filter(insumo => {
    const matchSearch = searchTerm === '' || 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (insumo.descripcion && insumo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchCategoria = selectedCategoria === '' || insumo.categoria === selectedCategoria

    return matchSearch && matchCategoria
  })

  if (isLoadingInsumos) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando insumos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pb-12">
      <AdminHeader 
        title="🧵 Gestión de Insumos" 
        subtitle="Administra materiales y suministros"
        actions={
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-sm hover:-translate-y-0.5"
          >
            + Nuevo Insumo
          </Button>
        }
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Insumos</p>
                <p className="text-3xl font-bold">{insumos.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 rounded-xl shadow-sm p-6 text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-yellow-100 font-semibold text-sm">Stock Bajo</p>
                <p className="text-3xl font-bold">
                  {insumos.filter(i => i.stock_actual <= i.stock_minimo).length}
                </p>
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
                <p className="text-emerald-100 font-semibold text-sm">Insumos Activos</p>
                <p className="text-3xl font-bold">
                  {insumos.filter(i => i.activo).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Buscar insumo..."
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white transition-colors"
                />
              </div>
              <select
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
                className="w-full p-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-white transition-colors font-semibold"
              >
                <option value="">📁 Todas las categorías</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <ViewToggle view={viewMode} onViewChange={setViewMode} />
          </div>
        </div>

        {/* Lista de insumos */}
        {viewMode === 'expanded' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {insumosFiltrados.length === 0 ? (
              <div className="col-span-full p-16 text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-teal-50 dark:bg-gray-800 rounded-full mb-6">
                  <svg className="w-12 h-12 text-teal-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin resultados</h3>
                <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron insumos con este filtro.</p>
              </div>
            ) : (
              insumosFiltrados.map(insumo => (
                <div key={insumo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                  <div className="relative">
                    {insumo.imagen_url ? (
                      <img src={insumo.imagen_url} alt={insumo.nombre} className="w-full h-48 object-cover" />
                    ) : (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                    )}
                    {!insumo.activo && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Inactivo
                      </div>
                    )}
                    {insumo.stock_actual <= insumo.stock_minimo && (
                      <div className="absolute top-2 left-2 bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        ⚠️ Stock bajo
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{insumo.nombre}</h3>
                      {insumo.categoria && (
                        <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md">
                          {insumo.categoria}
                        </span>
                      )}
                    </div>

                    {insumo.descripcion && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{insumo.descripcion}</p>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Stock actual:</span>
                        <span className={`font-semibold ${
                          insumo.stock_actual <= insumo.stock_minimo 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {insumo.stock_actual} {insumo.unidad_medida}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Stock mínimo:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {insumo.stock_minimo} {insumo.unidad_medida}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Precio ref.:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(insumo.precio_referencia)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => editarInsumo(insumo)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all"
                      >
                        Editar
                      </Button>
                      <Button
                        onClick={() => eliminarInsumo(insumo.id, insumo.nombre)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition-all"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Insumo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Precio Ref.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {insumosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No hay insumos
                    </td>
                  </tr>
                ) : (
                  insumosFiltrados.map(insumo => (
                    <tr key={insumo.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {insumo.imagen_url && (
                            <img src={insumo.imagen_url} alt={insumo.nombre} className="w-10 h-10 rounded object-cover" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{insumo.nombre}</p>
                            {insumo.descripcion && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{insumo.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {insumo.categoria && (
                          <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md">
                            {insumo.categoria}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className={`font-semibold ${
                            insumo.stock_actual <= insumo.stock_minimo 
                              ? 'text-red-600 dark:text-red-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {insumo.stock_actual} {insumo.unidad_medida}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Mín: {insumo.stock_minimo}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(insumo.precio_referencia)}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {insumo.activo ? (
                          <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold px-2 py-1 rounded-md">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-semibold px-2 py-1 rounded-md">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => editarInsumo(insumo)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                          >
                            Editar
                          </Button>
                          <Button
                            onClick={() => eliminarInsumo(insumo.id, insumo.nombre)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-semibold transition-all"
                          >
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre *
                </label>
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Ej: Tela Poliéster Azul"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del insumo..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Unidad de medida *
                  </label>
                  <select
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                  >
                    <option value="unidades">Unidades</option>
                    <option value="metros">Metros</option>
                    <option value="kilos">Kilos</option>
                    <option value="litros">Litros</option>
                    <option value="rollos">Rollos</option>
                    <option value="cajas">Cajas</option>
                    <option value="paquetes">Paquetes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Categoría
                  </label>
                  <Input
                    type="text"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ej: Telas, Botones, Hilos"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Precio referencia
                  </label>
                  <Input
                    type="number"
                    value={formData.precio_referencia}
                    onChange={(e) => setFormData({ ...formData, precio_referencia: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Stock actual
                  </label>
                  <Input
                    type="number"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Stock mínimo
                  </label>
                  <Input
                    type="number"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseFloat(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  URL de imagen
                </label>
                <Input
                  type="text"
                  value={formData.imagen_url}
                  onChange={(e) => setFormData({ ...formData, imagen_url: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-white resize-none"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600"
                />
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Insumo activo
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button
                onClick={resetForm}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all"
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={guardarInsumo}
                className="flex-1 py-3 rounded-xl font-semibold transition-all"
              >
                {editingInsumo ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog />
    </div>
  )
}
