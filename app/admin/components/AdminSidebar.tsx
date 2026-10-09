'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const modules = [
  { href: '/admin', label: 'Inventario' },
  { href: '/admin/ventas', label: 'Punto de venta' },
  { href: '/admin/nuevo', label: 'Nuevo producto' },
  { href: '/admin/colegios', label: 'Colegios' },
  { href: '/admin/categorias', label: 'Categorías' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/proveedores', label: 'Proveedores' },
  { href: '/admin/insumos', label: 'Insumos' },
  { href: '/admin/pedidos', label: 'Pedidos' },
  { href: '/admin/whatsapp', label: 'WhatsApp' }
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

  useEffect(() => {
    if (!mobileMenuOpen) return
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenForPathname(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [mobileMenuOpen])

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
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-[#123f3d]/15 bg-[#fffdf9] px-3 py-2 text-left text-sm font-semibold text-[#173b39] shadow-sm dark:border-white/10 dark:bg-[#142b2a] dark:text-[#edf5f2] md:hidden"
      >
        <span>Módulos: {activeModule?.label ?? 'Administración'}</span>
        <span aria-hidden="true" className="ml-3 text-xs">{mobileMenuOpen ? 'Cerrar' : 'Ver'}</span>
      </button>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45 md:hidden" onClick={() => setOpenForPathname(null)}>
          <div
            id="admin-mobile-modules"
            role="dialog"
            aria-modal="true"
            className="max-h-[82dvh] w-full overflow-y-auto rounded-t-2xl border border-[#123f3d]/10 bg-[#fffdf9] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-white/10 dark:bg-[#142b2a]"
            onClick={event => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#173b39] dark:text-[#edf5f2]">Módulos</h2>
                <p className="text-xs text-[#5f7a73] dark:text-[#bfd4d0]">Administración</p>
              </div>
              <button type="button" onClick={() => setOpenForPathname(null)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#4f6967] hover:bg-[#edf3f1] dark:text-[#d6e3e0] dark:hover:bg-white/5">
                Cerrar
              </button>
            </div>
            <nav aria-label="Módulos administrativos" className="grid grid-cols-2 gap-2">
              {modules.map(module => {
                const active = isActive(module.href)
                return (
                  <Link
                    key={module.href}
                    href={module.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setOpenForPathname(null)}
                    className={`flex min-h-11 min-w-0 items-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? 'border-[#123f3d]/20 bg-[#dfeae7] text-[#123f3d] dark:border-[#8ac7ae]/30 dark:bg-[#1a312f] dark:text-[#edf5f2]'
                        : 'border-transparent text-[#4f6967] hover:bg-[#f0eadf] dark:text-[#d6e3e0] dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">{module.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
      <nav aria-label="Módulos administrativos" className="hidden w-full min-w-0 md:block">
      <div className="rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] p-2 shadow-sm dark:border-white/10 dark:bg-[#142b2a] md:p-3">
        <h2 className="mb-2 hidden px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f7a73] dark:text-[#bfd4d0] md:block">
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
                className={`flex min-h-10 w-full min-w-0 items-center rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'border-l-[#b98a2f] bg-[#edf3f1] text-[#123f3d] dark:bg-white/5 dark:text-[#edf5f2]'
                    : 'border-l-transparent text-[#4f6967] hover:bg-[#f0eadf] dark:text-[#d6e3e0] dark:hover:bg-white/5'
                }`}
              >
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
