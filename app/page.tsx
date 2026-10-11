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

export default async function Home() {
  const [catalog, colegios] = await Promise.all([
    getPublicCatalogPage({ page: 1, pageSize: 12 }),
    getColegios()
  ])
  const productos = catalog.products
  const productoDestacado = productos.find(producto =>
    producto.stock_total > 0 && (producto.imagen_url || producto.imagenes?.length)
  ) ?? productos.find(producto => producto.stock_total > 0) ?? productos[0]
  const tieneImagenDestacada = Boolean(productoDestacado?.imagen_url || productoDestacado?.imagenes?.[0])
  const preciosVariantesDestacado = productoDestacado?.variantes
    .filter(variante => variante.stock > 0)
    .map(variante => variante.precio ?? productoDestacado.precio) ?? []
  const precioFinalDestacado = productoDestacado ? getProductFinalPrice(productoDestacado) : null
  const precioBaseDestacado = productoDestacado
    ? preciosVariantesDestacado.length > 0
      ? Math.min(...preciosVariantesDestacado)
      : productoDestacado.precio
    : null
  const precioDestacado = productoDestacado
    && precioFinalDestacado !== null
    ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
      .format(precioFinalDestacado)
    : null
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

      <div className="relative z-50 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[#123f3d] px-4 py-2.5 text-center text-[14px] font-semibold text-[#f8f3e9] shadow-[0_10px_25px_rgba(18,63,61,0.18)] dark:bg-[#0d1a1a] dark:text-[#edf5f2]">
        <span>Uniformes escolares y reparaciones en Quillota</span>
        <span className="hidden sm:inline" aria-hidden="true">·</span>
        <a href="https://wa.me/56983852967?text=Hola%2C%20quiero%20consultar%20por%20uniformes%20escolares" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#e7c77c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c77c]">
          Atención por WhatsApp
        </a>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#123f3d]/10 bg-[#f4efe7]/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(18,63,61,0.04)] dark:border-[#d7b972]/10 dark:bg-[#122827]/90 dark:shadow-[0_8px_24px_rgba(3,7,7,0.24)]">
        <div className="max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-5">
          <div className="flex items-center justify-between gap-1 sm:gap-4">
            <a href="#inicio" className="brand-logo-lockup group rounded-2xl p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-[#e7c77c] dark:focus-visible:ring-offset-[#122827]">

              <Image src="/logo_ig.png" alt="Confecciones Angus" width={56} height={56} className="brand-logo-image" />
              
              <div className="brand-logo-text">
                <p className="brand-logo-wordmark">ANGUS</p>
                <span>CONFECCIONES</span>
              </div>
            </a>

            <div className="flex items-center gap-1 sm:gap-4">
              <MobileNavigation />
              <nav aria-label="Navegación principal" className="hidden items-center gap-6 text-base sm:text-sm md:flex mr-2">
                <a href="#productos" className="inline-flex min-h-11 items-center rounded px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Catálogo</a>
                <a href="#reparaciones" className="inline-flex min-h-11 items-center rounded px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Reparaciones</a>
                <a href="#contacto" className="inline-flex min-h-11 items-center rounded px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c] text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Contacto</a>
              </nav>
              <ClientCartIcon />
              <ThemeToggle />
              <AccessibilityControls className="hidden md:block" />
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-12 lg:py-16 scroll-mt-28" id="inicio">
        <div className="grid items-center gap-5 rounded-[2rem] border border-[#123f3d]/8 bg-white/30 p-3 shadow-[0_18px_45px_rgba(17,31,30,0.04)] backdrop-blur-sm sm:gap-8 sm:p-6 md:grid-cols-[1.06fr_0.94fr] lg:p-8 dark:border-[#d7b972]/10 dark:bg-[#112827]/85 dark:shadow-[0_18px_45px_rgba(3,7,7,0.25)]">
          <div>
            <span className="accent-chip mb-5">Confección cuidada • materiales seleccionados • asesoría cercana</span>
            <h1 className="section-title leading-[0.95] tracking-[-0.06em] max-w-xl dark:text-[#edf5f2]">
              Bien hechos para <span className="gradient-text">acompañar</span> cada jornada.
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#355c58] dark:text-[#dfeae7] sm:mt-5 sm:text-lg">
              Uniformes escolares confeccionados con cuidado y materiales seleccionados. Te asesoramos con talla, calce y cuidados antes de solicitar.
            </p>

            <div className="mt-5 flex flex-col gap-3 min-[360px]:flex-row sm:mt-8">
              <a href="#productos" className="hero-cta-primary inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 py-3 text-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-[#e7c77c] dark:focus-visible:ring-offset-[#122827]">Ver catálogo</a>
              <a href="https://wa.me/56983852967?text=Hola%2C%20necesito%20orientaci%C3%B3n%20para%20elegir%20un%20uniforme.%20%C2%BFMe%20pueden%20ayudar%20con%20la%20talla%2C%20el%20calce%20o%20el%20cuidado%3F" target="_blank" rel="noopener noreferrer" className="hero-cta-secondary inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl px-4 py-3 text-center font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] focus-visible:ring-offset-2 dark:focus-visible:ring-[#e7c77c] dark:focus-visible:ring-offset-[#122827]">Pedir asesoría</a>
            </div>

            <p className="mt-4 text-base leading-5 text-[#4d6d5f] dark:text-[#cfe0dd] sm:mt-6 sm:text-sm">
              <span className="font-bold">{catalog.total}</span> productos en catálogo
              <span aria-hidden="true"> · </span>
              <span className="font-bold">{colegios.length}</span> colegios
              <span aria-hidden="true"> · </span>
              Asesoría directa
            </p>
          </div>

          <div className="brand-showcase p-3 sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-[#e9e1d3] dark:bg-[#1a3534]">
              {productoDestacado?.imagen_url || productoDestacado?.imagenes?.[0] ? (
                <Image
                  src={productoDestacado.imagen_url || productoDestacado.imagenes?.[0] || ''}
                  alt={productoDestacado.nombre}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-contain p-4 transition-transform duration-500 hover:scale-[1.02]"
                />
              ) : (
                <div className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_28%_20%,rgba(211,169,84,0.32),transparent_38%),linear-gradient(145deg,#f1eadf,#d6e0d9)] px-5 text-center text-[#123f3d] dark:bg-[radial-gradient(circle_at_28%_20%,rgba(231,199,124,0.18),transparent_38%),linear-gradient(145deg,#1a3534,#0f2423)] dark:text-[#edf5f2] sm:px-8">
                  <div aria-hidden="true" className="absolute -right-14 -top-16 h-48 w-48 rounded-full border border-[#123f3d]/10 dark:border-white/10" />
                  <div aria-hidden="true" className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full border border-[#d3a954]/30 dark:border-[#e7c77c]/20" />
                  <span className="absolute left-3 top-3 rounded-full border border-[#123f3d]/10 bg-white/65 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#73501b] shadow-sm backdrop-blur sm:left-5 sm:top-5 dark:border-white/10 dark:bg-white/5 dark:text-[#e7c77c]">
                    Confección local
                  </span>
                  <div className="relative flex flex-col items-center rounded-[1.75rem] border border-white/70 bg-white/55 px-5 py-4 shadow-[0_18px_40px_rgba(17,31,30,0.10)] backdrop-blur-sm dark:border-white/10 dark:bg-[#142b2a]/55 sm:px-7 sm:py-5">
                    <Image src="/logo-confecciones.png" alt="Angus Confecciones" width={160} height={160} className="h-24 w-24 object-contain drop-shadow-sm sm:h-32 sm:w-32" />
                    <span className="mt-2 text-xs font-black uppercase tracking-[0.12em] text-[#123f3d] dark:text-[#edf5f2] sm:text-sm">Uniformes y arreglos</span>
                    <span className="mt-1 text-xs font-semibold text-[#73501b] dark:text-[#e7c77c]">Quillota, Chile</span>
                  </div>
                </div>
              )}
              {tieneImagenDestacada && (
                <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-[#123f3d]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur">
                  Atención en cada detalle
                </span>
              )}
            </div>

            {tieneImagenDestacada ? (
              <div className="flex flex-col gap-4 px-2 pb-2 pt-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-[#73501b] dark:text-[#e7c77c]">
                    {productoDestacado?.categoria ?? 'Catálogo Angus'}
                  </p>
                  <h2 className="mt-1 line-clamp-2 text-xl font-black tracking-tight text-[#123f3d] dark:text-[#edf5f2]">
                    {productoDestacado?.nombre ?? 'Uniformes con identidad'}
                  </h2>
                  <p className="mt-1 text-sm text-[#4f6967] dark:text-[#bfd4d0]">
                    {colegios.length > 0 ? `${colegios.length} colegios disponibles` : 'Explora la colección'}
                  </p>
                </div>
                {precioDestacado && (
                  <div className="shrink-0 sm:text-right">
                    <span className="block text-xs text-[#5f7a73] dark:text-[#bfd4d0]">
                      {preciosVariantesDestacado.some(precio => precio !== precioBaseDestacado) ? 'Desde' : 'Precio referencial'}
                    </span>
                    <span className="text-lg font-black text-[#123f3d] dark:text-[#edf5f2]">{precioDestacado}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="px-2 pb-2 pt-5 text-sm text-[#4f6967] dark:text-[#bfd4d0]">
                La disponibilidad y el valor se confirman según la prenda, el colegio y la talla.
              </p>
            )}

            <a
              href="#productos"
              className="mt-2 flex min-h-12 items-center justify-between rounded-xl bg-[#123f3d] px-4 font-bold text-white transition-colors hover:bg-[#0d2f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 dark:bg-[#e7c77c] dark:text-[#123f3d] dark:hover:bg-[#f3d79a] dark:focus-visible:ring-[#123f3d] dark:focus-visible:ring-offset-[#142b2a]"
            >
              Explorar prendas y tallas
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      {productos.length === 0 ? (
        <section className="max-w-6xl mx-auto px-4 pb-10">
          <div className="brand-card p-12 text-center">
            <p className="text-xl font-bold text-[#173b39]">No hay productos disponibles</p>
            <p className="mt-2 text-[#4d6d5f]">Vuelve pronto para ver nuestras novedades.</p>
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
            <ClientProductList initialCatalog={catalog} colegiosData={colegios} />
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
        <div className="relative overflow-hidden rounded-[2rem] bg-[#123f3d] px-6 py-8 text-[#f7f1e7] shadow-[0_22px_55px_rgba(18,63,61,0.18)] sm:px-10 lg:px-12">
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
        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pb-5 sm:pt-14">
          <div className="grid gap-8 border-b border-white/15 pb-8 sm:gap-10 sm:pb-10 md:grid-cols-12">
            <section aria-label="Confecciones Angus" className="min-w-0 md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-lg sm:h-16 sm:w-16">
                  <Image src="/logo_ig.png" alt="" width={56} height={56} className="h-full w-full rounded-xl object-contain" />
                </div>
                <div>
                  <p className="text-xl font-black leading-none tracking-tight sm:text-2xl">ANGUS</p>
                  <p className="mt-1 text-[0.68rem] font-bold tracking-[0.24em] text-[#e7c77c]">CONFECCIONES</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#e0ebe5] sm:text-base">
                Uniformes escolares y arreglos confeccionados con cuidado en Quillota.
              </p>
              <a
                href="https://wa.me/56983852967?text=Hola%2C%20necesito%20orientaci%C3%B3n%20sobre%20una%20prenda."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d3a954] px-5 py-3 text-center text-sm font-extrabold text-[#123f3d] shadow-lg shadow-black/10 transition-colors hover:bg-[#e7c77c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d302e] sm:w-auto"
              >
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2a9.9 9.9 0 0 0-8.53 14.92L2 22l5.25-1.38A10 10 0 1 0 12 2Zm0 18a8 8 0 0 1-4.08-1.12l-.29-.17-3.11.82.83-3.03-.19-.31A8 8 0 1 1 12 20Zm4.39-5.99c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.39 1.37.5.58.18 1.11.15 1.53.09.47-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
                </svg>
                Escríbenos por WhatsApp
              </a>
            </section>

            <section aria-labelledby="footer-contact-title" className="min-w-0 md:col-span-4">
              <h2 id="footer-contact-title" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e7c77c]">Contacto</h2>
              <address className="mt-4 space-y-3 not-italic text-sm leading-6 text-[#edf3ee]">
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
              <h2 id="footer-hours-title" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e7c77c]">Horario de atención</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex flex-col gap-0.5 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-[#c7d7d1]">Lunes a viernes</dt>
                  <dd className="font-bold tabular-nums">12:00–19:00</dd>
                </div>
                <div className="flex flex-col gap-0.5 min-[360px]:flex-row min-[360px]:justify-between min-[360px]:gap-3">
                  <dt className="text-[#c7d7d1]">Sábado</dt>
                  <dd className="font-bold tabular-nums">12:00–17:00</dd>
                </div>
                <div className="border-t border-white/10 pt-3 text-xs text-[#c7d7d1]">Domingo cerrado</div>
              </dl>
            </section>
          </div>

          <div className="flex flex-col items-center gap-3 pt-5 text-center text-xs leading-5 text-[#d4e0da] sm:flex-row sm:justify-between sm:text-left">
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
