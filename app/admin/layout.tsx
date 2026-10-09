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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      
      <AdminTopBar />

      <div className="w-full max-w-[1800px] mx-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:gap-6">
          <AdminSidebar />
          <main className="w-full min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
