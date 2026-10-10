export interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string // Mantener por compatibilidad
  imagenes?: string[] // Nueva: array de URLs de imágenes
  activo: boolean
  created_at: string
  descuento_porcentaje?: number
  en_oferta?: boolean
  notas?: string // Notas privadas incluidas solo en respuestas administrativas
}

export interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string
  stock: number
  precio?: number | null
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

export interface Proveedor {
  id: string
  nombre: string
  contacto: string
  telefono: string
  email?: string
  direccion?: string
  rut?: string
  notas?: string
  activo: boolean
  total_pedidos: number
  cantidad_pedidos: number
  ultimo_pedido?: string
  created_at: string
  updated_at: string
}

export interface Pedido {
  id: string
  proveedor_id: string
  proveedor_nombre: string
  fecha_pedido: string
  fecha_esperada?: string
  fecha_recepcion?: string
  estado: 'pendiente' | 'recibido' | 'cancelado'
  total: number
  cantidad_items: number
  notas?: string
  usuario: string
  created_at: string
  updated_at: string
}

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id?: string
  variante_id?: string
  producto_nombre: string
  talla?: string
  colegio?: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  recibido: boolean
  cantidad_recibida: number
  created_at: string
}

export interface PedidoConItems extends Pedido {
  items: PedidoItem[]
}

export type SolicitudPedidoEstado = 'pendiente' | 'confirmado' | 'cancelado'

export interface SolicitudPedido {
  id: string
  cliente_nombre: string
  cliente_telefono: string
  consent_at: string
  estado: SolicitudPedidoEstado
  total: number
  cantidad_items: number
  created_at: string
  updated_at: string
  items?: SolicitudPedidoItem[]
}

export interface SolicitudPedidoItem {
  id: string
  solicitud_id: string
  producto_id: string | null
  variante_id: string | null
  producto_nombre: string
  talla: string
  colegio: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at: string
}

export type SolicitudReparacionEstado = 'pendiente' | 'cotizada' | 'aceptada' | 'completada' | 'cancelada'

export interface SolicitudReparacion {
  id: string
  cliente_nombre: string
  cliente_telefono: string
  prenda: string
  descripcion: string
  fecha_deseada: string | null
  estado: SolicitudReparacionEstado
  consent_at: string
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: string
  nombre: string
  descripcion?: string
  activo: boolean
  created_at: string
}

export interface Colegio {
  id: string
  nombre: string
  insignia_url?: string
  activo: boolean
  created_at: string
}

export interface Insumo {
  id: string
  nombre: string
  descripcion?: string
  unidad_medida: string
  precio_referencia: number
  stock_actual: number
  stock_minimo: number
  imagen_url?: string
  categoria?: string
  notas?: string
  activo: boolean
  created_at: string
}
