# Insignias de Colegios en Variantes

## Descripción

Las tarjetas de variantes en el panel administrativo muestran la insignia del colegio en miniatura junto al nombre, mejorando la identificación visual rápida. Si un colegio no tiene insignia configurada, se muestra un ícono de edificio por defecto.

## Implementación

### 1. Carga de Datos

La función `loadProductos()` carga las insignias de los colegios desde la tabla `colegios` con normalización de nombres:

```typescript
// Cargar colegios con sus insignias
const { data: colegiosData } = await supabase
  .from('colegios')
  .select('nombre, insignia_url')

// Crear mapa con normalización (trim) para evitar problemas de coincidencia
const colegiosMap = new Map(
  colegiosData?.map(c => [c.nombre.trim(), c.insignia_url]) || []
)

// Agregar insignia_url a cada variante
const variantesConInsignia = variantes?.map(v => ({
  ...v,
  insignia_url: colegiosMap.get(v.colegio.trim())
})) || []
```

### 2. Interfaz Actualizada

```typescript
interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string
  stock: number
  insignia_url?: string  // Nueva propiedad
}
```

### 3. Visualización con Fallback

En el componente `ProductListNotebook`, cada tarjeta de variante muestra:

- **Insignia**: Imagen de 40x40px (10x10 en Tailwind) con borde redondeado
- **Fallback**: Si no hay insignia, muestra un ícono SVG de edificio escolar
- **Nombre del colegio**: Texto en negrita, truncado si es muy largo
- **Talla**: Texto secundario debajo del nombre
- **Stock**: Badge de color según disponibilidad

```tsx
<div className="w-10 h-10 rounded-lg overflow-hidden bg-white dark:bg-slate-700 border-2 border-slate-300 dark:border-slate-600 flex-shrink-0 p-0.5">
  {variante.insignia_url ? (
    <img 
      src={variante.insignia_url} 
      alt={variante.colegio}
      className="w-full h-full object-contain"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
      <svg className="w-6 h-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  )}
</div>
```

## Características

### Diseño Responsivo
- La insignia tiene tamaño fijo (40x40px) para mantener consistencia
- Usa `flex-shrink-0` para evitar que se comprima
- El nombre del colegio usa `truncate` para textos largos
- Layout flex con gap de 10px entre elementos

### Modo Oscuro
- Fondo adaptativo: blanco en modo claro, slate-700 en modo oscuro
- Borde sutil que se adapta al tema
- La imagen usa `object-contain` para mantener proporciones
- Ícono fallback con colores adaptativos

### Fallback Inteligente
- Si no hay insignia (`!variante.insignia_url`), muestra ícono de edificio escolar
- El contenedor siempre se muestra, manteniendo el layout consistente
- Ícono SVG con colores sutiles que se adaptan al tema

### Normalización de Nombres
- Usa `.trim()` en nombres de colegios para evitar problemas con espacios
- Garantiza coincidencia correcta entre tablas `variantes` y `colegios`

## Beneficios

1. **Identificación Visual Rápida**: Las insignias permiten reconocer colegios de un vistazo
2. **Mejor UX**: Reduce el tiempo de búsqueda visual en listas largas
3. **Profesionalismo**: Añade un toque visual más pulido al panel
4. **Consistencia**: Usa las mismas insignias configuradas en el CRUD de colegios
5. **Robustez**: Siempre muestra algo, incluso sin insignia configurada

## Ubicación

Esta funcionalidad aparece en:
- Panel administrativo (`/admin`)
- Sección "Gestión Rápida de Variantes" (panel expandible)
- Cada tarjeta de variante individual

## Archivos Modificados

- `app/admin/page.tsx`: Función `loadProductos()` e interfaz `Variante`
- `app/admin/components/ProductListNotebook.tsx`: Renderizado de variantes con insignias y fallback

## Ejemplo Visual

```
┌─────────────────────────────────────┐
│ [🏫] Simón Bolívar            [4]  │
│      Talla: M                       │
│ [-1]  [✏️]  [+1]                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ [🏢] Colegio Sin Insignia     [2]  │
│      Talla: L                       │
│ [-1]  [✏️]  [+1]                   │
└─────────────────────────────────────┘
```

Donde `[🏫]` representa la insignia del colegio y `[🏢]` el ícono fallback.

## Notas Técnicas

- Las insignias se cargan una sola vez al inicio usando un `Map` para eficiencia
- No se hacen consultas adicionales por cada variante
- Normalización con `.trim()` previene errores por espacios en blanco
- El ícono fallback es un SVG inline, no requiere recursos externos
- Compatible con todos los navegadores modernos
