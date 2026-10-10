'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Image from 'next/image'
import ProductCard from './ProductCard'
import ProductListItem from './ProductListItem'
import SearchBarSimple from './SearchBarSimple'
import CountDisplayClient from './CountDisplayClient'
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
      const matchesSchool = selectedColegio === '' ||
        producto.variantes.some(variante => variante.colegio === selectedColegio)
      return matchesSearch && matchesCategory && matchesSchool
    })
  }, [productos, searchTerm, selectedCategory, selectedColegio])

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
      const matchesVariant = (selectedTalla === '' && selectedColegio === '') ||
        producto.variantes.some(v =>
          (selectedTalla === '' || v.talla === selectedTalla) &&
          (selectedColegio === '' || v.colegio === selectedColegio)
        )
      return matchesSearch && matchesCategory && matchesVariant
    })
    if (showOnlyFavorites) {
      filtered = filtered.filter(producto => favorites.includes(producto.id));
    }
    if (showOnlyOffers) {
      filtered = filtered.filter(producto => producto.en_oferta || (producto.descuento_porcentaje && producto.descuento_porcentaje > 0));
    }
    // Ordenar
    const getEffectivePrice = (producto: Producto) => {
      const variantPrices = producto.variantes
        .map(variante => variante.precio)
        .filter((price): price is number => price !== null && price !== undefined && price > 0)
      const basePrice = variantPrices.length > 0
        ? Math.min(producto.precio, ...variantPrices)
        : producto.precio
      return producto.descuento_porcentaje
        ? basePrice * (1 - producto.descuento_porcentaje / 100)
        : basePrice
    }

    switch (selectedSort) {
      case 'price-asc':
        filtered.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b))
        break
      case 'price-desc':
        filtered.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a))
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
      <section
        aria-labelledby="guided-selection-title"
        className="mb-6 rounded-2xl border border-[#123f3d]/10 bg-[#fffdf9] p-4 shadow-[0_12px_28px_rgba(17,31,30,0.05)] sm:p-5 dark:border-white/10 dark:bg-[#142b2a]"
      >
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6f3d] dark:text-[#e7c77c]">Selección guiada</p>
            <h3 id="guided-selection-title" className="mt-1 text-lg font-bold tracking-tight text-[#123f3d] dark:text-[#edf5f2]">
              Encuentra el uniforme que necesitas
            </h3>
          </div>
          {(selectedColegio || selectedCategory || selectedTalla) && (
            <button
              type="button"
              onClick={() => {
                setSelectedColegio('')
                setSelectedCategory('')
                setSelectedTalla('')
              }}
              className="mt-2 min-h-11 self-start rounded-lg px-3 text-sm font-semibold text-[#355c58] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:text-[#d6e3e0] dark:focus-visible:ring-[#e7c77c] sm:mt-0 sm:self-auto"
            >
              Limpiar selección
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          {[
            { step: '01', label: 'Colegio', value: selectedColegio || 'Todos' },
            { step: '02', label: 'Tipo de prenda', value: selectedCategory || 'Todas' },
            { step: '03', label: 'Talla', value: selectedTalla || 'Cualquiera' }
          ].map(({ step, label, value }) => (
            <div key={step} className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123f3d] text-[0.65rem] font-bold text-[#f7f1e7] dark:bg-[#e7c77c] dark:text-[#123f3d]">
                  {step}
                </span>
                <span className="text-sm font-bold text-[#173b39] dark:text-[#edf5f2]">{label}</span>
                <span className="ml-auto truncate text-xs text-[#5f7a73] dark:text-[#bfd4d0]">{value}</span>
              </div>

              {step === '01' ? (
                <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por colegio">
                  <button
                    type="button"
                    aria-pressed={!selectedColegio}
                    onClick={() => setSelectedColegio('')}
                    className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                      !selectedColegio
                        ? 'border-[#123f3d] bg-[#123f3d] text-white dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                        : 'border-[#123f3d]/15 bg-white text-[#355c58] hover:border-[#123f3d]/40 dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:hover:border-[#e7c77c]/50'
                    }`}
                  >
                    Todos
                  </button>
                  {colegios.map(colegio => {
                    const insigniaUrl = colegiosData.find(item => item.nombre === colegio)?.insignia_url
                    return (
                      <button
                        key={colegio}
                        type="button"
                        aria-pressed={selectedColegio === colegio}
                        onClick={() => setSelectedColegio(colegio)}
                        className={`min-h-11 shrink-0 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                          selectedColegio === colegio
                            ? 'border-[#123f3d] bg-[#123f3d] text-white dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                            : 'border-[#123f3d]/15 bg-white text-[#355c58] hover:border-[#123f3d]/40 dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:hover:border-[#e7c77c]/50'
                        }`}
                      >
                        {insigniaUrl && (
                          <Image
                            src={insigniaUrl}
                            alt=""
                            width={20}
                            height={20}
                            unoptimized
                            className="h-5 w-5 object-contain"
                          />
                        )}
                        {colegio}
                      </button>
                    )
                  })}
                </div>
              ) : step === '02' ? (
                <div className="flex flex-wrap gap-2" aria-label="Filtrar por tipo de prenda">
                  <button
                    type="button"
                    aria-pressed={!selectedCategory}
                    onClick={() => setSelectedCategory('')}
                    className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                      !selectedCategory
                        ? 'border-[#123f3d] bg-[#123f3d] text-white dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                        : 'border-[#123f3d]/15 bg-white text-[#355c58] hover:border-[#123f3d]/40 dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:hover:border-[#e7c77c]/50'
                    }`}
                  >
                    Todas
                  </button>
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      aria-pressed={selectedCategory === category}
                      onClick={() => setSelectedCategory(category)}
                      className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                        selectedCategory === category
                          ? 'border-[#123f3d] bg-[#123f3d] text-white dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                          : 'border-[#123f3d]/15 bg-white text-[#355c58] hover:border-[#123f3d]/40 dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:hover:border-[#e7c77c]/50'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2" aria-label="Filtrar por talla">
                  <button
                    type="button"
                    aria-pressed={!selectedTalla}
                    onClick={() => setSelectedTalla('')}
                    className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                      !selectedTalla
                        ? 'border-[#123f3d] bg-[#123f3d] text-white dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                        : 'border-[#123f3d]/15 bg-white text-[#355c58] hover:border-[#123f3d]/40 dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:hover:border-[#e7c77c]/50'
                    }`}
                  >
                    Todas
                  </button>
                  {tallas.map(talla => (
                    <button
                      key={talla}
                      type="button"
                      aria-pressed={selectedTalla === talla}
                      onClick={() => setSelectedTalla(selectedTalla === talla ? '' : talla)}
                      className={`min-h-11 min-w-11 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] ${
                        selectedTalla === talla
                          ? 'border-[#123f3d] bg-[#123f3d] text-white dark:border-[#e7c77c] dark:bg-[#e7c77c] dark:text-[#123f3d]'
                          : 'border-[#123f3d]/15 bg-white text-[#355c58] hover:border-[#123f3d]/40 dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:hover:border-[#e7c77c]/50'
                      }`}
                    >
                      {talla}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <p aria-live="polite" className="mt-4 border-t border-[#123f3d]/10 pt-3 text-sm text-[#4f6967] dark:border-white/10 dark:text-[#bfd4d0]">
          {filteredAndSortedProducts.length > 0
            ? `${filteredAndSortedProducts.length} ${filteredAndSortedProducts.length === 1 ? 'producto coincide' : 'productos coinciden'}${selectedColegio ? ` para ${selectedColegio}` : ''}${selectedCategory ? ` · ${selectedCategory}` : ''}${selectedTalla ? ` · talla ${selectedTalla}` : ''}.`
            : 'No hay opciones con esta combinación. Prueba cambiar uno de los filtros.'}
        </p>
      </section>

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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[#123f3d] dark:focus:ring-[#e7c77c] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
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
                    className={`min-h-11 min-w-11 rounded-lg transition-all ${currentView === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-[#123f3d] dark:text-[#e7c77c]' : 'text-gray-500'}`}
                    aria-label="Vista en cuadrícula"
                    aria-pressed={currentView === 'grid'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button
                    onClick={() => setCurrentView('list')}
                    className={`min-h-11 min-w-11 rounded-lg transition-all ${currentView === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-[#123f3d] dark:text-[#e7c77c]' : 'text-gray-500'}`}
                    aria-label="Vista en lista"
                    aria-pressed={currentView === 'list'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

      {filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-[1.5rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-[#edf3ee] dark:bg-gray-800 rounded-full mb-6">
            <svg className="w-12 h-12 text-[#4d6d5f] dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="min-h-11 px-6 py-3 bg-[#123f3d] hover:bg-[#0d2f2d] dark:bg-[#e7c77c] dark:hover:bg-[#f3d79a] text-white dark:text-[#123f3d] rounded-xl font-bold transition-all shadow-md hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            Limpiar todos los filtros
          </button>
        </div>
      ) : (
        <div className="space-y-6 lg:space-y-8">
          <div className="flex justify-between items-center pt-1">
            <p suppressHydrationWarning className="text-sm font-medium text-gray-600 dark:text-gray-400">
              <CountDisplayClient displayed={displayedProducts.length} total={filteredAndSortedProducts.length} />
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
                className="min-h-11 px-6 py-3 rounded-xl bg-[#edf3ee] hover:bg-[#dfeae7] text-[#123f3d] dark:bg-[#1a3534] dark:hover:bg-[#244341] dark:text-[#e7c77c] font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] flex items-center gap-2"
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
