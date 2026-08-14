"use client"

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

type Props = Omit<ImageProps, 'onLoad'> & {
  className?: string
}

export default function LazyImage({ className = '', src, alt, priority, ...rest }: Props) {
  const [loaded, setLoaded] = useState<boolean>(!!priority)

  return (
    <div className={`relative overflow-hidden ${rest.fill ? 'w-full h-full' : ''}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      <Image
        {...rest}
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        priority={priority}
        onLoad={() => setLoaded(true)}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  )
}
