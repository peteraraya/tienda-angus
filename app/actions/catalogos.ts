'use server'

import { createClient } from '@/utils/supabase/server'

export async function fetchColegiosActivosAction(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('colegios')
    .select('nombre')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(colegio => colegio.nombre)
}

export async function fetchCategoriasActivasAction(): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categorias')
    .select('nombre')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map(categoria => categoria.nombre)
}
