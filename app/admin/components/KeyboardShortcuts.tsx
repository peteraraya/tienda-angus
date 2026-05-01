'use client'

import { useEffect, useState } from 'react'

interface KeyboardShortcutsProps {
  searchInputRef?: React.RefObject<HTMLInputElement | null>
}

export default function KeyboardShortcuts({ searchInputRef }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+F para buscar
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        searchInputRef?.current?.focus()
        searchInputRef?.current?.select()
      }

      // ? para mostrar ayuda (solo si no está en un input)
      if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setShowHelp(true)
      }

      // Escape para cerrar ayuda
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchInputRef, showHelp])

  return (
    <>
      {/* Botón de ayuda flotante */}
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-24 right-6 w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center font-bold text-xl z-40 print:hidden"
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
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
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
                </div>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4">
              {/* Búsqueda */}
              <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex-shrink-0">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-white shadow-sm">
                    Ctrl+F
                  </kbd>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Buscar productos</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Enfoca el campo de búsqueda</p>
                </div>
              </div>

              {/* Guardar */}
              <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex-shrink-0">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-white shadow-sm">
                    Enter
                  </kbd>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Guardar cambios</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Al editar nombre, precio o stock</p>
                </div>
              </div>

              {/* Cancelar */}
              <div className="flex items-center gap-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex-shrink-0">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-white shadow-sm">
                    Esc
                  </kbd>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Cancelar edición</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">Cierra modales y cancela cambios</p>
                </div>
              </div>

              {/* Ayuda */}
              <div className="flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex-shrink-0">
                  <kbd className="px-3 py-1.5 bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm font-bold text-slate-900 dark:text-white shadow-sm">
                    ?
                  </kbd>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">Mostrar esta ayuda</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">También disponible en el botón flotante</p>
                </div>
              </div>
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
