'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui'
import React from 'react'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  backPath?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

export default function AdminHeader({ 
  title, 
  subtitle, 
  backPath = '/admin', 
  icon,
  actions 
}: AdminHeaderProps) {
  const router = useRouter()

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={() => router.push(backPath)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-lg overflow-hidden bg-white dark:bg-gray-800 flex-shrink-0 ml-1 sm:ml-2">
              <img 
                src="/logo-confecciones.png" 
                alt="Confecciones Angus" 
                className="w-full h-full object-contain p-1"
              />
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                {icon && <span>{icon}</span>}
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-1 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap justify-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
