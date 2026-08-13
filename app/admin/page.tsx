'use client'

import { useState, useEffect, useMemo, Fragment, useRef } from 'react'
// use LazyImage for placeholders and lazy loading in admin previews
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input, LazyImage, Pagination, usePagination } from '../components/ui'
import ProductListNotebook from './components/ProductListNotebook'
import DashboardSummary from './components/DashboardSummary'

import KeyboardShortcuts from './components/KeyboardShortcuts'
import NotificationCenter from './components/NotificationCenter'
import GlobalKeyboardShortcuts from './components/GlobalKeyboardShortcuts'
import { DashboardMetrics } from './components/DashboardMetrics'
import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

// Extendemos los tipos base con los campos computados que usamos en la UI
interface Variante extends DBVariante {
  insignia_url?: string
}

interface Producto extends DBProducto {
  stock_total?: number
  variantes_count?: number
  variantes?: Variante[]
}

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedColegio, setSelectedColegio] = useState('')
  const [selectedTalla, setSelectedTalla] = useState('')
  const [selectedStockFilter, setSelectedStockFilter] = useState('') // Nuevo filtro
  const [variantSearchTerm, setVariantSearchTerm] = useState('') // Filtro de variantes
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState<string | null>(null)
  const [editingProductPrice, setEditingProductPrice] = useState<string | null>(null)
  const [editingProductNotas, setEditingProductNotas] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setLoading(false)
      if (session) {
        loadProductos()
      }
    }
    checkAuth()
  }, []) // No dependencies needed

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      setIsAuthenticated(true)
      loadProductos()
      toast.success('Sesión iniciada correctamente')
    } else {
      toast.error('Error al iniciar sesión')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setProductos([])
  }

  async function loadProductos() {
    const { data: productosData } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })

    // Cargar colegios con sus insignias
    const { data: colegiosData } = await supabase
      .from('colegios')
      .select('nombre, insignia_url')

    // Crear mapa con normalización de nombres para evitar problemas de coincidencia
    const colegiosMap = new Map(
      colegiosData?.map(c => [c.nombre.trim(), c.insignia_url]) || []
    )

    if (productosData) {
      const productosConInfo = await Promise.all(
        productosData.map(async (producto) => {
          const { data: variantes } = await supabase
            .from('variantes')
            .select('*')
            .eq('producto_id', producto.id)

          // Agregar insignia_url a cada variante
          const variantesConInsignia = variantes?.map(v => ({
            ...v,
            insignia_url: colegiosMap.get(v.colegio.trim())
          })) || []

          const stock_total = variantes?.reduce((sum, v) => sum + v.stock, 0) || 0
          const variantes_count = variantes?.length || 0

          return {
            ...producto,
            stock_total,
            variantes_count,
            variantes: variantesConInsignia
          }
        })
      )

      setProductos(productosConInfo)
    }
  }

  async function deleteProducto(id: string) {
    const confirmed = await confirm({
      title: '¿Eliminar producto?',
      message: 'Se eliminará este producto y todas sus variantes. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    await supabase.from('productos').delete().eq('id', id)
    toast.success('Producto eliminado exitosamente')
    loadProductos()
  }

  async function toggleOferta(id: string, currentState: boolean) {
    const producto = productos.find(p => p.id === id)
    const nuevoEstado = !currentState
    
    const confirmed = await confirm({
      title: nuevoEstado ? '¿Activar oferta?' : '¿Desactivar oferta?',
      message: nuevoEstado 
        ? `Se marcará "${producto?.nombre}" como producto en oferta. Aparecerá con una insignia especial.`
        : `Se quitará la marca de oferta de "${producto?.nombre}".`,
      confirmText: nuevoEstado ? 'Activar Oferta' : 'Desactivar',
      variant: nuevoEstado ? 'warning' : 'info'
    })

    if (!confirmed) return

    await supabase
      .from('productos')
      .update({ en_oferta: nuevoEstado })
      .eq('id', id)
    
    toast.success(nuevoEstado ? 'Oferta activada exitosamente' : 'Oferta desactivada')
    loadProductos()
  }

  async function updateDescuento(id: string, descuento: number) {
    if (descuento < 0 || descuento > 100) {
      toast.error('El descuento debe estar entre 0 y 100')
      return
    }

    const producto = productos.find(p => p.id === id)
    const descuentoActual = producto?.descuento_porcentaje || 0
    
    // Si no hay cambio, no hacer nada
    if (descuento === descuentoActual) return

    // Si se está quitando el descuento (0%), no pedir confirmación
    if (descuento === 0) {
      await supabase
        .from('productos')
        .update({ descuento_porcentaje: descuento })
        .eq('id', id)
      toast.success('Descuento eliminado')
      loadProductos()
      return
    }

    // Calcular precios
    const precioOriginal = producto?.precio || 0
    const precioFinal = precioOriginal - (precioOriginal * descuento / 100)
    
    const confirmed = await confirm({
      title: '¿Aplicar descuento?',
      message: `Se aplicará un descuento del ${descuento}% a "${producto?.nombre}".\n\nPrecio original: ${formatPrice(precioOriginal)}\nPrecio con descuento: ${formatPrice(precioFinal)}\nAhorro: ${formatPrice(precioOriginal - precioFinal)}`,
      confirmText: 'Aplicar Descuento',
      variant: 'warning'
    })

    if (!confirmed) {
      // Revertir el select al valor anterior
      loadProductos()
      return
    }
    
    await supabase
      .from('productos')
      .update({ descuento_porcentaje: descuento })
      .eq('id', id)
    
    toast.success(`Descuento del ${descuento}% aplicado exitosamente`)
    loadProductos()
  }

  async function updateVarianteStock(varianteId: string, newStock: number) {
    if (newStock < 0) {
      toast.error('El stock no puede ser negativo')
      return
    }
    
    await supabase
      .from('variantes')
      .update({ stock: newStock })
      .eq('id', varianteId)
    
    loadProductos()
    setEditingVariant(null)
  }

  async function duplicateProduct(producto: Producto) {
    const confirmed = await confirm({
      title: '¿Duplicar producto?',
      message: 'Se creará una copia de este producto con todas sus variantes',
      confirmText: 'Duplicar',
      variant: 'info'
    })

    if (!confirmed) return

    const { data: newProduct } = await supabase
      .from('productos')
      .insert({
        nombre: `${producto.nombre} (Copia)`,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        imagen_url: producto.imagen_url,
        descuento_porcentaje: producto.descuento_porcentaje,
        en_oferta: producto.en_oferta
      })
      .select()
      .single()

    if (newProduct && producto.variantes) {
      const variantesToInsert = producto.variantes.map(v => ({
        producto_id: newProduct.id,
        talla: v.talla,
        colegio: v.colegio,
        stock: v.stock
      }))
      
      await supabase.from('variantes').insert(variantesToInsert)
    }
    
    toast.success('Producto duplicado exitosamente')
    loadProductos()
  }

  function toggleExpandProduct(productId: string) {
    setExpandedProduct(expandedProduct === productId ? null : productId)
  }

  async function updateProductName(id: string, nombre: string) {
    if (!nombre.trim()) {
      toast.error('El nombre no puede estar vacío')
      setEditingProductName(null)
      return
    }

    await supabase
      .from('productos')
      .update({ nombre: nombre.trim() })
      .eq('id', id)
    
    toast.success('Nombre actualizado')
    loadProductos()
    setEditingProductName(null)
  }

  async function updateProductPrice(id: string, precio: number) {
    if (precio < 0) {
      toast.error('El precio no puede ser negativo')
      setEditingProductPrice(null)
      return
    }

    await supabase
      .from('productos')
      .update({ precio })
      .eq('id', id)
    
    toast.success('Precio actualizado')
    loadProductos()
    setEditingProductPrice(null)
  }

  async function updateProductNotas(id: string, notas: string) {
    await supabase
      .from('productos')
      .update({ notas: notas.trim() || null })
      .eq('id', id)
    
    toast.success(notas.trim() ? 'Notas guardadas' : 'Notas eliminadas')
    loadProductos()
    setEditingProductNotas(null)
  }

  const categories = useMemo(() => {
    return [...new Set(productos.map(p => p.categoria))].sort()
  }, [productos])

  const colegios = useMemo(() => {
    const allColegios = productos.flatMap(p => p.variantes?.map(v => v.colegio) || [])
    return [...new Set(allColegios)].sort()
  }, [productos])

  const tallas = useMemo(() => {
    const allTallas = productos.flatMap(p => p.variantes?.map(v => v.talla) || [])
    const uniqueTallas = [...new Set(allTallas)]
    const order = ['6-8', '10-12', '14-16', 'S-M', 'L-XL', '6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
    return uniqueTallas.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [productos])

  const filteredProducts = useMemo(() => {
    return productos.filter(producto => {
      // Búsqueda mejorada - busca en productos Y variantes
      if (searchTerm !== '') {
        const search = searchTerm.toLowerCase()
        
        // Buscar en campos del producto
        const matchesNombre = producto.nombre.toLowerCase().includes(search)
        const matchesDescripcion = producto.descripcion.toLowerCase().includes(search)
        const matchesCategoria = producto.categoria.toLowerCase().includes(search)
        const matchesPrecio = producto.precio.toString().includes(search)
        const matchesNotas = producto.notas?.toLowerCase().includes(search)
        
        // Buscar en variantes (colegio, talla, stock)
        const matchesVariantes = producto.variantes?.some(v => 
          v.colegio.toLowerCase().includes(search) ||
          v.talla.toLowerCase().includes(search) ||
          v.stock.toString().includes(search)
        )
        
        // Si no coincide con nada, filtrar
        if (!matchesNombre && !matchesDescripcion && !matchesCategoria && 
            !matchesPrecio && !matchesNotas && !matchesVariantes) {
          return false
        }
      }
      
      // Filtro por categoría
      const matchesCategory = selectedCategory === '' || producto.categoria === selectedCategory

      // Filtro por colegio
      const matchesColegio = selectedColegio === '' || 
        producto.variantes?.some(v => v.colegio === selectedColegio)

      // Filtro por talla
      const matchesTalla = selectedTalla === '' || 
        producto.variantes?.some(v => v.talla === selectedTalla)

      // Filtro por stock
      let matchesStock = true
      if (selectedStockFilter === 'disponible') {
        matchesStock = (producto.stock_total || 0) > 6
      } else if (selectedStockFilter === 'bajo') {
        matchesStock = (producto.stock_total || 0) > 0 && (producto.stock_total || 0) <= 6
      } else if (selectedStockFilter === 'agotado') {
        matchesStock = (producto.stock_total || 0) === 0
      }

      return matchesCategory && matchesColegio && matchesTalla && matchesStock
    })
  }, [productos, searchTerm, selectedCategory, selectedColegio, selectedTalla, selectedStockFilter])

  // Paginación
  const { 
    currentPage, 
    totalPages, 
    startIndex, 
    endIndex, 
    goToPage 
  } = usePagination(filteredProducts.length, 20)

  // Productos paginados
  const paginatedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, endIndex)
  }, [filteredProducts, startIndex, endIndex])

  // Calcular stock específico según filtros de colegio y talla
  const stockEspecifico = useMemo(() => {
    if (!selectedColegio && !selectedTalla) return null

    let totalStock = 0
    let variantesEncontradas = 0

    filteredProducts.forEach(producto => {
      producto.variantes?.forEach(variante => {
        const matchColegio = !selectedColegio || variante.colegio === selectedColegio
        const matchTalla = !selectedTalla || variante.talla === selectedTalla
        
        if (matchColegio && matchTalla) {
          totalStock += variante.stock
          variantesEncontradas++
        }
      })
    })

    return { totalStock, variantesEncontradas }
  }, [filteredProducts, selectedColegio, selectedTalla])

  const calcularPrecioFinal = (precio: number, descuento?: number) => {
    if (!descuento || descuento === 0) return precio
    return precio - (precio * descuento / 100)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTM2IDM0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <form onSubmit={handleLogin} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-10 rounded-xl shadow-xl w-full max-w-md relative z-10 border border-white/20 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-linear-to-br from-blue-600 to-indigo-600 rounded-xl mb-4 shadow-sm">
              <svg className="w-12 h-12 text-gray-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Panel Administrativo
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Acceso seguro al sistema</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Correo Electrónico</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="admin@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-linear-to-br from-blue-600 to-indigo-600 text-gray-900 dark:text-white px-5 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-2 sm:mb-0 overflow-hidden bg-white dark:bg-gray-800">
                <img 
                  src="/logo-confecciones.png" 
                  alt="Confecciones Angus" 
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Panel de Administración
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Gestiona tu inventario</p>
              </div>
              <NotificationCenter />
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
              <Button
                variant="primary"
                onClick={() => router.push('/admin/nuevo')}
                className="w-full sm:w-auto  shadow-md hover:shadow-sm transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Ver Tienda</span>
              </Button>
              <Button
                onClick={() => {
                  // Generar CSV
                  const headers = ['ID', 'Nombre', 'Categoria', 'Precio Original', 'Descuento %', 'Precio Final', 'Stock Total', 'En Oferta', 'Notas']
                  const csvRows = filteredProducts.map(p => {
                    const precioFinal = p.descuento_porcentaje ? p.precio - (p.precio * p.descuento_porcentaje / 100) : p.precio
                    return [
                      p.id,
                      `"${p.nombre.replace(/"/g, '""')}"`,
                      `"${p.categoria}"`,
                      p.precio,
                      p.descuento_porcentaje || 0,
                      precioFinal,
                      p.stock_total || 0,
                      p.en_oferta ? 'Si' : 'No',
                      `"${p.notas?.replace(/"/g, '""') || ''}"`
                    ].join(',')
                  })
                  
                  const csvContent = [headers.join(','), ...csvRows].join('\n')
                  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement('a')
                  link.href = url
                  link.setAttribute('download', `inventario_angus_${new Date().toISOString().split('T')[0]}.csv`)
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  toast.success('Inventario exportado a CSV')
                }}
                className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm"
                title="Exportar a Excel/CSV"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Exportar</span>
              </Button>
              <Button
                variant="success"
                onClick={() => router.push('/admin/ventas/nueva')}
                className="w-full sm:w-auto  shadow-md hover:shadow-sm transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span className="hidden sm:inline">Imprimir</span>
              </Button>
              <Button
                onClick={handleLogout}
                className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm"
                title="Cerrar Sesión"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Menú Lateral de Módulos (Sidebar) */}
          <div className="w-full md:w-56 flex-shrink-0 sticky top-24">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4 px-2">Módulos</h2>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => router.push('/admin/ventas')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Punto de Venta</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/nuevo')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Nuevo Producto</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/colegios')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Colegios</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/categorias')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Categorías</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/clientes')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Clientes</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/proveedores')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Proveedores</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/insumos')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Insumos</span>
                </button>

                <button 
                  onClick={() => router.push('/admin/pedidos')}
                  className="flex items-center gap-3 p-3 rounded-lg border-l-4 border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">Pedidos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contenido Principal (Mas grande a la derecha) */}
          <div className="flex-1 min-w-0 w-full">      
        {/* Dashboard de Métricas - NUEVO */}
        <DashboardMetrics />

        {/* Dashboard Summary */}
        <DashboardSummary productos={productos} />

        {/* Buscador y Filtros Superiores */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col gap-4">
            
            {/* Fila Principal: Buscador */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                ref={searchInputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por nombre, notas, descripción..."
                className="w-full pl-12 pr-12 py-4 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-lg font-medium transition-all shadow-inner"
              />
              {searchTerm && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    onClick={() => setSearchTerm('')}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors focus:outline-none"
                    title="Borrar búsqueda"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Fila Secundaria: Filtros Rápidos */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">📁</span>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">🏫</span>
                </div>
                <select
                  value={selectedColegio}
                  onChange={(e) => setSelectedColegio(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Todos los colegios</option>
                  {colegios.map(colegio => (
                    <option key={colegio} value={colegio}>{colegio}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">📏</span>
                </div>
                <select
                  value={selectedTalla}
                  onChange={(e) => setSelectedTalla(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Todas las tallas</option>
                  {tallas.map(talla => (
                    <option key={talla} value={talla}>{talla}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 text-sm">📦</span>
                </div>
                <select
                  value={selectedStockFilter}
                  onChange={(e) => setSelectedStockFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
                >
                  <option value="">Todo el inventario</option>
                  <option value="disponible">🟢 Stock disponible (+6)</option>
                  <option value="bajo">🟡 Stock bajo (1-6)</option>
                  <option value="agotado">🔴 Agotados (0)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>

              {/* Botón limpiar filtros (solo aparece si hay filtros activos) */}
              {(searchTerm || selectedCategory || selectedColegio || selectedTalla || selectedStockFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('')
                    setSelectedColegio('')
                    setSelectedTalla('')
                    setSelectedStockFilter('')
                  }}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-500"
                  title="Restablecer todos los filtros"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Área de Tags (Filtros Activos) y Contador */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-bold border border-blue-200 dark:border-blue-800 mr-2 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
              {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
            </div>
            
            {selectedCategory && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
                📁 {selectedCategory}
                <button onClick={() => setSelectedCategory('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
              </span>
            )}
            {selectedColegio && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
                🏫 {selectedColegio}
                <button onClick={() => setSelectedColegio('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
              </span>
            )}
            {selectedTalla && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
                📏 Talla {selectedTalla}
                <button onClick={() => setSelectedTalla('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
              </span>
            )}
            {selectedStockFilter && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
                📦 {selectedStockFilter === 'disponible' ? '🟢 Disponible' : selectedStockFilter === 'bajo' ? '🟡 Stock Bajo' : '🔴 Agotado'}
                <button onClick={() => setSelectedStockFilter('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
              </span>
            )}
          </div>

          {/* Mensaje de stock específico según filtros */}
          {stockEspecifico && (
            <div className={`mt-4 p-4 rounded-xl border ${
              stockEspecifico.totalStock > 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-start gap-3">
                {stockEspecifico.totalStock > 0 ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className={`font-bold text-base ${
                    stockEspecifico.totalStock > 0 
                      ? 'text-green-900 dark:text-green-100' 
                      : 'text-red-900 dark:text-red-100'
                  }`}>
                    {stockEspecifico.totalStock > 0 ? (
                      <>
                        {stockEspecifico.totalStock === 1 
                          ? 'Hay 1 unidad disponible' 
                          : `Hay ${stockEspecifico.totalStock} unidades disponibles`}
                      </>
                    ) : (
                      'No hay stock disponible'
                    )}
                  </p>
                  <p className={`text-sm mt-1 ${
                    stockEspecifico.totalStock > 0 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {selectedTalla && selectedColegio ? (
                      <>de talla <span className="font-semibold">{selectedTalla}</span> para <span className="font-semibold">{selectedColegio}</span></>
                    ) : selectedTalla ? (
                      <>de talla <span className="font-semibold">{selectedTalla}</span></>
                    ) : selectedColegio ? (
                      <>para <span className="font-semibold">{selectedColegio}</span></>
                    ) : null}
                    {stockEspecifico.variantesEncontradas > 0 && (
                      <> ({stockEspecifico.variantesEncontradas} {stockEspecifico.variantesEncontradas === 1 ? 'variante' : 'variantes'})</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <ProductListNotebook
          productos={paginatedProducts}
          expandedProduct={expandedProduct}
          editingVariant={editingVariant}
          editingProductName={editingProductName}
          editingProductPrice={editingProductPrice}
          editingProductNotas={editingProductNotas}
          variantSearchTerm={variantSearchTerm}
          selectedColegio={selectedColegio}
          selectedTalla={selectedTalla}
          onToggleExpand={toggleExpandProduct}
          onUpdateDescuento={updateDescuento}
          onToggleOferta={toggleOferta}
          onUpdateVarianteStock={updateVarianteStock}
          onSetEditingVariant={setEditingVariant}
          onSetEditingProductName={setEditingProductName}
          onSetEditingProductPrice={setEditingProductPrice}
          onSetEditingProductNotas={setEditingProductNotas}
          onUpdateProductName={updateProductName}
          onUpdateProductPrice={updateProductPrice}
          onUpdateProductNotas={updateProductNotas}
          onDuplicate={duplicateProduct}
          onDelete={deleteProducto}
          onSetVariantSearchTerm={setVariantSearchTerm}
        />

            {/* Paginación */}
            {filteredProducts.length > 20 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={goToPage}
                  itemsPerPage={20}
                  totalItems={filteredProducts.length}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      <KeyboardShortcuts searchInputRef={searchInputRef} />
      <GlobalKeyboardShortcuts />
      <ConfirmDialog />
    </div>
  )
}
