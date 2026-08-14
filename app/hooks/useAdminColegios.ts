'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Colegio } from '@/types/database'
import { clearAllCache } from '@/app/hooks/useStaticData'
import { 
  fetchColegiosAction, 
  createColegioAction, 
  updateColegioAction, 
  deleteColegioAction, 
  toggleActivoColegioAction 
} from '@/app/actions/colegios'

export function useAdminColegios() {
  const queryClient = useQueryClient()

  function invalidate() {
    clearAllCache()
    queryClient.invalidateQueries({ queryKey: ['adminColegios'] })
  }

  const { data: colegios = [], isLoading: isLoadingColegios } = useQuery({
    queryKey: ['adminColegios'],
    queryFn: fetchColegiosAction,
  })

  const createColegioMutation = useMutation({
    mutationFn: async (nuevoColegio: Partial<Colegio>) => {
      await createColegioAction(nuevoColegio)
    },
    onSuccess: invalidate
  })

  const updateColegioMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Colegio> }) => {
      await updateColegioAction(id, data)
    },
    onSuccess: invalidate
  })

  const deleteColegioMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteColegioAction(id)
    },
    onSuccess: invalidate
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await toggleActivoColegioAction(id, currentState)
    },
    onSuccess: invalidate
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
