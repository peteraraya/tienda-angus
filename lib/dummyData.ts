// Sistema de datos dummy para pruebas y demos
// Activar con NEXT_PUBLIC_USE_DUMMY_DATA=true en .env.local

export const isDummyMode = () => {
  return process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'
}

// Helper para generar UUIDs determinísticos para dummy data
// Formato: 00000000-0000-4000-8000-{prefix}{id}
// UUID tiene 36 caracteres: 8-4-4-4-12
function generateDummyUUID(prefix: string, id: number): string {
  // La última sección de un UUID tiene 12 caracteres hexadecimales
  // Convertimos el prefix a hex y el id a hex
  const prefixHex = Buffer.from(prefix).toString('hex').padEnd(6, '0').slice(0, 6) // 6 hex chars
  const idHex = id.toString(16).padStart(6, '0').slice(0, 6) // 6 hex chars
  const lastSection = `${prefixHex}${idHex}`
  return `00000000-0000-4000-8000-${lastSection}`
}

// Colegios dummy
export const dummyColegios = [
  { id: generateDummyUUID('c01', 1), nombre: 'Colegio San Agustín', insignia_url: 'https://via.placeholder.com/100/0066cc/ffffff?text=SA' },
  { id: generateDummyUUID('c01', 2), nombre: 'Instituto Nacional', insignia_url: 'https://via.placeholder.com/100/cc0000/ffffff?text=IN' },
  { id: generateDummyUUID('c01', 3), nombre: 'Liceo de Aplicación', insignia_url: 'https://via.placeholder.com/100/00cc66/ffffff?text=LA' },
  { id: generateDummyUUID('c01', 4), nombre: 'Colegio Verbo Divino', insignia_url: 'https://via.placeholder.com/100/cc6600/ffffff?text=VD' },
  { id: generateDummyUUID('c01', 5), nombre: 'Saint George College', insignia_url: 'https://via.placeholder.com/100/6600cc/ffffff?text=SG' },
]

// Categorías dummy
export const dummyCategorias = [
  { id: generateDummyUUID('c02', 1), nombre: 'Camisas' },
  { id: generateDummyUUID('c02', 2), nombre: 'Pantalones' },
  { id: generateDummyUUID('c02', 3), nombre: 'Faldas' },
  { id: generateDummyUUID('c02', 4), nombre: 'Chalecos' },
  { id: generateDummyUUID('c02', 5), nombre: 'Chaquetas' },
  { id: generateDummyUUID('c02', 6), nombre: 'Corbatas' },
  { id: generateDummyUUID('c02', 7), nombre: 'Calcetines' },
]

// Productos dummy con variantes
export const dummyProductos = [
  {
    id: generateDummyUUID('p00', 1),
    nombre: 'Camisa Blanca Manga Larga',
    descripcion: 'Camisa blanca de algodón, manga larga con cuello tradicional',
    precio: 15990,
    categoria: 'Camisas',
    imagen_url: 'https://via.placeholder.com/400/ffffff/000000?text=Camisa+Blanca',
    descuento_porcentaje: 0,
    en_oferta: false,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('p00', 2),
    nombre: 'Pantalón Gris Escolar',
    descripcion: 'Pantalón gris de tela resistente, corte clásico',
    precio: 22990,
    categoria: 'Pantalones',
    imagen_url: 'https://via.placeholder.com/400/808080/ffffff?text=Pantalon+Gris',
    descuento_porcentaje: 10,
    en_oferta: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('p00', 3),
    nombre: 'Falda Tableada Azul',
    descripcion: 'Falda tableada azul marino, largo reglamentario',
    precio: 18990,
    categoria: 'Faldas',
    imagen_url: 'https://via.placeholder.com/400/000080/ffffff?text=Falda+Azul',
    descuento_porcentaje: 0,
    en_oferta: false,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('p00', 4),
    nombre: 'Chaleco Azul Marino',
    descripcion: 'Chaleco de lana azul marino con escudo bordado',
    precio: 19990,
    categoria: 'Chalecos',
    imagen_url: 'https://via.placeholder.com/400/000080/ffffff?text=Chaleco',
    descuento_porcentaje: 15,
    en_oferta: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('p00', 5),
    nombre: 'Chaqueta Deportiva',
    descripcion: 'Chaqueta deportiva con cierre y bolsillos',
    precio: 29990,
    categoria: 'Chaquetas',
    imagen_url: 'https://via.placeholder.com/400/cc0000/ffffff?text=Chaqueta',
    descuento_porcentaje: 0,
    en_oferta: false,
    created_at: new Date().toISOString(),
  },
]

