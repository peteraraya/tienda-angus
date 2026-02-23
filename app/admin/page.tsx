'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string
  stock_total?: number
  variantes_count?: number
}

export default function AdminPage() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      // Cargar variantes para cada producto
      const productosConInfo = await Promise.all(
        productosData.map(async (producto) => {
          const { data: variantes } = await supabase
            .from('variantes')
            .select('stock')
            .eq('producto_id', producto.id)

          const stock_total = variantes?.reduce((sum, v) => sum + v.stock, 0) || 0
          const variantes_count = variantes?.length || 0

          return {
            ...producto,
            stock_total,
            variantes_count
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnpNNiAzNGMzLjMxIDAgNiAyLjY5IDYgNnMtMi42OSA2LTYgNi02LTIuNjktNi02IDIuNjktNiA2LTZ6TTM2IDM0YzMuMzEgMCA2IDIuNjkgNiA2cy0yLjY5IDYtNiA2LTYtMi42OS02LTYgMi42OS02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        
        <form onSubmit={handleLogin} className="bg-white/95 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Panel Administrativo
            </h1>
            <p className="text-gray-600 mt-2">Acceso seguro al sistema</p>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico</label>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Panel de Administración
                </h1>
                <p className="text-gray-600 text-sm">Gestiona tu inventario</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Ver Tienda
              </button>
              <button
                onClick={() => router.push('/admin/nuevo')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Producto
              </button>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-600 to-rose-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:from-red-700 hover:to-rose-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Imagen</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Nombre</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Categoría</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Precio</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Stock Total</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Variantes</th>
                  <th className="p-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                    <td className="p-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-sm">
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
                      <p className="font-bold text-gray-900 text-base">{producto.nombre}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                        {producto.categoria}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        ${producto.precio}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-bold text-lg ${
                        (producto.stock_total || 0) > 10 
                          ? 'text-green-600' 
                          : (producto.stock_total || 0) > 0 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                      }`}>
                        {producto.stock_total || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="bg-gray-100 text-gray-700 font-semibold px-3 py-1.5 rounded-lg text-sm">
                        {producto.variantes_count || 0} variantes
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/editar/${producto.id}`)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteProducto(producto.id)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-semibold text-sm shadow-md hover:shadow-lg"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {productos.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-xl font-bold">No hay productos registrados</p>
              <p className="text-gray-400 text-sm mt-2">Comienza agregando tu primer producto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
