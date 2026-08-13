'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'
import type { Proveedor } from '@/types/database'
import AdminHeader from '../components/AdminHeader'

export default function ProveedoresPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    rut: '',
    notas: ''
  })

  async function loadProveedores() {
    setLoading(true)
    const { data } = await supabase
      .from('proveedores')
      .select('*')
      .order('activo', { ascending: false })
      .order('nombre', { ascending: true })

    if (data) setProveedores(data)
    setLoading(false)
  }

  useEffect(() => {
    loadProveedores()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nombre || !formData.contacto || !formData.telefono) {
      toast.error('Nombre, contacto y teléfono son obligatorios')
      return
    }

    const data = {
      nombre: formData.nombre.trim(),
      contacto: formData.contacto.trim(),
      telefono: formData.telefono.trim(),
      email: formData.email.trim() || null,
      direccion: formData.direccion.trim() || null,
      rut: formData.rut.trim() || null,
      notas: formData.notas.trim() || null
    }

    if (editingId) {
      const { error } = await supabase
        .from('proveedores')
        .update(data)
        .eq('id', editingId)

      if (error) {
        toast.error('Error al actualizar proveedor')
      } else {
        toast.success('Proveedor actualizado')
        resetForm()
        loadProveedores()
      }
    } else {
      const { error } = await supabase
        .from('proveedores')
        .insert([data])

      if (error) {
        toast.error('Error al crear proveedor')
      } else {
        toast.success('Proveedor creado')
        resetForm()
        loadProveedores()
      }
    }
  }

  function resetForm() {
    setFormData({
      nombre: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      rut: '',
      notas: ''
    })
    setEditingId(null)
    setShowNewForm(false)
  }

  function startEdit(proveedor: Proveedor) {
    setFormData({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto,
      telefono: proveedor.telefono,
      email: proveedor.email || '',
      direccion: proveedor.direccion || '',
      rut: proveedor.rut || '',
      notas: proveedor.notas || ''
    })
    setEditingId(proveedor.id)
    setShowNewForm(true)
  }

  async function toggleActivo(id: string, currentState: boolean) {
    const { error } = await supabase
      .from('proveedores')
      .update({ activo: !currentState })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar estado')
    } else {
      toast.success(currentState ? 'Proveedor desactivado' : 'Proveedor activado')
      loadProveedores()
    }
  }

  async function deleteProveedor(id: string, nombre: string) {
    const confirmed = await confirm({
      title: '¿Eliminar proveedor?',
      message: `Se eliminará a "${nombre}". Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('proveedores')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar proveedor')
    } else {
      toast.success('Proveedor eliminado')
      loadProveedores()
    }
  }

  const proveedoresFiltrados = proveedores.filter(p => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      p.nombre.toLowerCase().includes(search) ||
      p.telefono.includes(search) ||
      p.contacto.toLowerCase().includes(search) ||
      (p.rut && p.rut.includes(search))
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando proveedores...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pb-12">
      <AdminHeader 
        title="🏭 Proveedores" 
        subtitle="Gestiona tus proveedores"
        actions={
          <Button
            onClick={() => router.push('/admin/pedidos')}
            className="bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-sm hover:-translate-y-0.5"
          >
            📦 Ver Pedidos
          </Button>
        }
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Proveedores</p>
                <p className="text-3xl font-bold">{proveedores.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-100 font-semibold text-sm">Activos</p>
                <p className="text-3xl font-bold">
                  {proveedores.filter(p => p.activo).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <div>
                <p className="text-purple-100 font-semibold text-sm">Total Pedidos</p>
                <p className="text-3xl font-bold">
                  {proveedores.reduce((sum, p) => sum + p.cantidad_pedidos, 0)}
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
                placeholder="🔍 Buscar proveedor..."
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            <button
              onClick={() => setShowNewForm(!showNewForm)}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
            >
              {showNewForm ? 'Cancelar' : '+ Nuevo Proveedor'}
            </button>
          </div>
        </div>

        {showNewForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-blue-300 dark:border-blue-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del proveedor *"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <Input
                  type="text"
                  value={formData.contacto}
                  onChange={(e) => setFormData({ ...formData, contacto: e.target.value })}
                  placeholder="Nombre de contacto *"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <Input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Teléfono *"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Email"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="RUT"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Dirección"
                  className="p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                placeholder="Notas adicionales"
                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white py-3 rounded-lg font-semibold">
                  {editingId ? 'Actualizar' : 'Crear'} Proveedor
                </Button>
                <Button type="button" onClick={resetForm} className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold">
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {proveedoresFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-blue-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin resultados</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron proveedores con este filtro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Proveedor</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Contacto</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Pedidos</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Estado</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {proveedoresFiltrados.map(proveedor => (
                    <tr key={proveedor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 dark:text-white">{proveedor.nombre}</p>
                        {proveedor.rut && <p className="text-sm text-gray-600 dark:text-gray-400">RUT: {proveedor.rut}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 dark:text-white">{proveedor.contacto}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">📞 {proveedor.telefono}</p>
                        {proveedor.email && <p className="text-sm text-gray-600 dark:text-gray-400">📧 {proveedor.email}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                          {proveedor.cantidad_pedidos}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleActivo(proveedor.id, proveedor.activo)}
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            proveedor.activo
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {proveedor.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(proveedor)}
                            className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors shadow-sm font-bold"
                            title="Editar"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteProveedor(proveedor.id, proveedor.nombre)}
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