// Generar más productos (total 20)
for (let i = 6; i <= 20; i++) {
  const categorias = ['Camisas', 'Pantalones', 'Faldas', 'Chalecos', 'Chaquetas', 'Corbatas', 'Calcetines']
  const categoria = categorias[i % categorias.length]
  
  dummyProductos.push({
    id: generateDummyUUID('p00', i),
    nombre: `${categoria.slice(0, -1)} Modelo ${i}`,
    descripcion: `Descripción del producto ${i} de categoría ${categoria}`,
    precio: Math.floor(Math.random() * 20000) + 10000,
    categoria,
    imagen_url: `https://via.placeholder.com/400/0066cc/ffffff?text=Producto+${i}`,
    descuento_porcentaje: i % 3 === 0 ? Math.floor(Math.random() * 20) + 5 : 0,
    en_oferta: i % 3 === 0,
    created_at: new Date().toISOString(),
  })
}

// Variantes dummy (cada producto tiene variantes para cada colegio y varias tallas)
let variantCounter = 1
export const dummyVariantes = dummyProductos.flatMap(producto => 
  dummyColegios.flatMap(colegio => 
    ['XS', 'S', 'M', 'L', 'XL'].map(talla => ({
      id: generateDummyUUID('v00', variantCounter++),
      producto_id: producto.id,
      talla,
      colegio: colegio.nombre,
      stock: Math.floor(Math.random() * 50) + 5,
      created_at: new Date().toISOString(),
    }))
  )
)

