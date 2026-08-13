import React from 'react'
import AdminSidebar from './components/AdminSidebar'
import AdminTopBar from './components/AdminTopBar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      
      {/* TopBar persistente para todo el admin */}
      <AdminTopBar />

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          {/* Menú Lateral de Módulos (Sidebar) persistente */}
          <AdminSidebar />

          {/* Contenido Principal de cada página */}
          <div className="flex-1 min-w-0 w-full">      
            {children}
          </div>
          
        </div>
      </div>
    </div>
  )
}
