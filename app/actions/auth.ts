'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function login(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  if (data.user.app_metadata?.role !== 'admin') {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) return { error: `No se pudo cerrar la sesión no autorizada: ${signOutError.message}` }
    return { error: 'Esta cuenta no tiene permisos de administración.' }
  }

  revalidatePath('/admin', 'layout')
  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/admin', 'layout')
  return { success: true }
}