// Proveedores dummy
export const dummyProveedores = [
  {
    id: generateDummyUUID('pr0', 1),
    nombre: 'Textiles del Sur',
    contacto: 'Juan Pérez',
    telefono: '+56912345678',
    email: 'contacto@textilesdelsur.cl',
    direccion: 'Av. Principal 123, Santiago',
    rut: '76.123.456-7',
    notas: 'Proveedor principal de telas',
    activo: true,
    total_pedidos: 1500000,
    cantidad_pedidos: 15,
    ultimo_pedido: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('pr0', 2),
    nombre: 'Botones y Cierres SA',
    contacto: 'María González',
    telefono: '+56987654321',
    email: 'ventas@botonescierres.cl',
    direccion: 'Calle Comercio 456, Valparaíso',
    rut: '77.234.567-8',
    notas: 'Especialistas en accesorios',
    activo: true,
    total_pedidos: 800000,
    cantidad_pedidos: 20,
    ultimo_pedido: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('pr0', 3),
    nombre: 'Hilos Industriales',
    contacto: 'Pedro Ramírez',
    telefono: '+56923456789',
    email: 'info@hilosindustriales.cl',
    direccion: 'Parque Industrial 789, Concepción',
    rut: '78.345.678-9',
    notas: 'Hilos de alta calidad',
    activo: true,
    total_pedidos: 600000,
    cantidad_pedidos: 12,
    ultimo_pedido: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
]

// Generar más proveedores (total 20)
for (let i = 4; i <= 20; i++) {
  dummyProveedores.push({
    id: generateDummyUUID('pr0', i),
    nombre: `Proveedor ${i} Ltda`,
    contacto: `Contacto ${i}`,
    telefono: `+5691234${String(i).padStart(4, '0')}`,
    email: `proveedor${i}@example.cl`,
    direccion: `Dirección ${i}, Ciudad`,
    rut: `7${i}.${String(i).padStart(3, '0')}.${String(i).padStart(3, '0')}-${i % 10}`,
    notas: `Notas del proveedor ${i}`,
    activo: i % 5 !== 0, // 80% activos
    total_pedidos: Math.floor(Math.random() * 2000000),
    cantidad_pedidos: Math.floor(Math.random() * 30),
    ultimo_pedido: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  })
}

// Insumos dummy
export const dummyInsumos = [
  {
    id: generateDummyUUID('i00', 1),
    nombre: 'Tela Poliéster Azul Marino',
    descripcion: 'Tela de poliéster resistente, color azul marino',
    unidad_medida: 'metros',
    precio_referencia: 5990,
    stock_actual: 150,
    stock_minimo: 50,
    imagen_url: 'https://via.placeholder.com/400/000080/ffffff?text=Tela+Azul',
    categoria: 'Telas',
    notas: 'Para uniformes escolares',
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('i00', 2),
    nombre: 'Botones Blancos 15mm',
    descripcion: 'Botones plásticos blancos de 15mm',
    unidad_medida: 'unidades',
    precio_referencia: 50,
    stock_actual: 5000,
    stock_minimo: 1000,
    imagen_url: 'https://via.placeholder.com/400/ffffff/000000?text=Botones',
    categoria: 'Botones',
    notas: 'Para camisas',
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('i00', 3),
    nombre: 'Hilo Poliéster Negro',
    descripcion: 'Hilo de poliéster negro, rollo de 5000m',
    unidad_medida: 'rollos',
    precio_referencia: 3500,
    stock_actual: 25,
    stock_minimo: 10,
    imagen_url: 'https://via.placeholder.com/400/000000/ffffff?text=Hilo',
    categoria: 'Hilos',
    notas: 'Para costuras',
    activo: true,
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('i00', 4),
    nombre: 'Cierre Metálico 20cm',
    descripcion: 'Cierre metálico de 20cm, color plateado',
    unidad_medida: 'unidades',
    precio_referencia: 450,
    stock_actual: 8,
    stock_minimo: 50,
    imagen_url: 'https://via.placeholder.com/400/c0c0c0/000000?text=Cierre',
    categoria: 'Cierres',
    notas: 'Stock bajo - pedir urgente',
    activo: true,
    created_at: new Date().toISOString(),
  },
]

// Generar más insumos (total 15)
for (let i = 5; i <= 15; i++) {
  const categorias = ['Telas', 'Botones', 'Hilos', 'Cierres', 'Elásticos', 'Etiquetas']
  const unidades = ['metros', 'unidades', 'rollos', 'paquetes', 'cajas']
  
  dummyInsumos.push({
    id: generateDummyUUID('i00', i),
    nombre: `Insumo ${i}`,
    descripcion: `Descripción del insumo ${i}`,
    unidad_medida: unidades[i % unidades.length],
    precio_referencia: Math.floor(Math.random() * 10000) + 500,
    stock_actual: Math.floor(Math.random() * 200),
    stock_minimo: Math.floor(Math.random() * 50) + 20,
    imagen_url: `https://via.placeholder.com/400/0066cc/ffffff?text=Insumo+${i}`,
    categoria: categorias[i % categorias.length],
    notas: i % 4 === 0 ? 'Stock crítico' : '',
    activo: true,
    created_at: new Date().toISOString(),
  })
}

// Clientes dummy
export const dummyClientes = [
  {
    id: generateDummyUUID('cl0', 1),
    nombre: 'Ana María Torres',
    contacto: 'ana.torres@email.com',
    telefono: '+56912345001',
    red_social: '@anatorres',
    direccion: 'Las Condes, Santiago',
    notas: 'Cliente frecuente',
    total_compras: 250000,
    cantidad_compras: 8,
    ultima_compra: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('cl0', 2),
    nombre: 'Roberto Sánchez',
    contacto: 'roberto.s@email.com',
    telefono: '+56912345002',
    red_social: null,
    direccion: 'Providencia, Santiago',
    notas: '',
    total_compras: 180000,
    cantidad_compras: 5,
    ultima_compra: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
]

// Generar más clientes (total 30)
for (let i = 3; i <= 30; i++) {
  dummyClientes.push({
    id: generateDummyUUID('cl0', i),
    nombre: `Cliente ${i}`,
    contacto: `cliente${i}@email.com`,
    telefono: `+5691234${String(i).padStart(4, '0')}`,
    red_social: i % 3 === 0 ? `@cliente${i}` : null,
    direccion: i % 2 === 0 ? `Dirección ${i}, Santiago` : null,
    notas: i % 5 === 0 ? 'Cliente VIP' : '',
    total_compras: Math.floor(Math.random() * 500000),
    cantidad_compras: Math.floor(Math.random() * 20),
    ultima_compra: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  })
}

// Pedidos dummy
export const dummyPedidos = [
  {
    id: generateDummyUUID('pe0', 1),
    proveedor_id: dummyProveedores[0].id,
    proveedor_nombre: 'Textiles del Sur',
    fecha_pedido: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_esperada: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_recepcion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    estado: 'recibido' as const,
    total: 450000,
    cantidad_items: 3,
    notas: 'Pedido urgente de telas',
    usuario: 'admin@confecciones.cl',
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('pe0', 2),
    proveedor_id: dummyProveedores[1].id,
    proveedor_nombre: 'Botones y Cierres SA',
    fecha_pedido: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_esperada: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_recepcion: null,
    estado: 'pendiente' as const,
    total: 125000,
    cantidad_items: 5,
    notas: 'Botones para nueva colección',
    usuario: 'admin@confecciones.cl',
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('pe0', 3),
    proveedor_id: dummyProveedores[2].id,
    proveedor_nombre: 'Hilos Industriales',
    fecha_pedido: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_esperada: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_recepcion: null,
    estado: 'cancelado' as const,
    total: 85000,
    cantidad_items: 2,
    notas: 'Cancelado por demora',
    usuario: 'admin@confecciones.cl',
    created_at: new Date().toISOString(),
  },
]

// Generar más pedidos (total 20)
for (let i = 4; i <= 20; i++) {
  const estados: Array<'pendiente' | 'recibido' | 'cancelado'> = ['pendiente', 'recibido', 'cancelado']
  const estado = estados[i % 3]
  const diasAtras = Math.floor(Math.random() * 60)
  const provIndex = (i - 1) % dummyProveedores.length
  
  dummyPedidos.push({
    id: generateDummyUUID('pe0', i),
    proveedor_id: dummyProveedores[provIndex].id,
    proveedor_nombre: dummyProveedores[provIndex].nombre,
    fecha_pedido: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString(),
    fecha_esperada: new Date(Date.now() - (diasAtras - 10) * 24 * 60 * 60 * 1000).toISOString(),
    fecha_recepcion: estado === 'recibido' ? new Date(Date.now() - (diasAtras - 5) * 24 * 60 * 60 * 1000).toISOString() : null,
    estado,
    total: Math.floor(Math.random() * 500000) + 50000,
    cantidad_items: Math.floor(Math.random() * 10) + 1,
    notas: i % 3 === 0 ? `Notas del pedido ${i}` : '',
    usuario: 'admin@confecciones.cl',
    created_at: new Date().toISOString(),
  })
}

// Ventas dummy
export const dummyVentas = [
  {
    id: generateDummyUUID('vn0', 1),
    fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    total: 85980,
    subtotal: 85980,
    descuento_total: 0,
    cantidad_items: 3,
    notas: 'Venta completa de uniformes',
    vendedor: 'admin@confecciones.cl',
    cliente_id: dummyClientes[0].id,
    cliente_nombre: 'Ana María Torres',
    cliente_telefono: '+56912345001',
    cliente_contacto: 'ana.torres@email.com',
    created_at: new Date().toISOString(),
  },
  {
    id: generateDummyUUID('vn0', 2),
    fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    total: 62970,
    subtotal: 69970,
    descuento_total: 7000,
    cantidad_items: 2,
    notas: 'Cliente con descuento',
    vendedor: 'admin@confecciones.cl',
    cliente_id: dummyClientes[1].id,
    cliente_nombre: 'Roberto Sánchez',
    cliente_telefono: '+56912345002',
    cliente_contacto: 'roberto.s@email.com',
    created_at: new Date().toISOString(),
  },
]

// Generar más ventas (total 50)
for (let i = 3; i <= 50; i++) {
  const diasAtras = Math.floor(Math.random() * 90)
  const subtotal = Math.floor(Math.random() * 200000) + 20000
  const descuento = i % 4 === 0 ? Math.floor(subtotal * 0.1) : 0
  const clienteIndex = (i - 1) % dummyClientes.length
  
  dummyVentas.push({
    id: generateDummyUUID('vn0', i),
    fecha: new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString(),
    total: subtotal - descuento,
    subtotal,
    descuento_total: descuento,
    cantidad_items: Math.floor(Math.random() * 8) + 1,
    notas: i % 5 === 0 ? `Notas de venta ${i}` : '',
    vendedor: 'admin@confecciones.cl',
    cliente_id: dummyClientes[clienteIndex].id,
    cliente_nombre: dummyClientes[clienteIndex].nombre,
    cliente_telefono: dummyClientes[clienteIndex].telefono,
    cliente_contacto: dummyClientes[clienteIndex].contacto,
    created_at: new Date().toISOString(),
  })
}

// Función helper para mezclar datos reales con dummy
export function mergeDummyData<T>(realData: T[], dummyData: T[]): T[] {
  if (!isDummyMode()) return realData
  return [...dummyData, ...realData]
}

// Función para obtener solo datos dummy si está activado
export function getDummyData<T>(dummyData: T[]): T[] {
  if (!isDummyMode()) return []
  return dummyData
}
