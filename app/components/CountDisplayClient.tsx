"use client"

import { useEffect, useState } from 'react'

export default function CountDisplayClient({ displayed, total }: { displayed: number; total: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  if (!mounted) return <>{/* cliente: esperando */}</>
  return (
    <>
      Mostrando <span className="font-semibold text-gray-900 dark:text-white">{displayed}</span> de <span className="font-semibold text-gray-900 dark:text-white">{total}</span> {total === 1 ? 'producto' : 'productos'}
    </>
  )
}
