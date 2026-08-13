'use server'

import { createClient } from '@/utils/supabase/server'
import type { Colegio } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function fetchColegiosAction(): Promise<Colegio[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('colegios')
    .select('*')
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createColegioAction(nuevoColegio: Partial<Colegio>) {
  const supabase = await createClient()
  const { error } = await supabase.from('colegios').insert([nuevoColegio])
  if (error) throw new Error(error.message)
  revalidatePath('/admin/colegios')
}

export async function updateColegioAction(id: string, data: Partial<Colegio>) {
  const supabase = await createClient()
  const { error } = await supabase.from('colegios').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/colegios')
}

export async function deleteColegioAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('colegios').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/colegios')
}

export async function toggleActivoColegioAction(id: string, currentState: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('colegios').update({ activo: !currentState }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/colegios')
  return !currentState
}
