'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const modules = [
  { href: '/admin', label: 'Inventario', icon: '▦' },
  { href: '/admin/ventas', label: 'Punto de Venta', icon: '$' },
  { href: '/admin/nuevo', label: 'Nuevo Producto', icon: '+' },
  { href: '/admin/colegios', label: 'Colegios', icon: '⌂' },
  { href: '/admin/categorias', label: 'Categorías', icon: '◇' },
  { href: '/admin/clientes', label: 'Clientes', icon: '♙' },
  { href: '/admin/proveedores', label: 'Proveedores', icon: '▤' },
  { href: '/admin/insumos', label: 'Insumos', icon: '▣' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '☷' },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: '◉' }
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [openForPathname, setOpenForPathname] = useState<string | null>(null)
  const activeModule = modules.find(module =>
    module.href === '/admin'
      ? pathname === module.href
      : pathname === module.href || pathname.startsWith(`${module.href}/`)
  )
  const mobileMenuOpen = openForPathname === pathname

  function isActive(path: string) {
    return path === '/admin'
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <div className="relative w-full min-w-0 md:sticky md:top-20 md:w-56 md:flex-shrink-0">
      <button
        type="button"
        aria-expanded={mobileMenuOpen}
        aria-controls="admin-mobile-modules"
        onClick={() => setOpenForPathname(mobileMenuOpen ? null : pathname)}
        className="flex min-h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-left text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 md:hidden"
      >
        <span>Módulos: {activeModule?.label ?? 'Administración'}</span>
        <span aria-hidden="true" className="ml-3 text-lg">{mobileMenuOpen ? '−' : '+'}</span>
      </button>
      {mobileMenuOpen && (
        <nav
          id="admin-mobile-modules"
          aria-label="Módulos administrativos"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-800 md:hidden"
        >
          <div className="grid grid-cols-2 gap-2">
            {modules.map(module => {
              const active = isActive(module.href)
              return (
                <Link
                  key={module.href}
                  href={module.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpenForPathname(null)}
                  className={`flex min-h-11 min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      : 'border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                  }`}
                >
                  <span aria-hidden="true" className="w-5 shrink-0 text-center text-base">{module.icon}</span>
                  <span className="truncate">{module.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
      <nav aria-label="Módulos administrativos" className="hidden w-full min-w-0 md:block">
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-4">
        <h2 className="mb-3 hidden px-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:block">
          Módulos
        </h2>
        <div className="flex flex-col gap-2">
          {modules.map(module => {
            const active = isActive(module.href)
            return (
              <Link
                key={module.href}
                href={module.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'border-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span aria-hidden="true" className="w-5 text-center text-base">{module.icon}</span>
                {module.label}
              </Link>
            )
          })}
        </div>
      </div>
      </nav>
    </div>
  )
}
