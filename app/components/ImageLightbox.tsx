"use client"

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from './ui'

interface Props {
  images: string[]
  startIndex?: number
  onClose?: () => void
}

export default function ImageLightbox({ images, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const draggingRef = useRef<boolean>(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose && onClose()
      if (e.key === 'ArrowRight') {
        setIndex(i => {
          const next = Math.min(i + 1, images.length - 1)
          setScale(1)
          setOffset({ x: 0, y: 0 })
          return next
        })
      }
      if (e.key === 'ArrowLeft') {
        setIndex(i => {
          const next = Math.max(i - 1, 0)
          setScale(1)
          setOffset({ x: 0, y: 0 })
          return next
        })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  const wheelZoom = (e: React.WheelEvent) => {
    e.preventDefault()
    // usar un factor multiplicativo para zoom más suave y consistente
    const delta = -e.deltaY
    const factor = 1 + delta * 0.001
    setScale(s => {
      const next = +(s * factor).toFixed(2)
      return Math.min(5, Math.max(1, next))
    })
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale === 1) return;
    draggingRef.current = true;
    setDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !lastPos.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setOffset(o => ({ x: o.x + dx, y: o.y + dy }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  }
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    setDragging(false);
    lastPos.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch {}
  }

  if (!images || images.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => onClose && onClose()}>
      <div className="relative max-w-[95vw] max-h-[95vh] w-full" onClick={e => e.stopPropagation()} ref={containerRef} onWheel={wheelZoom}>
        <div className="relative w-full flex items-center justify-center">
          <Image
            src={images[index]}
            alt={`Imagen ${index + 1}`}
            draggable={false}
            onWheel={wheelZoom}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            width={1200}
            height={900}
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 120ms ease',
              cursor: dragging ? 'grabbing' : scale > 1 ? 'grab' : 'auto',
              maxWidth: '100%',
              maxHeight: '80vh',
              display: 'block',
              margin: '0 auto'
            }}
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
          />

          {/* Controls - ahora dentro del contenedor de la imagen para quedar sobre la imagen */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            <Button size='sm' variant='ghost'type="button" onClick={() => setScale(s => Math.max(1, +(s - 0.5).toFixed(2)))} aria-label="Disminuir zoom" className="bg-white bg-opacity-90 text-black px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">-</Button>
            <Button size='sm' variant='primary'type="button" onClick={() => setScale(1)} aria-label="Restablecer zoom" className="bg-white bg-opacity-90 text-black px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">Reset</Button>
            <Button size='sm' variant='ghost' type="button" onClick={() => setScale(s => Math.min(5, +(s + 0.5).toFixed(2)))} aria-label="Aumentar zoom" className="bg-white bg-opacity-90 text-black px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">+</Button>
          </div>

          <div className="absolute top-0 right-2 flex gap-2 z-20">
            {/* <button type="button"
              onClick={() => {
                setIndex(i => {
                  const next = Math.max(0, i - 1)
                  setScale(1)
                  setOffset({ x: 0, y: 0 })
                  return next
                })
              }}
              aria-label="Imagen anterior"
              className="bg-white/90 text-gray-900 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >⟨</button>
            <button type="button"
              onClick={() => {
                setIndex(i => {
                  const next = Math.min(images.length - 1, i + 1)
                  setScale(1)
                  setOffset({ x: 0, y: 0 })
                  return next
                })
              }}
              aria-label="Imagen siguiente"
              className="bg-white/90 text-gray-900 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >⟩</button> */}
            <Button variant="ghost" size='sm' type="button" onClick={() => onClose && onClose()} aria-label="Cerrar visor" className="bg-white/90 text-gray-900 px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">Cerrar</Button>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, i) => (
              <Button variant="ghost" size='sm'
                key={i}
                type="button"
                onClick={() => {
                  setIndex(i)
                  setScale(1)
                  setOffset({ x: 0, y: 0 })
                }}
                aria-label={`Ver imagen ${i + 1}`}
                className={`w-12 h-12 overflow-hidden rounded ${i === index ? 'ring-2 ring-white' : ''} focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                <Image src={img} alt={`Miniatura ${i + 1}`} width={48} height={48} className="w-full h-full object-cover" />
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
