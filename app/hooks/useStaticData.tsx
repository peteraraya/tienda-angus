'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchCategoriasActivasAction, fetchColegiosActivosAction } from '@/app/actions/catalogos'

const CACHE_DURATION = 5 * 60 * 1000

export function useColegios() {
  const query = useQuery({
    queryKey: ['catalogos', 'colegios'],
    queryFn: fetchColegiosActivosAction,
    staleTime: CACHE_DURATION
  })

  return {
    colegios: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch
  }
}

export function useCategorias() {
  const query = useQuery({
    queryKey: ['catalogos', 'categorias'],
    queryFn: fetchCategoriasActivasAction,
    staleTime: CACHE_DURATION
  })

  return {
    categorias: query.data ?? [],
    loading: query.isLoading,
    error: query.error,
    refresh: query.refetch
  }
}
