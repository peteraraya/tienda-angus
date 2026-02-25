"use client"

import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

type Props = Omit<ImageProps, 'onLoadingComplete'> & {
  className?: string
}

export default function LazyImage(props: Props) {
  const { className = '', src, alt, priority, ...rest } = props
  const [loaded, setLoaded] = useState<boolean>(!!priority)

  return (
    <div className={`relative overflow-hidden ${rest.fill ? 'w-full h-full' : ''}`}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}

      <Image
        {...(rest as any)}
        src={src as any}
        alt={alt as string}
        className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        priority={priority}
        onLoadingComplete={() => setLoaded(true)}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  )
}
