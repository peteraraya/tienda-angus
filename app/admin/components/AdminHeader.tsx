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
    <header className="mb-4 rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] px-3 py-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              onClick={() => router.push(backPath)}
              className="min-h-10 min-w-10 rounded-md border border-[#123f3d]/10 text-[#4f6967] transition-colors hover:bg-[#edf3f1] dark:border-white/10 dark:text-[#d6e3e0] dark:hover:bg-white/5"
              aria-label="Volver al inventario"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 truncate text-lg font-semibold tracking-tight text-[#173b39] dark:text-[#edf5f2] sm:text-xl">
                {icon && <span>{icon}</span>}
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-[#5f7a73] dark:text-[#bfd4d0] sm:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex w-full flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
              {actions}
            </div>
          )}
      </div>
    </header>
  )
}
