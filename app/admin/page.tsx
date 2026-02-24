'use client'

import { useState, useEffect, useMemo, Fragment } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { formatPrice } from '@/lib/formatPrice'

interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string
  stock: number
}

interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string
  stock_total?: number
  variantes_count?: number
  descuento_porcentaje?: number
  en_oferta?: boolean
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
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
    setLoading(false)
    if (session) {
      loadProductos()
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) {
      setIsAuthenticated(true)
      loadProductos()
    } else {
      alert('Error al iniciar sesión')
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

    if (productosData) {
      const productosConInfo = await Promise.all(
        productosData.map(async (producto) => {
          const { data: variantes } = await supabase
            .from('variantes')
            .select('*')
            .eq('producto_id', producto.id)

          const stock_total = variantes?.reduce((sum, v) => sum + v.stock, 0) || 0
          const variantes_count = variantes?.length || 0

          return {
            ...producto,
            stock_total,
            variantes_count,
            variantes: variantes || []
          }
        })
      )

      setProductos(productosConInfo)
    }
  }

  async function deleteProducto(id: string) {
    if (confirm('¿Eliminar este producto y todas sus variantes?')) {
      await supabase.from('productos').delete().eq('id', id)
      loadProductos()
    }
  }

  async function toggleOferta(id: string, currentState: boolean) {
    await supabase
      .from('productos')
      .update({ en_oferta: !currentState })
      .eq('id', id)
    loadProductos()
  }

  async function updateDescuento(id: string, descuento: number) {
    if (descuento < 0 || descuento > 100) {
      alert('El descuento debe estar entre 0 y 100')
      return
    }
    
    await supabase
      .from('productos')
      .update({ descuento_porcentaje: descuento })
      .eq('id', id)
    loadProductos()
  }

  async function updateVarianteStock(varianteId: string, newStock: number) {
    if (newStock < 0) {
      alert('El stock no puede ser negativo')
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
    if (confirm('¿Duplicar este producto con todas sus variantes?')) {
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
      
      loadProductos()
    }
  }

  function toggleExpandProduct(productId: string) {
    setExpandedProduct(expandedProduct === productId ? null : productId)
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
    const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
    return uniqueTallas.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }, [productos])

  const filteredProducts = useMemo(() => {
    return productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === '' || producto.categoria === selectedCategory

      const matchesColegio = selectedColegio === '' || 
        producto.variantes?.some(v => v.colegio === selectedColegio)

      const matchesTalla = selectedTalla === '' || 
        producto.variantes?.some(v => v.talla === selectedTalla)

      return matchesSearch && matchesCategory && matchesColegio && matchesTalla
    })
  }, [productos, searchTerm, selectedCategory, selectedColegio, selectedTalla])

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
        
        <form onSubmit={handleLogin} className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/20 dark:border-gray-700">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-linear-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            
            <button 
              type="submit" 
              className="w-full bg-linear-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-linear-to-br from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Panel de Administración
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Gestiona tu inventario</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="bg-linear-to-br from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ver Tienda
              </button>
              <button
                onClick={() => router.push('/admin/colegios')}
                className="bg-linear-to-br from-purple-600 to-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Colegios
              </button>
              <button
                onClick={() => router.push('/admin/nuevo')}
                className="bg-linear-to-br from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Producto
              </button>
              <button
                onClick={handleLogout}
                className="bg-linear-to-br from-red-600 to-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Buscador y Filtros */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-4">
            {/* Primera fila: Búsqueda y Categoría */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre o descripción..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="md:w-64 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Segunda fila: Colegio y Talla */}
            <div className="flex flex-col md:flex-row gap-4">
              <select
                value={selectedColegio}
                onChange={(e) => setSelectedColegio(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todos los colegios</option>
                {colegios.map(colegio => (
                  <option key={colegio} value={colegio}>{colegio}</option>
                ))}
              </select>
              <select
                value={selectedTalla}
                onChange={(e) => setSelectedTalla(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Todas las tallas</option>
                {tallas.map(talla => (
                  <option key={talla} value={talla}>{talla}</option>
                ))}
              </select>
              {/* Botón para limpiar filtros */}
              {(searchTerm || selectedCategory || selectedColegio || selectedTalla) && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('')
                    setSelectedColegio('')
                    setSelectedTalla('')
                  }}
                  className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-colors font-semibold whitespace-nowrap"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Contador de resultados y filtros activos */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> de {productos.length} productos
            </p>
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                Categoría: {selectedCategory}
                <button onClick={() => setSelectedCategory('')} className="hover:text-blue-900 dark:hover:text-blue-100"></button>
              </span>
            )}
            {selectedColegio && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                Colegio: {selectedColegio}
                <button onClick={() => setSelectedColegio('')} className="hover:text-purple-900 dark:hover:text-purple-100"></button>
              </span>
            )}
            {selectedTalla && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                Talla: {selectedTalla}
                <button onClick={() => setSelectedTalla('')} className="hover:text-green-900 dark:hover:text-green-100"></button>
              </span>
            )}
          </div>

          {/* Mensaje de stock específico según filtros */}
          {stockEspecifico && (
            <div className={`mt-4 p-4 rounded-xl border-2 ${
              stockEspecifico.totalStock > 0 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-start gap-3">
                {stockEspecifico.totalStock > 0 ? (
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Imagen</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nombre</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Categoría</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Precio</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Descuento</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">En Oferta</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((producto) => (
                  <Fragment key={producto.id}>
                  <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-sm">
                        {producto.imagen_url ? (
                          <img 
                            src={producto.imagen_url} 
                            alt={producto.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-gray-900 dark:text-white text-base">{producto.nombre}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-linear-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-300 text-xs font-bold px-3 py-1.5 rounded-full">
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 ? (
                          <>
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through block">{formatPrice(producto.precio)}</span>
                            <span className="font-bold text-lg text-green-600 dark:text-green-400">
                              {formatPrice(calcularPrecioFinal(producto.precio, producto.descuento_porcentaje))}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-lg text-gray-900 dark:text-white">{formatPrice(producto.precio)}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <select
                        value={producto.descuento_porcentaje || 0}
                        onChange={(e) => updateDescuento(producto.id, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="0">Sin descuento</option>
                        <option value="5">5%</option>
                        <option value="10">10%</option>
                        <option value="15">15%</option>
                        <option value="20">20%</option>
                        <option value="30">30%</option>
                        <option value="40">40%</option>
                        <option value="50">50%</option>
                        <option value="60">60%</option>
                        <option value="70">70%</option>
                        <option value="80">80%</option>
                        <option value="90">90%</option>
                      </select>
                      {producto.descuento_porcentaje && producto.descuento_porcentaje > 0 && (
                        <span className="text-xs text-red-600 dark:text-red-400 font-bold mt-1 block">
                          Ahorro: {formatPrice(producto.precio * (producto.descuento_porcentaje / 100))}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleOferta(producto.id, producto.en_oferta || false)}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow-md ${
                          producto.en_oferta
                            ? 'bg-linear-to-br from-red-500 to-orange-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {producto.en_oferta ? '🔥 Oferta' : 'Sin oferta'}
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="text-center">
                        <span className={`font-bold text-lg block ${
                          (producto.stock_total || 0) > 10 
                            ? 'text-green-600 dark:text-green-400' 
                            : (producto.stock_total || 0) > 0 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {producto.stock_total || 0}
                        </span>
                        <button
                          onClick={() => toggleExpandProduct(producto.id)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 block"
                        >
                          {expandedProduct === producto.id ? '▼' : '▶'} {producto.variantes_count || 0} variantes
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => router.push(`/admin/editar/${producto.id}`)}
                          className="bg-linear-to-br from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg"
                          title="Editar producto"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => duplicateProduct(producto)}
                          className="bg-linear-to-br from-purple-500 to-purple-600 text-white px-3 py-2 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg"
                          title="Duplicar producto"
                        >
                          📋
                        </button>
                        <button
                          onClick={() => deleteProducto(producto.id)}
                          className="bg-linear-to-br from-red-500 to-red-600 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold text-xs shadow-md hover:shadow-lg"
                          title="Eliminar producto"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Fila expandible con variantes */}
                  {expandedProduct === producto.id && producto.variantes && producto.variantes.length > 0 && (
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td colSpan={8} className="p-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            Gestión Rápida de Variantes
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {producto.variantes
                              .sort((a, b) => {
                                const colegioCompare = a.colegio.localeCompare(b.colegio)
                                if (colegioCompare !== 0) return colegioCompare
                                const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
                                return order.indexOf(a.talla) - order.indexOf(b.talla)
                              })
                              .map((variante) => (
                              <div 
                                key={variante.id} 
                                className="bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-bold text-gray-900 dark:text-white block">{variante.colegio}</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Talla: {variante.talla}</span>
                                  </div>
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    variante.stock > 10 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                      : variante.stock > 0 
                                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' 
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                    {variante.stock}
                                  </span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  {editingVariant === variante.id ? (
                                    <>
                                      <input
                                        type="number"
                                        min="0"
                                        defaultValue={variante.stock}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            updateVarianteStock(variante.id, parseInt((e.target as HTMLInputElement).value) || 0)
                                          }
                                        }}
                                        className="flex-1 px-2 py-1 border border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => {
                                          const input = document.querySelector(`input[type="number"]`) as HTMLInputElement
                                          updateVarianteStock(variante.id, parseInt(input.value) || 0)
                                        }}
                                        className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors text-xs font-bold"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => setEditingVariant(null)}
                                        className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600 transition-colors text-xs font-bold"
                                      >
                                        ✕
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => updateVarianteStock(variante.id, Math.max(0, variante.stock - 1))}
                                        className="flex-1 bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm font-bold"
                                      >
                                        -1
                                      </button>
                                      <button
                                        onClick={() => setEditingVariant(variante.id)}
                                        className="flex-1 bg-blue-500 text-white px-2 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm font-bold"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() => updateVarianteStock(variante.id, variante.stock + 1)}
                                        className="flex-1 bg-green-500 text-white px-2 py-1 rounded-lg hover:bg-green-600 transition-colors text-sm font-bold"
                                      >
                                        +1
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xl font-bold">No se encontraron productos</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Intenta con otros términos de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
