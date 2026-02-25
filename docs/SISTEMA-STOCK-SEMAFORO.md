# Sistema de Semáforo de Stock

## Descripción
Sistema visual de indicadores de stock implementado en toda la aplicación para facilitar la gestión de inventario.

## Umbrales de Stock

### 🟢 Stock Disponible
- **Criterio:** Más de 6 unidades (`stock > 6`)
- **Color:** Verde
- **Significado:** Inventario saludable, no requiere atención inmediata

### 🟡 Stock Bajo
- **Criterio:** Entre 1 y 6 unidades (`stock >= 1 && stock <= 6`)
- **Color:** Amarillo/Naranja
- **Significado:** Requiere atención, considerar reabastecimiento

### 🔴 Stock Agotado
- **Criterio:** 0 unidades (`stock === 0`)
- **Color:** Rojo
- **Significado:** Sin inventario, requiere reabastecimiento urgente

## Implementación

### Dashboard (DashboardSummary.tsx)
El dashboard muestra tarjetas con:
- **Disponibles:** Suma de UNIDADES con stock > 6
- **Stock Bajo:** Suma de UNIDADES con stock entre 1-6
- **Agotados:** Cantidad de VARIANTES con stock = 0

```typescript
// Sumar UNIDADES de stock disponible (stock > 6)
const unidadesDisponibles = todasLasVariantes.reduce((total, v) => {
  return v.stock > 6 ? total + v.stock : total
}, 0)

// Sumar UNIDADES de stock bajo (1-6)
const unidadesStockBajo = todasLasVariantes.reduce((total, v) => {
  return v.stock > 0 && v.stock <= 6 ? total + v.stock : total
}, 0)
```

### Filtros de Stock
El panel admin incluye un filtro de stock con opciones:
- 🟢 Stock disponible (+6)
- 🟡 Stock bajo (1-6)
- 🔴 Agotados (0)

### Colores en Componentes

#### ProductListNotebook (Admin)
- Vista desktop y móvil usan los mismos umbrales
- Badge de stock muestra color según nivel
- Panel de variantes muestra color individual por variante

#### ProductCard y ProductListItem (Tienda)
- Muestran badge de stock con colores del semáforo
- Ayudan al cliente a identificar disponibilidad

## Consistencia
Todos los componentes usan los mismos umbrales:
- `tienda-confecciones/app/admin/components/DashboardSummary.tsx`
- `tienda-confecciones/app/admin/components/ProductListNotebook.tsx`
- `tienda-confecciones/app/components/ProductCard.tsx`
- `tienda-confecciones/app/components/ProductListItem.tsx`
- `tienda-confecciones/app/admin/page.tsx` (filtros)

## Beneficios
1. **Visual:** Identificación rápida del estado del inventario
2. **Consistente:** Mismos criterios en toda la aplicación
3. **Accionable:** Facilita decisiones de reabastecimiento
4. **Intuitivo:** Colores universalmente reconocidos (semáforo)
