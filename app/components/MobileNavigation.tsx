'use client'

import { useEffect, useRef, useState } from 'react'

const links = [
  { href: '#productos', label: 'Catálogo' },
  { href: '#reparaciones', label: 'Reparaciones' },
  { href: '#contacto', label: 'Contacto' }
]

export default function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-primary-navigation"
        onClick={() => setOpen(value => !value)}
        className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-[#173b39] hover:bg-[#123f3d]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:text-[#edf5f2] dark:hover:bg-white/5 dark:focus-visible:ring-[#e7c77c]"
      >
        Menú
      </button>
      {open && (
        <nav
          id="mobile-primary-navigation"
          aria-label="Navegación principal"
          className="absolute right-0 top-full z-50 mt-2 grid min-w-44 gap-1 rounded-xl border border-[#123f3d]/10 bg-[#fffdf9] p-2 shadow-xl dark:border-white/10 dark:bg-[#142b2a]"
        >
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[#355c58] hover:bg-[#edf3f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:text-[#d6e3e0] dark:hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  )
}
