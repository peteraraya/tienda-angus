'use client'

import { useEffect, useRef, useState } from 'react'
import AccessibilityControls from './AccessibilityControls'

const links = [
  { href: '#productos', label: 'Catálogo' },
  { href: '#reparaciones', label: 'Reparaciones' },
  { href: '#contacto', label: 'Contacto' }
]

export default function MobileNavigation() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (event.target instanceof Element && event.target.closest('#accessibility-preferences')) return
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div className="relative md:hidden" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-primary-navigation"
        onClick={() => setOpen(value => !value)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-2 text-base font-bold text-[#173b39] hover:bg-[#123f3d]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:text-[#edf5f2] dark:hover:bg-white/5 dark:focus-visible:ring-[#e7c77c] sm:px-3"
      >
        <svg aria-hidden="true" className="h-5 w-5 sm:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span className="sr-only sm:not-sr-only">Menú</span>
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
              className="flex min-h-11 items-center rounded-lg px-3 text-base font-semibold text-[#355c58] hover:bg-[#edf3f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:text-[#d6e3e0] dark:hover:bg-white/5 dark:focus-visible:ring-[#e7c77c]"
            >
              {link.label}
            </a>
          ))}
          <div className="border-t border-[#123f3d]/10 px-2 pt-2 dark:border-white/10">
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#4f6967] dark:text-[#c5d9d6]">
              Visualización
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Accesibilidad</span>
              <AccessibilityControls mobilePanel />
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
