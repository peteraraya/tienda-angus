'use client'

import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pedido, PedidoItem } from '@/types/database'

export interface PedidoConProveedor extends Pedido {
  proveedor?: {
    nombre: string
  }
  items?: PedidoItem[]
}

export function useAdminPedidos() {
  const queryClient = useQueryClient()

  const fetchPedidos = async (): Promise<PedidoConProveedor[]> => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, proveedor:proveedores(nombre)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  const { data: pedidos = [], isLoading: isLoadingPedidos } = useQuery({
    queryKey: ['adminPedidos'],
    queryFn: fetchPedidos,
  })

  const updatePedidoEstadoMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: 'pendiente' | 'recibido' | 'cancelado' }) => {
      const { error } = await supabase.from('pedidos').update({ estado }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminPedidos'] })
  })

  const deletePedidoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pedidos').delete().eq('id', id)
      if (error) throw error
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
