import { supabase } from '@/lib/supabase'
import ClientProductList from './components/ClientProductList'
import ThemeToggle from './components/ThemeToggle'
import ClientCartIcon from './components/ClientCartIcon'
import Image from 'next/image'

export const revalidate = 0

interface Variante {
  talla: string
  colegio: string
  stock: number
  precio?: number | null
}

interface ProductoConVariantes {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string
  imagenes?: string[]
  variantes: Variante[]
  stock_total: number
  descuento_porcentaje?: number
  en_oferta?: boolean
}

interface Colegio {
  nombre: string
  insignia_url?: string
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

  // Generar JSON-LD estructurado para los productos (mejora SEO)
  const jsonLdProducts = productos.map((p) => ({
    "@type": "Product",
    "name": p.nombre,
    "description": p.descripcion,
    "image": p.imagen_url || "https://www.confeccionesangus.cl/logo-confecciones.png",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "CLP",
      "price": p.precio,
      "availability": p.stock_total > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": `https://www.confeccionesangus.cl#catalogo`
    }
  }));

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      {/* Schema.org JSON-LD para Productos */}
      {productos.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": jsonLdProducts.map((product, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": product
              }))
            })
          }}
        />
      )}

      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs sm:text-sm font-semibold py-2 text-center shadow-sm">
        🎉 ¡Preparándonos para la nueva temporada escolar! Contacta por WhatsApp para reservas y entregas 🚚
      </div>

      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            
                <Image
                  src="/logo-confecciones.png"
                  alt="Confecciones Angus"
                  width={64}
                  height={64}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain rounded-full p-0 bg-transparent dark:bg-gray-800"
                  priority
                />
           
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight uppercase ">
                  Angus confecciones
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">Venta de Buzos escolares, poleras polo, short y calzas.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6 text-sm mr-4">
                <a href="#catalogo" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Catálogo</a>
                <a href="#contacto" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Contacto</a>
              </div>
              <ClientCartIcon />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12" id="catalogo">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight">
            Descubre nuestro <br className="sm:hidden" />
            <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Catálogo Escolar
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Confección nacional de alta durabilidad. Elige tu colegio y encuentra el uniforme perfecto.
          </p>
        </div>

        {productos.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
            <div className="inline-block p-6 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xl font-semibold">No hay productos disponibles</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Vuelve pronto para ver nuestras novedades</p>
          </div>
        ) : (
          <ClientProductList productos={productos} colegiosData={colegios} />
        )}
      </div>

      {/* Sección de Reparaciones */}
      <div className="max-w-5xl mx-auto px-4 py-12 mb-8">
        <div className="bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-700 rounded-3xl p-8 sm:p-12 shadow-md border border-blue-100 dark:border-gray-600 relative overflow-hidden">
          {/* Elementos decorativos de fondo */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-purple-500 opacity-10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-sm font-bold mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                Servicio Especializado
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
                REPARACIÓN DE PRENDAS
              </h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-6 leading-relaxed">
                Hacemos reparaciones de cualquier tipo de prendas. Contáctanos por WhatsApp detallando qué es lo que necesitas y te ayudaremos a darle una segunda vida a tu ropa.
              </p>
              
              <div className="bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 mb-8 text-left border border-white/40 dark:border-gray-600/40">
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Para cotizar solo debes enviarnos:
                </h4>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300 font-medium">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                    Detalles precisos de lo que necesitas reparar.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                    Una o más fotos de la prenda dañada.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                    Si es ropa de colegio, indícanos de cuál es.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                    También puedes traer la prenda directamente a nuestro local para darte un presupuesto exacto.
                  </li>
                </ul>
              </div>

              <a
                href={`https://wa.me/56983852967?text=${encodeURIComponent('Hola, me gustaría cotizar la reparación de una prenda.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Consulta Rápida de Reparación
              </a>
            </div>
            
            <div className="hidden md:block flex-shrink-0">
              <div className="relative w-64 h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-700 rotate-3">
                {/* Fallback pattern instead of an image to avoid 404s, since we don't have a specific image asset for repairs */}
                <div className="absolute inset-0 bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                  <svg className="w-32 h-32 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner de Promesa de Valor / Trust Badges (Movido al final) */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              ¿Por qué elegir Angus Confecciones?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-300">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Calidad Garantizada</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Materiales seleccionados y confección reforzada, pensada para resistir la exigencia del año escolar.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-300">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-2xl flex items-center justify-center mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Atención Directa</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Sin intermediarios. Resolvemos tus dudas rápidamente y gestionamos tu pedido directamente por WhatsApp.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/50 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-300">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Compra 100% Segura</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Selecciona los productos, arma tu pedido fácilmente y coordina el pago de forma segura con nosotros.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300" id="contacto">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 items-center md:items-start text-center md:text-left">
            <div className="flex flex-col items-center md:flex-row md:items-start gap-4">
              <Image
                src="/logo-confecciones.png"
                alt="Confecciones Angus"
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover mx-auto md:mx-0"
                priority
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Angus Confecciones</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Venta de buzos escolares, poleras polo, short y calzas.</p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contacto</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Pasaje Santa Olga 288</p>
                <p>Teléfono: <a href="tel:+56983852967" className="underline">+56 9 8385 2967</a></p>
                <p>
                  <a
                    href="https://www.google.com/maps/place/O'Higgins+1384,+2261543+Quillota,+Valpara%C3%ADso/@-32.8925184,-71.2704,14z/data=!4m6!3m5!1s0x9689d278fe242b47:0x4ed3023dc9ea90be!8m2!3d-32.8933438!4d-71.2486881!16s%2Fg%2F11f64gkw2y?entry=ttu&g_ep=EgoyMDI2MDIyMi4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >Ver en Google Maps</a>
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Horario</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>Lunes a Viernes: 12:00 - 19:00</p>
                <p>Sábados: 12:00 - 17:00</p>
              </div>
            </div>
          </div>
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm pt-8 border-t border-gray-200 dark:border-gray-700">
            <p>© 2026  Angus Confecciones. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
