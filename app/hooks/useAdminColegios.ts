'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Colegio } from '@/types/database'
import { clearAllCache } from '@/app/hooks/useStaticData'
import { useIdempotencyKeys } from '@/app/hooks/useIdempotencyKeys'
import { 
  fetchColegiosAction, 
  createColegioAction, 
  updateColegioAction, 
  deleteColegioAction, 
  toggleActivoColegioAction 
} from '@/app/actions/colegios'

export function useAdminColegios() {
  const queryClient = useQueryClient()
  const { getKey, clearKey } = useIdempotencyKeys()

  async function invalidate() {
    clearAllCache()
    await queryClient.invalidateQueries({ queryKey: ['adminColegios'] })
  }

  const { data: colegios = [], isLoading: isLoadingColegios } = useQuery({
    queryKey: ['adminColegios'],
    queryFn: fetchColegiosAction,
  })

  const createColegioMutation = useMutation({
    mutationFn: async (nuevoColegio: Partial<Colegio>) => {
      await createColegioAction(nuevoColegio, getKey('colegio', nuevoColegio))
    },
    onSuccess: async (_, nuevoColegio) => {
      await invalidate()
      clearKey('colegio', nuevoColegio)
    }
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
