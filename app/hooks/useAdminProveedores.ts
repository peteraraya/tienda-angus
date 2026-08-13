'use client'

import { supabase } from '@/lib/supabase'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Proveedor } from '@/types/database'

export function useAdminProveedores() {
  const queryClient = useQueryClient()

  const fetchProveedores = async (): Promise<Proveedor[]> => {
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('activo', { ascending: false })
      .order('nombre', { ascending: true })

    if (error) throw error
    return data || []
  }

  const { data: proveedores = [], isLoading: isLoadingProveedores } = useQuery({
    queryKey: ['adminProveedores'],
    queryFn: fetchProveedores,
  })

  const createProveedorMutation = useMutation({
    mutationFn: async (nuevoProveedor: Partial<Proveedor>) => {
      const { error } = await supabase.from('proveedores').insert([nuevoProveedor])
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  const updateProveedorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Proveedor> }) => {
      const { error } = await supabase.from('proveedores').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  const deleteProveedorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('proveedores').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProveedores'] })
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string; currentState: boolean }) => {
      const { error } = await supabase.from('proveedores').update({ activo: !currentState }).eq('id', id)
      if (error) throw error
      return currentState
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
