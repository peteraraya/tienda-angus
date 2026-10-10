'use client'

import React from 'react'

export default function MapModalTrigger() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('open-map-modal'))
  }

  return (
    <button 
      onClick={handleClick}
      className="inline-flex min-h-11 items-center rounded py-2 text-left underline transition-colors hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:hover:text-blue-400"
    >
      Ver en Google Maps
    </button>
  )
}
