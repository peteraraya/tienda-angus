import { useEffect, useRef } from 'react'
import CloseIcon from '@mui/icons-material/Close'

interface SizeGuideModalProps {
  onClose: () => void
}

export default function SizeGuideModal({ onClose }: SizeGuideModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    const prevActive = document.activeElement as HTMLElement | null
    const initialFocus = window.setTimeout(() => modalRef.current?.focus(), 0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !modalRef.current) return
      const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        e.preventDefault()
        modalRef.current.focus()
      } else if (e.shiftKey && (document.activeElement === first || !modalRef.current.contains(document.activeElement))) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (document.activeElement === last || !modalRef.current.contains(document.activeElement))) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(initialFocus)
      window.removeEventListener('keydown', onKey)
      prevActive?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        tabIndex={-1}
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h2 id="size-guide-title" className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-[#123f3d] dark:text-[#e7c77c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            Guía de Tallas
          </h2>
          <button type="button"
            onClick={onClose}
            aria-label="Cerrar guía de tallas"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c]"
          >
            <CloseIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Utiliza esta guía como referencia para elegir la talla correcta. Las medidas están en centímetros (cm) y pueden variar ligeramente (+/- 1 a 2 cm) dependiendo de la confección de cada prenda.
          </p>
          <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
            Compara estas medidas con una prenda similar que te quede cómoda. Las edades son solo referenciales; si tienes dudas sobre el calce o las medidas disponibles, consúltanos antes de solicitar.
          </p>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">Poleras y Polerones</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Talla</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Ancho Pecho</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Largo Total</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Edad Ref.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">6</td>
                    <td className="px-4 py-2">38 cm</td>
                    <td className="px-4 py-2">48 cm</td>
                    <td className="px-4 py-2 text-gray-500">5-6 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">8</td>
                    <td className="px-4 py-2">40 cm</td>
                    <td className="px-4 py-2">52 cm</td>
                    <td className="px-4 py-2 text-gray-500">7-8 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">10</td>
                    <td className="px-4 py-2">42 cm</td>
                    <td className="px-4 py-2">56 cm</td>
                    <td className="px-4 py-2 text-gray-500">9-10 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">12</td>
                    <td className="px-4 py-2">44 cm</td>
                    <td className="px-4 py-2">60 cm</td>
                    <td className="px-4 py-2 text-gray-500">11-12 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">14</td>
                    <td className="px-4 py-2">46 cm</td>
                    <td className="px-4 py-2">64 cm</td>
                    <td className="px-4 py-2 text-gray-500">13-14 años</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">16 / S</td>
                    <td className="px-4 py-2">48 cm</td>
                    <td className="px-4 py-2">68 cm</td>
                    <td className="px-4 py-2 text-gray-500">15+ años</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">M</td>
                    <td className="px-4 py-2">52 cm</td>
                    <td className="px-4 py-2">72 cm</td>
                    <td className="px-4 py-2 text-gray-500">Adulto</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">L</td>
                    <td className="px-4 py-2">56 cm</td>
                    <td className="px-4 py-2">74 cm</td>
                    <td className="px-4 py-2 text-gray-500">Adulto</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">XL</td>
                    <td className="px-4 py-2">60 cm</td>
                    <td className="px-4 py-2">76 cm</td>
                    <td className="px-4 py-2 text-gray-500">Adulto</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">Pantalones de Buzo y Shorts</h3>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Talla</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Cintura Ext.</th>
                    <th scope="col" className="px-4 py-3 font-semibold">Largo Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">6</td>
                    <td className="px-4 py-2">32 cm</td>
                    <td className="px-4 py-2">68 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">8</td>
                    <td className="px-4 py-2">34 cm</td>
                    <td className="px-4 py-2">74 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">10</td>
                    <td className="px-4 py-2">36 cm</td>
                    <td className="px-4 py-2">80 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">12</td>
                    <td className="px-4 py-2">38 cm</td>
                    <td className="px-4 py-2">86 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">14</td>
                    <td className="px-4 py-2">40 cm</td>
                    <td className="px-4 py-2">92 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">16 / S</td>
                    <td className="px-4 py-2">42 cm</td>
                    <td className="px-4 py-2">96 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">M</td>
                    <td className="px-4 py-2">46 cm</td>
                    <td className="px-4 py-2">100 cm</td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-2 font-bold">L</td>
                    <td className="px-4 py-2">50 cm</td>
                    <td className="px-4 py-2">102 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-[#edf3ee] dark:bg-[#244341] p-4 rounded-xl flex items-start gap-3">
            <svg className="w-6 h-6 text-[#123f3d] dark:text-[#e7c77c] shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-[#123f3d] dark:text-[#edf5f2]">
              <span className="font-bold">Tip de medición:</span> Toma una prenda de tu hijo(a) que le quede bien, ponla plana sobre una mesa y mide el ancho del pecho (de axila a axila) o el largo total. Compara esos centímetros con la tabla.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button"
              onClick={onClose}
              className="min-h-11 w-full bg-[#123f3d] dark:bg-[#e7c77c] hover:bg-[#0d2f2d] dark:hover:bg-[#f3d79a] text-white dark:text-[#123f3d] font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954]"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
