'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cliente } from '@/types/database'
import { fetchClientesAction, updateClienteAction, deleteClienteAction } from '@/app/actions/clientes'

export function useAdminClientes() {
  const queryClient = useQueryClient()

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ['adminClientes'],
    queryFn: fetchClientesAction,
  })

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cliente> }) => {
      await updateClienteAction(id, data)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminClientes'] })
  })

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteClienteAction(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminClientes'] })
  })

  return {
    clientes,
    isLoadingClientes,
    updateClienteMutation,
    deleteClienteMutation
  }
}
