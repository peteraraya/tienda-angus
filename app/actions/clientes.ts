'use server'

import { createClient } from '@/utils/supabase/server'
import type { Cliente } from '@/types/database'
import { revalidatePath } from 'next/cache'
import { createAdminRecordIdempotently } from './idempotency'

export async function fetchClientesAction(): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('cantidad_compras', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}

export async function searchClientesAction(term: string): Promise<Cliente[]> {
  const normalizedTerm = term.trim()
  if (normalizedTerm.length < 2) return []
  if (normalizedTerm.length > 80) throw new Error('La búsqueda no puede superar 80 caracteres')

  const supabase = await createClient()
  const pattern = `%${normalizedTerm}%`
  const queries = await Promise.all([
    supabase.from('clientes').select('*').ilike('nombre', pattern).limit(5),
    supabase.from('clientes').select('*').ilike('telefono', pattern).limit(5),
    supabase.from('clientes').select('*').ilike('contacto', pattern).limit(5)
  ])

  for (const { error } of queries) {
    if (error) throw new Error(error.message)
  }

  const uniqueClients = new Map<string, Cliente>()
  for (const { data } of queries) {
    for (const cliente of data ?? []) uniqueClients.set(cliente.id, cliente)
  }

  return Array.from(uniqueClients.values())
    .sort((a, b) => b.cantidad_compras - a.cantidad_compras)
    .slice(0, 5)
}

export async function fetchClienteAction(id: string): Promise<Cliente> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function createClienteAction(nuevoCliente: Partial<Cliente>, requestKey: string) {
  const id = await createAdminRecordIdempotently('clientes', nuevoCliente, requestKey)
  revalidatePath('/admin/clientes')
  return id
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
