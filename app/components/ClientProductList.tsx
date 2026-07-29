'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import ProductListItem from './ProductListItem'
import SearchBarSimple from './SearchBarSimple'
import CountDisplayClient from './CountDisplayClient'
// Hook para favoritos
function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
      if (typeof window === 'undefined') return [];
      return JSON.parse(window.localStorage.getItem('favoritos') || '[]');
  });
  useEffect(() => {
    const onStorage = () => {
        const favs = JSON.parse(window.localStorage.getItem('favoritos') || '[]');
      setFavorites(favs);
    };
    const onCustom = (e: Event) => {
      try {
        // intentar leer detail si viene en CustomEvent
        const detail = (e as CustomEvent).detail;
        if (Array.isArray(detail)) {
          setFavorites(detail)
          return
        }
      } catch (err) {}
      // fallback a leer desde localStorage
      onStorage();
    }
    window.addEventListener('storage', onStorage);
    window.addEventListener('favoritos-changed', onCustom as EventListener);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('favoritos-changed', onCustom as EventListener);
    }
  }, []);
  return favorites;
}

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

interface ColegioData {
  nombre: string
  insignia_url?: string
}

interface ClientProductListProps {
  productos: Producto[]
  colegiosData?: ColegioData[]
}


export default function ClientProductList({ productos, colegiosData = [] }: ClientProductListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid')
  const [selectedTalla, setSelectedTalla] = useState('')
  const [selectedColegio, setSelectedColegio] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const favorites = useFavorites();
  // Paginación / carga infinita
  const PAGE_SIZE = 12
  const [page, setPage] = useState(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

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
    const allColegios = productos.flatMap(p => p.variantes?.map(v => v.colegio) || [])
    return [...new Set(allColegios)].filter(Boolean).sort()
  }, [productos])

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = productos.filter(producto => {
      const matchesSearch = searchTerm === '' || 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === '' || producto.categoria === selectedCategory
      const matchesTalla = selectedTalla === '' || producto.variantes.some(v => v.talla === selectedTalla)
      const matchesColegio = selectedColegio === '' || producto.variantes.some(v => v.colegio === selectedColegio)
      return matchesSearch && matchesCategory && matchesTalla && matchesColegio
    })
    if (showOnlyFavorites) {
      filtered = filtered.filter(producto => favorites.includes(producto.id));
    }
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
  }, [productos, searchTerm, selectedCategory, selectedSort, selectedTalla, selectedColegio, showOnlyFavorites, favorites])

  // Reiniciar página cuando cambian filtros o el conjunto de resultados
  useEffect(() => {
    // Defer the update to avoid calling setState synchronously within the effect
    const t = window.setTimeout(() => setPage(1), 0)
    // scroll to top of product list? leave to consumer
    return () => clearTimeout(t)
  }, [searchTerm, selectedCategory, selectedSort, selectedTalla, selectedColegio, showOnlyFavorites, favorites])

  const displayedProducts = useMemo(() => {
    return filteredAndSortedProducts.slice(0, page * PAGE_SIZE)
  }, [filteredAndSortedProducts, page])

  // IntersectionObserver para carga infinita
  useEffect(() => {
    if (typeof window === 'undefined') return
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // cargar más si hay más productos
          if (displayedProducts.length < filteredAndSortedProducts.length) {
            setPage((p) => p + 1)
          }
        }
      })
    }, { root: null, rootMargin: '200px', threshold: 0.1 })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [displayedProducts.length, filteredAndSortedProducts.length])

  // CountDisplayClient es un componente cliente que monta y muestra el conteo

  return (
    <div>
      {/* Selector Rápido de Colegios */}
      {colegios.length > 0 && (
        <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
          <div className="flex gap-3 min-w-max px-1">
            <button
              onClick={() => setSelectedColegio('')}
              className={`px-5 py-3 rounded-2xl font-bold transition-all shadow-sm ${
                selectedColegio === ''
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              Todos los Colegios
            </button>
            {colegios.map(colegio => {
              const colegioInfo = colegiosData?.find(c => c.nombre === colegio)
              return (
                <button
                  key={colegio}
                  onClick={() => setSelectedColegio(colegio)}
                  className={`px-5 py-3 rounded-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                    selectedColegio === colegio
                      ? 'bg-blue-600 text-white shadow-md scale-105'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {colegioInfo?.insignia_url && (
                    <img src={colegioInfo.insignia_url} alt={colegio} className="w-6 h-6 object-contain" />
                  )}
                  {colegio}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <SearchBarSimple 
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
        showOnlyFavorites={showOnlyFavorites}
        onShowOnlyFavoritesChange={setShowOnlyFavorites}
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
            <p suppressHydrationWarning className="text-gray-600 dark:text-gray-400">
              <CountDisplayClient displayed={displayedProducts.length} total={filteredAndSortedProducts.length} />
            </p>
          </div>

          {currentView === 'grid' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayedProducts.map((producto) => (
                  <ProductCard key={producto.id} producto={producto} />
                ))}
              </div>
              {/* Sentinel para carga infinita */}
              <div ref={sentinelRef} />
            </>
          ) : (
            <>
              <div className="space-y-4">
                {displayedProducts.map((producto) => (
                  <ProductListItem key={producto.id} producto={producto} />
                ))}
              </div>
              <div ref={sentinelRef} />
            </>
          )}
          {/* Botón 'Cargar más' como fallback */}
          {displayedProducts.length < filteredAndSortedProducts.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
              >
                Cargar más
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
