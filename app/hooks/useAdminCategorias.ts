'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Categoria } from '@/types/database'
import { 
  fetchCategoriasAction, 
  createCategoriaAction, 
  updateCategoriaAction, 
  deleteCategoriaAction, 
  toggleActivoCategoriaAction 
} from '@/app/actions/categorias'

export function useAdminCategorias() {
  const queryClient = useQueryClient()

  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['adminCategorias'],
    queryFn: fetchCategoriasAction,
  })

  const createCategoriaMutation = useMutation({
    mutationFn: async (nuevaCategoria: Partial<Categoria>) => {
      await createCategoriaAction(nuevaCategoria)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategorias'] })
  })

  const updateCategoriaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Categoria> }) => {
      await updateCategoriaAction(id, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategorias'] })
  })

  const deleteCategoriaMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCategoriaAction(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategorias'] })
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await toggleActivoCategoriaAction(id, currentState)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategorias'] })
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
