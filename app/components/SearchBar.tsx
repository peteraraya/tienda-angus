'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchSuggestions } from '../hooks/useSearch'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'productos' | 'clientes' | 'insumos'
  onSearch?: (value: string) => void
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = '🔍 Buscar...',
  type = 'productos',
  onSearch,
  className = ''
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  const { data: suggestions = [], isLoading } = useSearchSuggestions(value, type)

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
    if (onSearch) {
      onSearch(suggestion)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value)
      setShowSuggestions(false)
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleClear = () => {
    onChange('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-base"
        />

        {value && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Limpiar búsqueda"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

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

      {/* Loading indicator */}
      {isLoading && value.length >= 2 && (
        <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}
