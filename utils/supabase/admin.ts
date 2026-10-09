import { createClient } from '@/utils/supabase/server'

export async function isAdminRequest() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.name !== 'AuthSessionMissingError') {
    throw new Error(`No se pudo verificar la sesión: ${error.message}`)
  }
  return user?.app_metadata?.role === 'admin'
}
