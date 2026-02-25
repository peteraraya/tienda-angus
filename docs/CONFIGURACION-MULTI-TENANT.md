# Sistema de Configuración Multi-Tenant

## Resumen
El sistema ahora es completamente parametrizable y puede ser usado por cualquier empresa. Todos los nombres propios, logos, y datos específicos del cliente están centralizados en un archivo de configuración.

## Archivos Creados

### 1. `config/app.config.ts`
Archivo principal de configuración que contiene:
- Información de la empresa (nombre, logo, tagline)
- Datos de contacto (email, teléfono, dirección)
- Redes sociales
- Configuración de la aplicación (moneda, idioma, zona horaria)
- Configuración de inventario (umbrales de stock)
- Etiquetas personalizables (nombres de entidades)
- Características habilitadas/deshabilitadas

### 2. `app/hooks/useAppConfig.tsx`
Hooks de React para acceder fácilmente a la configuración:
- `useAppConfig()` - Configuración completa
- `useCompanyInfo()` - Información de la empresa
- `useContactInfo()` - Datos de contacto
- `useSocialInfo()` - Redes sociales
- `useAppSettings()` - Configuración de la app
- `useInventorySettings()` - Configuración de inventario
- `useLabels()` - Etiquetas personalizadas
- `useFeatures()` - Características habilitadas

### 3. `config/app.config.example.ts`
Ejemplos de configuración para diferentes tipos de negocio:
- Tienda de ropa deportiva (SportMax)
- Boutique de moda (Fashion Boutique)
- Ferretería (El Martillo)

## Estructura de Configuración

```typescript
interface AppConfig {
  company: {
    name: string              // "Confecciones Angus"
    shortName: string         // "Angus"
    tagline: string          // "Uniformes escolares de calidad"
    description: string      // Descripción para SEO
    logo: string            // Ruta al logo
    favicon: string         // Ruta al favicon
  }
  
  contact: {
    email: string
    phone: string
    whatsapp?: string
    address?: string
    website?: string
  }
  
  social: {
    facebook?: string
    instagram?: string
    twitter?: string
    linkedin?: string
  }
  
  app: {
    currency: string         // "CLP"
    currencySymbol: string   // "$"
    locale: string          // "es-CL"
    timezone: string        // "America/Santiago"
    dateFormat: string      // "DD/MM/YYYY"
  }
  
  inventory: {
    lowStockThreshold: number      // 6
    criticalStockThreshold: number // 0
  }
  
  labels: {
    products: string    // "Productos"
    product: string     // "Producto"
    categories: string  // "Categorías"
    // ... más etiquetas
  }
  
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
```

## Cómo Usar

### En Componentes de React

```typescript
import { useCompanyInfo, useLabels, useFeatures } from '@/app/hooks/useAppConfig'

function MyComponent() {
  const company = useCompanyInfo()
  const labels = useLabels()
  const features = useFeatures()
  
  return (
    <div>
      <h1>{company.name}</h1>
      <p>{company.tagline}</p>
      
      {features.enableSchools && (
        <div>
          <h2>{labels.schools}</h2>
        </div>
      )}
    </div>
  )
}
```

### En Archivos No-React

```typescript
import { appConfig } from '@/config/app.config'

const companyName = appConfig.company.name
const lowStock = appConfig.inventory.lowStockThreshold
```

### En Metadata (layout.tsx)

```typescript
import { appConfig } from "@/config/app.config"

export const metadata: Metadata = {
  title: `${appConfig.company.name} - ${appConfig.company.tagline}`,
  description: appConfig.company.description,
  icons: {
    icon: appConfig.company.favicon,
  },
}
```

## Configurar para un Nuevo Cliente

### Paso 1: Modificar `config/app.config.ts`

```typescript
export const defaultConfig: AppConfig = {
  company: {
    name: 'Tu Empresa',
    shortName: 'TuEmpresa',
    tagline: 'Tu slogan aquí',
    description: 'Descripción de tu negocio',
    logo: '/tu-logo.png',
    favicon: '/tu-favicon.png'
  },
  
  contact: {
    email: 'contacto@tuempresa.com',
    phone: '+56 9 1234 5678',
    whatsapp: '+56912345678',
    address: 'Tu dirección',
  },
  
  // ... resto de la configuración
}
```

### Paso 2: Agregar Logo e Imágenes

1. Coloca tu logo en `public/tu-logo.png`
2. Coloca tu favicon en `public/tu-favicon.png`
3. Actualiza las rutas en la configuración

### Paso 3: Personalizar Etiquetas

```typescript
labels: {
  products: 'Artículos',      // En lugar de "Productos"
  product: 'Artículo',
  schools: 'Equipos',         // En lugar de "Colegios"
  school: 'Equipo',
  // ... personaliza según tu negocio
}
```

### Paso 4: Habilitar/Deshabilitar Características

```typescript
features: {
  enableSchools: false,      // Si no necesitas colegios
  enableSuppliers: true,
  enableSupplies: true,
  enableDiscounts: true,
  enableOffers: true,
  enableNotes: true,
  enableCustomers: true,
  enableSales: true
}
```

## Ejemplos de Uso por Tipo de Negocio

