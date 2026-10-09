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
    try {
      const result = await logout()
      if ('error' in result) {
        toast.error(result.error ?? 'No se pudo cerrar la sesión')
        return
      }
      router.replace('/login')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo cerrar la sesión')
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#123f3d]/10 bg-[#fffdf9]/95 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#0d1a1a]/95">
      <div className="mx-auto w-full max-w-[1800px] px-3 py-2 sm:px-5 lg:px-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white sm:flex dark:bg-[#142b2a]">
              <Image 
                src="/logo_ig.png" 
                alt="Confecciones Angus" 
                width={48}
                height={48}
                className="w-full h-full object-contain p-1"
                priority
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-lg font-bold tracking-tight text-[#173b39] dark:text-[#edf5f2] sm:text-xl">
                Panel de Administración
              </h1>
              <p className="text-xs text-[#5f7a73] dark:text-[#bfd4d0]">Confecciones Angus</p>
            </div>
            <NotificationCenter />
          </div>
          <div className="flex w-full flex-wrap justify-center gap-1.5 sm:w-auto sm:justify-end">
            <Button
              variant="success"
              onClick={() => router.push('/admin/ventas')}
              className="min-h-10 shadow-sm transition-all flex items-center justify-center gap-2"
              title="Punto de Venta"
              aria-label="Punto de Venta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="hidden sm:inline">Punto de Venta</span>
            </Button>

            <Button
              variant="primary"
              onClick={() => router.push('/admin/nuevo')}
              className="min-h-10 shadow-sm transition-all flex items-center justify-center gap-2"
              title="Añadir Nuevo Producto"
              aria-label="Añadir Nuevo Producto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nuevo Producto</span>
            </Button>
            
            <Button
              onClick={() => window.open('/', '_blank')}
              className="min-h-10 bg-transparent hover:bg-[#edf3f1] dark:hover:bg-white/5 text-[#4f6967] dark:text-[#d6e3e0] border border-[#123f3d]/15 dark:border-white/10 px-3 py-2 rounded-lg font-semibold transition-all text-sm flex items-center gap-2"
              title="Abrir Tienda"
              aria-label="Abrir Tienda"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="hidden sm:inline">Ver Tienda</span>
            </Button>

            <Button
              onClick={() => window.print()}
              className="min-h-10 bg-transparent hover:bg-[#edf3f1] dark:hover:bg-white/5 text-[#4f6967] dark:text-[#d6e3e0] border border-[#123f3d]/15 dark:border-white/10 px-3 py-2 rounded-lg font-semibold transition-all text-sm flex items-center gap-2 print:hidden"
              title="Imprimir Vista Actual"
              aria-label="Imprimir Vista Actual"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="hidden lg:inline">Imprimir</span>
            </Button>
            <Button
              onClick={handleLogout}
              className="min-h-10 bg-transparent hover:bg-red-50 text-[#a23f37] dark:hover:bg-red-950/30 dark:text-red-300 border border-red-200/70 dark:border-red-900/50 px-3 py-2 rounded-lg font-semibold transition-all text-sm flex items-center gap-2"
              title="Cerrar Sesión"
              aria-label="Cerrar Sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </div>
    </header>

  )
}
