'use client'

import { useState } from 'react'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Input } from '@/app/components/ui'
import type { Cliente } from '@/types/database'
import AdminHeader from '../components/AdminHeader'
import { useAdminClientes } from '@/app/hooks/useAdminClientes'

export default function ClientesPage() {
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const { 
    clientes, 
    isLoadingClientes, 
    updateClienteMutation, 
    deleteClienteMutation 
  } = useAdminClientes()

  const [searchTerm, setSearchTerm] = useState('')
  const [editingCliente, setEditingCliente] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    red_social: '',
    direccion: '',
    notas: ''
  })

  async function deleteCliente(id: string, nombre: string) {
    const confirmed = await confirm({
      title: '¿Eliminar cliente?',
      message: `Se eliminará a "${nombre}". Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      await deleteClienteMutation.mutateAsync(id)
      toast.success('Cliente eliminado')
    } catch (err) {
      toast.error('Error al eliminar cliente')
      console.error(err)
    }
  }

  function startEdit(cliente: Cliente) {
    setEditingCliente(cliente.id)
    setEditForm({
      nombre: cliente.nombre,
      contacto: cliente.contacto,
      telefono: cliente.telefono,
      red_social: cliente.red_social || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || ''
    })
  }

  function cancelEdit() {
    setEditingCliente(null)
    setEditForm({
      nombre: '',
      contacto: '',
      telefono: '',
      red_social: '',
      direccion: '',
      notas: ''
    })
  }

  async function saveEdit(id: string) {
    if (!editForm.nombre || !editForm.contacto || !editForm.telefono) {
      toast.error('Nombre, contacto y teléfono son obligatorios')
      return
    }

    try {
      await updateClienteMutation.mutateAsync({
        id,
        data: {
          nombre: editForm.nombre.trim(),
          contacto: editForm.contacto.trim(),
          telefono: editForm.telefono.trim(),
          red_social: editForm.red_social.trim() || null,
          direccion: editForm.direccion.trim() || null,
          notas: editForm.notas.trim() || null
        } as Partial<Cliente>
      })
      toast.success('Cliente actualizado')
      cancelEdit()
    } catch (err) {
      toast.error('Error al actualizar cliente')
      console.error(err)
    }
  }

  function formatFecha(fecha?: string) {
    if (!fecha) return 'Nunca'
    const date = new Date(fecha)
    return new Intl.DateTimeFormat('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const clientesFiltrados = clientes.filter(cliente => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      cliente.nombre.toLowerCase().includes(search) ||
      cliente.telefono.includes(search) ||
      cliente.contacto.toLowerCase().includes(search)
    )
  })

  if (isLoadingClientes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 pb-12">
      <AdminHeader 
        title="👥 Clientes" 
        subtitle="Administra tu base de clientes"
      />

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 dark:from-blue-600 dark:to-blue-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-blue-100 font-semibold text-sm">Total Clientes</p>
                <p className="text-3xl font-bold">{clientes.length}</p>
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
                <p className="text-emerald-100 font-semibold text-sm">Con Compras</p>
                <p className="text-3xl font-bold">
                  {clientes.filter(c => c.cantidad_compras > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 rounded-xl shadow-sm p-6 text-gray-900 dark:text-white transform hover:scale-105 transition-all">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-purple-100 font-semibold text-sm">Ingresos Totales</p>
                <p className="text-3xl font-bold">
                  {formatPrice(clientes.reduce((sum, c) => sum + c.total_compras, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-8 border border-gray-200 dark:border-gray-700">
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
              placeholder="🔍 Buscar por nombre, teléfono o contacto..."
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            />
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {clientesFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full mb-6">
                <svg className="w-12 h-12 text-blue-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Sin resultados</h3>
              <p className="text-gray-500 dark:text-gray-400 text-base font-medium">No se encontraron clientes que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Compras
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Total Gastado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Última Compra
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {clientesFiltrados.map(cliente => (
                    <tr key={cliente.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      {editingCliente === cliente.id ? (
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Input
                                type="text"
                                value={editForm.nombre}
                                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                                placeholder="Nombre *"
                                className="p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <Input
                                type="text"
                                value={editForm.contacto}
                                onChange={(e) => setEditForm({ ...editForm, contacto: e.target.value })}
                                placeholder="Contacto *"
                                className="p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <Input
                                type="tel"
                                value={editForm.telefono}
                                onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                                placeholder="Teléfono *"
                                className="p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Input
                                type="text"
                                value={editForm.red_social}
                                onChange={(e) => setEditForm({ ...editForm, red_social: e.target.value })}
                                placeholder="Red Social"
                                className="p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                              <Input
                                type="text"
                                value={editForm.direccion}
                                onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                                placeholder="Dirección"
                                className="p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                            </div>
                            <textarea
                              value={editForm.notas}
                              onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })}
                              placeholder="Notas"
                              className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => saveEdit(cliente.id)}
                                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-gray-900 dark:text-white rounded-xl font-bold transition-all shadow-sm"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-900 dark:text-white rounded-xl font-bold transition-all shadow-sm"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white">{cliente.nombre}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">📞 {cliente.telefono}</p>
                              {cliente.red_social && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">📱 {cliente.red_social}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 dark:text-white">{cliente.contacto}</p>
                            {cliente.direccion && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">📍 {cliente.direccion}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                              cliente.cantidad_compras > 0
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                            }`}>
                              {cliente.cantidad_compras}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(cliente.total_compras)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {formatFecha(cliente.ultima_compra)}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEdit(cliente)}
                                className="p-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl transition-all font-bold shadow-sm"
                                title="Editar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteCliente(cliente.id, cliente.nombre)}
                                className="p-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-all font-bold shadow-sm"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
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
