import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/formatPrice'
import { getProductFinalPrice } from '@/lib/productPricing'
import { productPath } from '@/lib/productSlug'
import type { Producto, Variante } from '@/types/database'

const SITE_URL = 'https://www.confeccionesangus.cl'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface ProductWithVariants extends Producto {
  variantes: Variante[]
}

async function getProduct(id: string): Promise<ProductWithVariants | null> {
  if (!UUID_PATTERN.test(id)) return null
  const { data, error } = await supabase
    .from('productos')
    .select('id, nombre, descripcion, precio, categoria, imagen_url, imagenes, descuento_porcentaje, en_oferta, activo, created_at')
    .eq('id', id)
    .or('activo.is.null,activo.eq.true')
    .maybeSingle()

  if (error) throw new Error(`No se pudo cargar el producto público: ${error.message}`)
  if (!data) return null

  const { data: variantes, error: variantError } = await supabase
    .from('variantes')
    .select('id, producto_id, talla, colegio, stock, precio, created_at')
    .eq('producto_id', id)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (variantError) throw new Error(`No se pudieron cargar las variantes públicas: ${variantError.message}`)
  return { ...data, variantes: variantes ?? [] } as ProductWithVariants
}

type ProductRouteProps = {
  params: Promise<{ id: string; slug: string }>
}

export async function generateMetadata({ params }: ProductRouteProps): Promise<Metadata> {
  const { id } = await params
  const product = await getProduct(id)
  if (!product) return { title: 'Producto no encontrado | Confecciones Angus', robots: { index: false, follow: false } }

  const canonical = `${SITE_URL}${productPath(product.id, product.nombre)}`
  const description = product.descripcion?.trim().slice(0, 160) || `${product.nombre} de ${product.categoria}, disponible en Confecciones Angus.`
  const image = product.imagen_url || product.imagenes?.[0]

  return {
    title: `${product.nombre} | Confecciones Angus`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      title: `${product.nombre} | Confecciones Angus`,
      description,
      images: image ? [{ url: image, alt: product.nombre }] : undefined
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${product.nombre} | Confecciones Angus`,
      description,
      images: image ? [image] : undefined
    }
  }
}

export default async function ProductPage({ params }: ProductRouteProps) {
  const { id, slug } = await params
  const product = await getProduct(id)
  if (!product) notFound()

  const canonicalPath = productPath(product.id, product.nombre)
  if (slug !== canonicalPath.split('/').pop()) {
    redirect(canonicalPath)
  }

  const availableVariants = product.variantes.filter(variant => variant.stock > 0)
  const stock = product.variantes.reduce((total, variant) => total + variant.stock, 0)
  const price = getProductFinalPrice(product)
  const images = product.imagenes?.length ? product.imagenes : product.imagen_url ? [product.imagen_url] : []
  const schools = [...new Set(availableVariants.map(variant => variant.colegio).filter(school => school !== 'General'))]
  const sizes = [...new Set(availableVariants.map(variant => variant.talla))]
  const productUrl = `${SITE_URL}${canonicalPath}`
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.nombre,
    description: product.descripcion,
    category: product.categoria,
    image: images,
    url: productUrl,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'CLP',
      price: Math.round(price),
      availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition'
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f2ea_0%,#efe6d8_100%)] px-4 py-8 text-[#173b39] dark:bg-[linear-gradient(180deg,#0d1a1a_0%,#142b2a_100%)] dark:text-[#edf5f2] sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Ruta de navegación" className="mb-6 text-sm font-semibold text-[#4d6d5f] dark:text-[#bfd4d0]">
          <Link href="/" className="underline-offset-4 hover:underline">Inicio</Link>
          <span aria-hidden="true" className="px-2">/</span>
          <Link href="/#productos" className="underline-offset-4 hover:underline">Catálogo</Link>
          <span aria-hidden="true" className="px-2">/</span>
          <span aria-current="page">{product.nombre}</span>
        </nav>

        <article className="grid overflow-hidden rounded-[2rem] border border-[#123f3d]/10 bg-white shadow-[0_24px_70px_rgba(17,31,30,0.1)] dark:border-white/10 dark:bg-[#142b2a] md:grid-cols-2">
          <div className="relative min-h-[320px] bg-[#f1eadf] dark:bg-[#1b3331] sm:min-h-[520px]">
            {images[0] ? (
              <Image src={images[0]} alt={product.nombre} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-contain p-6 sm:p-10" />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center text-sm font-semibold text-[#52716a] dark:text-[#c6d8d3]">Imagen en preparación</div>
            )}
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8b6b31] dark:text-[#e7c77c]">{product.categoria}</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-[#173b39] dark:text-white sm:text-4xl">{product.nombre}</h1>
            <p className="mt-5 whitespace-pre-line leading-7 text-[#45625e] dark:text-[#d2e0dc]">{product.descripcion || 'Consulta los detalles y disponibilidad con nuestro equipo.'}</p>
            <p className="mt-8 text-3xl font-black text-[#123f3d] dark:text-[#e7c77c]">{formatPrice(price)}</p>
            <p className="mt-2 text-sm font-semibold text-[#4d6d5f] dark:text-[#bfd4d0]">
              {stock > 0 ? `${stock} unidades disponibles` : 'Agotado temporalmente'}
            </p>
            {sizes.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-bold">Tallas disponibles</h2>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {sizes.map(size => <li key={size} className="rounded-lg border border-[#123f3d]/15 px-3 py-1.5 text-sm font-semibold dark:border-white/20">{size}</li>)}
                </ul>
              </div>
            )}
            {schools.length > 0 && (
              <div className="mt-5">
                <h2 className="text-sm font-bold">Colegios</h2>
                <p className="mt-2 text-sm text-[#45625e] dark:text-[#d2e0dc]">{schools.join(' · ')}</p>
              </div>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={`https://wa.me/56983852967?text=${encodeURIComponent(`Hola, quisiera consultar por ${product.nombre}.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#123f3d] px-5 font-bold text-white transition-colors hover:bg-[#0d2f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:bg-[#e7c77c] dark:text-[#123f3d] dark:hover:bg-[#f3d79a]">
                Consultar disponibilidad
              </a>
              <Link href="/#productos" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#123f3d]/20 px-5 font-bold text-[#123f3d] hover:bg-[#edf3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:border-white/20 dark:text-[#e7c77c] dark:hover:bg-white/5">
                Volver al catálogo
              </Link>
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
