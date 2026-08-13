'use server'

import { createClient } from '@/utils/supabase/server'
import type { Proveedor } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function fetchProveedoresAction(): Promise<Proveedor[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('activo', { ascending: false })
    .order('nombre', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}

export async function createProveedorAction(nuevoProveedor: Partial<Proveedor>) {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').insert([nuevoProveedor])
  if (error) throw new Error(error.message)
  revalidatePath('/admin/proveedores')
}

export async function updateProveedorAction(id: string, data: Partial<Proveedor>) {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').update(data).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/proveedores')
}

export async function deleteProveedorAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/proveedores')
}

export async function toggleActivoProveedorAction(id: string, currentState: boolean) {
  const supabase = await createClient()
  const { error } = await supabase.from('proveedores').update({ activo: !currentState }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/proveedores')
  return !currentState
}
