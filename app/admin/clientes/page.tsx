'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'

interface Cliente {
  id: string
  nombre: string
  contacto: string
  telefono: string
  red_social?: string
  direccion?: string
  notas?: string
  total_compras: number
  cantidad_compras: number
  ultima_compra?: string
  created_at: string
}

export default function ClientesPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    loadClientes()
  }, [])

  async function loadClientes() {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('cantidad_compras', { ascending: false })

    if (data) {
      setClientes(data)
    }
    setLoading(false)
  }

  async function deleteCliente(id: string, nombre: string) {
    const confirmed = await confirm({
      title: '¿Eliminar cliente?',
      message: `Se eliminará a "${nombre}". Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar cliente')
    } else {
      toast.success('Cliente eliminado')
      loadClientes()
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

    const { error } = await supabase
      .from('clientes')
      .update({
        nombre: editForm.nombre.trim(),
        contacto: editForm.contacto.trim(),
        telefono: editForm.telefono.trim(),
        red_social: editForm.red_social.trim() || null,
        direccion: editForm.direccion.trim() || null,
        notas: editForm.notas.trim() || null
      })
      .eq('id', id)

    if (error) {
      toast.error('Error al actualizar cliente')
    } else {
      toast.success('Cliente actualizado')
      cancelEdit()
      loadClientes()
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

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  👥 Gestión de Clientes
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Administra tu base de clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{clientes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Con Compras</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {clientes.filter(c => c.cantidad_compras > 0).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos Totales</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(clientes.reduce((sum, c) => sum + c.total_compras, 0))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Buscar por nombre, teléfono o contacto..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {clientesFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 dark:text-gray-400 text-lg">No se encontraron clientes</p>
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
                              <Button
                                onClick={() => saveEdit(cliente.id)}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold"
                              >
                                Guardar
                              </Button>
                              <Button
                                onClick={cancelEdit}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                              >
                                Cancelar
                              </Button>
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
                                className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteCliente(cliente.id, cliente.nombre)}
                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
