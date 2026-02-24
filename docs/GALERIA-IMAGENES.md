# 🖼️ Sistema de Galería de Imágenes Múltiples

## ✅ Funcionalidad Implementada

El sistema ahora soporta de 1 a 5 imágenes por producto con navegación completa para los clientes.

### Características:

#### 📱 Vista de Catálogo (ProductCard)
- **Navegación de imágenes** con flechas izquierda/derecha
- **Indicadores de puntos** en la parte inferior
- **Contador de imágenes** visible en hover
- **Transición suave** entre imágenes
- Los controles aparecen al hacer hover sobre la tarjeta

#### 🔍 Vista Detallada (ProductModal)
- **Galería completa** con imagen principal grande
- **Miniaturas** debajo de la imagen principal (hasta 5)
- **Navegación** con flechas laterales
- **Contador** de imagen actual (ej: "2 / 5")
- **Click en miniatura** para cambiar imagen principal
- **Borde azul** en la miniatura activa

#### 📋 Vista de Lista (ProductListItem)
- Muestra la **primera imagen**
- **Indicador de cantidad** de imágenes (ej: "🖼️ 3")
- Click para abrir modal con galería completa

#### ⚙️ Panel de Administración
- **Formulario de nuevo producto**: Agregar hasta 5 URLs de imágenes
- **Botón "+ Agregar otra imagen"** para añadir más campos
- **Vista previa** de todas las imágenes con numeración
- **Eliminar imágenes** individuales con botón ✕
- Mínimo 1 imagen, máximo 5

## 🗄️ Cambios en Base de Datos

### Ejecutar SQL:

```bash
# Conectarse a Supabase y ejecutar:
tienda-confecciones/supabase/14-add-multiple-images.sql
```

Este script:
1. Agrega columna `imagenes` (array de texto)
2. Migra datos existentes de `imagen_url` a `imagenes`
3. Mantiene `imagen_url` por compatibilidad (opcional eliminarlo después)

### Estructura:

```sql
-- Nueva columna
imagenes TEXT[] DEFAULT '{}'

-- Ejemplo de datos:
imagenes: ['https://url1.jpg', 'https://url2.jpg', 'https://url3.jpg']
```

## 🎨 Interfaz de Usuario

### Navegación en Tarjetas:
```
┌─────────────────────┐
│                     │
│  ← [IMAGEN] →       │  ← Flechas en hover
│                     │
│     • • ○ • •       │  ← Indicadores
└─────────────────────┘
```

### Modal con Galería:
```
┌──────────────────────────────┐
│  [Imagen Principal Grande]   │  ← Contador: 2/5
│  ← →                         │
├──────────────────────────────┤
│ [▣] [▣] [■] [▣] [▣]         │  ← Miniaturas
└──────────────────────────────┘
```

### Formulario Admin:
```
Imágenes del Producto (1-5)
┌────────────────────────────┐
│ URL imagen 1: [________] ✕ │
│ URL imagen 2: [________] ✕ │
│ URL imagen 3: [________] ✕ │
│ + Agregar otra imagen      │
└────────────────────────────┘

Vista Previa:
[1] [2] [3]  ← Miniaturas numeradas
```

## 🔧 Componentes Actualizados

### 1. `types/database.ts`
```typescript
export interface Producto {
  // ...
  imagen_url?: string    // Mantener compatibilidad
  imagenes?: string[]    // Nueva: array de URLs
}
```

### 2. `ProductCard.tsx`
- Estado `currentImageIndex` para navegación
- Funciones `nextImage()` y `prevImage()`
- Indicadores de puntos interactivos
- Flechas de navegación en hover

### 3. `ProductModal.tsx`
- Galería completa con imagen principal
- Grid de miniaturas (5 columnas)
- Navegación con flechas
- Contador de imágenes

### 4. `ProductListItem.tsx`
- Muestra primera imagen
- Badge con cantidad de imágenes

### 5. `app/admin/nuevo/page.tsx`
- Array de `imagenes` en estado
- Funciones para agregar/actualizar/eliminar
- Vista previa con grid
- Validación (1-5 imágenes)

## 📝 Uso

### Agregar Producto con Múltiples Imágenes:

1. Ir a `/admin/nuevo`
2. Llenar datos del producto
3. En "Imágenes del Producto":
   - Pegar URL de primera imagen
   - Click en "+ Agregar otra imagen"
   - Pegar más URLs (hasta 5)
   - Ver vista previa abajo
4. Agregar variantes
5. Guardar

### Navegación para Clientes:

1. **En catálogo**: Hover sobre producto → usar flechas o puntos
2. **En modal**: Click en producto → usar flechas o miniaturas
3. **En lista**: Ver indicador de cantidad → click para modal

## 🎯 Ventajas

✅ Mejor experiencia de usuario
✅ Más información visual del producto
✅ Navegación intuitiva
✅ Compatible con productos existentes
✅ Responsive en móvil y desktop
✅ Indicadores visuales claros
✅ Fácil de usar en admin

## 🔄 Compatibilidad

- **Productos antiguos** con solo `imagen_url`: Funcionan normalmente
- **Productos nuevos** con `imagenes[]`: Usan galería completa
- **Migración automática**: El SQL migra datos existentes
- **Fallback**: Si no hay imágenes, muestra placeholder

## 🚀 Próximas Mejoras Sugeridas

1. **Upload directo** a Supabase Storage (sin URLs externas)
2. **Drag & drop** para reordenar imágenes
3. **Zoom** en imagen principal del modal
4. **Lightbox** para ver imágenes a pantalla completa
5. **Lazy loading** de imágenes para mejor performance
6. **Compresión automática** de imágenes
7. **Edición de imágenes** en formulario de editar producto