### Tienda de Ropa Deportiva

```typescript
company: {
  name: 'SportMax',
  tagline: 'Equipamiento deportivo profesional'
}

labels: {
  schools: 'Equipos',
  school: 'Equipo',
  products: 'Productos Deportivos',
  categories: 'Deportes'
}

features: {
  enableSchools: true  // Usar para equipos deportivos
}
```

### Ferretería

```typescript
company: {
  name: 'Ferretería El Martillo',
  tagline: 'Todo para tu construcción'
}

labels: {
  schools: 'Marcas',
  school: 'Marca',
  variants: 'Presentaciones',
  supplies: 'Materias Primas'
}

inventory: {
  lowStockThreshold: 20,  // Mayor umbral para ferretería
  criticalStockThreshold: 5
}

features: {
  enableSchools: false  // No necesita colegios
}
```

### Boutique de Moda

```typescript
company: {
  name: 'Fashion Boutique',
  tagline: 'Moda y estilo para todos'
}

labels: {
  schools: 'Colecciones',
  school: 'Colección',
  supplies: 'Materiales',
  variants: 'Tallas y Colores'
}

features: {
  enableSchools: false,
  enableSupplies: false  // Puede no necesitar gestión de insumos
}
```

## Configuración Avanzada

### Variables de Entorno

Puedes cargar configuración desde variables de entorno:

```typescript
// En config/app.config.ts
export function loadConfig(): AppConfig {
  return {
    company: {
      name: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Confecciones Angus',
      logo: process.env.NEXT_PUBLIC_LOGO_URL || '/logo-confecciones.png',
      // ...
    },
    // ...
  }
}
```

Luego en `.env.local`:
```env
NEXT_PUBLIC_COMPANY_NAME=Mi Empresa
NEXT_PUBLIC_LOGO_URL=/mi-logo.png
NEXT_PUBLIC_CONTACT_EMAIL=contacto@miempresa.com
```

### Configuración por Base de Datos

Para un sistema multi-tenant real con múltiples clientes:

```typescript
export async function loadConfig(): Promise<AppConfig> {
  // Obtener tenant ID del dominio o subdomain
  const tenantId = getTenantId()
  
  // Cargar configuración desde base de datos
  const config = await supabase
    .from('tenant_configs')
    .select('*')
    .eq('id', tenantId)
    .single()
  
  return config.data
}
```

### Configuración por Subdomain

```typescript
export function loadConfig(): AppConfig {
  const subdomain = window.location.hostname.split('.')[0]
  
  switch(subdomain) {
    case 'angus':
      return confeccionesAngusConfig
    case 'sportmax':
      return sportMaxConfig
    case 'fashion':
      return fashionBoutiqueConfig
    default:
      return defaultConfig
  }
}
```

## Migración de Código Existente

### Antes (hardcoded):
```typescript
<h1>Confecciones Angus</h1>
<img src="/logo-confecciones.png" />
<p>Stock bajo: {stock < 6 ? 'Sí' : 'No'}</p>
```

### Después (parametrizado):
```typescript
const company = useCompanyInfo()
const inventory = useInventorySettings()

<h1>{company.name}</h1>
<img src={company.logo} />
<p>Stock bajo: {stock < inventory.lowStockThreshold ? 'Sí' : 'No'}</p>
```

## Checklist de Parametrización

- [x] Nombre de la empresa
- [x] Logo y favicon
- [x] Información de contacto
- [x] Redes sociales
- [x] Configuración de moneda y formato
- [x] Umbrales de inventario
- [x] Etiquetas de entidades
- [x] Características habilitadas
- [ ] Colores del tema (próxima mejora)
- [ ] Textos de marketing (próxima mejora)
- [ ] Configuración de email (próxima mejora)

## Próximas Mejoras

### 1. Temas Personalizables
```typescript
theme: {
  primaryColor: '#3b82f6',
  secondaryColor: '#8b5cf6',
  accentColor: '#06b6d4'
}
```

### 2. Textos de Marketing
```typescript
marketing: {
  heroTitle: 'Bienvenido a nuestra tienda',
  heroSubtitle: 'Los mejores productos',
  ctaButton: 'Ver Catálogo'
}
```

### 3. Configuración de Email
```typescript
email: {
  fromName: 'Confecciones Angus',
  fromEmail: 'noreply@confeccionesangus.cl',
  templates: {
    orderConfirmation: 'template-id-123'
  }
}
```

### 4. Configuración de Impresión
```typescript
printing: {
  showLogo: true,
  showAddress: true,
  footerText: 'Gracias por su compra'
}
```

## Soporte

Para configurar el sistema para tu empresa:

1. Revisa los ejemplos en `config/app.config.example.ts`
2. Modifica `config/app.config.ts` con tus datos
3. Agrega tus imágenes en la carpeta `public/`
4. Reinicia el servidor de desarrollo

Si necesitas ayuda, consulta la documentación o contacta al equipo de desarrollo.

## Conclusión

El sistema ahora es completamente parametrizable y puede ser usado por cualquier tipo de negocio. Solo necesitas modificar un archivo de configuración y agregar tus imágenes para tener una aplicación personalizada para tu empresa.
