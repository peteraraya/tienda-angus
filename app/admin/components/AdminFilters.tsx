'use client'

import React, { RefObject } from 'react'

interface AdminFiltersProps {
  searchTerm: string
  setSearchTerm: (val: string) => void
  selectedCategory: string
  setSelectedCategory: (val: string) => void
  selectedColegio: string
  setSelectedColegio: (val: string) => void
  selectedTalla: string
  setSelectedTalla: (val: string) => void
  selectedStockFilter: string
  setSelectedStockFilter: (val: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  categories: string[]
  colegios: string[]
  tallas: string[]
  filteredProductsLength: number
  stockEspecifico: { totalStock: number; variantesEncontradas: number } | null
}

export default function AdminFilters({
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
  filteredProductsLength,
  stockEspecifico
}: AdminFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col gap-4">
        
        {/* Fila Principal: Buscador */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Busca por nombre, notas, descripción..."
            className="w-full pl-12 pr-12 py-4 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white text-lg font-medium transition-all shadow-inner"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                onClick={() => setSearchTerm('')}
                className="p-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg transition-colors focus:outline-none"
                title="Borrar búsqueda"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Fila Secundaria: Filtros Rápidos */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 text-sm">📁</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 text-sm">🏫</span>
            </div>
            <select
              value={selectedColegio}
              onChange={(e) => setSelectedColegio(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
            >
              <option value="">Todos los colegios</option>
              {colegios.map(colegio => (
                <option key={colegio} value={colegio}>{colegio}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 text-sm">📏</span>
            </div>
            <select
              value={selectedTalla}
              onChange={(e) => setSelectedTalla(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
            >
              <option value="">Todas las tallas</option>
              {tallas.map(talla => (
                <option key={talla} value={talla}>{talla}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400 text-sm">📦</span>
            </div>
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-0 focus:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold appearance-none cursor-pointer transition-colors"
            >
              <option value="">Todo el inventario</option>
              <option value="disponible">🟢 Stock disponible (+6)</option>
              <option value="bajo">🟡 Stock bajo (1-6)</option>
              <option value="agotado">🔴 Agotados (0)</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          {/* Botón limpiar filtros (solo aparece si hay filtros activos) */}
          {(searchTerm || selectedCategory || selectedColegio || selectedTalla || selectedStockFilter) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('')
                setSelectedColegio('')
                setSelectedTalla('')
                setSelectedStockFilter('')
              }}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-slate-500"
              title="Restablecer todos los filtros"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de Tags (Filtros Activos) y Contador */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-bold border border-blue-200 dark:border-blue-800 mr-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
          {filteredProductsLength} {filteredProductsLength === 1 ? 'resultado' : 'resultados'}
        </div>
        
        {selectedCategory && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
            📁 {selectedCategory}
            <button onClick={() => setSelectedCategory('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
          </span>
        )}
        {selectedColegio && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
            🏫 {selectedColegio}
            <button onClick={() => setSelectedColegio('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
          </span>
        )}
        {selectedTalla && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
            📏 Talla {selectedTalla}
            <button onClick={() => setSelectedTalla('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
          </span>
        )}
        {selectedStockFilter && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold shadow-sm">
            📦 {selectedStockFilter === 'disponible' ? '🟢 Disponible' : selectedStockFilter === 'bajo' ? '🟡 Stock Bajo' : '🔴 Agotado'}
            <button onClick={() => setSelectedStockFilter('')} className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center ml-1 transition-colors">✕</button>
          </span>
        )}
      </div>

      {/* Mensaje de stock específico según filtros */}
      {stockEspecifico && (
        <div className={`mt-4 p-4 rounded-xl border ${
          stockEspecifico.totalStock > 0 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
        }`}>
          <div className="flex items-start gap-3">
            {stockEspecifico.totalStock > 0 ? (
              <svg className="w-6 h-6 text-green-600 dark:text-green-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <div className="flex-1">
              <p className={`font-bold text-base ${
                stockEspecifico.totalStock > 0 
                  ? 'text-green-900 dark:text-green-100' 
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {stockEspecifico.totalStock > 0 ? (
                  <>
                    {stockEspecifico.totalStock === 1 
                      ? 'Hay 1 unidad disponible' 
                      : `Hay ${stockEspecifico.totalStock} unidades disponibles`}
                  </>
                ) : (
                  'No hay stock disponible'
                )}
              </p>
              <p className={`text-sm mt-1 ${
                stockEspecifico.totalStock > 0 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {selectedTalla && selectedColegio ? (
                  <>de talla <span className="font-semibold">{selectedTalla}</span> para <span className="font-semibold">{selectedColegio}</span></>
                ) : selectedTalla ? (
                  <>de talla <span className="font-semibold">{selectedTalla}</span></>
                ) : selectedColegio ? (
                  <>para <span className="font-semibold">{selectedColegio}</span></>
                ) : null}
                {stockEspecifico.variantesEncontradas > 0 && (
                  <> ({stockEspecifico.variantesEncontradas} {stockEspecifico.variantesEncontradas === 1 ? 'variante' : 'variantes'})</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
