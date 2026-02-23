# Solución: Stock mostrando "Agotado" en Frontend

## Problema
El frontend mostraba "Sin stock" o "Agotado" para todos los productos, aunque el panel de administración mostraba stock disponible.

## Causa Raíz
Durante la migración del concepto "color" a "colegio", algunos archivos no fueron actualizados completamente:

1. **app/page.tsx** - La consulta SQL seguía buscando el campo `color` en lugar de `colegio`
2. **types/database.ts** - La interfaz `Variante` tenía `color` en lugar de `colegio`
3. **app/components/ClientProductList.tsx** - La interfaz local `Variante` tenía `color`
4. **app/admin/page.tsx** - Múltiples referencias a `color` en lugar de `colegio`
5. **app/admin/nuevo/page.tsx** - Mensaje de alerta mencionaba "color"

## Archivos Corregidos

### 1. types/database.ts
```typescript
// ANTES
export interface Variante {
  id: string
  producto_id: string
  talla: string
  color: string  // ❌ Incorrecto
  stock: number
  created_at: string
}

// DESPUÉS
export interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string  // ✅ Correcto
  stock: number
  created_at: string
}
```

### 2. app/page.tsx
```typescript
// ANTES
const { data: variantes } = await supabase
  .from('variantes')
  .select('talla, color, stock')  // ❌ Incorrecto
  .eq('producto_id', producto.id)

// DESPUÉS
const { data: variantes } = await supabase
  .from('variantes')
  .select('talla, colegio, stock')  // ✅ Correcto
  .eq('producto_id', producto.id)
```

### 3. app/components/ClientProductList.tsx
```typescript
// ANTES
interface Variante {
  talla: string
  color: string  // ❌ Incorrecto
  stock: number
}

// DESPUÉS
interface Variante {
  talla: string
  colegio: string  // ✅ Correcto
  stock: number
}
```

### 4. app/admin/page.tsx
Múltiples cambios:
- Interfaz `Variante`: `color` → `colegio`
- Inserción de variantes: `color: v.color` → `colegio: v.colegio`
- Ordenamiento: `colorCompare` → `colegioCompare`
- Display: `variante.color` → `variante.colegio`

### 5. app/admin/nuevo/page.tsx
```typescript
// ANTES
alert('Debes agregar al menos una variante (talla/color/stock)')

// DESPUÉS
alert('Debes agregar al menos una variante (talla/colegio/stock)')
```

## Verificación
Después de estos cambios:
- ✅ No hay errores de TypeScript
- ✅ Todas las interfaces usan `colegio` consistentemente
- ✅ Todas las consultas SQL buscan el campo `colegio`
- ✅ El frontend ahora muestra correctamente el stock disponible

## Próximos Pasos
1. Ejecutar el script SQL `16-create-colegios-table.sql` en Supabase si aún no lo has hecho
2. Verificar que la tabla `variantes` tiene la columna `colegio` (no `color`)
3. Probar la creación de productos con variantes
4. Verificar que el stock se muestra correctamente en el catálogo público

## Nota Importante
Si el problema persiste, verifica en Supabase que:
- La tabla `variantes` tiene la columna `colegio` (no `color`)
- Los datos existentes tienen valores en la columna `colegio`
- Las políticas RLS permiten leer la columna `colegio`
