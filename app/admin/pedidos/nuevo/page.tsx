'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'

interface Insumo {
  id: string
  nombre: string
  descripcion?: string
  unidad_medida: string
  precio_referencia: number
  stock_actual: number
  stock_minimo: number
  imagen_url?: string
  categoria?: string
  activo: boolean
}

interface CartItem {
  insumo_id: string
  insumo_nombre: string
  unidad_medida: string
  precio_unitario: number
  cantidad: number
  imagen_url?: string
}

interface Proveedor {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email?: string
  direccion?: string
  rut?: string
  cantidad_pedidos: number
  total_pedidos: number
}

export default function NuevoPedidoPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingPedido, setProcessingPedido] = useState(false)
  const [notasPedido, setNotasPedido] = useState('')
  const [fechaEsperada, setFechaEsperada] = useState('')
  
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)
  const [searchProveedor, setSearchProveedor] = useState('')
  const [showProveedorSuggestions, setShowProveedorSuggestions] = useState(false)
  const [preciosCompra, setPreciosCompra] = useState<Record<string, number>>({})
  const [cantidades, setCantidades] = useState<Record<string, number>>({})

  useEffect(() => {
    loadInsumos()
    loadProveedores()
  }, [])

  async function loadInsumos() {
    setLoading(true)
    const { data } = await supabase
      .from('insumos')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (data) setInsumos(data)
    setLoading(false)
  }

  async function loadProveedores() {
    const { data } = await supabase
      .from('proveedores')
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (data) setProveedores(data)
  }

  function agregarAlCarrito(insumo: Insumo) {
    const precioCompra = preciosCompra[insumo.id] || 0
    const cantidad = cantidades[insumo.id] || 1

    if (precioCompra <= 0) {
      toast.error('Ingresa un precio de compra válido')
      return
    }

    if (cantidad <= 0) {
      toast.error('Ingresa una cantidad válida')
      return
    }

    const itemExistente = cart.find(item => item.insumo_id === insumo.id)

    if (itemExistente) {
      setCart(cart.map(item => 
        item.insumo_id === insumo.id
          ? { ...item, cantidad: item.cantidad + cantidad, precio_unitario: precioCompra }
          : item
      ))
      toast.success('Cantidad actualizada')
    } else {
      const nuevoItem: CartItem = {
        insumo_id: insumo.id,
        insumo_nombre: insumo.nombre,
        unidad_medida: insumo.unidad_medida,
        precio_unitario: precioCompra,
        cantidad: cantidad,
        imagen_url: insumo.imagen_url
      }
      setCart([...cart, nuevoItem])
      toast.success('Agregado al pedido')
    }

    setPreciosCompra({ ...preciosCompra, [insumo.id]: 0 })
    setCantidades({ ...cantidades, [insumo.id]: 1 })
  }

  function actualizarCantidad(insumo_id: string, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(insumo_id)
      return
    }

    setCart(cart.map(i => 
      i.insumo_id === insumo_id
        ? { ...i, cantidad: nuevaCantidad }
        : i
    ))
  }

  function actualizarPrecio(insumo_id: string, nuevoPrecio: number) {
    if (nuevoPrecio < 0) return

    setCart(cart.map(i => 
      i.insumo_id === insumo_id
        ? { ...i, precio_unitario: nuevoPrecio }
        : i
    ))
  }

  function eliminarDelCarrito(insumo_id: string) {
    setCart(cart.filter(item => item.insumo_id !== insumo_id))
    toast.success('Eliminado del pedido')
  }

  function vaciarCarrito() {
    setCart([])
    toast.success('Pedido vaciado')
  }

  const calcularTotales = () => {
    const total = cart.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0)
    const cantidad_items = cart.reduce((sum, item) => sum + item.cantidad, 0)

    return { total, cantidad_items }
  }

  async function crearPedido() {
    if (cart.length === 0) {
      toast.error('El pedido está vacío')
      return
    }

    if (!selectedProveedor) {
      toast.error('Debes seleccionar un proveedor')
      return
    }

    const confirmed = await confirm({
      title: '¿Crear pedido?',
      message: `Se creará un pedido de ${calcularTotales().cantidad_items} items por un total de ${formatPrice(calcularTotales().total)} al proveedor ${selectedProveedor.nombre}.`,
      confirmText: 'Crear Pedido',
      variant: 'warning'
    })

    if (!confirmed) return

    setProcessingPedido(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const usuario = user?.email || 'Administrador'

      const totales = calcularTotales()

      const { data: pedido, error: errorPedido } = await supabase
        .from('pedidos')
        .insert({
          proveedor_id: selectedProveedor.id,
          proveedor_nombre: selectedProveedor.nombre,
          fecha_pedido: new Date().toISOString(),
          fecha_esperada: fechaEsperada || null,
          estado: 'pendiente',
          total: totales.total,
          cantidad_items: totales.cantidad_items,
          notas: notasPedido.trim() || null,
          usuario
        })
        .select()
        .single()

      if (errorPedido || !pedido) {
        throw new Error('Error al crear el pedido')
      }

      const items = cart.map(item => ({
        pedido_id: pedido.id,
        insumo_id: item.insumo_id,
        insumo_nombre: item.insumo_nombre,
        unidad_medida: item.unidad_medida,
        precio_unitario: item.precio_unitario,
        cantidad: item.cantidad,
        subtotal: item.precio_unitario * item.cantidad,
        recibido: false,
        cantidad_recibida: 0
      }))

      const { error: errorItems } = await supabase
        .from('pedido_items')
        .insert(items)

      if (errorItems) {
        throw new Error('Error al crear los items del pedido')
      }

      toast.success('¡Pedido creado exitosamente!')
      router.push('/admin/pedidos')

    } catch (error) {
      console.error('Error al crear pedido:', error)
      toast.error('Error al crear el pedido')
    } finally {
      setProcessingPedido(false)
    }
  }

  function seleccionarProveedor(proveedor: Proveedor) {
    setSelectedProveedor(proveedor)
    setSearchProveedor(proveedor.nombre)
    setShowProveedorSuggestions(false)
  }

  function limpiarProveedor() {
    setSelectedProveedor(null)
    setSearchProveedor('')
  }

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(searchProveedor.toLowerCase()) ||
    p.contacto.toLowerCase().includes(searchProveedor.toLowerCase())
  )

  const categorias = [...new Set(insumos.map(i => i.categoria).filter(Boolean))].sort()

  const insumosFiltrados = insumos.filter(insumo => {
    const matchSearch = searchTerm === '' || 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (insumo.descripcion && insumo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchCategoria = selectedCategoria === '' || insumo.categoria === selectedCategoria

    return matchSearch && matchCategoria
  })

  const totales = calcularTotales()

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0">
                <img 
                  src="/logo-confecciones.png" 
                  alt="Confecciones Angus" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <Button
                onClick={() => router.push('/admin/pedidos')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">📦 Nuevo Pedido</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hidden sm:block">Crea una orden de compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-3 sm:space-y-4">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Buscar..."
                  className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                />
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full p-2.5 sm:p-3 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                >
                  <option value="">📁 Categoría</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {insumosFiltrados.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg">No hay insumos disponibles</p>
                </div>
              ) : (
                insumosFiltrados.map(insumo => (
                  <div key={insumo.id} className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                    <div className="p-3 sm:p-6">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          {insumo.imagen_url ? (
                            <img src={insumo.imagen_url} alt={insumo.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-2 sm:mb-2">
                            <div className="min-w-0">
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">{insumo.nombre}</h3>
                              {insumo.categoria && (
                                <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md mt-1">
                                  {insumo.categoria}
                                </span>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Precio ref.:</span>
                              <span className="block text-base sm:text-lg font-bold text-gray-900 dark:text-white">{formatPrice(insumo.precio_referencia)}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Stock: {insumo.stock_actual}</span>
                            </div>
                          </div>

                          {insumo.descripcion && (
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{insumo.descripcion}</p>
                          )}

                          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2 mt-3 sm:mt-4">
                            <div className="col-span-1">
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Cantidad</label>
                              <Input
                                type="number"
                                placeholder="Cant."
                                value={cantidades[insumo.id] || ''}
                                onChange={(e) => setCantidades({ ...cantidades, [insumo.id]: parseFloat(e.target.value) || 0 })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Precio</label>
                              <Input
                                type="number"
                                placeholder="Precio"
                                value={preciosCompra[insumo.id] || ''}
                                onChange={(e) => setPreciosCompra({ ...preciosCompra, [insumo.id]: parseFloat(e.target.value) || 0 })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                min="0"
                              />
                            </div>
                            <button
                              onClick={() => agregarAlCarrito(insumo)}
                              className="col-span-2 sm:col-span-1 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold transition-all"
                            >
                              Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Carrito - Sidebar responsivo */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-24">
              <div className="p-3 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="truncate">Pedido ({cart.length})</span>
                </h2>
              </div>

              <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
                {selectedProveedor ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-green-900 dark:text-green-100">{selectedProveedor.nombre}</p>
                          <p className="text-sm text-green-700 dark:text-green-300">Proveedor seleccionado</p>
                        </div>
                      </div>
                      <button
                        onClick={limpiarProveedor}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="space-y-1 text-sm text-green-800 dark:text-green-200">
                      <p>📞 {selectedProveedor.telefono}</p>
                      <p>👤 {selectedProveedor.contacto}</p>
                      {selectedProveedor.email && <p>📧 {selectedProveedor.email}</p>}
                      {selectedProveedor.cantidad_pedidos > 0 && (
                        <p className="text-xs mt-2 pt-2 border-t border-green-300 dark:border-green-700">
                          📦 {selectedProveedor.cantidad_pedidos} pedidos anteriores
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700 rounded-xl p-4">
                      <label className="block text-sm font-bold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Proveedor (obligatorio)
                      </label>
                      
                      <Input
                        type="text"
                        value={searchProveedor}
                        onChange={(e) => setSearchProveedor(e.target.value)}
                        onFocus={() => setShowProveedorSuggestions(true)}
                        placeholder="Buscar proveedor..."
                        className="w-full p-3 border border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />

                      {showProveedorSuggestions && searchProveedor.length >= 1 && proveedoresFiltrados.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border-2 border-orange-300 dark:border-orange-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                          {proveedoresFiltrados.map(proveedor => (
                            <button
                              key={proveedor.id}
                              onClick={() => seleccionarProveedor(proveedor)}
                              className="w-full p-3 text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors"
                            >
                              <p className="font-semibold text-gray-900 dark:text-white">{proveedor.nombre}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">📞 {proveedor.telefono}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">👤 {proveedor.contacto}</p>
                              {proveedor.cantidad_pedidos > 0 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  📦 {proveedor.cantidad_pedidos} pedidos anteriores
                                </p>
                              )}
                            </button>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-2">
                        💡 Selecciona el proveedor para este pedido
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    📅 Fecha esperada de entrega (opcional)
                  </label>
                  <Input
                    type="date"
                    value={fechaEsperada}
                    onChange={(e) => setFechaEsperada(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto border-t border-gray-200 dark:border-gray-700">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">Pedido vacío</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.insumo_id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.insumo_nombre}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{item.unidad_medida}</p>
                          </div>
                          <button
                            onClick={() => eliminarDelCarrito(item.insumo_id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Cantidad:</span>
                            <button
                              onClick={() => actualizarCantidad(item.insumo_id, item.cantidad - 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-bold text-gray-900 dark:text-white">{item.cantidad}</span>
                            <button
                              onClick={() => actualizarCantidad(item.insumo_id, item.cantidad + 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 dark:text-gray-400">Precio:</span>
                            <Input
                              type="number"
                              value={item.precio_unitario}
                              onChange={(e) => actualizarPrecio(item.insumo_id, parseFloat(e.target.value) || 0)}
                              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              min="0"
                            />
                          </div>
                          
                          <div className="text-right pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-bold text-gray-900 dark:text-white">{formatPrice(item.precio_unitario * item.cantidad)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Items:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{totales.cantidad_items}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-blue-600 dark:text-blue-400">{formatPrice(totales.total)}</span>
                    </div>

                    <textarea
                      value={notasPedido}
                      onChange={(e) => setNotasPedido(e.target.value)}
                      placeholder="Notas del pedido (opcional)..."
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      rows={2}
                    />

                    <div className="flex gap-2">
                      <Button
                        onClick={vaciarCarrito}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all"
                      >
                        Vaciar
                      </Button>
                      <Button
                        onClick={crearPedido}
                        disabled={processingPedido || !selectedProveedor}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPedido ? 'Creando...' : 'Crear Pedido'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}
