import { supabase } from '@/lib/supabase'
import ClientProductList from './components/ClientProductList'
import ThemeToggle from './components/ThemeToggle'
import ClientCartIcon from './components/ClientCartIcon'
import MapModalTrigger from './components/MapModalTrigger'
import type { Colegio, Producto, Variante } from '@/types/database'

export const revalidate = 0

interface ProductoConVariantes extends Producto {
  variantes: Variante[]
  stock_total: number
}

async function getColegios() {
  const { data } = await supabase
    .from('colegios')
    .select('nombre, insignia_url')
    .eq('activo', true)
    .order('nombre', { ascending: true })

  return data as Colegio[]
}

async function getProductos() {
  const { data: productosData } = await supabase
    .from('productos')
    .select('*')
    .or('activo.is.null,activo.eq.true')
    .order('created_at', { ascending: false })

  if (!productosData) return []

  const productosConVariantes = await Promise.all(
    productosData.map(async (producto) => {
      const { data: variantes } = await supabase
        .from('variantes')
        .select('talla, colegio, stock, precio')
        .eq('producto_id', producto.id)

      const stock_total = variantes?.reduce((sum, v) => sum + v.stock, 0) || 0

      return {
        ...producto,
        variantes: variantes || [],
        stock_total
      }
    })
  )

  return productosConVariantes as ProductoConVariantes[]
}

export default async function Home() {
  const [productos, colegios] = await Promise.all([getProductos(), getColegios()])

  const jsonLdProducts = productos.map((p) => ({
    '@type': 'Product',
    name: p.nombre,
    description: p.descripcion,
    image: p.imagen_url || 'https://www.confeccionesangus.cl/logo-confecciones.png',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'CLP',
      price: p.precio,
      availability: p.stock_total > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: 'https://www.confeccionesangus.cl#catalogo'
    }
  }))

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
        <span aria-hidden="true">🎉</span>
        <span>Preparando la nueva temporada escolar con entregas y atención directa por WhatsApp</span>
        <span aria-hidden="true">🚚</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-[#123f3d]/10 bg-[#f4efe7]/80 backdrop-blur-xl shadow-[0_8px_24px_rgba(18,63,61,0.04)] dark:border-[#d7b972]/10 dark:bg-[#122827]/90 dark:shadow-[0_8px_24px_rgba(3,7,7,0.24)]">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-4">
            <a href="#" className="brand-logo-lockup group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] rounded-2xl p-1">
              <div className="brand-badge">A</div>
              <div className="brand-logo-text">
                <h1>ANGUS</h1>
                <span>CONFECCIONES</span>
              </div>
            </a>

            <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm mr-2">
                <a href="#catalogo" className="text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Catálogo</a>
                <a href="#reparaciones" className="text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Reparaciones</a>
                <a href="#contacto" className="text-[#173b39] hover:text-[#123f3d] transition-colors font-bold dark:text-[#edf5f2] dark:hover:text-[#e7c77c]">Contacto</a>
              </div>
              <ClientCartIcon />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20" id="catalogo">
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
              <a href="#catalogo" className="hero-cta-primary inline-flex items-center justify-center rounded-2xl px-6 py-3 font-bold text-[#123f3d]">Ver catálogo</a>
              <a href="https://wa.me/56983852967?text=Hola%2C%20quiero%20consultar%20por%20uniformes%20escolares" target="_blank" rel="noopener noreferrer" className="hero-cta-secondary inline-flex items-center justify-center rounded-2xl px-6 py-3 font-bold">Consultar por WhatsApp</a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              <div className="brand-card p-3 text-center dark:text-[#edf5f2]">
                <p className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">+500</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#4d6d5f] dark:text-[#cfe0dd]">prendas</p>
              </div>
              <div className="brand-card p-3 text-center dark:text-[#edf5f2]">
                <p className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">12+</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#4d6d5f] dark:text-[#cfe0dd]">años</p>
              </div>
              <div className="brand-card p-3 text-center dark:text-[#edf5f2]">
                <p className="text-xl font-black text-[#123f3d] dark:text-[#edf5f2]">100%</p>
                <p className="text-xs uppercase tracking-[0.12em] text-[#4d6d5f] dark:text-[#cfe0dd]">personal</p>
              </div>
            </div>
          </div>

          <div className="brand-showcase p-5 sm:p-6">
            <div className="relative mx-auto max-w-[430px] rounded-[1.6rem] bg-[#f7f1e7]/90 p-5 shadow-[inset_0_0_0_1px_rgba(18,63,61,0.02)]">
              <div className="relative flex items-center justify-center gap-4 pb-4">
                <div className="brand-badge">A</div>
                <div className="text-left">
                  <p className="text-[2.1rem] font-black leading-none tracking-[-0.08em] text-[#123f3d]">Angus</p>
                  <p className="text-[0.72rem] font-black tracking-[0.36em] text-[#4d6d5f] pt-1">CONFECCIONES</p>
                </div>
              </div>

              <div className="gold-divider my-3" />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.35rem] bg-[#0f2d2d] p-4 text-[#f3ebdf] shadow-[0_12px_24px_rgba(15,45,45,0.2)]">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[#d7b972]">Colegio</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-[#d7b972]" />
                  </div>
                  <div className="rounded-xl bg-[#f5efe7] p-3 text-[#123f3d] font-black text-lg leading-tight">Simón Bolívar</div>
                  <div className="mt-4 h-28 rounded-xl bg-[linear-gradient(135deg,#f3ebdc_0%,#e6d7b4_100%)] p-3 flex items-center justify-center text-[#123f3d] font-black text-lg text-center leading-tight">
                    Uniforme escolar
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.35rem] bg-[#f4efe7] p-4 border border-[#123f3d]/06 shadow-[0_8px_18px_rgba(18,63,61,0.04)]">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[#123f3d]">Reparaciones</span>
                      <span className="h-2.5 w-2.5 rounded-full bg-[#d7b972] ring-2 ring-[#d7b972]/30" />
                    </div>
                    <div className="rounded-xl bg-[#f9f6f0] p-3 text-[#123f3d] font-bold text-sm leading-relaxed">Ajustes, cierres, parches, retoques y mantenimiento de uniformes.</div>
                  </div>

                  <div className="rounded-[1.35rem] bg-[#123f3d] p-4 text-[#f7f1e7] shadow-[0_12px_24px_rgba(18,63,61,0.2)]">
                    <div className="text-base font-black leading-snug">Calidad garantizada y atención directa.</div>
                  </div>
                </div>
              </div>
            </div>
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
        <section className="max-w-6xl mx-auto px-4 pb-14 sm:pb-18">
          <div className="rounded-[2rem] border border-[#123f3d]/10 bg-white/35 p-3 shadow-[0_18px_40px_rgba(17,31,30,0.04)] backdrop-blur-sm sm:p-5 lg:p-6">
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
              <a href="https://wa.me/56983852967?text=Hola%2C%20me%20gustar%C3%ADa%20cotizar%20una%20reparaci%C3%B3n%20de%20prenda" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-2xl bg-[#d3a954] px-6 py-3 font-black text-[#123f3d] shadow-lg">
                Consultar reparación
              </a>
            </div>
          </div>
        </div>
      </section>


      <footer className="bg-[#123f3d] text-[#f7f1e7]" id="contacto">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <div className="brand-badge h-[62px] w-[62px] text-[1.5rem]">A</div>
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
            © 2026 Angus Confecciones. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </main>
  )
}
