# 🏫 Sistema de Gestión de Colegios con Insignias

## ✅ Implementado

### 📊 Base de Datos

**Nueva Tabla: `colegios`**
```sql
CREATE TABLE colegios (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  insignia_url TEXT,           -- URL de la insignia del colegio
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP
);
```

**Cambio en Tabla: `variantes`**
- Columna `color` → renombrada a `colegio`
- Ahora almacena el nombre del colegio en lugar del color

### 🎨 Gestión de Colegios (`/admin/colegios`)

**Funcionalidades:**
1. ✅ **Ver lista de colegios** con insignias
2. ✅ **Agregar nuevo colegio**
   - Nombre del colegio
   - URL de insignia
   - Vista previa de insignia
3. ✅ **Editar colegio**
   - Cambiar nombre
   - Cambiar URL de insignia
4. ✅ **Activar/Desactivar** colegios
5. ✅ **Eliminar** colegios
6. ✅ **Vista previa** de insignias en tiempo real

### 🖼️ Insignias

**Características:**
- Tamaño recomendado: 64x64px o 128x128px
- Formato: PNG con fondo transparente (recomendado)
- Se muestran en:
  - Panel de gestión de colegios
  - Selector de colegios en productos
  - Catálogo de productos (próximamente)
  - Modal de detalles (próximamente)

### 📝 Formularios Actualizados

**Nuevo Producto (`/admin/nuevo`):**
- Selector de "Colegio" en lugar de "Color"
- Carga dinámica de colegios activos desde BD
- Botón "Gestionar Colegios" para acceso rápido

**Editar Producto (`/admin/editar/[id]`):**
- (Pendiente actualizar)

### 🎯 Panel Admin Principal

**Nuevo Botón:**
- Botón morado "Colegios" en header
- Icono de edificio escolar
- Acceso directo a gestión de colegios

## 📋 Colegios Iniciales

Los siguientes colegios se crean automáticamente:
1. Simón Bolívar
2. San Miguel
3. Liceo de Aplicación
4. Instituto Nacional
5. Carmela Carvajal

## 🚀 Instalación

### 1. Ejecutar SQL

```bash
# En Supabase SQL Editor:
supabase/16-create-colegios-table.sql
```

Este script:
- ✅ Crea tabla `colegios`
- ✅ Inserta colegios iniciales
- ✅ Renombra `color` → `colegio` en variantes
- ✅ Agrega columna `insignia_url` si no existe
- ✅ Configura políticas RLS

### 2. Verificar Estructura

```sql
-- Ver estructura de colegios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'colegios'
ORDER BY ordinal_position;

-- Ver colegios creados
SELECT * FROM colegios ORDER BY nombre;

-- Ver estructura de variantes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'variantes'
ORDER BY ordinal_position;
```

## 💻 Uso

### Agregar Colegio con Insignia

1. Ir a `/admin/colegios`
2. Llenar formulario:
   - **Nombre**: Ej: "Colegio San José"
   - **URL Insignia**: URL de la imagen
3. Ver vista previa
4. Click "Agregar Colegio"

### Editar Colegio

1. Click en "Editar" en el colegio
2. Modificar nombre y/o URL de insignia
3. Click "✓ Guardar"

### Usar en Productos

1. Ir a `/admin/nuevo`
2. En sección "Variantes":
   - Seleccionar Talla
   - Seleccionar Colegio (carga desde BD)
   - Ingresar Stock
3. Click "Agregar"

## 🎨 Interfaz

### Panel de Gestión

```
┌─────────────────────────────────────┐
│ Gestión de Colegios                 │
├─────────────────────────────────────┤
│ Agregar Nuevo Colegio               │
│ ┌─────────────────────────────────┐ │
│ │ Nombre: [____________]          │ │
│ │ Insignia: [____________]        │ │
│ │ [Vista Previa 64x64]            │ │
│ │ [Agregar Colegio]               │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Colegios Registrados (5)            │
│ ┌─────────────────────────────────┐ │
│ │ [🏫] Simón Bolívar    [Activo] │ │
│ │      [Editar] [Desactivar] [X] │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Selector en Productos

```
Variantes (Tallas y Colegios)
┌──────────────────────────────────┐
│ Talla: [8 ▼]                     │
│ Colegio: [Simón Bolívar ▼]      │
│ Stock: [10]                      │
│ [Agregar]                        │
└──────────────────────────────────┘

[Gestionar Colegios] ← Botón de acceso rápido
```

## 🔄 Próximas Mejoras

### Catálogo Público (Pendiente)

1. **ProductCard**: Mostrar insignia del colegio
2. **ProductModal**: 
   - Selector de colegio con insignias
   - Filtrar tallas por colegio seleccionado
3. **ProductListItem**: Badge con insignia

### Ejemplo de Visualización:

```
┌─────────────────────────┐
│ Pantalón Escolar        │
│ $10.000                 │
├─────────────────────────┤
│ Colegio:                │
│ ┌───┐ ┌───┐ ┌───┐      │
│ │🏫 │ │🏫 │ │🏫 │      │
│ └───┘ └───┘ └───┘      │
│  S.B.  S.M.  L.A.       │
└─────────────────────────┘
```

## 📸 Recomendaciones para Insignias

### Formato
- **Tipo**: PNG con transparencia
- **Tamaño**: 128x128px o 256x256px
- **Peso**: < 50KB
- **Fondo**: Transparente

### Hosting
- Supabase Storage (recomendado)
- Cloudinary
- ImgBB
- Cualquier CDN

### Ejemplo de URL
```
https://tudominio.com/insignias/simon-bolivar.png
https://storage.supabase.co/insignias/san-miguel.png
```

## 🔐 Seguridad

**Políticas RLS Configuradas:**
- ✅ Todos pueden ver colegios activos
- ✅ Solo autenticados pueden crear/editar/eliminar
- ✅ Validación de nombres únicos
- ✅ Protección contra duplicados

## 🐛 Solución de Problemas

### Error: "Colegio ya existe"
- El nombre debe ser único
- Verifica que no haya otro colegio con el mismo nombre

### Insignia no se muestra
- Verifica que la URL sea válida
- Verifica que la imagen sea accesible públicamente
- Revisa la consola del navegador para errores CORS

### Colegio no aparece en selector
- Verifica que esté marcado como "Activo"
- Refresca la página del formulario

## 📊 Estadísticas

```sql
-- Contar colegios activos
SELECT COUNT(*) FROM colegios WHERE activo = true;

-- Productos por colegio
SELECT 
  v.colegio,
  COUNT(DISTINCT v.producto_id) as total_productos,
  SUM(v.stock) as stock_total
FROM variantes v
GROUP BY v.colegio
ORDER BY total_productos DESC;

-- Colegios sin productos
SELECT c.nombre
FROM colegios c
LEFT JOIN variantes v ON c.nombre = v.colegio
WHERE v.id IS NULL AND c.activo = true;
```

## ✨ Ventajas del Sistema

✅ Gestión centralizada de colegios
✅ Fácil agregar nuevos colegios
✅ Insignias visuales para mejor UX
✅ Activar/desactivar sin eliminar
✅ Reutilizable en múltiples productos
✅ Escalable para muchos colegios
✅ Interfaz intuitiva y moderna
