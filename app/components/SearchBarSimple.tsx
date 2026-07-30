'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

interface SearchBarSimpleProps {
  value: string
  onChange: (value: string) => void
  onCategoryChange: (value: string) => void
  selectedCategory: string
  categories: string[]
  onSortChange: (value: string) => void
  selectedSort: string
  onViewChange: (view: 'grid' | 'list') => void
  currentView: 'grid' | 'list'
  tallas: string[]
  selectedTalla: string
  onTallaChange: (value: string) => void
  colegios: string[]
  selectedColegio: string
  onColegioChange: (value: string) => void
  showOnlyFavorites: boolean
  onShowOnlyFavoritesChange: (value: boolean) => void
  showOnlyOffers: boolean
  onShowOnlyOffersChange: (value: boolean) => void
  productos?: Array<{ id: string; nombre: string; descripcion: string }>
}

export default function SearchBarSimple({
  value,
  onChange,
  onCategoryChange,
  selectedCategory,
  categories,
  onSortChange,
  selectedSort,
  onViewChange,
  currentView,
  tallas,
  selectedTalla,
  onTallaChange,
  colegios,
  selectedColegio,
  onColegioChange,
  showOnlyFavorites,
  onShowOnlyFavoritesChange,
  showOnlyOffers,
  onShowOnlyOffersChange,
  productos = []
}: SearchBarSimpleProps) {
  
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const hasActiveFilters = selectedCategory || selectedTalla || selectedColegio || showOnlyFavorites || showOnlyOffers

  // Generar sugerencias basadas en los productos
  const suggestions = useMemo(() => {
    if (!value || value.length < 2) return []
    
    const searchLower = value.toLowerCase()
    const matches = new Set<string>()
    
    productos.forEach(producto => {
      if (producto.nombre.toLowerCase().includes(searchLower)) {
        matches.add(producto.nombre)
      }
    })
    
    return Array.from(matches).slice(0, 5)
  }, [value, productos])

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setShowSuggestions(newValue.length >= 2)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    setShowSuggestions(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const clearFilters = () => {
    onCategoryChange('')
    onTallaChange('')
    onColegioChange('')
    onShowOnlyFavoritesChange(false)
    onShowOnlyOffersChange(false)
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Barra de búsqueda y controles principales */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Campo de búsqueda */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => value.length >= 2 && setShowSuggestions(true)}
            placeholder="Buscar productos..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 shadow-sm dark:shadow-none transition-all"
          />
          {value && (
            <button
              onClick={() => {
                onChange('')
                setShowSuggestions(false)
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Sugerencias */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Sugerencias
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Botones de control */}
        <div className="flex gap-2">
          {/* Botón Filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-sm ${
              showFilters || hasActiveFilters
                ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 dark:shadow-blue-600/30'
                : 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="hidden sm:inline">Filtros</span>
            {hasActiveFilters && (
              <span className="bg-white dark:bg-blue-500 text-blue-600 dark:text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {[selectedCategory, selectedTalla, selectedColegio, showOnlyFavorites, showOnlyOffers].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Vista */}
          <div className="flex gap-1 border border-gray-300 dark:border-gray-700 rounded-xl p-1 bg-white dark:bg-gray-900 shadow-sm">
            <button
              onClick={() => onViewChange('grid')}
              className={`p-2 rounded-lg transition-all ${currentView === 'grid' ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Vista en cuadrícula"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`p-2 rounded-lg transition-all ${currentView === 'list' ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              title="Vista en lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Panel de filtros colapsable */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 animate-fadeIn shadow-sm">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent shadow-sm dark:shadow-none transition-all"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Talla */}
            {tallas.length > 0 && (
              <select
                value={selectedTalla}
                onChange={(e) => onTallaChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent shadow-sm dark:shadow-none transition-all"
              >
                <option value="">Todas las tallas</option>
                {tallas.map(talla => (
                  <option key={talla} value={talla}>{talla}</option>
                ))}
              </select>
            )}


            {/* Ordenar */}
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent shadow-sm dark:shadow-none transition-all"
            >
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
              <option value="stock-desc">Mayor stock</option>
            </select>

            {/* Favoritos */}
            <button
              onClick={() => onShowOnlyFavoritesChange(!showOnlyFavorites)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm ${
                showOnlyFavorites 
                  ? 'bg-pink-600 hover:bg-pink-700 dark:bg-pink-600 dark:hover:bg-pink-700 text-white shadow-pink-500/30 dark:shadow-pink-600/30' 
                  : 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill={showOnlyFavorites ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="hidden sm:inline">Favoritos</span>
            </button>

            {/* Ofertas */}
            <button
              onClick={() => onShowOnlyOffersChange(!showOnlyOffers)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-sm ${
                showOnlyOffers 
                  ? 'bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white shadow-orange-500/30 dark:shadow-orange-600/30' 
                  : 'border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg leading-none mb-0.5">🔥</span>
              <span className="hidden sm:inline font-bold">Ofertas</span>
            </button>

            {/* Limpiar filtros */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 text-white flex items-center gap-2 transition-all ml-auto shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
