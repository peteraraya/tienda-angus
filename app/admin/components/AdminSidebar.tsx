'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AdminSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  
  const isActive = (path: string) => {
    if (path === '/admin' && pathname !== '/admin') return false;
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <div className="w-full md:w-56 flex-shrink-0 sticky top-24 z-10">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mb-4 px-2">Módulos</h2>
        <div className="flex flex-col gap-2">
          <button 
            onClick={() => router.push('/admin')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              pathname === '/admin' 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              pathname === '/admin' ? 'bg-blue-100 dark:bg-blue-900/60 scale-105' : 'bg-slate-100 dark:bg-slate-700 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${pathname === '/admin' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${pathname === '/admin' ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`}>Inventario</span>
          </button>

          <button 
            onClick={() => router.push('/admin/ventas')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/ventas') 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                : 'border-transparent hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/ventas') ? 'bg-emerald-200 dark:bg-emerald-900/60 scale-105' : 'bg-emerald-100 dark:bg-emerald-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/ventas') ? 'text-emerald-700 dark:text-emerald-300' : 'text-emerald-600 dark:text-emerald-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/ventas') ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>Punto de Venta</span>
          </button>

          <button 
            onClick={() => router.push('/admin/nuevo')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/nuevo') 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                : 'border-transparent hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/nuevo') ? 'bg-green-200 dark:bg-green-900/60 scale-105' : 'bg-green-100 dark:bg-green-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/nuevo') ? 'text-green-700 dark:text-green-300' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/nuevo') ? 'text-green-700 dark:text-green-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-green-700 dark:group-hover:text-green-400'}`}>Nuevo Producto</span>
          </button>

          <button 
            onClick={() => router.push('/admin/colegios')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/colegios') 
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                : 'border-transparent hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/colegios') ? 'bg-purple-200 dark:bg-purple-900/60 scale-105' : 'bg-purple-100 dark:bg-purple-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/colegios') ? 'text-purple-700 dark:text-purple-300' : 'text-purple-600 dark:text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/colegios') ? 'text-purple-700 dark:text-purple-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-purple-700 dark:group-hover:text-purple-400'}`}>Colegios</span>
          </button>

          <button 
            onClick={() => router.push('/admin/categorias')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/categorias') 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'border-transparent hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/categorias') ? 'bg-indigo-200 dark:bg-indigo-900/60 scale-105' : 'bg-indigo-100 dark:bg-indigo-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/categorias') ? 'text-indigo-700 dark:text-indigo-300' : 'text-indigo-600 dark:text-indigo-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/categorias') ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-indigo-700 dark:group-hover:text-indigo-400'}`}>Categorías</span>
          </button>

          <button 
            onClick={() => router.push('/admin/clientes')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/clientes') 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-transparent hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/clientes') ? 'bg-blue-200 dark:bg-blue-900/60 scale-105' : 'bg-blue-100 dark:bg-blue-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/clientes') ? 'text-blue-700 dark:text-blue-300' : 'text-blue-600 dark:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/clientes') ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400'}`}>Clientes</span>
          </button>

          <button 
            onClick={() => router.push('/admin/proveedores')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/proveedores') 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                : 'border-transparent hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/proveedores') ? 'bg-orange-200 dark:bg-orange-900/60 scale-105' : 'bg-orange-100 dark:bg-orange-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/proveedores') ? 'text-orange-700 dark:text-orange-300' : 'text-orange-600 dark:text-orange-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/proveedores') ? 'text-orange-700 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-orange-700 dark:group-hover:text-orange-400'}`}>Proveedores</span>
          </button>

          <button 
            onClick={() => router.push('/admin/insumos')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/insumos') 
                ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' 
                : 'border-transparent hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/insumos') ? 'bg-teal-200 dark:bg-teal-900/60 scale-105' : 'bg-teal-100 dark:bg-teal-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/insumos') ? 'text-teal-700 dark:text-teal-300' : 'text-teal-600 dark:text-teal-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/insumos') ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-teal-700 dark:group-hover:text-teal-400'}`}>Insumos</span>
          </button>

          <button 
            onClick={() => router.push('/admin/pedidos')}
            className={`flex items-center gap-3 p-3 rounded-lg border-l-4 transition-all text-left group ${
              isActive('/admin/pedidos') 
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' 
                : 'border-transparent hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform shadow-sm ${
              isActive('/admin/pedidos') ? 'bg-amber-200 dark:bg-amber-900/60 scale-105' : 'bg-amber-100 dark:bg-amber-900/40 group-hover:scale-105'
            }`}>
              <svg className={`w-5 h-5 ${isActive('/admin/pedidos') ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600 dark:text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className={`font-semibold transition-colors ${isActive('/admin/pedidos') ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-amber-700 dark:group-hover:text-amber-400'}`}>Pedidos</span>
          </button>
        </div>
      </div>
    </div>
  )
}
