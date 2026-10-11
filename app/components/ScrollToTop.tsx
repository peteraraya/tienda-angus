'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const pathname = usePathname()
  const positionClasses = pathname?.startsWith('/admin')
    ? 'bottom-6 left-6'
    : 'bottom-20 left-4 sm:bottom-24 sm:left-6'

  // Ocultar/Mostrar según la posición del scroll
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className={`fixed z-40 rounded-full border border-gray-200 bg-white p-3 text-blue-600 shadow-lg transition-all hover:scale-110 hover:shadow-xl focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400 ${positionClasses}`}
      title="Volver arriba"
      aria-label="Volver arriba"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  )
}
