"use client"

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

type Props = Omit<ImageProps, 'onLoad'> & {
  className?: string
  fallbackLabel?: string
}

export default function LazyImage({ className = '', src, alt, priority, fallbackLabel = 'Imagen no disponible', ...rest }: Props) {
  const [imageState, setImageState] = useState({ src, priority: Boolean(priority), loaded: Boolean(priority), failed: false })
  const currentImageState = imageState.src === src && imageState.priority === Boolean(priority)
    ? imageState
    : { src, priority: Boolean(priority), loaded: Boolean(priority), failed: false }

  return (
    <div className={`relative overflow-hidden ${rest.fill ? 'w-full h-full' : ''}`}>
      {currentImageState.failed ? (
        <div
          role="img"
          aria-label={alt ? `${fallbackLabel}: ${alt}` : fallbackLabel}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,#fbf6ed_0%,#e9eee8_70%)] px-4 text-center text-[#52716a] dark:bg-[radial-gradient(circle_at_top,#294341_0%,#172d2c_70%)] dark:text-[#c6d8d3]"
        >
          <svg className="h-12 w-12 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold">{fallbackLabel}</span>
        </div>
      ) : (
        <>
      {!currentImageState.loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      <Image
        {...rest}
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${currentImageState.loaded ? 'opacity-100' : 'opacity-0'}`}
        priority={priority}
        onLoad={() => setImageState({ src, priority: Boolean(priority), loaded: true, failed: false })}
        onError={() => {
          setImageState({ src, priority: Boolean(priority), loaded: true, failed: true })
        }}
        loading={priority ? 'eager' : 'lazy'}
      />
        </>
      )}
    </div>
  )
}
