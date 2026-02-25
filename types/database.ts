export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string // Mantener por compatibilidad
  imagenes?: string[] // Nueva: array de URLs de imágenes
  created_at: string
  descuento_porcentaje?: number
  en_oferta?: boolean
  notas?: string // Notas personales del administrador
}

export interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string
  stock: number
  created_at: string
}

export interface ProductoConVariantes extends Producto {
  variantes: Variante[]
}

export interface Venta {
  id: string
  fecha: string
  total: number
  subtotal: number
  descuento_total: number
  cantidad_items: number
  notas?: string
  vendedor: string
  cliente_id?: string
  cliente_nombre?: string
  cliente_telefono?: string
  cliente_contacto?: string
  created_at: string
}

export interface Cliente {
  id: string
  nombre: string
  contacto: string
  telefono: string
  red_social?: string
  direccion?: string
  notas?: string
  total_compras: number
  cantidad_compras: number
  ultima_compra?: string
  created_at: string
  updated_at: string
}

export interface VentaItem {
  id: string
  venta_id: string
  producto_id: string
  variante_id: string
  producto_nombre: string
  talla: string
  colegio: string
  precio_unitario: number
  descuento_porcentaje: number
  precio_final: number
  cantidad: number
  subtotal: number
  created_at: string
}

export interface VentaConItems extends Venta {
  items: VentaItem[]
}
