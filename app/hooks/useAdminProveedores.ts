'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Proveedor } from '@/types/database'
import { 
  fetchProveedoresAction, 
  createProveedorAction, 
  updateProveedorAction, 
  deleteProveedorAction, 
  toggleActivoProveedorAction 
} from '@/app/actions/proveedores'

export function useAdminProveedores() {
  const queryClient = useQueryClient()

  const { data: proveedores = [], isLoading: isLoadingProveedores } = useQuery({
    queryKey: ['adminProveedores'],
    queryFn: fetchProveedoresAction,
  })

  const createProveedorMutation = useMutation({
    mutationFn: async (nuevoProveedor: Partial<Proveedor>) => {
      await createProveedorAction(nuevoProveedor)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  const updateProveedorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Proveedor> }) => {
      await updateProveedorAction(id, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  const deleteProveedorMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteProveedorAction(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      return await toggleActivoProveedorAction(id, currentState)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  return {
    proveedores,
    isLoadingProveedores,
    createProveedorMutation,
    updateProveedorMutation,
    deleteProveedorMutation,
    toggleActivoMutation
  }
}
