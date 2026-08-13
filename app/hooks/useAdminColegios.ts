'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Colegio } from '@/types/database'
import { 
  fetchColegiosAction, 
  createColegioAction, 
  updateColegioAction, 
  deleteColegioAction, 
  toggleActivoColegioAction 
} from '@/app/actions/colegios'

export function useAdminColegios() {
  const queryClient = useQueryClient()

  const { data: colegios = [], isLoading: isLoadingColegios } = useQuery({
    queryKey: ['adminColegios'],
    queryFn: fetchColegiosAction,
  })

  const createColegioMutation = useMutation({
    mutationFn: async (nuevoColegio: Partial<Colegio>) => {
      await createColegioAction(nuevoColegio)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminColegios'] })
  })

  const updateColegioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Colegio> }) => {
      await updateColegioAction(id, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminColegios'] })
  })

  const deleteColegioMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteColegioAction(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminColegios'] })
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await toggleActivoColegioAction(id, currentState)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminColegios'] })
  })

  return {
    colegios,
    isLoadingColegios,
    createColegioMutation,
    updateColegioMutation,
    deleteColegioMutation,
    toggleActivoMutation
  }
}
