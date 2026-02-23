'use client'

interface Variante {
  talla: string
  color: string
  stock: number
}

interface ProductCardProps {
  producto: {
    id: string
    nombre: string
    descripcion: string
    precio: number
    categoria: string
    imagen_url?: string
    variantes: Variante[]
    stock_total: number
  }
}

export default function ProductCard({ producto }: ProductCardProps) {
  const tallasDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.talla))]
  const coloresDisponibles = [...new Set(producto.variantes.filter(v => v.stock > 0).map(v => v.color))]

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-2xl dark:hover:shadow-blue-900/20 transition-all duration-500 transform hover:-translate-y-1 border border-gray-200 dark:border-gray-700">
      <div className="relative h-72 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
        {producto.imagen_url ? (
          <img 
            src={producto.imagen_url} 
            alt={producto.nombre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20">
            <svg className="w-24 h-24 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {producto.stock_total === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <span className="text-white text-2xl font-bold">AGOTADO</span>
              <p className="text-gray-300 text-sm mt-2">Próximamente disponible</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4">
          <span className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-gray-900 dark:text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border border-gray-200 dark:border-gray-600">
            {producto.categoria}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {producto.nombre}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed">
          {producto.descripcion}
        </p>
        
        {tallasDisponibles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Tallas</p>
            <div className="flex flex-wrap gap-2">
              {tallasDisponibles.map(talla => (
                <span 
                  key={talla} 
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {talla}
                </span>
              ))}
            </div>
          </div>
        )}

        {coloresDisponibles.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">Colores</p>
            <div className="flex flex-wrap gap-2">
              {coloresDisponibles.slice(0, 4).map(color => (
                <span 
                  key={color} 
                  className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  {color}
                </span>
              ))}
              {coloresDisponibles.length > 4 && (
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
                  +{coloresDisponibles.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio</p>
            <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
              ${producto.precio}
            </span>
          </div>
          <div className="text-right">
            <span className={`inline-block text-xs font-bold px-4 py-2 rounded-full ${
              producto.stock_total > 10 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700' 
                : producto.stock_total > 0 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700' 
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700'
            }`}>
              {producto.stock_total > 0 ? `${producto.stock_total} unidades` : 'Sin stock'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
