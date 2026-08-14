'use server'

import { createClient } from '@/utils/supabase/server'
import type { Insumo } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function fetchInsumosAction(): Promise<Insumo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createInsumoAction(nuevoInsumo: Partial<Insumo>) {
  const supabase = await createClient()
  const { error } = await supabase.from('insumos').insert([nuevoInsumo])
  if (error) throw new Error(error.message)
  revalidatePath('/admin/insumos')
}

export async function updateInsumoAction(id: string, data: Partial<Insumo>) {
  const supabase = await createClient()
  const { error } = await supabase.from('insumos').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/insumos')
}

export async function deleteInsumoAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('insumos').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/insumos')
}
