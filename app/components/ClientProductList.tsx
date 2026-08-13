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

import type { Colegio as DBColegio, Producto as DBProducto, Variante as DBVariante } from '@/types/database'

interface Variante extends Pick<DBVariante, 'talla' | 'colegio' | 'stock'> {}

interface Producto extends Pick<DBProducto, 'id' | 'nombre' | 'descripcion' | 'precio' | 'categoria' | 'imagen_url' | 'descuento_porcentaje' | 'en_oferta'> {
  variantes: Variante[]
  stock_total: number
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
  const [showOnlyOffers, setShowOnlyOffers] = useState(false)
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
    return [...new Set(allTallas)].filter(t => t !== 'Única').sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  }, [filteredProductsForFilters])

  const colegios = useMemo(() => {
    const allColegios = productos.flatMap(p => p.variantes?.map(v => v.colegio) || [])
    return [...new Set(allColegios)].filter(Boolean).filter(c => c !== 'General').sort()
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
    if (showOnlyOffers) {
      filtered = filtered.filter(producto => producto.en_oferta || (producto.descuento_porcentaje && producto.descuento_porcentaje > 0));
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
  }, [productos, searchTerm, selectedCategory, selectedSort, selectedTalla, selectedColegio, showOnlyFavorites, showOnlyOffers, favorites])

  // Reiniciar página cuando cambian filtros o el conjunto de resultados
  useEffect(() => {
    // Defer the update to avoid calling setState synchronously within the effect
    const t = window.setTimeout(() => setPage(1), 0)
    // scroll to top of product list? leave to consumer
    return () => clearTimeout(t)
  }, [searchTerm, selectedCategory, selectedSort, selectedTalla, selectedColegio, showOnlyFavorites, showOnlyOffers, favorites])

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
        <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar lg:hidden">
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-28 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Colegios</h3>
              <div className="space-y-1">
                <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="colegio"
                    checked={selectedColegio === ''}
                    onChange={() => setSelectedColegio('')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className={`text-sm ${selectedColegio === '' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>Todos los Colegios</span>
                </label>
                {colegios.map(colegio => (
                  <label key={colegio} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="colegio"
                      checked={selectedColegio === colegio}
                      onChange={() => setSelectedColegio(colegio)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className={`text-sm ${selectedColegio === colegio ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{colegio}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Categorías</h3>
              <div className="space-y-1">
                <label className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="radio"
                    name="categoria"
                    checked={selectedCategory === ''}
                    onChange={() => setSelectedCategory('')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className={`text-sm ${selectedCategory === '' ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>Todas las Categorías</span>
                </label>
                {categories.map(cat => (
                  <label key={cat} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="radio"
                      name="categoria"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className={`text-sm ${selectedCategory === cat ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {tallas.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Tallas</h3>
                <div className="flex flex-wrap gap-2">
                  {tallas.map(talla => (
                    <button
                      key={talla}
                      onClick={() => setSelectedTalla(selectedTalla === talla ? '' : talla)}
                      className={`min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center rounded-xl text-sm font-bold transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 ${
                        selectedTalla === talla 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-gray-400 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400'
                      }`}
                    >
                      {talla}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Especiales</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                    showOnlyFavorites 
                      ? 'bg-pink-600 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill={showOnlyFavorites ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Favoritos
                </button>
                <button
                  onClick={() => setShowOnlyOffers(!showOnlyOffers)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                    showOnlyOffers 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <span className="text-lg leading-none mb-0.5">🔥</span>
                  En Oferta
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 min-w-0">
          <div className="lg:hidden">
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
              showOnlyOffers={showOnlyOffers}
              onShowOnlyOffersChange={setShowOnlyOffers}
            />
          </div>
          
          <div className="hidden lg:block mb-6">
            {/* Version desktop simplificada de la barra superior (sólo búsqueda y vista) */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="relative w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar productos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium"
                >
                  <option value="newest">Más recientes</option>
                  <option value="price-asc">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="name-asc">Nombre: A-Z</option>
                  <option value="name-desc">Nombre: Z-A</option>
                </select>

                <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  <button
                    onClick={() => setCurrentView('grid')}
                    className={`p-2 rounded-lg transition-all ${currentView === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button
                    onClick={() => setCurrentView('list')}
                    className={`p-2 rounded-lg transition-all ${currentView === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 dark:bg-gray-800 rounded-full mb-6">
            <svg className="w-12 h-12 text-blue-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">No encontramos resultados</h3>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium max-w-sm mb-8">
            Lo sentimos, no hay productos que coincidan con tus filtros actuales.
          </p>
          <button
            onClick={() => {
              setSearchTerm('')
              setSelectedCategory('')
              setSelectedColegio('')
              setSelectedTalla('')
              setShowOnlyFavorites(false)
              setShowOnlyOffers(false)
            }}
            className="px-6 py-3 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold transition-all shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            Limpiar todos los filtros
          </button>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
                {displayedProducts.map((producto) => {
                  const relacionados = productos
                    .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
                    .slice(0, 4);
                  return <ProductCard key={producto.id} producto={producto} relatedProducts={relacionados} />;
                })}
              </div>
              {/* Sentinel para carga infinita */}
              <div ref={sentinelRef} />
            </>
          ) : (
            <>
              <div className="space-y-4">
                {displayedProducts.map((producto) => {
                  const relacionados = productos
                    .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
                    .slice(0, 4);
                  return <ProductListItem key={producto.id} producto={producto} relatedProducts={relacionados} />;
                })}
              </div>
              <div ref={sentinelRef} />
            </>
          )}
          {/* Botón 'Cargar más' como fallback */}
          {displayedProducts.length < filteredAndSortedProducts.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="px-6 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 font-bold transition-colors focus:outline-none flex items-center gap-2"
              >
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                Cargar más productos
              </button>
            </div>
          )}
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
