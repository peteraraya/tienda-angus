'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Categoria } from '@/types/database'
import { clearAllCache } from '@/app/hooks/useStaticData'
import { 
  fetchCategoriasAction, 
  createCategoriaAction, 
  updateCategoriaAction, 
  deleteCategoriaAction, 
  toggleActivoCategoriaAction 
} from '@/app/actions/categorias'

export function useAdminCategorias() {
  const queryClient = useQueryClient()

  function invalidate() {
    clearAllCache()
    queryClient.invalidateQueries({ queryKey: ['adminCategorias'] })
  }

  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['adminCategorias'],
    queryFn: fetchCategoriasAction,
  })

  const createCategoriaMutation = useMutation({
    mutationFn: async (nuevaCategoria: Partial<Categoria>) => {
      await createCategoriaAction(nuevaCategoria)
    },
    onSuccess: invalidate
  })

  const updateCategoriaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Categoria> }) => {
      await updateCategoriaAction(id, data)
    },
    onSuccess: invalidate
  })

  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCategoriaAction(id)
    },
    onSuccess: invalidate
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await toggleActivoCategoriaAction(id, currentState)
    },
    onSuccess: invalidate
  })

  return {
    categorias,
    isLoadingCategorias,
    createCategoriaMutation,
    updateCategoriaMutation,
    deleteCategoriaMutation,
    toggleActivoMutation
  }
}
