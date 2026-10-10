'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { matchesSearchText } from '@/lib/normalizeSearchText'

interface ColegioData {
  nombre: string
  insignia_url?: string
}

interface GuidedProductFiltersProps {
  categories: string[]
  tallas: string[]
  colegios: string[]
  colegiosData: ColegioData[]
  selectedCategory: string
  selectedTalla: string
  selectedColegio: string
  resultCount: number
  onCategoryChange: (category: string) => void
  onTallaChange: (talla: string) => void
  onColegioChange: (colegio: string) => void
  onClear: () => void
}

const selectClassName =
  'min-h-11 w-full min-w-0 appearance-none rounded-xl border border-[#123f3d]/15 bg-white px-3 pr-9 text-sm font-semibold text-[#355c58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:border-white/15 dark:bg-[#1a3534] dark:text-[#d6e3e0] dark:focus-visible:ring-[#e7c77c]'

export default function GuidedProductFilters({
  categories,
  tallas,
  colegios,
  colegiosData,
  selectedCategory,
  selectedTalla,
  selectedColegio,
  resultCount,
  onCategoryChange,
  onTallaChange,
  onColegioChange,
  onClear,
}: GuidedProductFiltersProps) {
  const [schoolPickerOpen, setSchoolPickerOpen] = useState(false)
  const [schoolSearch, setSchoolSearch] = useState('')
  const schoolPickerRef = useRef<HTMLDivElement>(null)
  const schoolTriggerRef = useRef<HTMLButtonElement>(null)
  const schoolSearchRef = useRef<HTMLInputElement>(null)

  const filteredSchools = useMemo(
    () => colegios.filter(colegio => matchesSearchText(colegio, schoolSearch)),
    [colegios, schoolSearch]
  )

  useEffect(() => {
    if (!schoolPickerOpen) return

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !schoolPickerRef.current?.contains(event.target)) {
        setSchoolPickerOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOnOutsideClick)
    schoolSearchRef.current?.focus()

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [schoolPickerOpen])

  const chooseSchool = (colegio: string) => {
    onColegioChange(colegio)
    setSchoolSearch('')
    setSchoolPickerOpen(false)
    schoolTriggerRef.current?.focus()
  }

  const resetFilters = () => {
    onClear()
    setSchoolSearch('')
    setSchoolPickerOpen(false)
  }

  const schoolInsignia = colegiosData.find(item => item.nombre === selectedColegio)?.insignia_url

  return (
    <section
      aria-labelledby="guided-selection-title"
      className="mb-6 rounded-2xl border border-[#123f3d]/10 bg-[#fffdf9] p-4 shadow-[0_12px_28px_rgba(17,31,30,0.05)] sm:p-5 dark:border-white/10 dark:bg-[#142b2a]"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6f3d] dark:text-[#e7c77c]">
            Selección guiada
          </p>
          <h3 id="guided-selection-title" className="mt-1 text-lg font-bold tracking-tight text-[#123f3d] dark:text-[#edf5f2]">
            Encuentra el uniforme que necesitas
          </h3>
        </div>
        {(selectedColegio || selectedCategory || selectedTalla) && (
          <button
            type="button"
            onClick={resetFilters}
            className="mt-2 min-h-11 self-start rounded-lg px-3 text-sm font-semibold text-[#355c58] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:text-[#d6e3e0] dark:focus-visible:ring-[#e7c77c] sm:mt-0 sm:self-auto"
          >
            Limpiar selección
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <label htmlFor="guided-school-filter" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#173b39] dark:text-[#edf5f2]">
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123f3d] text-[0.65rem] text-[#f7f1e7] dark:bg-[#e7c77c] dark:text-[#123f3d]">01</span>
            Colegio
          </label>
          <div className="relative" ref={schoolPickerRef}>
            <button
              id="guided-school-filter"
              ref={schoolTriggerRef}
              type="button"
              aria-label={`Colegio: ${selectedColegio || 'Todos los colegios'}`}
              aria-haspopup="dialog"
              aria-expanded={schoolPickerOpen}
              aria-controls="guided-school-options"
              onClick={() => setSchoolPickerOpen(value => !value)}
              className={`${selectClassName} inline-flex items-center justify-between gap-2 text-left`}
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                {schoolInsignia && (
                  <Image src={schoolInsignia} alt="" width={20} height={20} unoptimized className="h-5 w-5 shrink-0 object-contain" />
                )}
                <span className="truncate">{selectedColegio || 'Todos los colegios'}</span>
              </span>
              <svg aria-hidden="true" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {schoolPickerOpen && (
              <div
                id="guided-school-options"
                role="dialog"
                aria-label="Seleccionar colegio"
                onKeyDown={event => {
                  if (event.key !== 'Escape') return
                  event.preventDefault()
                  setSchoolPickerOpen(false)
                  schoolTriggerRef.current?.focus()
                }}
                className="absolute left-0 right-0 top-full z-30 mt-2 rounded-xl border border-[#123f3d]/15 bg-[#fffdf9] p-3 shadow-xl dark:border-white/15 dark:bg-[#142b2a]"
              >
                <label htmlFor="guided-school-search" className="sr-only">Buscar colegio</label>
                <input
                  ref={schoolSearchRef}
                  id="guided-school-search"
                  type="search"
                  value={schoolSearch}
                  onChange={event => setSchoolSearch(event.target.value)}
                  placeholder="Buscar colegio..."
                  autoComplete="off"
                  className="min-h-11 w-full rounded-lg border border-[#123f3d]/20 bg-white px-3 text-base text-[#173b39] placeholder:text-[#5f7a73] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:border-white/20 dark:bg-[#0d1a1a] dark:text-[#edf5f2] dark:placeholder:text-[#bfd4d0] dark:focus-visible:ring-[#e7c77c]"
                />
                <div className="mt-2 max-h-56 overflow-y-auto overscroll-contain" role="group" aria-label="Opciones de colegio">
                  <button
                    type="button"
                    aria-pressed={!selectedColegio}
                    onClick={() => chooseSchool('')}
                    className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm font-semibold text-[#355c58] hover:bg-[#edf3f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#123f3d] dark:text-[#d6e3e0] dark:hover:bg-white/5 dark:focus-visible:ring-[#e7c77c]"
                  >
                    Todos los colegios
                  </button>
                  {filteredSchools.map(colegio => {
                    const insigniaUrl = colegiosData.find(item => item.nombre === colegio)?.insignia_url
                    return (
                      <button
                        key={colegio}
                        type="button"
                        aria-pressed={selectedColegio === colegio}
                        onClick={() => chooseSchool(colegio)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-sm font-semibold text-[#355c58] hover:bg-[#edf3f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#123f3d] dark:text-[#d6e3e0] dark:hover:bg-white/5 dark:focus-visible:ring-[#e7c77c]"
                      >
                        {insigniaUrl && (
                          <Image src={insigniaUrl} alt="" width={20} height={20} unoptimized className="h-5 w-5 shrink-0 object-contain" />
                        )}
                        <span className="truncate">{colegio}</span>
                      </button>
                    )
                  })}
                  {filteredSchools.length === 0 && (
                    <p className="px-3 py-4 text-sm text-[#4f6967] dark:text-[#c5d9d6]">
                      No encontramos colegios con ese nombre.
                    </p>
                  )}
                </div>
                <p aria-live="polite" className="mt-2 border-t border-[#123f3d]/10 pt-2 text-xs text-[#4f6967] dark:border-white/10 dark:text-[#c5d9d6]">
                  {filteredSchools.length} {filteredSchools.length === 1 ? 'colegio encontrado' : 'colegios encontrados'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <label htmlFor="guided-category-filter" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#173b39] dark:text-[#edf5f2]">
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123f3d] text-[0.65rem] text-[#f7f1e7] dark:bg-[#e7c77c] dark:text-[#123f3d]">02</span>
            Tipo de prenda
          </label>
          <div className="relative">
            <select
              id="guided-category-filter"
              value={selectedCategory}
              onChange={event => onCategoryChange(event.target.value)}
              className={selectClassName}
            >
              <option value="">Todas las prendas</option>
              {categories.map(category => <option key={category} value={category}>{category}</option>)}
            </select>
            <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#355c58] dark:text-[#d6e3e0]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
          <label htmlFor="guided-size-filter" className="mb-2 flex items-center gap-2 text-sm font-bold text-[#173b39] dark:text-[#edf5f2]">
            <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full bg-[#123f3d] text-[0.65rem] text-[#f7f1e7] dark:bg-[#e7c77c] dark:text-[#123f3d]">03</span>
            Talla
          </label>
          <div className="relative">
            <select
              id="guided-size-filter"
              value={selectedTalla}
              onChange={event => onTallaChange(event.target.value)}
              className={selectClassName}
            >
              <option value="">Cualquier talla</option>
              {tallas.map(talla => <option key={talla} value={talla}>{talla}</option>)}
            </select>
            <svg aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#355c58] dark:text-[#d6e3e0]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.22 7.22a.75.75 0 011.06 0L10 10.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 8.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      <p aria-live="polite" aria-atomic="true" className="mt-4 border-t border-[#123f3d]/10 pt-3 text-sm text-[#4f6967] dark:border-white/10 dark:text-[#bfd4d0]">
        {resultCount > 0
          ? `${resultCount} ${resultCount === 1 ? 'producto coincide' : 'productos coinciden'}.`
          : 'No hay opciones con esta combinación. Prueba cambiar uno de los filtros.'}
      </p>
    </section>
  )
}
