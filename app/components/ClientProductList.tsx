'use client'

import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'
import ProductListItem from './ProductListItem'
import SearchBar from './SearchBar'

interface Variante {
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
  variantes: Variante[]
  stock_total: number
  descuento_porcentaje?: number
  en_oferta?: boolean
}

interface ClientProductListProps {
  productos: Producto[]
}


export default function ClientProductList({ productos }: ClientProductListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid')
  const [selectedTalla, setSelectedTalla] = useState('')
  const [selectedColegio, setSelectedColegio] = useState('')

  const categories = useMemo(() => {
    return [...new Set(productos.map(p => p.categoria))].sort()
  }, [productos])

  // Filtros dinámicos de tallas y colegios según productos filtrados
  const filteredProductsForFilters = useMemo(() => {
    return productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === '' || producto.categoria === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [productos, searchTerm, selectedCategory])

  const tallas = useMemo(() => {
    const allTallas = filteredProductsForFilters.flatMap(p => p.variantes?.map(v => v.talla) || [])
    return [...new Set(allTallas)].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [filteredProductsForFilters])

  const colegios = useMemo(() => {
    const allColegios = filteredProductsForFilters.flatMap(p => p.variantes?.map(v => v.colegio) || [])
    return [...new Set(allColegios)].sort()
  }, [filteredProductsForFilters])

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === '' || producto.categoria === selectedCategory
      const matchesTalla = selectedTalla === '' || producto.variantes.some(v => v.talla === selectedTalla)
      const matchesColegio = selectedColegio === '' || producto.variantes.some(v => v.colegio === selectedColegio)
      return matchesSearch && matchesCategory && matchesTalla && matchesColegio
    })

    // Ordenar
    switch (selectedSort) {
      case 'price-asc':
        filtered.sort((a, b) => a.precio - b.precio)
        break
      case 'price-desc':
        filtered.sort((a, b) => b.precio - a.precio)
        break
      case 'name-asc':
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre))
        break
      case 'name-desc':
        filtered.sort((a, b) => b.nombre.localeCompare(a.nombre))
        break
      case 'stock-desc':
        filtered.sort((a, b) => b.stock_total - a.stock_total)
        break
      default: // newest
        break
    }

    return filtered
  }, [productos, searchTerm, selectedCategory, selectedSort, selectedTalla, selectedColegio])

  return (
    <div>
      <SearchBar 
        value={searchTerm}
        onChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        selectedCategory={selectedCategory}
        categories={categories}
        onSortChange={setSelectedSort}
        selectedSort={selectedSort}
        onViewChange={setCurrentView}
        currentView={currentView}
        productos={productos.map(p => ({ id: p.id, nombre: p.nombre, descripcion: p.descripcion }))}
        tallas={tallas}
        selectedTalla={selectedTalla}
        onTallaChange={setSelectedTalla}
        colegios={colegios}
        selectedColegio={selectedColegio}
        onColegioChange={setSelectedColegio}
      />

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-block p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-xl font-semibold">No se encontraron productos</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Intenta con otros términos de búsqueda</p>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Mostrando <span className="font-semibold text-gray-900 dark:text-white">{filteredAndSortedProducts.length}</span> {filteredAndSortedProducts.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>

          {currentView === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedProducts.map((producto) => (
                <ProductListItem key={producto.id} producto={producto} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
