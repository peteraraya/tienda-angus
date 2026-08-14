'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Insumo } from '@/types/database'
import { 
  fetchInsumosAction, 
  createInsumoAction, 
  updateInsumoAction, 
  deleteInsumoAction 
} from '@/app/actions/insumos'

export function useAdminInsumos() {
  const queryClient = useQueryClient()

  const { data: insumos = [], isLoading: isLoadingInsumos } = useQuery({
    queryKey: ['adminInsumos'],
    queryFn: fetchInsumosAction,
  })

  const createInsumoMutation = useMutation({
    mutationFn: async (nuevoInsumo: Partial<Insumo>) => {
      await createInsumoAction(nuevoInsumo)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminInsumos'] })
  })

  const updateInsumoMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Insumo> }) => {
      await updateInsumoAction(id, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminInsumos'] })
  })

  const deleteInsumoMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteInsumoAction(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminInsumos'] })
  })

  return {
    insumos,
    isLoadingInsumos,
    createInsumoMutation,
    updateInsumoMutation,
    deleteInsumoMutation
  }
}
