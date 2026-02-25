"use client";

import { useState, useRef, useEffect } from 'react';

interface ProductoSugerencia {
  id: string;
  nombre: string;
  descripcion: string;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
  categories: string[];
  onSortChange: (sort: string) => void;
  selectedSort: string;
  onViewChange: (view: 'grid' | 'list') => void;
  currentView: 'grid' | 'list';
  productos?: ProductoSugerencia[];
}

export default function SearchBar({ 
  value, 
  onChange, 
  onCategoryChange, 
  selectedCategory, 
  categories,
  onSortChange,
  selectedSort,
  onViewChange,
  currentView,
  productos = []
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestions = value.length > 1
    ? productos.filter(p =>
        p.nombre.toLowerCase().includes(value.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    if (!value) setShowSuggestions(false);
  }, [value]);
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex flex-col gap-4">
        {/* Búsqueda y Vista */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => value.length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              placeholder="Buscar productos por nombre o descripción..."
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 mt-2 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-72 overflow-auto">
                {suggestions.map((prod) => (
                  <li
                    key={prod.id}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white text-sm border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    onMouseDown={() => {
                      onChange(prod.nombre);
                      setShowSuggestions(false);
                      inputRef.current?.blur();
                    }}
                  >
                    <span className="font-semibold">{prod.nombre}</span>
                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">{prod.descripcion}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Botones de Vista */}
          <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
            <button
              onClick={() => onViewChange('grid')}
              className={`p-3 rounded-lg transition-all ${
                currentView === 'grid'
                  ? 'bg-white dark:bg-gray-600 shadow-md'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Vista en cuadrícula"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`p-3 rounded-lg transition-all ${
                currentView === 'list'
                  ? 'bg-white dark:bg-gray-600 shadow-md'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Vista en lista"
            >
              <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none bg-white dark:bg-gray-700 transition-all cursor-pointer text-gray-900 dark:text-white"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </div>
            <select
              value={selectedSort}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none bg-white dark:bg-gray-700 transition-all cursor-pointer text-gray-900 dark:text-white"
            >
              <option value="newest">Más recientes</option>
              <option value="price-asc">Precio: Menor a Mayor</option>
              <option value="price-desc">Precio: Mayor a Menor</option>
              <option value="name-asc">Nombre: A-Z</option>
              <option value="name-desc">Nombre: Z-A</option>
              <option value="stock-desc">Mayor stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Filtros activos visuales */}
      {(selectedCategory || selectedSort !== 'newest') && (
        <div className="flex flex-wrap gap-2 mt-4">
          {selectedCategory && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
              Categoría: {selectedCategory}
              <button
                onClick={() => onCategoryChange('')}
                className="ml-1 text-blue-900 dark:text-blue-100 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                title="Quitar filtro de categoría"
              >✕</button>
            </span>
          )}
          {selectedSort !== 'newest' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
              Orden: {(() => {
                switch(selectedSort) {
                  case 'price-asc': return 'Precio: Menor a Mayor';
                  case 'price-desc': return 'Precio: Mayor a Menor';
                  case 'name-asc': return 'Nombre: A-Z';
                  case 'name-desc': return 'Nombre: Z-A';
                  case 'stock-desc': return 'Mayor stock';
                  default: return '';
                }
              })()}
              <button
                onClick={() => onSortChange('newest')}
                className="ml-1 text-purple-900 dark:text-purple-100 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                title="Quitar filtro de orden"
              >✕</button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
