/**
 * EJEMPLO DE CONFIGURACIÓN PARA OTRO CLIENTE
 * 
 * Copia este archivo a app.config.ts y modifica los valores según tu negocio
 */

import { AppConfig } from './app.config'

// Ejemplo: Tienda de Ropa Deportiva
export const sportStoreConfig: AppConfig = {
  company: {
    name: 'SportMax',
    shortName: 'SportMax',
    tagline: 'Equipamiento deportivo profesional',
    description: 'Tu tienda de confianza para equipamiento deportivo',
    logo: '/logo-sportmax.png',
    favicon: '/icon-sportmax.png'
  },
  
  contact: {
    email: 'contacto@sportmax.com',
    phone: '+56 9 8765 4321',
    whatsapp: '+56987654321',
    address: 'Av. Deportiva 123, Santiago',
    website: 'https://sportmax.com'
  },
  
  social: {
    facebook: 'https://facebook.com/sportmax',
    instagram: 'https://instagram.com/sportmax',
    twitter: 'https://twitter.com/sportmax'
  },
  
  app: {
    currency: 'CLP',
    currencySymbol: '$',
    locale: 'es-CL',
    timezone: 'America/Santiago',
    dateFormat: 'DD/MM/YYYY'
  },
  
  inventory: {
    lowStockThreshold: 10,
    criticalStockThreshold: 3
  },
  
  labels: {
    products: 'Productos',
    product: 'Producto',
    categories: 'Categorías',
    category: 'Categoría',
    variants: 'Variantes',
    variant: 'Variante',
    sales: 'Ventas',
    sale: 'Venta',
    customers: 'Clientes',
    customer: 'Cliente',
    suppliers: 'Proveedores',
    supplier: 'Proveedor',
    orders: 'Pedidos',
    order: 'Pedido',
    supplies: 'Insumos',
    supply: 'Insumo',
    schools: 'Equipos', // Cambiado para deportes
    school: 'Equipo'
  },
  
  features: {
    enableSchools: true, // Usar para equipos deportivos
    enableSuppliers: true,
    enableSupplies: true,
    enableDiscounts: true,
    enableOffers: true,
    enableNotes: true,
    enableCustomers: true,
    enableSales: true
  }
}

// Ejemplo: Tienda de Ropa Casual
export const fashionStoreConfig: AppConfig = {
  company: {
    name: 'Fashion Boutique',
    shortName: 'Fashion',
    tagline: 'Moda y estilo para todos',
    description: 'Las últimas tendencias en moda',
    logo: '/logo-fashion.png',
    favicon: '/icon-fashion.png'
  },
  
  contact: {
    email: 'hola@fashionboutique.com',
    phone: '+56 9 5555 6666',
    address: 'Mall Plaza, Local 45',
  },
  
  social: {
    instagram: 'https://instagram.com/fashionboutique',
  },
  
  app: {
    currency: 'CLP',
    currencySymbol: '$',
    locale: 'es-CL',
    timezone: 'America/Santiago',
    dateFormat: 'DD/MM/YYYY'
  },
  
  inventory: {
    lowStockThreshold: 5,
    criticalStockThreshold: 1
  },
  
  labels: {
    products: 'Productos',
    product: 'Producto',
    categories: 'Categorías',
    category: 'Categoría',
    variants: 'Variantes',
    variant: 'Variante',
    sales: 'Ventas',
    sale: 'Venta',
    customers: 'Clientes',
    customer: 'Cliente',
    suppliers: 'Proveedores',
    supplier: 'Proveedor',
    orders: 'Pedidos',
    order: 'Pedido',
    supplies: 'Materiales',
    supply: 'Material',
    schools: 'Colecciones',
    school: 'Colección'
  },
  
  features: {
    enableSchools: false, // No necesita colegios
    enableSuppliers: true,
    enableSupplies: true,
    enableDiscounts: true,
    enableOffers: true,
    enableNotes: true,
    enableCustomers: true,
    enableSales: true
  }
}

// Ejemplo: Ferretería
export const hardwareStoreConfig: AppConfig = {
  company: {
    name: 'Ferretería El Martillo',
    shortName: 'El Martillo',
    tagline: 'Todo para tu construcción',
    description: 'Herramientas y materiales de construcción',
    logo: '/logo-ferreteria.png',
    favicon: '/icon-ferreteria.png'
  },
  
  contact: {
    email: 'ventas@elmartillo.cl',
    phone: '+56 2 2345 6789',
    whatsapp: '+56223456789',
    address: 'Av. Industrial 456, Santiago',
  },
  
  social: {},
  
  app: {
    currency: 'CLP',
    currencySymbol: '$',
    locale: 'es-CL',
    timezone: 'America/Santiago',
    dateFormat: 'DD/MM/YYYY'
  },
  
  inventory: {
    lowStockThreshold: 20,
    criticalStockThreshold: 5
  },
  
  labels: {
    products: 'Productos',
    product: 'Producto',
    categories: 'Categorías',
    category: 'Categoría',
    variants: 'Presentaciones',
    variant: 'Presentación',
    sales: 'Ventas',
    sale: 'Venta',
    customers: 'Clientes',
    customer: 'Cliente',
    suppliers: 'Proveedores',
    supplier: 'Proveedor',
    orders: 'Pedidos',
    order: 'Pedido',
    supplies: 'Materias Primas',
    supply: 'Materia Prima',
    schools: 'Marcas',
    school: 'Marca'
  },
  
  features: {
    enableSchools: false,
    enableSuppliers: true,
    enableSupplies: true,
    enableDiscounts: true,
    enableOffers: true,
    enableNotes: true,
    enableCustomers: true,
    enableSales: true
  }
}
