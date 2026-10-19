import { supabase } from '@/lib/supabase'
import ClientProductList from './components/ClientProductList'
import ThemeToggle from './components/ThemeToggle'
import AccessibilityControls from './components/AccessibilityControls'
import ClientCartIcon from './components/ClientCartIcon'
import MapModalTrigger from './components/MapModalTrigger'
import MobileNavigation from './components/MobileNavigation'
import { getProductFinalPrice } from '@/lib/productPricing'
import { getPublicCatalogPage } from '@/app/actions/catalogo-publico'
import { productPath } from '@/lib/productSlug'
import type { Colegio } from '@/types/database'
import Image from 'next/image';
import Link from 'next/link'
export const revalidate = 0

type ColegioCatalogo = Pick<Colegio, 'nombre' | 'insignia_url'>

async function getColegios(): Promise<ColegioCatalogo[]> {
  const { data, error } = await supabase
    .from('colegios')
    .select('nombre, insignia_url')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  if (error) throw new Error(`No se pudieron cargar los colegios: ${error.message}`)
  return data ?? []
}

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ q?: string | string[] }>
}) {
  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q.trim() : ''
  const [catalog, colegios] = await Promise.all([
    getPublicCatalogPage({ page: 1, pageSize: 12, search: searchQuery }),
    getColegios()
  ])
  const productos = catalog.products
  const jsonLdProducts = productos.map((p) => {
    const precioFinal = getProductFinalPrice(p)
    return {
    '@type': 'Product',
    name: p.nombre,
    description: p.descripcion,
    image: p.imagen_url || p.imagenes?.[0] || 'https://www.confeccionesangus.cl/logo_ig.png',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: Math.round(precioFinal),
      availability: p.stock_total > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://www.confeccionesangus.cl${productPath(p.id, p.nombre)}`
    }
    }
  })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(211,169,84,0.15),_transparent_28%),linear-gradient(180deg,#f7f2ea_0%,#f3eee4_42%,#efe6d8_100%)] text-[#173b39] dark:bg-[radial-gradient(circle_at_top,_rgba(231,199,124,0.08),_transparent_24%),linear-gradient(180deg,#0d1a1a_0%,#122827_35%,#142b2a_100%)] dark:text-[#edf5f2]">
      {productos.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              itemListElement: jsonLdProducts.map((product, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: product
              }))
            })
          }}
        />
      )}

      <header className="sticky top-0 z-40 border-b border-[#123f3d]/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#122827]">
        <div className="mx-auto grid min-h-[106px] max-w-6xl grid-cols-[minmax(0,1fr)_auto] grid-rows-[50px_40px] items-center gap-x-2 gap-y-1 px-3 py-2 sm:flex sm:h-[76px] sm:min-h-0 sm:gap-5 sm:px-5 sm:py-0">
          <a href="#inicio" className="brand-logo-lockup shrink-0 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c]">
            <Image src="/logo_ig.png" alt="Confecciones Angus" width={44} height={44} className="h-10 w-10 object-contain sm:h-12 sm:w-12" />
            <div className="brand-logo-text">
              <p className="brand-logo-wordmark">ANGUS</p>
              <span>CONFECCIONES</span>
            </div>
          </a>

          <form action="/#productos" method="get" role="search" className="col-span-2 row-start-2 mx-auto flex h-10 w-full min-w-0 max-w-lg flex-1 items-center overflow-hidden rounded-full border border-[#d6dedb] bg-[#f8faf9] focus-within:border-[#123f3d] focus-within:ring-2 focus-within:ring-[#123f3d]/15 dark:border-white/15 dark:bg-[#1a3534] dark:focus-within:border-[#e7c77c] sm:row-auto">
            <label htmlFor="header-product-search" className="sr-only">Buscar productos</label>
            <input
              id="header-product-search"
              type="search"
              name="q"
              defaultValue={searchQuery}
              placeholder="Buscar productos..."
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-[#173b39] outline-none placeholder:text-[#80918d] dark:text-[#edf5f2] dark:placeholder:text-[#a8bfba] sm:px-4"
            />
            <button type="submit" aria-label="Buscar" className="mr-1 flex h-8 w-9 shrink-0 items-center justify-center rounded-full bg-[#075f53] text-white transition-colors hover:bg-[#064a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] dark:bg-[#e7c77c] dark:text-[#123f3d]">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="7" strokeWidth="2" />
                <path strokeLinecap="round" strokeWidth="2" d="m16 16 4 4" />
              </svg>
            </button>
          </form>

          <div className="col-start-2 row-start-1 flex shrink-0 items-center justify-end gap-0.5 sm:row-auto sm:gap-2">
            <MobileNavigation />
            <ClientCartIcon />
            <ThemeToggle />
            <AccessibilityControls className="hidden md:block" />
          </div>
        </div>
      </header>

      <section id="inicio" className="home-hero relative isolate scroll-mt-20 overflow-hidden text-white">
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-2 px-5 py-9 sm:px-8 sm:py-12 lg:min-h-[440px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:px-12 lg:py-14">
          <div className="relative z-10 py-2 sm:py-4 lg:py-8">
            <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-white/80 sm:text-sm">
              <span aria-hidden="true" className="h-px w-8 bg-[#ffd33d]/80" />
              Confección local · Quillota
            </p>
            <h1 className="max-w-[13ch] text-[clamp(2.15rem,4.4vw,3.5rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-white">
              Uniformes escolares <span className="block text-[#ffd33d]">de calidad</span>
            </h1>
            <p className="mt-5 max-w-md text-base font-medium leading-relaxed tracking-[0.015em] text-white/85 sm:text-lg">
              Confección · Reparación · Personalización
            </p>
            <a href="#productos" className="home-hero-cta mt-7 inline-flex min-h-12 items-center gap-3 rounded-xl border border-white/20 bg-[#ffd33d] px-6 py-3 text-base font-bold text-[#173b39] shadow-[0_12px_28px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#075f53]">
              Ver productos <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="home-hero-art relative mx-auto mt-1 h-[330px] w-full max-w-[480px] sm:mt-2 sm:h-[390px] lg:mt-0 lg:h-[420px] lg:max-w-[560px]" role="group" aria-label="Uniforme escolar mostrado de frente y por detrás">
            <Image
              src="/banner-uniformes-maniquies.png"
              alt="Buzo escolar azul marino con pantalón burdeos, mostrado de frente y por detrás"
              fill
              priority
              sizes="(max-width: 560px) 100vw, (max-width: 1023px) 480px, 42vw"
              className="object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.18)]"
            />
          </div>
        </div>
      </section>

      <section aria-label="Beneficios de Confecciones Angus" className="mb-3 border-b border-[#123f3d]/10 bg-white text-[#173b39] dark:border-white/10 dark:bg-[#142b2a] dark:text-[#edf5f2]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 divide-y divide-[#123f3d]/15 px-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-6 dark:divide-white/15">
          <div className="flex min-h-[96px] items-center gap-3 px-3 py-3 sm:justify-center sm:px-5">
            <svg aria-hidden="true" className="h-7 w-7 shrink-0 text-[#075f53] dark:text-[#e7c77c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M12 3 5 6v5c0 4.6 2.9 8 7 10 4.1-2 7-5.4 7-10V6l-7-3Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="m9 12 2 2 4-4" />
            </svg>
            <span className="text-base font-semibold leading-snug">Calidad<br className="sm:hidden" /> garantizada</span>
          </div>
          <div className="flex min-h-[64px] items-center gap-3 px-3 py-3 sm:justify-center sm:px-5">
            <svg aria-hidden="true" className="h-7 w-7 shrink-0 text-[#075f53] dark:text-[#e7c77c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20.8 8.8c0 5-8.8 10.2-8.8 10.2S3.2 13.8 3.2 8.8a4.3 4.3 0 0 1 8.8-1.2 4.3 4.3 0 0 1 8.8 1.2Z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 10h3l1.2-2 2.1 4 1.2-2H18" />
            </svg>
            <span className="text-base font-semibold leading-snug">Atención<br className="sm:hidden" /> personalizada</span>
          </div>
          <div className="flex min-h-[96px] items-center gap-3 px-3 py-3 sm:justify-center sm:px-5">
            <svg aria-hidden="true" className="h-7 w-7 shrink-0 text-[#075f53] dark:text-[#e7c77c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
              <circle cx="7.5" cy="18" r="1.8" strokeWidth="1.7" />
              <circle cx="17.5" cy="18" r="1.8" strokeWidth="1.7" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 10h4M5 13h3" />
            </svg>
            <span className="text-base font-semibold leading-snug">Envíos y retiros<br className="sm:hidden" /> (consultar)</span>
          </div>
        </div>
      </section>

      {productos.length === 0 ? (
        <section className="max-w-6xl mx-auto px-4 pb-10 " >
          <div className="brand-card p-12 text-center">
            <p className="text-xl font-bold text-[#173b39]">
              {searchQuery ? 'No encontramos productos para esta búsqueda' : 'No hay productos disponibles'}
            </p>
            <p className="mt-2 text-[#4d6d5f]">
              {searchQuery ? 'Prueba con otro término o explora el catálogo completo.' : 'Vuelve pronto para ver nuestras novedades.'}
            </p>
            {searchQuery && (
              <Link href="/#productos" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#123f3d] px-5 font-bold text-white transition-colors hover:bg-[#0d2f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954]">
                Ver todo el catálogo
              </Link>
            )}
          </div>
        </section>
      ) : (
        <section id="productos" aria-labelledby="catalog-title" className="max-w-6xl mx-auto px-4 pb-14 sm:pb-18 scroll-mt-28">
          <div className="rounded-[2rem] border border-[#123f3d]/10 bg-white/35 p-3 shadow-[0_18px_40px_rgba(17,31,30,0.04)] backdrop-blur-sm sm:p-5 lg:p-6">
            <div className="mb-4 px-1 sm:px-2">
              <p className="text-[14px] font-semibold uppercase tracking-[0.12em] text-[#73501b] dark:text-[#e7c77c]">Catálogo</p>
              <h2 id="catalog-title" className="mt-1 text-2xl font-bold tracking-tight text-[#123f3d] dark:text-[#edf5f2]">Uniformes escolares</h2>
              <p className="mt-1 text-base text-[#4f6967] dark:text-[#bfd4d0] sm:text-sm">Elige colegio, prenda y talla para revisar disponibilidad.</p>
            </div>
            <ClientProductList initialCatalog={catalog} initialSearch={searchQuery} colegiosData={colegios} />
          </div>
        </section>
      )}
      <section className="max-w-6xl mx-auto px-4 py-6 scroll-mt-28 sm:py-10" id="diferencia">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[14px] font-black uppercase tracking-[0.16em] text-[#73501b] dark:text-[#e7c77c]">Nuestra diferencia</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#123f3d] dark:text-[#edf5f2] sm:text-4xl">Una buena prenda empieza en cómo se hace y cómo se elige.</h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#d3a954]/70 via-[#123f3d]/30 to-transparent hidden sm:block" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="group relative overflow-hidden rounded-[1.6rem] bg-[#123f3d] p-6 text-[#f7f1e7] shadow-[0_18px_35px_rgba(18,63,61,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(18,63,61,0.18)] dark:bg-[#0f2d2d] dark:text-[#edf5f2]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(211,169,84,0.18),_transparent_52%)]" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7b972] text-xl text-[#123f3d] shadow-inner">✦</div>
              <h3 className="text-xl font-black text-[#f7f1e7]">Oficio y terminaciones cuidadas</h3>
              <p className="mt-2 text-[#edf3ee]/85 leading-relaxed">Ponemos atención en la confección y en los detalles para que cada prenda esté preparada para acompañar la rutina escolar.</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[1.6rem] border border-[#123f3d]/10 bg-[linear-gradient(135deg,#f9f3e7_0%,#f2e7cc_100%)] p-6 shadow-[0_18px_35px_rgba(18,63,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(18,63,61,0.12)] dark:border-white/10 dark:bg-none dark:bg-[#1a3534] dark:shadow-[0_18px_35px_rgba(3,7,7,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(18,63,61,0.09),_transparent_45%)]" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d3a954] text-xl text-[#123f3d] shadow-inner">✂</div>
              <h3 className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">Materiales para el uso diario</h3>
              <p className="mt-2 leading-relaxed text-[#4c6865] dark:text-[#d6e3e0]">Elegimos materiales pensando en comodidad y uso frecuente. Si necesitas conocer la composición o cómo cuidar una prenda, consúltanos antes de elegir.</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[1.6rem] border border-[#123f3d]/10 bg-[#eff6f2] p-6 shadow-[0_18px_35px_rgba(18,63,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(18,63,61,0.12)] dark:border-white/10 dark:bg-[#142b2a] dark:shadow-[0_18px_35px_rgba(3,7,7,0.2)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(18,63,61,0.06),_transparent_45%)]" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfeae5] text-xl text-[#123f3d] shadow-inner">✓</div>
              <h3 className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">Asesoría de persona a persona</h3>
              <p className="mt-2 leading-relaxed text-[#4c6865] dark:text-[#d6e3e0]">Te orientamos con tallas, calce, disponibilidad y recomendaciones de cuidado para que elijas con más seguridad.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 scroll-mt-28 sm:py-12" id="reparaciones">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#123f3d] px-6 py-10 text-[#f7f1e7] shadow-[0_22px_55px_rgba(18,63,61,0.18)] sm:px-10 sm:py-14 lg:px-12">
          <div className="absolute right-[-40px] top-[-30px] h-40 w-40 rounded-full bg-[#d3a954]/20 blur-3xl" />
          <div className="absolute left-[-40px] bottom-[-30px] h-32 w-32 rounded-full bg-[#f1e7d1]/15 blur-3xl" />

          <div className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d7b972]">Servicio especializado</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">El cuidado también forma parte de una buena prenda.</h2>
              <p className="mt-4 max-w-xl text-base text-[#edf3ee] leading-relaxed">
                ¿Tienes una duda de talla, uso o cuidado? Cuéntanos qué necesitas y te orientaremos. También puedes solicitar una evaluación para reparar o ajustar una prenda.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="flex flex-col gap-3 sm:flex-row">
                <a href="/arreglos" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#d3a954] px-6 py-3 font-black text-[#123f3d] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Evaluar un arreglo
                </a>
                <a
                  href="https://wa.me/56983852967?text=Hola%2C%20quiero%20recibir%20orientaci%C3%B3n%20personalizada%20sobre%20una%20prenda."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/35 px-6 py-3 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Hablar con una persona
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>


      <footer className="relative isolate scroll-mt-28 overflow-hidden bg-[#0d302e] text-[#f7f1e7]" id="contacto">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-[#d3a954]/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-24 -z-10 h-80 w-80 rounded-full bg-[#4d756e]/25 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-14 sm:px-6 sm:pb-8 sm:pt-20 lg:pb-10 lg:pt-24">
          <div className="grid gap-10 border-b border-white/15 pb-10 sm:gap-12 sm:pb-12 md:grid-cols-12">
            <section aria-label="Confecciones Angus" className="min-w-0 md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-lg sm:h-16 sm:w-16">
                  <Image src="/logo_ig.png" alt="" width={56} height={56} className="h-full w-full rounded-xl object-contain" />
                </div>
                <div>
                  <p className="text-2xl font-black leading-none tracking-tight sm:text-3xl">ANGUS</p>
                  <p className="mt-1 text-[0.68rem] font-bold tracking-[0.24em] text-[#e7c77c]">CONFECCIONES</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-base leading-7 text-[#e0ebe5] sm:text-lg">
                Uniformes escolares y arreglos confeccionados con cuidado en Quillota.
              </p>
              <a
                href="https://wa.me/56983852967?text=Hola%2C%20necesito%20orientaci%C3%B3n%20sobre%20una%20prenda."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d3a954] px-5 py-3 text-center text-base font-extrabold text-[#123f3d] shadow-lg shadow-black/10 transition-colors hover:bg-[#e7c77c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d302e] sm:w-auto"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a9.9 9.9 0 0 0-8.53 14.92L2 22l5.25-1.38A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.11.82.83-3.03-.19-.31A8 8 0 1 1 12 20Zm4.39-5.99c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.11.15 1.53.09.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
                </svg>
                Escríbenos por WhatsApp
              </a>
            </section>

            <section aria-labelledby="footer-contact-title" className="min-w-0 md:col-span-4">
              <h2 id="footer-contact-title" className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#e7c77c]">Contacto</h2>
              <address className="mt-4 space-y-3 not-italic text-base leading-7 text-[#edf3ee]">
                <p className="break-words">Pasaje Santa Olga 288, Quillota</p>
                <a href="tel:+56983852967" className="inline-flex min-h-11 items-center rounded-lg font-semibold text-[#f3d79a] underline decoration-white/40 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d79a]">
                  +56 9 8385 2967
                </a>
                <div className="-mt-1">
                  <MapModalTrigger />
                </div>
              </address>
            </section>

            <section aria-labelledby="footer-hours-title" className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] p-4 sm:p-5 md:col-span-3">
              <h2 id="footer-hours-title" className="text-sm font-extrabold uppercase tracking-[0.18em] text-[#e7c77c]">Horario de atención</h2>
              <dl className="mt-4 space-y-4 text-base">
                <div className="flex flex-col gap-0.5 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-[#c7d7d1]">Lunes a viernes</dt>
                  <dd className="font-bold tabular-nums">12:00–19:00</dd>
                </div>
                <div className="flex flex-col gap-0.5 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-[#c7d7d1]">Sábado</dt>
                  <dd className="font-bold tabular-nums">12:00–17:00</dd>
                </div>
                <div className="border-t border-white/10 pt-3 text-sm text-[#c7d7d1]">Domingo cerrado</div>
              </dl>
            </section>
          </div>

          <div className="flex flex-col items-center gap-4 pt-7 text-center text-sm leading-6 text-[#d4e0da] sm:flex-row sm:justify-between sm:text-left">
            <p>© {new Date().getFullYear()} Angus Confecciones. Todos los derechos reservados.</p>
            <nav aria-label="Información legal" className="flex w-full flex-col items-center gap-1 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-5 sm:gap-y-1">
              <Link href="/privacidad" className="inline-flex min-h-11 max-w-full items-center justify-center rounded px-2 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d79a]">Privacidad y almacenamiento</Link>
              <Link href="/condiciones" className="inline-flex min-h-11 max-w-full items-center justify-center rounded px-2 underline decoration-white/35 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3d79a]">Condiciones de solicitudes</Link>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  )
}
