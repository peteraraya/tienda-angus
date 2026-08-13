'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/ui/ToastContainer'
import { Button, Pagination, usePagination } from '../components/ui'
import ProductListNotebook from './components/ProductListNotebook'
import DashboardSummary from './components/DashboardSummary'
import AdminSidebar from './components/AdminSidebar'
import AdminLoginForm from './components/AdminLoginForm'

import KeyboardShortcuts from './components/KeyboardShortcuts'
import NotificationCenter from './components/NotificationCenter'
import GlobalKeyboardShortcuts from './components/GlobalKeyboardShortcuts'
import { DashboardMetrics } from './components/DashboardMetrics'

import { useAdminProductos } from '@/app/hooks/useAdminProductos'
import AdminFilters from './components/AdminFilters'
import { useAdminFilters } from '@/app/hooks/useAdminFilters'
import AdminTopBar from './components/AdminTopBar'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [variantSearchTerm, setVariantSearchTerm] = useState('') // Filtro de variantes
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState<string | null>(null)
  const [editingProductPrice, setEditingProductPrice] = useState<string | null>(null)
  const [editingProductNotas, setEditingProductNotas] = useState<string | null>(null)
  
  const router = useRouter()
  const toast = useToast()

  const { 
    productos, 
    isLoadingProductos,
    deleteProducto, 
    toggleOferta, 
    updateDescuento, 
    duplicateProduct,
    updateVarianteStockMutation,
    updateProductNameMutation,
    updateProductPriceMutation,
    updateProductNotasMutation,
    ConfirmDialog,
    refetchProductos
  } = useAdminProductos()

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedColegio,
    setSelectedColegio,
    selectedTalla,
    setSelectedTalla,
    selectedStockFilter,
    setSelectedStockFilter,
    searchInputRef,
    categories,
    colegios,
    tallas,
    filteredProducts,
    stockEspecifico
  } = useAdminFilters(productos)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      setIsAuthenticated(!!session)
      setLoading(false)
    }
    checkAuth()
  }, []) 

  async function handleLogout() {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
  }

  async function updateVarianteStock(varianteId: string, newStock: number) {
    if (newStock < 0) {
      toast.error('El stock no puede ser negativo')
      return
    }
    await updateVarianteStockMutation.mutateAsync({ varianteId, newStock })
    setEditingVariant(null)
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
    await updateProductNameMutation.mutateAsync({ id, nombre })
    setEditingProductName(null)
  }

  async function updateProductPrice(id: string, precio: number) {
    if (precio < 0) {
      toast.error('El precio no puede ser negativo')
      setEditingProductPrice(null)
      return
    }
    await updateProductPriceMutation.mutateAsync({ id, precio })
    setEditingProductPrice(null)
  }

  async function updateProductNotas(id: string, notas: string) {
    await updateProductNotasMutation.mutateAsync({ id, notas })
    setEditingProductNotas(null)
  }

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

  if (loading || isLoadingProductos) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={() => {
      setIsAuthenticated(true)
      refetchProductos()
    }} />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      
      <AdminTopBar filteredProducts={filteredProducts} onLogout={handleLogout} />

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Menú Lateral de Módulos (Sidebar) */}
          <AdminSidebar />

          {/* Contenido Principal (Mas grande a la derecha) */}
          <div className="flex-1 min-w-0 w-full">      
        {/* Dashboard de Métricas - NUEVO */}
        <DashboardMetrics />

        {/* Dashboard Summary */}
        <DashboardSummary productos={productos} />

        <AdminFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedColegio={selectedColegio}
          setSelectedColegio={setSelectedColegio}
          selectedTalla={selectedTalla}
          setSelectedTalla={setSelectedTalla}
          selectedStockFilter={selectedStockFilter}
          setSelectedStockFilter={setSelectedStockFilter}
          searchInputRef={searchInputRef}
          categories={categories}
          colegios={colegios}
          tallas={tallas}
          filteredProductsLength={filteredProducts.length}
          stockEspecifico={stockEspecifico}
        />

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
