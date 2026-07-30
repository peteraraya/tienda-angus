'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input } from '@/app/components/ui'
import ClienteAutocomplete from '../components/ClienteAutocomplete'
import type { Producto as DBProducto, Variante as DBVariante, Cliente } from '@/types/database'

interface Variante extends DBVariante {
  insignia_url?: string
}

interface Producto extends DBProducto {
  variantes?: Variante[]
}

interface CartItem {
  variante_id: string
  producto_id: string
  producto_nombre: string
  talla: string
  colegio: string
  precio_unitario: number
  descuento_porcentaje: number
  precio_final: number
  cantidad: number
  stock_disponible: number
  imagen_url?: string
}

export default function VentasPage() {
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  
  const [productos, setProductos] = useState<Producto[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [loading, setLoading] = useState(true)
  const [processingVenta, setProcessingVenta] = useState(false)
  const [notasVenta, setNotasVenta] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  
  // Estado para la boleta/ticket
  const [showTicket, setShowTicket] = useState(false)
  const [ultimaVenta, setUltimaVenta] = useState<any>(null)

  useEffect(() => {
    loadProductos()
  }, [])

  async function loadProductos() {
    setLoading(true)
    const { data: productosData } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true })

    const { data: colegiosData } = await supabase
      .from('colegios')
      .select('nombre, insignia_url')

    const colegiosMap = new Map(
      colegiosData?.map(c => [c.nombre.trim(), c.insignia_url]) || []
    )

    if (productosData) {
      const productosConVariantes = await Promise.all(
        productosData.map(async (producto) => {
          const { data: variantes } = await supabase
            .from('variantes')
            .select('*')
            .eq('producto_id', producto.id)
            .gt('stock', 0) // Solo variantes con stock

          const variantesConInsignia = variantes?.map(v => ({
            ...v,
            insignia_url: colegiosMap.get(v.colegio.trim())
          })) || []

          return {
            ...producto,
            variantes: variantesConInsignia
          }
        })
      )

      // Filtrar productos que tengan al menos una variante con stock
      const productosDisponibles = productosConVariantes.filter(
        p => p.variantes && p.variantes.length > 0
      )

      setProductos(productosDisponibles)
    }
    setLoading(false)
  }

  function agregarAlCarrito(producto: Producto, variante: Variante) {
    const precioBase = variante.precio !== null && variante.precio !== undefined ? variante.precio : producto.precio;
    const precio_final = producto.descuento_porcentaje 
      ? precioBase - (precioBase * producto.descuento_porcentaje / 100)
      : precioBase;

    const itemExistente = cart.find(item => item.variante_id === variante.id)

    if (itemExistente) {
      if (itemExistente.cantidad >= variante.stock) {
        toast.error(`Stock máximo alcanzado (${variante.stock} unidades)`)
        return
      }
      
      setCart(cart.map(item => 
        item.variante_id === variante.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ))
      toast.success('Cantidad actualizada')
    } else {
      const nuevoItem: CartItem = {
        variante_id: variante.id,
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        talla: variante.talla,
        colegio: variante.colegio,
        precio_unitario: precioBase,
        descuento_porcentaje: producto.descuento_porcentaje || 0,
        precio_final,
        cantidad: 1,
        stock_disponible: variante.stock,
        imagen_url: producto.imagen_url
      }
      setCart([...cart, nuevoItem])
      toast.success('Agregado al carrito')
    }
  }

  function actualizarCantidad(variante_id: string, nuevaCantidad: number) {
    const item = cart.find(i => i.variante_id === variante_id)
    if (!item) return

    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(variante_id)
      return
    }

    if (nuevaCantidad > item.stock_disponible) {
      toast.error(`Stock máximo: ${item.stock_disponible}`)
      return
    }

    setCart(cart.map(i => 
      i.variante_id === variante_id
        ? { ...i, cantidad: nuevaCantidad }
        : i
    ))
  }

  function eliminarDelCarrito(variante_id: string) {
    setCart(cart.filter(item => item.variante_id !== variante_id))
    toast.success('Eliminado del carrito')
  }

  function vaciarCarrito() {
    setCart([])
    toast.success('Carrito vaciado')
  }

  const calcularTotales = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.precio_final * item.cantidad), 0)
    const descuento_total = cart.reduce((sum, item) => {
      const descuento = item.precio_unitario - item.precio_final
      return sum + (descuento * item.cantidad)
    }, 0)
    const total = subtotal
    const cantidad_items = cart.reduce((sum, item) => sum + item.cantidad, 0)

    return { subtotal, descuento_total, total, cantidad_items }
  }

  async function procesarVenta() {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (!selectedCliente) {
      toast.error('Debes seleccionar un cliente para procesar la venta')
      return
    }

    const confirmed = await confirm({
      title: '¿Confirmar venta?',
      message: `Se procesará una venta de ${calcularTotales().cantidad_items} items por un total de ${formatPrice(calcularTotales().total)} para ${selectedCliente.nombre}. Se descontará del inventario.`,
      confirmText: 'Confirmar Venta',
      variant: 'warning'
    })

    if (!confirmed) return

    setProcessingVenta(true)

    try {
      // Obtener email del usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      const vendedor = user?.email || 'Administrador'

      const totales = calcularTotales()

      // 1. Crear la venta
      const { data: venta, error: errorVenta } = await supabase
        .from('ventas')
        .insert({
          total: totales.total,
          subtotal: totales.subtotal,
          descuento_total: totales.descuento_total,
          cantidad_items: totales.cantidad_items,
          notas: notasVenta.trim() || null,
          vendedor,
          cliente_id: selectedCliente.id,
          cliente_nombre: selectedCliente.nombre,
          cliente_telefono: selectedCliente.telefono,
          cliente_contacto: selectedCliente.contacto
        })
        .select()
        .single()

      if (errorVenta || !venta) {
        throw new Error('Error al crear la venta')
      }

      // 2. Crear los items de venta
      const items = cart.map(item => ({
        venta_id: venta.id,
        producto_id: item.producto_id,
        variante_id: item.variante_id,
        producto_nombre: item.producto_nombre,
        talla: item.talla,
        colegio: item.colegio,
        precio_unitario: item.precio_unitario,
        descuento_porcentaje: item.descuento_porcentaje,
        precio_final: item.precio_final,
        cantidad: item.cantidad,
        subtotal: item.precio_final * item.cantidad
      }))

      const { error: errorItems } = await supabase
        .from('venta_items')
        .insert(items)

      if (errorItems) {
        throw new Error('Error al crear los items de venta')
      }

      // 3. Descontar del inventario
      for (const item of cart) {
        const { data: variante } = await supabase
          .from('variantes')
          .select('stock')
          .eq('id', item.variante_id)
          .single()

        if (variante) {
          const nuevoStock = variante.stock - item.cantidad
          
          await supabase
            .from('variantes')
            .update({ stock: Math.max(0, nuevoStock) })
            .eq('id', item.variante_id)
        }
      }

      // 4. Actualizar estadísticas del cliente
      await supabase
        .from('clientes')
        .update({
          total_compras: selectedCliente.total_compras + totales.total,
          cantidad_compras: selectedCliente.cantidad_compras + 1,
          ultima_compra: new Date().toISOString()
        })
        .eq('id', selectedCliente.id)

      toast.success('¡Venta procesada exitosamente!')
      
      // Guardar datos para el ticket
      setUltimaVenta({
        id: venta.id,
        fecha: new Date().toLocaleString('es-CL'),
        cliente: selectedCliente,
        items: [...cart],
        totales,
        vendedor
      })
      setShowTicket(true)
      
      // Limpiar carrito y recargar productos
      setCart([])
      setNotasVenta('')
      setSelectedCliente(null)
      loadProductos()

    } catch (error) {
      console.error('Error al procesar venta:', error)
      toast.error('Error al procesar la venta')
    } finally {
      setProcessingVenta(false)
    }
  }

  const categorias = [...new Set(productos.map(p => p.categoria))].sort()

  const productosFiltrados = productos.filter(producto => {
    const matchSearch = searchTerm === '' || 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchCategoria = selectedCategoria === '' || producto.categoria === selectedCategoria

    return matchSearch && matchCategoria
  })

  const totales = calcularTotales()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando productos...</p>
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-gray-800">
                <img 
                  src="/logo-confecciones.png" 
                  alt="Confecciones Angus" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <Button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  💰 Punto de Venta
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Registra ventas y descuenta del inventario</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/admin/ventas/historial')}
                className="bg-gradient-to-br from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Historial
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Modal de Ticket de Venta */}
        {showTicket && ultimaVenta && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">¡Venta Exitosa!</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">La venta ha sido registrada en el sistema</p>
              </div>
              
              {/* Ticket para imprimir */}
              <div id="ticket-impresion" className="p-6 overflow-y-auto bg-white dark:bg-gray-800 flex-1">
                <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 dark:border-gray-600 pb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-widest">Angus Confecciones</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comprobante de Venta</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">ID: {ultimaVenta.id.substring(0, 8).toUpperCase()}</p>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex justify-between">
                    <span className="font-semibold">Fecha:</span>
                    <span>{ultimaVenta.fecha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Cliente:</span>
                    <span className="text-right">{ultimaVenta.cliente.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Atendido por:</span>
                    <span>{ultimaVenta.vendedor}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 uppercase tracking-wider">
                    <div className="col-span-6">Producto</div>
                    <div className="col-span-2 text-center">Cant</div>
                    <div className="col-span-4 text-right">Total</div>
                  </div>
                  <div className="space-y-3">
                    {ultimaVenta.items.map((item: any, index: number) => (
                      <div key={index} className="grid grid-cols-12 gap-2 text-sm text-gray-800 dark:text-gray-200 items-center">
                        <div className="col-span-6">
                          <p className="font-semibold line-clamp-1">{item.producto_nombre}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{item.colegio} - {item.talla}</p>
                        </div>
                        <div className="col-span-2 text-center font-mono">{item.cantidad}</div>
                        <div className="col-span-4 text-right font-mono font-medium">{formatPrice(item.precio_final * item.cantidad)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatPrice(ultimaVenta.totales.subtotal)}</span>
                  </div>
                  {ultimaVenta.totales.descuento_total > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400 font-semibold">
                      <span>Descuento:</span>
                      <span className="font-mono">-{formatPrice(ultimaVenta.totales.descuento_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 dark:text-white mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span>TOTAL:</span>
                    <span className="font-mono">{formatPrice(ultimaVenta.totales.total)}</span>
                  </div>
                </div>
                
                <div className="text-center mt-8 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  ¡Gracias por su compra!
                </div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                <Button
                  onClick={() => setShowTicket(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-xl font-bold transition-colors"
                >
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    // Lógica simple para imprimir solo el ticket
                    const printContent = document.getElementById('ticket-impresion');
                    const windowPrint = window.open('', '', 'width=800,height=600');
                    if (windowPrint && printContent) {
                      windowPrint.document.write(`
                        <html>
                          <head>
                            <title>Imprimir Comprobante</title>
                            <style>
                              body { font-family: monospace; padding: 20px; color: #000; }
                              .text-center { text-align: center; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .font-bold { font-weight: bold; }
                              .text-xl { font-size: 1.25rem; }
                              .mt-6 { margin-top: 1.5rem; }
                              .mb-6 { margin-bottom: 1.5rem; }
                              .border-b-2 { border-bottom: 2px dashed #ccc; }
                              .pt-4 { padding-top: 1rem; }
                              .pb-4 { padding-bottom: 1rem; }
                              .grid { display: grid; grid-template-columns: 6fr 2fr 4fr; gap: 10px; }
                              .col-span-6 { grid-column: span 1; }
                              .col-span-2 { grid-column: span 1; text-align: center; }
                              .col-span-4 { grid-column: span 1; text-align: right; }
                              @media print {
                                body { width: 80mm; margin: 0 auto; }
                              }
                            </style>
                          </head>
                          <body>
                            ${printContent.innerHTML}
                            <script>
                              window.onload = function() { window.print(); window.close(); }
                            </script>
                          </body>
                        </html>
                      `);
                      windowPrint.document.close();
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Imprimir Comprobante
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de productos */}
          <div className="lg:col-span-2 space-y-6">
            {/* Búsqueda y filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="space-y-4">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="🔍 Buscar productos..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">📁 Todas las categorías</option>
                  {categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de productos */}
            <div className="space-y-4">
              {productosFiltrados.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No hay productos disponibles</p>
                </div>
              ) : (
                productosFiltrados.map(producto => (
                  <div key={producto.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all">
                    <div className="p-6">
                      <div className="flex gap-4">
                        {/* Imagen */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                          {producto.imagen_url ? (
                            <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{producto.nombre}</h3>
                              <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-1 rounded-md mt-1">
                                {producto.categoria}
                              </span>
                            </div>
                            <div className="text-right">
                              {(() => {
                                const preciosVariantes = producto.variantes?.map(v => v.precio).filter(p => p !== null && p !== undefined) as number[] || [];
                                const tienePreciosDiferentes = preciosVariantes.length > 0 && preciosVariantes.some(p => p !== producto.precio);
                                const precioMinimo = preciosVariantes.length > 0 ? Math.min(producto.precio, ...preciosVariantes) : producto.precio;
                                const precioFinalMinimo = producto.descuento_porcentaje && producto.descuento_porcentaje > 0
                                  ? precioMinimo - (precioMinimo * producto.descuento_porcentaje / 100)
                                  : precioMinimo;

                                return producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through block">
                                      {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                                    </span>
                                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                                      {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioFinalMinimo)}
                                    </span>
                                    <span className="block text-xs text-orange-600 dark:text-orange-400 font-semibold">-{producto.descuento_porcentaje}%</span>
                                  </div>
                                ) : (
                                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    {tienePreciosDiferentes ? 'Desde ' : ''}{formatPrice(precioMinimo)}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Variantes */}
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Variantes disponibles:</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {producto.variantes?.map(variante => (
                                <button
                                  key={variante.id}
                                  onClick={() => agregarAlCarrito(producto, variante)}
                                  className="p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left"
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {variante.insignia_url && (
                                      <img src={variante.insignia_url} alt={variante.colegio} className="w-6 h-6 object-contain" />
                                    )}
                                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">{variante.colegio}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Talla {variante.talla}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                      variante.stock > 6 
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    }`}>
                                      {variante.stock} un.
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel del carrito */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 sticky top-24">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Carrito ({cart.length})
                </h2>
              </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400">Carrito vacío</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.variante_id} className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{item.producto_nombre}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{item.colegio} - Talla {item.talla}</p>
                          </div>
                          <button
                            onClick={() => eliminarDelCarrito(item.variante_id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => actualizarCantidad(item.variante_id, item.cantidad - 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.cantidad}</span>
                            <button
                              onClick={() => actualizarCantidad(item.variante_id, item.cantidad + 1)}
                              className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white">{formatPrice(item.precio_final * item.cantidad)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <>
                  <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    {/* Selector de cliente */}
                    <ClienteAutocomplete
                      selectedCliente={selectedCliente}
                      onClienteSelect={setSelectedCliente}
                    />

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Items:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{totales.cantidad_items}</span>
                      </div>
                      {totales.descuento_total > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                          <span className="font-semibold text-green-600 dark:text-green-400">-{formatPrice(totales.descuento_total)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">Total:</span>
                        <span className="text-blue-600 dark:text-blue-400">{formatPrice(totales.total)}</span>
                      </div>

                      <textarea
                        value={notasVenta}
                        onChange={(e) => setNotasVenta(e.target.value)}
                        placeholder="Notas de la venta (opcional)..."
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
                          onClick={procesarVenta}
                          disabled={processingVenta || !selectedCliente}
                          className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingVenta ? 'Procesando...' : 'Procesar Venta'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog />
    </div>
  )
}
