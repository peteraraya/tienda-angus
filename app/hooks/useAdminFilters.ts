'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { AdminInventoryFilters } from '@/app/actions/productos'

export function useAdminFilters(onFiltersChange: () => void) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedColegio, setSelectedColegio] = useState('')
  const [selectedTalla, setSelectedTalla] = useState('')
  const [selectedStockFilter, setSelectedStockFilter] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [])

  function updateSearchTerm(value: string) {
    setSearchTerm(value)
    onFiltersChange()
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(value.trim())
    }, 300)
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value)
    onFiltersChange()
  }

  const filters = useMemo<AdminInventoryFilters>(() => ({
    searchTerm: debouncedSearchTerm,
    category: selectedCategory,
    school: selectedColegio,
    size: selectedTalla,
    stockFilter: selectedStockFilter,
    statusFilter: selectedStatusFilter
  }), [
    debouncedSearchTerm,
    selectedCategory,
    selectedColegio,
    selectedTalla,
    selectedStockFilter,
    selectedStatusFilter
  ])

  return {
    searchTerm,
    setSearchTerm: updateSearchTerm,
    selectedCategory,
    setSelectedCategory: (value: string) => updateFilter(setSelectedCategory, value),
    selectedColegio,
    setSelectedColegio: (value: string) => updateFilter(setSelectedColegio, value),
    selectedTalla,
    setSelectedTalla: (value: string) => updateFilter(setSelectedTalla, value),
    selectedStockFilter,
    setSelectedStockFilter: (value: string) => updateFilter(setSelectedStockFilter, value),
    selectedStatusFilter,
    setSelectedStatusFilter: (value: string) => updateFilter(setSelectedStatusFilter, value),
    searchInputRef,
    filters
  }
}
