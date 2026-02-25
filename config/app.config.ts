/**
 * Configuración de la aplicación
 * Este archivo contiene todos los datos personalizables de la empresa/cliente
 * Modifica estos valores para adaptar la aplicación a tu negocio
 */

export interface AppConfig {
  // Información de la empresa
  company: {
    name: string
    shortName: string
    tagline: string
    description: string
    logo: string
    favicon: string
  }
  
  // Información de contacto
  contact: {
    email: string
    phone: string
    whatsapp?: string
    address?: string
    website?: string
  }
  
  // Redes sociales
  social: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  
  // Configuración de la aplicación
  app: {
    currency: string
    currencySymbol: string
    locale: string
    timezone: string
    dateFormat: string
  }
  
  // Configuración de inventario
  inventory: {
    lowStockThreshold: number
    criticalStockThreshold: number
  }
  
  // Textos personalizables
  labels: {
    products: string
    product: string
    categories: string
    category: string
    variants: string
    variant: string
    sales: string
    sale: string
    customers: string
    customer: string
    suppliers: string
    supplier: string
    orders: string
    order: string
    supplies: string
    supply: string
    schools: string
    school: string
  }
  
  // Características habilitadas
  features: {
    enableSchools: boolean
    enableSuppliers: boolean
    enableSupplies: boolean
    enableDiscounts: boolean
    enableOffers: boolean
    enableNotes: boolean
    enableCustomers: boolean
    enableSales: boolean
  }
}

// Configuración por defecto - Confecciones Angus
export const defaultConfig: AppConfig = {
  company: {
    name: 'Confecciones Angus',
    shortName: 'Angus',
    tagline: 'Uniformes escolares de calidad',
    description: 'Especialistas en confección de uniformes escolares',
    logo: '/logo-confecciones.png',
    favicon: '/icon.png'
  },
  
  contact: {
    email: 'contacto@confeccionesangus.cl',
    phone: '+56 9 1234 5678',
    whatsapp: '+56912345678',
    address: 'Santiago, Chile',
    website: 'https://confeccionesangus.cl'
  },
  
  social: {
    facebook: 'https://facebook.com/confeccionesangus',
    instagram: 'https://instagram.com/confeccionesangus',
  },
  
  app: {
    currency: 'CLP',
    currencySymbol: '$',
    locale: 'es-CL',
    timezone: 'America/Santiago',
    dateFormat: 'DD/MM/YYYY'
  },
  
  inventory: {
    lowStockThreshold: 6,
    criticalStockThreshold: 0
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
    schools: 'Colegios',
    school: 'Colegio'
  },
  
  features: {
    enableSchools: true,
    enableSuppliers: true,
    enableSupplies: true,
    enableDiscounts: true,
    enableOffers: true,
    enableNotes: true,
    enableCustomers: true,
    enableSales: true
  }
}

// Función para cargar configuración personalizada desde variables de entorno
export function loadConfig(): AppConfig {
  // Aquí puedes cargar configuración desde .env o base de datos
  // Por ahora retornamos la configuración por defecto
  return defaultConfig
}

// Exportar la configuración activa
export const appConfig = loadConfig()
