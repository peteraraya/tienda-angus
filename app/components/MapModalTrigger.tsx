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
      className="underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer focus:outline-none text-left"
    >
      Ver en Google Maps
    </button>
  )
}
