'use client'

import { useState } from 'react'
import Button from './Button'
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  className = ''
}: PaginationProps) {
  const pages: (number | string)[] = []
  
  // Lógica para mostrar páginas con elipsis
  if (totalPages <= 7) {
    // Mostrar todas las páginas si son pocas
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Mostrar con elipsis
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages)
    }
  }

  const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0)

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Información de items */}
      {itemsPerPage && totalItems !== undefined && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> a{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> de{' '}
          <span className="font-semibold text-gray-900 dark:text-white">{totalItems}</span> resultados
        </div>
      )}

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Botón anterior */}
        <Button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="secondary"
          className="px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {pages.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              )
            }

            const pageNum = page as number
            const isActive = pageNum === currentPage

            return (
              <Button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                variant={isActive ? 'info' : 'ghost'}
                className={`px-3 py-2 text-sm font-medium min-w-[40px] ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        {/* Botón siguiente */}
        <Button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="secondary"
          className="px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Selector de items por página (opcional) */}
      {itemsPerPage && (
        <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
          {itemsPerPage} por página
        </div>
      )}
    </div>
  )
}

// Hook para manejar paginación
export function usePagination(totalItems: number, itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const nextPage = () => goToPage(currentPage + 1)
  const prevPage = () => goToPage(currentPage - 1)
  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)

  return {
    currentPage,
    totalPages,
    startIndex,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  }
}



