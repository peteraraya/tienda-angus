'use server'

import { createClient } from '@/utils/supabase/server'
import type { Cliente } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function fetchClientesAction(): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('cantidad_compras', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function updateClienteAction(id: string, data: Partial<Cliente>) {
  const supabase = await createClient()
  const { error } = await supabase.from('clientes').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/clientes')
}

export async function deleteClienteAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('clientes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/clientes')
}
