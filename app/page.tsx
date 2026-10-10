import { supabase } from '@/lib/supabase'
import ClientProductList from './components/ClientProductList'
import ThemeToggle from './components/ThemeToggle'
import ClientCartIcon from './components/ClientCartIcon'
import MapModalTrigger from './components/MapModalTrigger'
import MobileNavigation from './components/MobileNavigation'
import { getProductFinalPrice } from '@/lib/productPricing'
import type { Colegio, Producto, Variante } from '@/types/database'
import Image from 'next/image';
export const revalidate = 0

interface ProductoConVariantes extends Producto {
  variantes: Variante[]
  stock_total: number
}

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

async function getProductos() {
  const pageSize = 500
  const productosData: Producto[] = []
  let productOffset = 0

  while (true) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .or('activo.is.null,activo.eq.true')
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(productOffset, productOffset + pageSize - 1)

    if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`)
    productosData.push(...(data ?? []))
    if (!data || data.length < pageSize) break
    productOffset += pageSize
  }

  const variantesPorProducto = new Map<string, Variante[]>()
  const productIdBatchSize = 100
  for (let index = 0; index < productosData.length; index += productIdBatchSize) {
    const productIds = productosData.slice(index, index + productIdBatchSize).map(producto => producto.id)
    let variantOffset = 0

    while (true) {
      const { data: variantes, error } = await supabase
        .from('variantes')
        .select('id, producto_id, talla, colegio, stock, precio, created_at')
        .in('producto_id', productIds)
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .range(variantOffset, variantOffset + 999)

      if (error) throw new Error(`No se pudieron cargar las variantes: ${error.message}`)
      for (const variante of variantes ?? []) {
        const actuales = variantesPorProducto.get(variante.producto_id) ?? []
        actuales.push(variante)
        variantesPorProducto.set(variante.producto_id, actuales)
      }

      if (!variantes || variantes.length < 1000) break
      variantOffset += 1000
    }
  }

  const productosConVariantes = productosData.map(producto => {
    const variantes = variantesPorProducto.get(producto.id) ?? []
    return {
      ...producto,
      variantes,
      stock_total: variantes.reduce((sum, variante) => sum + variante.stock, 0)
    }
  })

  return productosConVariantes as ProductoConVariantes[]
}

export default async function Home() {
  const [productos, colegios] = await Promise.all([getProductos(), getColegios()])
  const productoDestacado = productos.find(producto =>
    producto.stock_total > 0 && (producto.imagen_url || producto.imagenes?.length)
  ) ?? productos.find(producto => producto.stock_total > 0) ?? productos[0]
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
  const productosDisponibles = productos.filter(producto => producto.stock_total > 0).length

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
      url: 'https://www.confeccionesangus.cl#productos'
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

      <div className="bg-[#123f3d] text-[#f8f3e9] text-xs sm:text-sm font-semibold py-2.5 px-4 text-center shadow-[0_10px_25px_rgba(18,63,61,0.18)] relative z-50 flex items-center justify-center gap-2 dark:bg-[#0d1a1a] dark:text-[#edf5f2]">
        <span>Uniformes escolares y reparaciones en Quillota</span>
        <span aria-hidden="true">·</span>
        <a href="https://wa.me/56983852967?text=Hola%2C%20quiero%20consultar%20por%20uniformes%20escolares" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#e7c77c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e7c77c]">
          Atención por WhatsApp
        </a>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#123f3d]/10 bg-[#f4efe7]/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(18,63,61,0.04)] dark:border-[#d7b972]/10 dark:bg-[#122827]/90 dark:shadow-[0_8px_24px_rgba(3,7,7,0.24)]">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <a href="#" className="brand-logo-lockup group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] rounded-2xl p-1">

              <Image src="/logo_ig.png" alt="Confecciones Angus" width={56} height={56} className="brand-logo-image" />
              
              <div className="brand-logo-text">
                <p className="brand-logo-wordmark">ANGUS</p>
                <span>CONFECCIONES</span>
              </div>
            </a>

            <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-4">
              <MobileNavigation />
              <div className="hidden md:flex items-center gap-6 text-sm mr-2">
                <a href="#productos" className="text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Catálogo</a>
                <a href="#reparaciones" className="text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Reparaciones</a>
                <a href="#contacto" className="text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Contacto</a>
              </div>
              <ClientCartIcon />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20" id="inicio">
        <div className="grid items-center gap-8 lg:grid-cols-[1.06fr_0.94fr] rounded-[2rem] border border-[#123f3d]/8 bg-white/30 p-4 shadow-[0_18px_45px_rgba(17,31,30,0.04)] backdrop-blur-sm sm:p-6 lg:p-8 dark:border-[#d7b972]/10 dark:bg-[#112827]/85 dark:shadow-[0_18px_45px_rgba(3,7,7,0.25)]">
          <div>
            <span className="accent-chip mb-5">Uniformes escolares • calidad artesanal</span>
            <h1 className="section-title leading-[0.95] tracking-[-0.06em] max-w-xl dark:text-[#edf5f2]">
              Uniformes <span className="gradient-text">escolares</span> con identidad y estilo.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-[#355c58] leading-relaxed dark:text-[#dfeae7]">
              Confección de buzos, poleras, calzas y prendas de colegio con terminación cuidada, reforzadas para la exigencia diaria del año escolar.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#productos" className="hero-cta-primary inline-flex items-center justify-center rounded-2xl px-6 py-3 font-bold text-[#123f3d]">Ver catálogo</a>
              <a href="https://wa.me/56983852967?text=Hola%2C%20quiero%20consultar%20por%20uniformes%20escolares" target="_blank" rel="noopener noreferrer" className="hero-cta-secondary inline-flex items-center justify-center rounded-2xl px-6 py-3 font-bold">Consultar por WhatsApp</a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <div className="brand-card p-3 text-center dark:text-[#edf5f2]">
                <p className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">{productosDisponibles}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#4d6d5f] dark:text-[#cfe0dd]">productos disponibles</p>
              </div>
              <div className="brand-card p-3 text-center dark:text-[#edf5f2]">
                <p className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">{colegios.length}</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#4d6d5f] dark:text-[#cfe0dd]">colegios</p>
              </div>
              <div className="brand-card p-3 text-center dark:text-[#edf5f2]">
                <p className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">WhatsApp</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#4d6d5f] dark:text-[#cfe0dd]">atención directa</p>
              </div>
            </div>
          </div>

          <div className="brand-showcase p-3 sm:p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-[#e9e1d3] dark:bg-[#1a3534]">
              {productoDestacado?.imagen_url || productoDestacado?.imagenes?.[0] ? (
                <Image
                  src={productoDestacado.imagen_url || productoDestacado.imagenes?.[0] || ''}
                  alt={productoDestacado.nombre}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_30%_20%,rgba(211,169,84,0.32),transparent_40%),linear-gradient(145deg,#e9e1d3,#d6e0d9)] text-[#123f3d] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(231,199,124,0.18),transparent_40%),linear-gradient(145deg,#1a3534,#0f2423)] dark:text-[#edf5f2]">
                  <Image src="/logo_ig.png" alt="" width={112} height={112} className="h-24 w-24 object-contain opacity-80" />
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-full border border-white/30 bg-[#123f3d]/90 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-lg backdrop-blur">
                Hecho para el día a día
              </span>
            </div>

            <div className="flex flex-col gap-4 px-2 pb-2 pt-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6f3d] dark:text-[#e7c77c]">
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

            <a
              href="#productos"
              className="mt-2 flex min-h-12 items-center justify-between rounded-xl bg-[#123f3d] px-4 font-bold text-white transition-colors hover:bg-[#0d2f2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d3a954] focus-visible:ring-offset-2 dark:bg-[#e7c77c] dark:text-[#123f3d] dark:hover:bg-[#f3d79a] dark:focus-visible:ring-offset-[#142b2a]"
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
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6f3d]">Catálogo</p>
              <h2 id="catalog-title" className="mt-1 text-2xl font-bold tracking-tight text-[#123f3d] dark:text-[#edf5f2]">Uniformes escolares</h2>
              <p className="mt-1 text-sm text-[#4f6967] dark:text-[#bfd4d0]">Elige colegio, prenda y talla para revisar disponibilidad.</p>
            </div>
            <ClientProductList productos={productos} colegiosData={colegios} />
          </div>
        </section>
      )}
      <section className="max-w-6xl mx-auto px-4 py-6 sm:py-10" id="diferencia">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#8a6f3d]">Nuestra diferencia</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#123f3d] sm:text-4xl">Calidad y atención que se sienten.</h2>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-[#d3a954]/70 via-[#123f3d]/30 to-transparent hidden sm:block" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <article className="group relative overflow-hidden rounded-[1.6rem] bg-[#123f3d] p-6 text-[#f7f1e7] shadow-[0_18px_35px_rgba(18,63,61,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(18,63,61,0.18)] dark:bg-[#0f2d2d] dark:text-[#edf5f2]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(211,169,84,0.18),_transparent_52%)]" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d7b972] text-xl text-[#123f3d] shadow-inner">✦</div>
              <h3 className="text-xl font-black text-[#f7f1e7]">Confección a medida</h3>
              <p className="mt-2 text-[#edf3ee]/85 leading-relaxed">Uniformes fabricados con estilo, consistencia y cuidado en cada detalle.</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(135deg,#f9f3e7_0%,#f2e7cc_100%)] p-6 shadow-[0_18px_35px_rgba(18,63,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(18,63,61,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(18,63,61,0.09),_transparent_45%)]" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#d3a954] text-xl text-[#123f3d] shadow-inner">✂</div>
              <h3 className="text-xl font-black text-[#123f3d]">Ajustes y reparaciones</h3>
              <p className="mt-2 text-[#4c6865] leading-relaxed">Retoques, cierres, cambios de medida y servicio postventa para que dure más.</p>
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[1.6rem] bg-[#eff6f2] p-6 shadow-[0_18px_35px_rgba(18,63,61,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(18,63,61,0.12)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(18,63,61,0.06),_transparent_45%)]" />
            <div className="relative">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfeae5] text-xl text-[#123f3d] shadow-inner">✓</div>
              <h3 className="text-xl font-black text-[#123f3d]">Atención personalizada</h3>
              <p className="mt-2 text-[#4c6865] leading-relaxed">Respuesta directa, asesoría por WhatsApp y orientación para elegir lo correcto.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12" id="reparaciones">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#123f3d] px-6 py-8 text-[#f7f1e7] shadow-[0_22px_55px_rgba(18,63,61,0.18)] sm:px-10 lg:px-12">
          <div className="absolute right-[-40px] top-[-30px] h-40 w-40 rounded-full bg-[#d3a954]/20 blur-3xl" />
          <div className="absolute left-[-40px] bottom-[-30px] h-32 w-32 rounded-full bg-[#f1e7d1]/15 blur-3xl" />

          <div className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d7b972]">Servicio especializado</p>
              <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">Reparación y cuidado de prendas.</h2>
              <p className="mt-4 max-w-xl text-base text-[#edf3ee] leading-relaxed">
                Solucionamos prendas, uniformes y ajustes con atención cercana, buen criterio y trabajo bien hecho. Hacemos que cada pieza siga luciendo impecable.
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <a href="/arreglos" className="inline-flex items-center justify-center rounded-2xl bg-[#d3a954] px-6 py-3 font-black text-[#123f3d] shadow-lg">
                Solicitar evaluación
              </a>
            </div>
          </div>
        </div>
      </section>


      <footer className="bg-[#123f3d] text-[#f7f1e7]" id="contacto">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <Image src="/logo_ig.png" alt="Confecciones Angus" width={56} height={56} className="brand-logo-image" />
              <div>
                <p className="text-xl font-black leading-none">ANGUS</p>
                <p className="text-[0.72rem] tracking-[0.25em] text-[#d7b972]">CONFECCIONES</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black">Contacto</h3>
              <div className="mt-3 space-y-2 text-sm text-[#edf3ee]">
                <p>Pasaje Santa Olga 288, Quillota</p>
                <p><a href="tel:+56983852967" className="text-[#d7b972] underline">+56 9 8385 2967</a></p>
                <p><MapModalTrigger /></p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black">Horario</h3>
              <div className="mt-3 space-y-2 text-sm text-[#edf3ee]">
                <p>Lunes a Viernes: 12:00 - 19:00</p>
                <p>Sábados: 12:00 - 17:00</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-[#edf3ee]/80">
            © {new Date().getFullYear()} Angus Confecciones. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </main>
  )
}
