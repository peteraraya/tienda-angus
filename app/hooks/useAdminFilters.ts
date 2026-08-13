'use client'

import { useState, useMemo, useRef } from 'react'
import type { Producto } from './useAdminProductos'

export function useAdminFilters(productos: Producto[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedColegio, setSelectedColegio] = useState('')
  const [selectedTalla, setSelectedTalla] = useState('')
  const [selectedStockFilter, setSelectedStockFilter] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  return {
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
  }
}
