'use server'

import { createClient } from '@/utils/supabase/server'
import type { Categoria } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function fetchCategoriasAction(): Promise<Categoria[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createCategoriaAction(nuevaCategoria: Partial<Categoria>) {
  const supabase = await createClient()
  const { error } = await supabase.from('categorias').insert([nuevaCategoria])
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
}

export async function updateCategoriaAction(id: string, data: Partial<Categoria>) {
  const supabase = await createClient()
  const { error } = await supabase.from('categorias').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
}

export async function deleteCategoriaAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
}

export async function toggleActivoCategoriaAction(id: string, currentState: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('categorias').update({ activo: !currentState }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/categorias')
  return !currentState
}
