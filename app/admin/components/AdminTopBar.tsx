'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/ui/ToastContainer'
import { Button } from '@/app/components/ui'
import NotificationCenter from './NotificationCenter'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'

export default function AdminTopBar() {
  const router = useRouter()
  const toast = useToast()

  async function handleLogout() {
    await logout()
    router.push('/login')
  }

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm mb-2 sm:mb-0 overflow-hidden bg-white dark:bg-gray-800">
              <Image 
                src="/logo-confecciones.png" 
                alt="Confecciones Angus" 
                width={48}
                height={48}
                className="w-full h-full object-contain p-1"
                priority
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Panel de Administración
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Gestiona tu inventario</p>
            </div>
            <NotificationCenter />
          </div>
          <div className="flex gap-3 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
            <Button
              variant="success"
              onClick={() => router.push('/admin/ventas')}
              className="w-full sm:w-auto shadow-md hover:shadow-sm transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              title="Punto de Venta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Punto de Venta</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => router.push('/admin/nuevo')}
              className="w-full sm:w-auto shadow-md hover:shadow-sm transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              title="Añadir Nuevo Producto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nuevo Producto</span>
            </Button>
            
            <Button
              onClick={() => window.open('/', '_blank')}
              className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm"
              title="Abrir Tienda"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">Ver Tienda</span>
            </Button>

            <Button
              onClick={() => window.print()}
              className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm print:hidden"
              title="Imprimir Vista Actual"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden lg:inline">Imprimir</span>
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 px-4 py-2 rounded-xl font-bold transition-all text-sm flex items-center gap-2 shadow-sm"
              title="Cerrar Sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
