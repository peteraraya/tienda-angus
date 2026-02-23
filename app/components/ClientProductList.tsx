'use client'

import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'
import SearchBar from './SearchBar'

interface Variante {
  talla: string
  color: string
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
}

interface ClientProductListProps {
  productos: Producto[]
}

export default function ClientProductList({ productos }: ClientProductListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const categories = useMemo(() => {
    return [...new Set(productos.map(p => p.categoria))].sort()
  }, [productos])

  const filteredProducts = useMemo(() => {
    return productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = selectedCategory === '' || producto.categoria === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [productos, searchTerm, selectedCategory])

  return (
    <div>
      <SearchBar 
        value={searchTerm}
        onChange={setSearchTerm}
        onCategoryChange={setSelectedCategory}
        selectedCategory={selectedCategory}
        categories={categories}
      />

      {filteredProducts.length === 0 ? (
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
              Mostrando <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
