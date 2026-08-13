'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Shortcut {
  key: string
  description: string
  action: () => void
  modifier?: 'ctrl' | 'alt' | 'shift'
}

export default function GlobalKeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

  const shortcuts: Shortcut[] = [
    {
      key: '?',
      description: 'Mostrar/Ocultar ayuda de atajos',
      action: () => setShowHelp(!showHelp)
    },
    {
      key: 'n',
      modifier: 'ctrl',
      description: 'Nuevo producto',
      action: () => router.push('/admin/nuevo')
    },
    {
      key: 'v',
      modifier: 'ctrl',
      description: 'Ir a Ventas',
      action: () => router.push('/admin/ventas')
    },
    {
      key: 'c',
      modifier: 'ctrl',
      description: 'Ir a Clientes',
      action: () => router.push('/admin/clientes')
    },
    {
      key: 'i',
      modifier: 'ctrl',
      description: 'Ir a Insumos',
      action: () => router.push('/admin/insumos')
    },
    {
      key: 'p',
      modifier: 'ctrl',
      description: 'Ir a Pedidos',
      action: () => router.push('/admin/pedidos')
    },
    {
      key: 'h',
      modifier: 'ctrl',
      description: 'Ir a Home/Admin',
      action: () => router.push('/admin')
    },
    {
      key: '1',
      modifier: 'alt',
      description: 'Vista compacta',
      action: () => {
        const event = new CustomEvent('changeView', { detail: 'compact' })
        window.dispatchEvent(event)
      }
    },
    {
      key: '2',
      modifier: 'alt',
      description: 'Vista expandida',
      action: () => {
        const event = new CustomEvent('changeView', { detail: 'expanded' })
        window.dispatchEvent(event)
      }
    },
    {
      key: 'f',
      modifier: 'ctrl',
      description: 'Buscar',
      action: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        searchInput?.focus()
      }
    }
  ]

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignorar si está escribiendo en un input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Excepto para Ctrl+F
        if (!(e.ctrlKey && e.key === 'f')) {
          return
        }
      }

      shortcuts.forEach(shortcut => {
        const modifierMatch = 
          (!shortcut.modifier) ||
          (shortcut.modifier === 'ctrl' && e.ctrlKey) ||
          (shortcut.modifier === 'alt' && e.altKey) ||
          (shortcut.modifier === 'shift' && e.shiftKey)

        if (modifierMatch && e.key.toLowerCase() === shortcut.key.toLowerCase()) {
          e.preventDefault()
          shortcut.action()
        }
      })

      // ESC para cerrar ayuda
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showHelp])

  if (!showHelp) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            ⌨️ Atajos de Teclado
          </h2>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {shortcut.description}
                </span>
                <div className="flex items-center gap-1">
                  {shortcut.modifier && (
                    <>
                      <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                        {shortcut.modifier === 'ctrl' ? 'Ctrl' : shortcut.modifier === 'alt' ? 'Alt' : 'Shift'}
                      </kbd>
                      <span className="text-gray-500 dark:text-gray-400">+</span>
                    </>
                  )}
                  <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                    {shortcut.key.toUpperCase()}
                  </kbd>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 <strong>Tip:</strong> Presiona <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded text-xs font-semibold">?</kbd> en cualquier momento para ver esta ayuda.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
