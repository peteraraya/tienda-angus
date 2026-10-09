import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminSidebar from './components/AdminSidebar'
import AdminTopBar from './components/AdminTopBar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error && error.name !== 'AuthSessionMissingError') {
    throw new Error(`No se pudo verificar la sesión: ${error.message}`)
  }
  if (user?.app_metadata?.role !== 'admin') redirect('/login?error=admin-required')

  return (
    <div className="min-h-screen bg-[#f4efe7] text-[#173b39] dark:bg-[#0d1a1a] dark:text-[#edf5f2]">
      <AdminTopBar />

      <div className="mx-auto w-full max-w-[1800px] px-3 py-3 sm:px-5 sm:py-5 lg:px-7">
        <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:gap-5">
          <AdminSidebar />
          <main className="w-full min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
