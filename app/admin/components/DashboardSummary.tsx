'use client'

import { formatPrice } from '@/lib/formatPrice'

interface Variante {
  id: string
  stock: number
}

interface Producto {
  id: string
  precio: number
  stock_total?: number
  descuento_porcentaje?: number
  variantes?: Variante[]
}

interface Props {
  productos: Producto[]
}

export default function DashboardSummary({ productos }: Props) {
  // Obtener todas las variantes de todos los productos
  const todasLasVariantes = productos.flatMap(p => p.variantes || [])
  
  // Calcular estadísticas por UNIDADES DE STOCK (no por cantidad de variantes)
  const totalVariantes = todasLasVariantes.length
  
  // Sumar UNIDADES de stock disponible (stock > 6)
  const unidadesDisponibles = todasLasVariantes.reduce((total, v) => {
    return v.stock > 6 ? total + v.stock : total
  }, 0)
  
  // Sumar UNIDADES de stock bajo (1-6)
  const unidadesStockBajo = todasLasVariantes.reduce((total, v) => {
    return v.stock > 0 && v.stock <= 6 ? total + v.stock : total
  }, 0)
  
  // Contar variantes agotadas (0 unidades)
  const variantesAgotadas = todasLasVariantes.filter(v => v.stock === 0).length

  // Calcular valor total del inventario
  const valorInventario = productos.reduce((total, producto) => {
    const stock = producto.stock_total || 0
    const precioFinal = producto.descuento_porcentaje 
      ? producto.precio - (producto.precio * producto.descuento_porcentaje / 100)
      : producto.precio
    return total + (precioFinal * stock)
  }, 0)

  // Calcular total de productos únicos
  const totalProductos = productos.length

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
      <SummaryCard label="Productos" value={totalProductos.toLocaleString('es-CL')} detail={`${totalVariantes} variantes`} />
      <SummaryCard label="Stock disponible" value={unidadesDisponibles.toLocaleString('es-CL')} detail="Más de 6 unidades" tone="positive" />
      <SummaryCard label="Stock bajo" value={unidadesStockBajo.toLocaleString('es-CL')} detail="Entre 1 y 6 unidades" tone="warning" />
      <SummaryCard label="Variantes agotadas" value={variantesAgotadas.toLocaleString('es-CL')} detail="Sin unidades" tone="critical" />
      <SummaryCard label="Valor del inventario" value={formatPrice(valorInventario)} detail="A precios vigentes" />
    </div>
  )
}

function SummaryCard({ label, value, detail, tone = 'neutral' }: {
  label: string
  value: string
  detail: string
  tone?: 'neutral' | 'positive' | 'warning' | 'critical'
}) {
  const valueColor = {
    neutral: 'text-[#173b39] dark:text-[#edf5f2]',
    positive: 'text-[#2f6f5a] dark:text-[#8ac7ae]',
    warning: 'text-[#9a681a] dark:text-[#e7c77c]',
    critical: 'text-[#a23f37] dark:text-[#f0a59e]'
  }[tone]

  return (
    <article className="min-w-0 rounded-lg border border-[#123f3d]/10 bg-[#fffdf9] px-3 py-3 shadow-sm dark:border-white/10 dark:bg-[#142b2a] sm:px-4">
      <p className="truncate text-xs font-medium text-[#5f7a73] dark:text-[#bfd4d0]">{label}</p>
      <p className={`mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl ${valueColor}`}>{value}</p>
      <p className="mt-0.5 truncate text-[11px] text-[#6e827f] dark:text-[#aec7c4]">{detail}</p>
    </article>
  )
}
