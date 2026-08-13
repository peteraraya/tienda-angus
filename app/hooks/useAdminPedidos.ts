'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchPedidosAction, 
  updatePedidoEstadoAction, 
  deletePedidoAction,
  type PedidoConProveedor 
} from '@/app/actions/pedidos'

export type { PedidoConProveedor }

export function useAdminPedidos() {
  const queryClient = useQueryClient()

  const { data: pedidos = [], isLoading: isLoadingPedidos } = useQuery({
    queryKey: ['adminPedidos'],
    queryFn: fetchPedidosAction,
  })

  const updatePedidoEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: 'pendiente' | 'recibido' | 'cancelado' }) => {
      await updatePedidoEstadoAction(id, estado)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPedidos'] })
  })

  const deletePedidoMutation = useMutation({
    mutationFn: async (id: string) => {
      await deletePedidoAction(id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPedidos'] })
  })

  return {
    pedidos,
    isLoadingPedidos,
    updatePedidoEstadoMutation,
    deletePedidoMutation
  }
}
