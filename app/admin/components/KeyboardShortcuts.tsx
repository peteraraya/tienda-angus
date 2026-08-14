'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface KeyboardShortcutsProps {
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

interface ShortcutRow {
  keys: string
  label: string
  description: string
}

export default function KeyboardShortcuts({ searchInputRef }: KeyboardShortcutsProps) {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: ShortcutRow[] = [
    { keys: 'Ctrl+F', label: 'Buscar productos', description: 'Enfoca el campo de búsqueda' },
    { keys: 'Ctrl+N', label: 'Nuevo producto', description: 'Ir a crear producto' },
    { keys: 'Ctrl+V', label: 'Ir a Ventas', description: 'Abrir el punto de venta' },
    { keys: 'Ctrl+C', label: 'Ir a Clientes', description: 'Abrir clientes' },
    { keys: 'Ctrl+I', label: 'Ir a Insumos', description: 'Abrir insumos' },
    { keys: 'Ctrl+P', label: 'Ir a Pedidos', description: 'Abrir pedidos' },
    { keys: 'Ctrl+H', label: 'Ir al inicio', description: 'Volver al dashboard' },
    { keys: 'Alt+1 / Alt+2', label: 'Cambiar vista', description: 'Vista compacta o expandida' },
    { keys: 'Enter', label: 'Guardar cambios', description: 'Al editar nombre, precio o stock' },
    { keys: 'Esc', label: 'Cancelar / cerrar', description: 'Cierra modales y cancela cambios' },
    { keys: '?', label: 'Mostrar esta ayuda', description: 'También disponible en el botón flotante' }
  ]

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // Ctrl+F siempre funciona, incluso escribiendo en un input
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        if (searchInputRef?.current) {
          searchInputRef.current.focus()
          searchInputRef.current.select()
        } else {
          const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
          searchInput?.focus()
        }
        return
      }

      // Ignorar el resto de atajos mientras se escribe
      if (isTyping) return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        setShowHelp(prev => !prev)
        return
      }

      if (e.key === 'Escape') {
        if (showHelp) setShowHelp(false)
        return
      }

      const ctrl = (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey
      const alt = e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey

      if (ctrl) {
        switch (e.key.toLowerCase()) {
          case 'n': e.preventDefault(); router.push('/admin/nuevo'); return
          case 'v': e.preventDefault(); router.push('/admin/ventas'); return
          case 'c': e.preventDefault(); router.push('/admin/clientes'); return
          case 'i': e.preventDefault(); router.push('/admin/insumos'); return
          case 'p': e.preventDefault(); router.push('/admin/pedidos'); return
          case 'h': e.preventDefault(); router.push('/admin'); return
        }
      }

      if (alt) {
        if (e.key === '1') {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('changeView', { detail: 'compact' }))
        } else if (e.key === '2') {
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('changeView', { detail: 'expanded' }))
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchInputRef, showHelp, router])

  return (
    <>
      {/* Botón de ayuda flotante */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-sm hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center font-bold text-xl z-40 print:hidden"
        title="Atajos de teclado (presiona ?)"
      >
        ?
      </button>

      {/* Modal de ayuda */}
      {showHelp && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Atajos de Teclado</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Trabaja más rápido</p>
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 ml-auto hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex-shrink-0">
                    <kbd className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm font-bold text-slate-700 dark:text-white shadow-sm">
                      {shortcut.keys}
                    </kbd>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{shortcut.label}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{shortcut.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
              <p className="text-xs text-center text-slate-600 dark:text-slate-400">
                💡 Tip: Los atajos funcionan en toda la página de administración
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
