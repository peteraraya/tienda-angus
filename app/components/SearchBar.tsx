"use client";

import React, { useState, useRef } from 'react';
import CategoryIcon from '@mui/icons-material/Category';
import StraightenIcon from '@mui/icons-material/Straighten';
import SchoolIcon from '@mui/icons-material/School';
import SortIcon from '@mui/icons-material/Sort';

interface ProductoSugerencia {
  id: string;
  nombre: string;
  descripcion: string;
}

interface SearchBarProps {
    showOnlyFavorites?: boolean;
    onShowOnlyFavoritesChange?: (show: boolean) => void;
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
  tallas?: string[];
  selectedTalla?: string;
  onTallaChange?: (talla: string) => void;
  colegios?: string[];
  selectedColegio?: string;
  onColegioChange?: (colegio: string) => void;
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
  productos = [],
  tallas = [],
  selectedTalla,
  onTallaChange,
  colegios = [],
  selectedColegio,
  onColegioChange,
  showOnlyFavorites = false,
  onShowOnlyFavoritesChange,
}: SearchBarProps) {
  // Add missing state and refs
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductoSugerencia[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update suggestions when value or productos change
  React.useEffect(() => {
    if (value.length > 1) {
      setSuggestions(
        productos.filter(
          (prod) =>
            prod.nombre.toLowerCase().includes(value.toLowerCase()) ||
            prod.descripcion.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  }, [value, productos]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Búsqueda y Vista */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="flex-1 relative flex items-stretch">
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
          
          {/* Botones de Vista y Mostrar Filtros */}
          <div className="flex gap-2 items-center ml-2">
            {/* Toggle favoritos */}
            {onShowOnlyFavoritesChange && (
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium shadow-sm focus:outline-none transition-colors
                  ${showOnlyFavorites ? 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 border-pink-300 dark:border-pink-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'}`}
                onClick={() => onShowOnlyFavoritesChange(!showOnlyFavorites)}
                title={showOnlyFavorites ? 'Mostrar todos los productos' : 'Mostrar solo favoritos'}
              >
                <svg className={`w-5 h-5 ${showOnlyFavorites ? 'text-pink-500' : 'text-gray-400 dark:text-gray-500'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {showOnlyFavorites ? 'Solo favoritos' : 'Todos'}
              </button>
            )}
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
            <button
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium border border-gray-200 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setShowFilters(v => !v)}
              aria-expanded={showFilters}
            >
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>
        </div>

        {/* Filtros (collapse en todos los tamaños) */}
        {showFilters && (
          <div className="w-full flex flex-col md:flex-row md:items-center gap-2 md:gap-2">
            {/* Categoría */}
            <div className="relative w-full md:w-auto flex-1 min-w-[160px] max-w-none whitespace-nowrap">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <CategoryIcon fontSize="small" className="text-gray-400 dark:text-gray-500" />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none bg-white dark:bg-gray-700 transition-all cursor-pointer text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            {/* Talla */}
            <div className="relative w-full md:w-auto flex-1 min-w-[130px] max-w-none whitespace-nowrap">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <StraightenIcon fontSize="small" className="text-gray-400 dark:text-gray-500" />
              </div>
              <select
                value={selectedTalla}
                onChange={(e) => onTallaChange && onTallaChange(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none bg-white dark:bg-gray-700 transition-all cursor-pointer text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todas las tallas</option>
                {tallas.map(talla => (
                  <option key={talla} value={talla}>{talla}</option>
                ))}
              </select>
            </div>
            {/* Colegio */}
            <div className="relative w-full md:w-auto flex-1 min-w-[150px] max-w-none whitespace-nowrap">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <SchoolIcon fontSize="small" className="text-gray-400 dark:text-gray-500" />
              </div>
              <select
                value={selectedColegio}
                onChange={(e) => onColegioChange && onColegioChange(e.target.value)}
                className="w-full pl-8 pr-2 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none bg-white dark:bg-gray-700 transition-all cursor-pointer text-gray-900 dark:text-white text-sm"
              >
                <option value="">Todos los colegios</option>
                {colegios.map(colegio => (
                  <option key={colegio} value={colegio}>{colegio}</option>
                ))}
              </select>
            </div>
            {/* Orden */}
            <div className="relative w-full md:w-auto flex-1 min-w-[140px] max-w-none whitespace-nowrap">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <SortIcon fontSize="small" className="text-gray-400 dark:text-gray-500" />
              </div>
              <select
                value={selectedSort}
                onChange={(e) => onSortChange(e.target.value)}
                className="w-full pl-12 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent appearance-none bg-white dark:bg-gray-700 transition-all cursor-pointer text-gray-900 dark:text-white text-sm"
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
        )}
      {/* Filtros activos visuales */}
      {(selectedCategory || selectedSort !== 'newest' || (selectedTalla !== undefined && selectedTalla !== '') || (selectedColegio !== undefined && selectedColegio !== '')) && (
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
          {(selectedTalla !== undefined && selectedTalla !== '') && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">
              Talla: {selectedTalla}
              <button
                onClick={() => onTallaChange && onTallaChange('')}
                className="ml-1 text-sky-900 dark:text-sky-100 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                title="Quitar filtro de talla"
              >✕</button>
            </span>
          )}
          {(selectedColegio !== undefined && selectedColegio !== '') && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
              Colegio: {selectedColegio}
              <button
                onClick={() => onColegioChange && onColegioChange('')}
                className="ml-1 text-orange-900 dark:text-orange-100 hover:text-red-500 dark:hover:text-red-400 focus:outline-none"
                title="Quitar filtro de colegio"
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
