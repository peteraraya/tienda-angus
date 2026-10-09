'use client'

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

  function isActive(path: string) {
    return path === '/admin'
      ? pathname === path
      : pathname === path || pathname.startsWith(`${path}/`)
  }

  return (
    <nav aria-label="Módulos administrativos" className="w-full min-w-0 md:sticky md:top-20 md:w-56 md:flex-shrink-0">
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800 md:p-4">
        <h2 className="mb-3 hidden px-2 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 md:block">
          Módulos
        </h2>
        <div className="flex gap-2 overflow-x-auto md:flex-col">
          {modules.map(module => {
            const active = isActive(module.href)
            return (
              <Link
                key={module.href}
                href={module.href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 min-w-max items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors md:w-full ${
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
  )
}
