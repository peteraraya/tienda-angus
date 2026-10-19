'use client'

import { useState, useEffect, useRef } from 'react'
import ProductCard from './ProductCard'
import ProductListItem from './ProductListItem'
import GuidedProductFilters from './GuidedProductFilters'
import SearchBarSimple from './SearchBarSimple'
import CountDisplayClient from './CountDisplayClient'
import { trackStorefrontMetric } from '@/lib/storefrontMetrics'
import { getPublicCatalogPage, type PublicCatalogPage } from '@/app/actions/catalogo-publico'
// Hook para favoritos
function readFavorites() {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem('favoritos') || '[]')
    return Array.isArray(parsed) && parsed.every(value => typeof value === 'string') ? parsed : []
  } catch (error) {
    console.error('No se pudieron leer los favoritos guardados:', error)
    return []
  }
}

function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    return readFavorites()
  });
  useEffect(() => {
    const onStorage = () => {
      setFavorites(readFavorites())
    };
    const onCustom = (e: Event) => {
      const detail: unknown = (e as CustomEvent<unknown>).detail
      if (Array.isArray(detail) && detail.every(value => typeof value === 'string')) {
        setFavorites(detail)
        return
      }
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

import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

type Variante = Pick<DBVariante, 'id' | 'talla' | 'colegio' | 'stock' | 'precio'>

interface Producto extends Pick<DBProducto, 'id' | 'nombre' | 'descripcion' | 'precio' | 'categoria' | 'imagen_url' | 'imagenes' | 'descuento_porcentaje' | 'en_oferta'> {
  variantes: Variante[]
  stock_total: number
}

interface ColegioData {
  nombre: string
  insignia_url?: string
}

interface ClientProductListProps {
  initialCatalog: PublicCatalogPage
  initialSearch?: string
  colegiosData?: ColegioData[]
}


export default function ClientProductList({ initialCatalog, initialSearch = '', colegiosData = [] }: ClientProductListProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSort, setSelectedSort] = useState('newest')
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('grid')
  const [selectedTalla, setSelectedTalla] = useState('')
  const [selectedColegio, setSelectedColegio] = useState('')
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false)
  const [showOnlyOffers, setShowOnlyOffers] = useState(false)
  const favorites = useFavorites();
  const noResultsKeyRef = useRef('')
  const PAGE_SIZE = 12
  const [catalog, setCatalog] = useState(initialCatalog)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [retryCounter, setRetryCounter] = useState(0)
  const requestIdRef = useRef(0)
  const skipInitialRequestRef = useRef(true)
  const productos = catalog.products as Producto[]
  const categories = catalog.categories
  const tallas = catalog.sizes
  const colegios = catalog.schools

  useEffect(() => {
    if (skipInitialRequestRef.current) {
      skipInitialRequestRef.current = false
      return
    }
    const requestId = ++requestIdRef.current
    const timeout = window.setTimeout(async () => {
      setIsLoading(true)
      setCatalogError('')
      try {
        const result = await getPublicCatalogPage({
          search: searchTerm,
          category: selectedCategory,
          school: selectedColegio,
          size: selectedTalla,
          favoritesOnly: showOnlyFavorites,
          favoriteIds: favorites,
          offersOnly: showOnlyOffers,
          sort: selectedSort,
          page: 1,
          pageSize: PAGE_SIZE
        })
        if (requestId === requestIdRef.current) setCatalog(result)
      } catch (error) {
        if (requestId === requestIdRef.current) {
          console.error('No se pudo actualizar el catálogo:', error)
          setCatalogError('No se pudieron actualizar los productos. Inténtalo nuevamente.')
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false)
      }
    }, searchTerm.trim() ? 250 : 0)
    return () => window.clearTimeout(timeout)
  }, [searchTerm, selectedCategory, selectedSort, selectedTalla, selectedColegio, showOnlyFavorites, showOnlyOffers, favorites, retryCounter])

  useEffect(() => {
    const hasFilters = Boolean(
      searchTerm.trim() ||
      selectedCategory ||
      selectedTalla ||
      selectedColegio ||
      showOnlyFavorites ||
      showOnlyOffers
    )
    if (catalog.total > 0 || !hasFilters) {
      noResultsKeyRef.current = ''
      return
    }

    const key = JSON.stringify([
      searchTerm.trim(),
      selectedCategory,
      selectedTalla,
      selectedColegio,
      showOnlyFavorites,
      showOnlyOffers
    ])
    const timeout = window.setTimeout(() => {
      if (noResultsKeyRef.current !== key) {
        noResultsKeyRef.current = key
        trackStorefrontMetric('no_results')
      }
    }, 600)
    return () => window.clearTimeout(timeout)
  }, [catalog.total, searchTerm, selectedCategory, selectedTalla, selectedColegio, showOnlyFavorites, showOnlyOffers])

  const displayedProducts = productos

  const loadMore = async () => {
    if (isLoadingMore || productos.length >= catalog.total) return
    setIsLoadingMore(true)
    setCatalogError('')
    try {
      const requestId = requestIdRef.current
      const result = await getPublicCatalogPage({
        search: searchTerm,
        category: selectedCategory,
        school: selectedColegio,
        size: selectedTalla,
        favoritesOnly: showOnlyFavorites,
        favoriteIds: favorites,
        offersOnly: showOnlyOffers,
        sort: selectedSort,
        page: Math.floor(productos.length / PAGE_SIZE) + 1,
        pageSize: PAGE_SIZE
      })
      if (requestId === requestIdRef.current) {
        setCatalog(current => ({ ...result, products: [...current.products, ...result.products] }))
      }
    } catch (error) {
      console.error('No se pudo cargar la siguiente página del catálogo:', error)
      setCatalogError('No se pudieron cargar más productos. Inténtalo nuevamente.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  const activeFilterChips = [
    ...(searchTerm.trim() ? [{ label: `Búsqueda: ${searchTerm.trim()}`, clear: () => setSearchTerm('') }] : []),
    ...(selectedColegio ? [{ label: `Colegio: ${selectedColegio}`, clear: () => setSelectedColegio('') }] : []),
    ...(selectedCategory ? [{ label: `Prenda: ${selectedCategory}`, clear: () => setSelectedCategory('') }] : []),
    ...(selectedTalla ? [{ label: `Talla: ${selectedTalla}`, clear: () => setSelectedTalla('') }] : []),
    ...(showOnlyFavorites ? [{ label: 'Favoritos', clear: () => setShowOnlyFavorites(false) }] : []),
    ...(showOnlyOffers ? [{ label: 'En oferta', clear: () => setShowOnlyOffers(false) }] : [])
  ]

  // CountDisplayClient es un componente cliente que monta y muestra el conteo

  return (
    <div>
      <GuidedProductFilters
        categories={categories}
        tallas={tallas}
        colegios={colegios}
        colegiosData={colegiosData}
        selectedCategory={selectedCategory}
        selectedTalla={selectedTalla}
        selectedColegio={selectedColegio}
        resultCount={catalog.total}
        onCategoryChange={setSelectedCategory}
        onTallaChange={setSelectedTalla}
        onColegioChange={setSelectedColegio}
        onClear={() => {
          setSelectedColegio('')
          setSelectedCategory('')
          setSelectedTalla('')
        }}
      />

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden">
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
                    className="w-4 h-4 text-[#123f3d] bg-gray-100 border-gray-300 focus:ring-[#123f3d] dark:focus:ring-[#e7c77c] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
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
                      className="w-4 h-4 text-[#123f3d] bg-gray-100 border-gray-300 focus:ring-[#123f3d] dark:focus:ring-[#e7c77c] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
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
                    className="w-4 h-4 text-[#123f3d] bg-gray-100 border-gray-300 focus:ring-[#123f3d] dark:focus:ring-[#e7c77c] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
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
                      className="w-4 h-4 text-[#123f3d] bg-gray-100 border-gray-300 focus:ring-[#123f3d] dark:focus:ring-[#e7c77c] dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
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
                      className={`min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center rounded-xl text-sm font-bold transition-all border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-[#e7c77c] dark:focus-visible:ring-offset-gray-800 ${
                        selectedTalla === talla 
                          ? 'bg-[#123f3d] border-[#123f3d] text-white shadow-md dark:bg-[#e7c77c] dark:border-[#e7c77c] dark:text-[#123f3d]'
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
                  className={`w-full min-h-11 text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                    showOnlyFavorites 
                      ? 'bg-[#123f3d] text-white shadow-md dark:bg-[#e7c77c] dark:text-[#123f3d]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-[#edf3ee] dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill={showOnlyFavorites ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Favoritos
                </button>
                <button
                  onClick={() => setShowOnlyOffers(!showOnlyOffers)}
                  className={`w-full min-h-11 text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:focus-visible:ring-[#e7c77c] ${
                    showOnlyOffers 
                      ? 'bg-[#d3a954] text-[#123f3d] shadow-md dark:bg-[#e7c77c]'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-[#f6efdf] dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8.5h18M5 4.5h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2v-11a2 2 0 012-2zM7 15h4" />
                  </svg>
                  En Oferta
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 min-w-0">
          <div>
            <SearchBarSimple
              value={searchTerm}
              onChange={setSearchTerm}
              onSortChange={setSelectedSort}
              selectedSort={selectedSort}
              onViewChange={setCurrentView}
              currentView={currentView}
              productos={productos.map(p => ({
                id: p.id,
                nombre: p.nombre,
                descripcion: p.descripcion,
                categoria: p.categoria,
                variantes: p.variantes
              }))}
              showOnlyFavorites={showOnlyFavorites}
              onShowOnlyFavoritesChange={setShowOnlyFavorites}
              showOnlyOffers={showOnlyOffers}
              onShowOnlyOffersChange={setShowOnlyOffers}
            />
          </div>

          {activeFilterChips.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Filtros activos">
              {activeFilterChips.map(({ label, clear }) => (
                <button
                  key={label}
                  type="button"
                  onClick={clear}
                  aria-label={`Quitar filtro ${label}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#123f3d]/15 bg-[#edf3ee] px-3 py-1.5 text-xs font-semibold text-[#123f3d] transition-colors hover:bg-[#dfeae7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:border-white/15 dark:bg-[#1a3534] dark:text-[#e7c77c] dark:hover:bg-[#244341] dark:focus-visible:ring-[#e7c77c]"
                >
                  {label}
                  <span aria-hidden="true" className="text-sm">×</span>
                </button>
              ))}
              {activeFilterChips.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedColegio('')
                    setSelectedCategory('')
                    setSelectedTalla('')
                    setShowOnlyFavorites(false)
                    setShowOnlyOffers(false)
                  }}
                  className="min-h-10 px-2 text-xs font-semibold text-[#4f6967] underline underline-offset-2 hover:text-[#123f3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:text-[#bfd4d0] dark:hover:text-white dark:focus-visible:ring-[#e7c77c]"
                >
                  Limpiar todo
                </button>
              )}
            </div>
          )}
          {catalogError && (
            <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              <span>{catalogError}</span>
              <button type="button" onClick={() => setRetryCounter(value => value + 1)} className="underline underline-offset-2">
                Reintentar
              </button>
            </div>
          )}
          {isLoading && (
            <p role="status" aria-live="polite" className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Actualizando productos…
            </p>
          )}

          {catalog.total === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#edf3ee] dark:bg-gray-800 rounded-full mb-6">
            <svg className="w-12 h-12 text-[#4d6d5f] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">No encontramos resultados</h3>
          <p className="text-gray-500 dark:text-gray-400 text-base font-medium max-w-sm mb-8">
            No encontramos productos con esta combinación. Puedes quitar un filtro o consultarnos por WhatsApp para revisar otras opciones.
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
            className="min-h-11 px-6 py-3 bg-[#123f3d] hover:bg-[#0d2f2d] dark:bg-[#e7c77c] dark:hover:bg-[#f3d79a] text-white dark:text-[#123f3d] rounded-xl font-bold transition-all shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            Limpiar todos los filtros
          </button>
          <a
            href="https://wa.me/56983852967?text=Hola%2C%20no%20encuentro%20una%20prenda%20o%20talla%20en%20el%20cat%C3%A1logo.%20%C2%BFMe%20pueden%20ayudar%3F"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackStorefrontMetric('whatsapp_opened')}
            className="mt-3 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#128C7E] px-5 py-3 font-bold text-[#128C7E] transition-colors hover:bg-[#128C7E]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#128C7E]"
          >
            Consultar por WhatsApp
          </a>
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          <div className="flex justify-between items-center pt-1">
            <p aria-live="polite" aria-atomic="true" suppressHydrationWarning className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <CountDisplayClient displayed={displayedProducts.length} total={catalog.total} />
            </p>
          </div>
          {currentView === 'grid' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
                {displayedProducts.map((producto) => {
                  const relacionados = productos
                    .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
                    .slice(0, 4);
                  return <ProductCard key={producto.id} producto={producto} relatedProducts={relacionados} />;
                })}
              </div>
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
            </>
          )}
          {/* Botón 'Cargar más' como fallback */}
          {displayedProducts.length < catalog.total && (
            <div className="flex justify-center mt-10">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="min-h-11 px-6 py-3 rounded-xl bg-[#edf3ee] hover:bg-[#dfeae7] text-[#123f3d] dark:bg-[#1a3534] dark:hover:bg-[#244341] dark:text-[#e7c77c] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] flex items-center gap-2"
              >
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {isLoadingMore ? 'Cargando…' : 'Cargar más productos'}
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
