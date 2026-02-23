export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string
  created_at: string
}

export interface Variante {
  id: string
  producto_id: string
  talla: string
  color: string
  stock: number
  created_at: string
}

export interface ProductoConVariantes extends Producto {
  variantes: Variante[]
}
