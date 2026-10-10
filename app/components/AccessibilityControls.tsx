'use client'

import { useEffect, useRef, useState } from 'react'

type FontScale = '100' | '112.5' | '125'
type ContrastMode = 'standard' | 'high'
type Preferences = {
  fontScale: FontScale
  contrast: ContrastMode
  reduceMotion: boolean
}

const preferenceChangeEvent = 'angus-accessibility-preferences-change'

const fontScales: { value: FontScale; label: string }[] = [
  { value: '100', label: '100 %' },
  { value: '112.5', label: '112,5 %' },
  { value: '125', label: '125 %' },
]

export default function AccessibilityControls({
  className = '',
  mobilePanel = false,
}: {
  className?: string
  mobilePanel?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [fontScale, setFontScale] = useState<FontScale>('100')
  const [contrast, setContrast] = useState<ContrastMode>('standard')
  const [reduceMotion, setReduceMotion] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelTop, setPanelTop] = useState(0)
  const [panelMaxHeight, setPanelMaxHeight] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const storedFontScale = localStorage.getItem('accessibility-font-scale')
        const storedContrast = localStorage.getItem('accessibility-contrast')
        const storedReduceMotion = localStorage.getItem('accessibility-reduce-motion')

        const initialFontScale: FontScale =
          storedFontScale === '112.5' || storedFontScale === '125' ? storedFontScale : '100'
        const initialContrast: ContrastMode = storedContrast === 'high' ? 'high' : 'standard'
        const initialReduceMotion = storedReduceMotion === 'true'

        setFontScale(initialFontScale)
        setContrast(initialContrast)
        setReduceMotion(initialReduceMotion)
        applyPreferences(initialFontScale, initialContrast, initialReduceMotion)
      } catch {
        applyPreferences('100', 'standard', false)
      }
      setMounted(true)
    }, 0)

    const synchronizePreferences = (event: Event) => {
      const preferences = (event as CustomEvent<Preferences>).detail
      if (!preferences) return
      setFontScale(preferences.fontScale)
      setContrast(preferences.contrast)
      setReduceMotion(preferences.reduceMotion)
      applyPreferences(preferences.fontScale, preferences.contrast, preferences.reduceMotion)
    }
    window.addEventListener(preferenceChangeEvent, synchronizePreferences)

    return () => {
      window.clearTimeout(id)
      window.removeEventListener(preferenceChangeEvent, synchronizePreferences)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panelRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      window.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [open])

  useEffect(() => {
    if (!mounted) return

    applyPreferences(fontScale, contrast, reduceMotion)
    try {
      localStorage.setItem('accessibility-font-scale', fontScale)
      localStorage.setItem('accessibility-contrast', contrast)
      localStorage.setItem('accessibility-reduce-motion', String(reduceMotion))
    } catch {
      // Preferences still work for the current page when browser storage is unavailable.
    }
    window.dispatchEvent(new CustomEvent<Preferences>(preferenceChangeEvent, {
      detail: { fontScale, contrast, reduceMotion },
    }))
  }, [contrast, fontScale, mounted, reduceMotion])

  const resetPreferences = () => {
    setFontScale('100')
    setContrast('standard')
    setReduceMotion(false)
  }

  const togglePanel = () => {
    if (!open && mobilePanel) {
      const maxHeight = Math.min(window.innerHeight - 32, 400)
      const triggerBottom = (triggerRef.current?.getBoundingClientRect().bottom ?? 0) + 8
      setPanelTop(Math.min(triggerBottom, Math.max(16, window.innerHeight - maxHeight - 16)))
      setPanelMaxHeight(maxHeight)
    }
    setOpen(value => !value)
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="accessibility-preferences"
        aria-label="Abrir ajustes de accesibilidad"
        title="Ajustes de accesibilidad"
        onClick={togglePanel}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-gray-100 text-[#173b39] shadow-sm transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:bg-gray-800 dark:text-[#edf5f2] dark:hover:bg-gray-700 dark:focus-visible:ring-[#e7c77c]"
      >
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" d="M12 7v10M7 12h10M8.5 8.5l7 7m0-7-7 7" />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          id="accessibility-preferences"
          aria-label="Preferencias de accesibilidad"
          style={mobilePanel ? {
            top: panelTop,
            maxHeight: panelMaxHeight,
          } : undefined}
          className={`accessibility-preferences-panel absolute right-0 top-full z-[60] mt-3 rounded-2xl border border-[#123f3d]/20 bg-[#fffdf9] p-4 text-[#173b39] shadow-2xl dark:border-white/20 dark:bg-[#142b2a] dark:text-[#edf5f2] sm:p-5 ${mobilePanel ? 'accessibility-preferences-panel-mobile' : ''}`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">Accesibilidad</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#4f6967] dark:text-[#c5d9d6]">
                Ajusta la visualización a tu preferencia.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar ajustes de accesibilidad"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:hover:bg-white/10 dark:focus-visible:ring-[#e7c77c]"
            >
              <span aria-hidden="true" className="text-xl leading-none">×</span>
            </button>
          </div>

          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-semibold">Tamaño del texto</legend>
            <div className="grid grid-cols-3 gap-2">
              {fontScales.map(option => (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#123f3d]/20 px-2 text-sm font-semibold has-[:checked]:border-[#123f3d] has-[:checked]:bg-[#dfeae7] focus-within:ring-2 focus-within:ring-[#123f3d] dark:border-white/20 dark:has-[:checked]:border-[#e7c77c] dark:has-[:checked]:bg-white/10 dark:focus-within:ring-[#e7c77c]"
                >
                  <input
                    type="radio"
                    name="accessibility-font-scale"
                    value={option.value}
                    checked={fontScale === option.value}
                    onChange={() => setFontScale(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mb-4">
            <legend className="mb-2 text-sm font-semibold">Contraste</legend>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'standard', label: 'Estándar' },
                { value: 'high', label: 'Reforzado' },
              ] as const).map(option => (
                <label
                  key={option.value}
                  className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#123f3d]/20 px-2 text-sm font-semibold has-[:checked]:border-[#123f3d] has-[:checked]:bg-[#dfeae7] focus-within:ring-2 focus-within:ring-[#123f3d] dark:border-white/20 dark:has-[:checked]:border-[#e7c77c] dark:has-[:checked]:bg-white/10 dark:focus-within:ring-[#e7c77c]"
                >
                  <input
                    type="radio"
                    name="accessibility-contrast"
                    value={option.value}
                    checked={contrast === option.value}
                    onChange={() => setContrast(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg py-1 text-sm font-medium">
            <input
              type="checkbox"
              checked={reduceMotion}
              onChange={event => setReduceMotion(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-[#123f3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:accent-[#e7c77c] dark:focus-visible:ring-[#e7c77c]"
            />
            Reducir animaciones
          </label>
          <p className="mt-1 text-xs leading-relaxed text-[#4f6967] dark:text-[#c5d9d6]">
            También se respeta la preferencia de movimiento de tu dispositivo.
          </p>

          <button
            type="button"
            onClick={resetPreferences}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#123f3d]/30 px-3 text-sm font-semibold underline underline-offset-2 hover:bg-[#edf3f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:border-white/30 dark:hover:bg-white/10 dark:focus-visible:ring-[#e7c77c]"
          >
            Restablecer ajustes
          </button>
        </div>
      )}
    </div>
  )
}

function applyPreferences(fontScale: FontScale, contrast: ContrastMode, reduceMotion: boolean) {
  const root = document.documentElement
  root.dataset.fontScale = fontScale
  root.dataset.contrast = contrast
  root.dataset.reduceMotion = String(reduceMotion)
}
