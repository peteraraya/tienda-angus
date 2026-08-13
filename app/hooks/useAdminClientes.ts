'use client'

import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Cliente } from '@/types/database'

export function useAdminClientes() {
  const queryClient = useQueryClient()

  const fetchClientes = async (): Promise<Cliente[]> => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('cantidad_compras', { ascending: false })

    if (error) throw error
    return data || []
  }

  const { data: clientes = [], isLoading: isLoadingClientes } = useQuery({
    queryKey: ['adminClientes'],
    queryFn: fetchClientes,
  })

  const updateClienteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Cliente> }) => {
      const { error } = await supabase.from('clientes').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminClientes'] })
  })

  const deleteClienteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
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
