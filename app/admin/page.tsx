'use client'

import { useState, useMemo } from 'react'
import { useToast } from '@/app/components/ui/ToastContainer'
import { Button, Pagination, usePagination } from '../components/ui'
import ProductListNotebook from './components/ProductListNotebook'
import DashboardSummary from './components/DashboardSummary'

import KeyboardShortcuts from './components/KeyboardShortcuts'
import { DashboardMetrics } from './components/DashboardMetrics'

import { useAdminProductos } from '@/app/hooks/useAdminProductos'
import AdminFilters from './components/AdminFilters'
import { useAdminFilters } from '@/app/hooks/useAdminFilters'

export default function AdminPage() {
  const [variantSearchTerm, setVariantSearchTerm] = useState('')
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
  const [editingVariant, setEditingVariant] = useState<string | null>(null)
  const [editingProductName, setEditingProductName] = useState<string | null>(null)
  const [editingProductPrice, setEditingProductPrice] = useState<string | null>(null)
  const [editingProductNotas, setEditingProductNotas] = useState<string | null>(null)
  
  const toast = useToast()

  const { 
    productos, 
    isLoadingProductos,
    isErrorProductos,
    errorProductos,
    deleteProducto, 
    toggleOferta,
    toggleActivoProducto,
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
    selectedStatusFilter,
    setSelectedStatusFilter,
    searchInputRef,
    categories,
    colegios,
    tallas,
    filteredProducts,
    stockEspecifico
  } = useAdminFilters(productos)

  function updateVarianteStock(varianteId: string, expectedStock: number, newStock: number) {
    if (newStock < 0) {
      toast.error('El stock no puede ser negativo')
      return
    }
    updateVarianteStockMutation.mutate(
      { varianteId, expectedStock, newStock },
      { onSuccess: () => setEditingVariant(null) }
    )
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

  if (isLoadingProductos) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Cargando panel de administración...</p>
      </div>
    )
  }

  if (isErrorProductos) {
    return (
      <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
        <p className="font-semibold">No se pudo cargar el inventario.</p>
        <p className="mt-1 text-sm">{errorProductos instanceof Error ? errorProductos.message : 'Error de consulta'}</p>
        <Button onClick={() => void refetchProductos()} className="mt-4 min-h-11">
          Reintentar
        </Button>
      </div>
    )
  }

  function handleExportCsv() {
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
  }

  return (
    <>
      {/* Header de Inventario */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario General</h2>
        <Button
          onClick={handleExportCsv}
          className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm"
          title="Exportar a Excel/CSV"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="hidden lg:inline">Exportar</span>
        </Button>
      </div>

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
        selectedStatusFilter={selectedStatusFilter}
        setSelectedStatusFilter={setSelectedStatusFilter}
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
        onToggleActivo={toggleActivoProducto}
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
    
      <KeyboardShortcuts searchInputRef={searchInputRef} />
      <ConfirmDialog />
    </>
  )
}
