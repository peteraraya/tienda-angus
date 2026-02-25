'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Input, Button } from '@/app/components/ui'

interface Cliente {
  id: string
  nombre: string
  contacto: string
  telefono: string
  red_social?: string
  direccion?: string
  cantidad_compras: number
  total_compras: number
}

interface ClienteAutocompleteProps {
  onClienteSelect: (cliente: Cliente | null) => void
  selectedCliente: Cliente | null
}

export default function ClienteAutocomplete({ onClienteSelect, selectedCliente }: ClienteAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showNewClienteForm, setShowNewClienteForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    contacto: '',
    telefono: '',
    red_social: '',
    direccion: ''
  })

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      buscarClientes(searchTerm)
    } else {
      setClientes([])
      setShowSuggestions(false)
    }
  }, [searchTerm])

  async function buscarClientes(term: string) {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${term}%,telefono.ilike.%${term}%,contacto.ilike.%${term}%`)
      .order('cantidad_compras', { ascending: false })
      .limit(5)

    if (data) {
      setClientes(data)
      setShowSuggestions(true)
    }
    setLoading(false)
  }

  function seleccionarCliente(cliente: Cliente) {
    onClienteSelect(cliente)
    setSearchTerm(cliente.nombre)
    setShowSuggestions(false)
  }

  function limpiarSeleccion() {
    onClienteSelect(null)
    setSearchTerm('')
    setClientes([])
  }

  async function crearNuevoCliente() {
    if (!nuevoCliente.nombre || !nuevoCliente.contacto || !nuevoCliente.telefono) {
      alert('Nombre, contacto y teléfono son obligatorios')
      return
    }

    const { data, error } = await supabase
      .from('clientes')
      .insert([{
        nombre: nuevoCliente.nombre.trim(),
        contacto: nuevoCliente.contacto.trim(),
        telefono: nuevoCliente.telefono.trim(),
        red_social: nuevoCliente.red_social.trim() || null,
        direccion: nuevoCliente.direccion.trim() || null
      }])
      .select()
      .single()

    if (error) {
      alert('Error al crear cliente')
      return
    }

    if (data) {
      seleccionarCliente(data)
      setShowNewClienteForm(false)
      setNuevoCliente({
        nombre: '',
        contacto: '',
        telefono: '',
        red_social: '',
        direccion: ''
      })
    }
  }

  if (selectedCliente) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-green-900 dark:text-green-100">{selectedCliente.nombre}</p>
              <p className="text-sm text-green-700 dark:text-green-300">Cliente seleccionado</p>
            </div>
          </div>
          <button
            onClick={limpiarSeleccion}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
          <p>📞 {selectedCliente.telefono}</p>
          <p>📧 {selectedCliente.contacto}</p>
          {selectedCliente.red_social && <p>📱 {selectedCliente.red_social}</p>}
          {selectedCliente.direccion && <p>📍 {selectedCliente.direccion}</p>}
          {selectedCliente.cantidad_compras > 0 && (
            <p className="text-xs mt-2 pt-2 border-t border-green-300 dark:border-green-700">
              💚 {selectedCliente.cantidad_compras} compras anteriores
            </p>
          )}
        </div>
      </div>
    )
  }

  if (showNewClienteForm) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Nuevo Cliente
          </h3>
          <button
            onClick={() => setShowNewClienteForm(false)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Nombre completo *
            </label>
            <Input
              type="text"
              value={nuevoCliente.nombre}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez"
              className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Contacto (email o nombre) *
            </label>
            <Input
              type="text"
              value={nuevoCliente.contacto}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, contacto: e.target.value })}
              placeholder="Ej: juan@email.com"
              className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Teléfono *
            </label>
            <Input
              type="tel"
              value={nuevoCliente.telefono}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })}
              placeholder="Ej: +56912345678"
              className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Red Social (opcional)
            </label>
            <Input
              type="text"
              value={nuevoCliente.red_social}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, red_social: e.target.value })}
              placeholder="Ej: @usuario_instagram"
              className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Dirección (opcional)
            </label>
            <Input
              type="text"
              value={nuevoCliente.direccion}
              onChange={(e) => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })}
              placeholder="Ej: Av. Principal 123"
              className="w-full p-2 border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <Button
            onClick={crearNuevoCliente}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-2 rounded-lg font-semibold transition-all"
          >
            Crear Cliente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-xl p-4">
        <label className="block text-sm font-bold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Cliente (obligatorio)
        </label>
        
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
          placeholder="Buscar por nombre, teléfono o contacto..."
          className="w-full p-3 border border-yellow-300 dark:border-yellow-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />

        {loading && (
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">Buscando...</p>
        )}

        {showSuggestions && clientes.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-yellow-300 dark:border-yellow-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
            {clientes.map(cliente => (
              <button
                key={cliente.id}
                onClick={() => seleccionarCliente(cliente)}
                className="w-full p-3 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
              >
                <p className="font-semibold text-gray-900 dark:text-white">{cliente.nombre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">📞 {cliente.telefono}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">📧 {cliente.contacto}</p>
                {cliente.cantidad_compras > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    💚 {cliente.cantidad_compras} compras anteriores
                  </p>
                )}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => setShowNewClienteForm(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Cliente
          </Button>
        </div>

        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
          💡 Escribe al menos 2 caracteres para buscar
        </p>
      </div>
    </div>
  )
}
