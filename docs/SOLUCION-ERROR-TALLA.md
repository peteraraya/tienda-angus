# 🔧 Solución: Error "null value in column talla"

## ❌ Problema

Al intentar crear un producto, aparece el error:
```
"code": "23502"
"message": "null value in column \"talla\" of relation \"productos\" violates not-null constraint"
```

## 🔍 Causa

La tabla `productos` en tu base de datos tiene columnas que NO deberían existir:
- `talla`
- `color` 
- `stock`

Estas columnas solo deben estar en la tabla `variantes`, NO en `productos`.

## ✅ Solución

### Opción 1: Ejecutar Script SQL (Recomendado)

1. Abre Supabase Dashboard
2. Ve a SQL Editor
3. Ejecuta el archivo: `supabase/15-fix-productos-schema.sql`

Este script:
- ✅ Elimina las columnas incorrectas (`talla`, `color`, `stock`)
- ✅ Agrega las columnas correctas si faltan (`descuento_porcentaje`, `en_oferta`, `imagenes`)
- ✅ Muestra la estructura final de la tabla

### Opción 2: Recrear las Tablas (Si la Opción 1 no funciona)

Si tienes datos importantes, **haz backup primero**.

```sql
-- 1. Hacer backup de datos existentes
CREATE TABLE productos_backup AS SELECT * FROM productos;
CREATE TABLE variantes_backup AS SELECT * FROM variantes;

-- 2. Eliminar tablas
DROP TABLE IF EXISTS variantes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;

-- 3. Ejecutar scripts en orden:
-- supabase/01-create-tables.sql
-- supabase/02-create-variantes.sql
-- supabase/13-add-discount-fields.sql
-- supabase/14-add-multiple-images.sql

-- 4. Restaurar datos (ajustar según tu estructura)
-- INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url)
-- SELECT nombre, descripcion, precio, categoria, imagen_url FROM productos_backup;
```

## 📋 Estructura Correcta

### Tabla `productos`:
```sql
CREATE TABLE productos (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  imagen_url TEXT,
  imagenes TEXT[],
  descuento_porcentaje INTEGER DEFAULT 0,
  en_oferta BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Tabla `variantes`:
```sql
CREATE TABLE variantes (
  id UUID PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  talla TEXT NOT NULL,
  color TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🧪 Verificar Solución

Después de ejecutar el script, verifica la estructura:

```sql
-- Ver columnas de productos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'productos'
ORDER BY ordinal_position;

-- Ver columnas de variantes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'variantes'
ORDER BY ordinal_position;
```

### Resultado Esperado para `productos`:
```
column_name           | data_type | is_nullable
----------------------|-----------|------------
id                    | uuid      | NO
nombre                | text      | NO
descripcion           | text      | NO
precio                | numeric   | NO
categoria             | text      | NO
imagen_url            | text      | YES
imagenes              | ARRAY     | YES
descuento_porcentaje  | integer   | YES
en_oferta             | boolean   | YES
created_at            | timestamp | YES
```

### Resultado Esperado para `variantes`:
```
column_name  | data_type | is_nullable
-------------|-----------|------------
id           | uuid      | NO
producto_id  | uuid      | NO
talla        | text      | NO
color        | text      | NO
stock        | integer   | NO
created_at   | timestamp | YES
```

## 🎯 Probar Creación de Producto

Después de corregir el esquema, intenta crear un producto nuevamente:

1. Ve a `/admin/nuevo`
2. Llena el formulario:
   - Nombre: "Producto Test"
   - Descripción: "Descripción del producto"
   - Precio: 10000
   - Categoría: "Pantalón"
   - Imagen: URL válida
3. Agrega al menos una variante:
   - Talla: 8
   - Color: Azul
   - Stock: 10
4. Click en "Crear Producto"

Debería funcionar sin errores.

## 🚨 Si el Error Persiste

1. **Verifica las políticas RLS:**
   ```sql
   -- Ver políticas de productos
   SELECT * FROM pg_policies WHERE tablename = 'productos';
   ```

2. **Verifica que no haya triggers problemáticos:**
   ```sql
   -- Ver triggers de productos
   SELECT * FROM pg_trigger WHERE tgrelid = 'productos'::regclass;
   ```

3. **Revisa los logs de Supabase:**
   - Dashboard → Logs → Database
   - Busca errores relacionados con la tabla productos

## 📞 Soporte Adicional

Si el problema continúa:
1. Exporta el esquema actual:
   ```sql
   SELECT 
       table_name,
       column_name,
       data_type,
       is_nullable,
       column_default
   FROM information_schema.columns
   WHERE table_schema = 'public'
   AND table_name IN ('productos', 'variantes')
   ORDER BY table_name, ordinal_position;
   ```

2. Comparte el resultado para diagnóstico más detallado.
