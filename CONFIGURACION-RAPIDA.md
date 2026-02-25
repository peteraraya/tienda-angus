# Configuración Rápida para Tu Empresa

## 🚀 Inicio Rápido (5 minutos)

### 1. Edita el archivo de configuración
Abre `config/app.config.ts` y modifica:

```typescript
export const defaultConfig: AppConfig = {
  company: {
    name: 'TU EMPRESA AQUÍ',           // ← Cambia esto
    shortName: 'TU EMPRESA',           // ← Cambia esto
    tagline: 'Tu slogan aquí',         // ← Cambia esto
    description: 'Descripción',        // ← Cambia esto
    logo: '/tu-logo.png',              // ← Cambia esto
    favicon: '/tu-favicon.png'         // ← Cambia esto
  },
  
  contact: {
    email: 'tu@email.com',             // ← Cambia esto
    phone: '+56 9 1234 5678',          // ← Cambia esto
    whatsapp: '+56912345678',          // ← Cambia esto (opcional)
    address: 'Tu dirección',           // ← Cambia esto (opcional)
  },
  
  // ... el resto puede quedar igual por ahora
}
```

### 2. Agrega tus imágenes
- Coloca tu logo en `public/tu-logo.png`
- Coloca tu favicon en `public/tu-favicon.png`

### 3. Reinicia el servidor
```bash
npm run dev
```

¡Listo! Tu aplicación ahora muestra el nombre y logo de tu empresa.

## 📝 Personalización Avanzada

### Cambiar etiquetas (opcional)
Si quieres cambiar nombres como "Colegios" por "Equipos" o "Marcas":

```typescript
labels: {
  schools: 'Equipos',      // En lugar de "Colegios"
  school: 'Equipo',
  products: 'Artículos',   // En lugar de "Productos"
  // ... etc
}
```

### Deshabilitar características (opcional)
Si no necesitas ciertas funciones:

```typescript
features: {
  enableSchools: false,      // Si no necesitas colegios/equipos
  enableSuppliers: true,
  enableSupplies: true,
  // ... etc
}
```

### Cambiar umbrales de stock (opcional)
```typescript
inventory: {
  lowStockThreshold: 10,     // Stock bajo cuando hay 10 o menos
  criticalStockThreshold: 3  // Stock crítico cuando hay 3 o menos
}
```

## 📚 Documentación Completa
Ver `docs/CONFIGURACION-MULTI-TENANT.md` para más detalles.

## 💡 Ejemplos
Ver `config/app.config.example.ts` para ejemplos de diferentes tipos de negocio.
