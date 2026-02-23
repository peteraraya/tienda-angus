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
