import { supabase } from '@/lib/supabase'
import ClientProductList from './components/ClientProductList'
import ThemeToggle from './components/ThemeToggle'
import Image from 'next/image'

export const revalidate = 0

interface Variante {
  talla: string
  colegio: string
  stock: number
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
        .select('talla, colegio, stock')
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
  const productos = await getProductos()

  return (
    <main className="min-h-screen bg-linear-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm transition-colors duration-300">
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
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12" id="catalogo">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Catálogo
            </span>
            <br />
            <span className="text-gray-900 dark:text-white">de Productos</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Encuentra las mejores prendas con la calidad que mereces
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
          <ClientProductList productos={productos} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 mt-20 transition-colors duration-300" id="contacto">
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
                <p>Dirección: O&#39;Higgins 1384, Quillota</p>
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
