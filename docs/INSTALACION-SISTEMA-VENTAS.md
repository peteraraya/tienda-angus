# Instalación del Sistema de Ventas

## Requisitos Previos

- Tener configurado Supabase
- Tener las tablas `productos` y `variantes` creadas
- Acceso al SQL Editor de Supabase

## Pasos de Instalación

### 1. Crear Tablas de Ventas

Ejecuta los siguientes scripts SQL en orden en el SQL Editor de Supabase:

#### Script 1: Crear tablas
```sql
-- Archivo: supabase/21-create-ventas-table.sql

-- Tabla de ventas (cabecera)
CREATE TABLE IF NOT EXISTS ventas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  descuento_total INTEGER DEFAULT 0,
  cantidad_items INTEGER NOT NULL,
  notas TEXT,
  vendedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de detalles de venta (items individuales)
CREATE TABLE IF NOT EXISTS venta_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  variante_id UUID NOT NULL REFERENCES variantes(id),
  producto_nombre TEXT NOT NULL,
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  precio_unitario INTEGER NOT NULL,
  descuento_porcentaje INTEGER DEFAULT 0,
  precio_final INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(vendedor);
CREATE INDEX IF NOT EXISTS idx_venta_items_venta_id ON venta_items(venta_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_producto_id ON venta_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_venta_items_variante_id ON venta_items(variante_id);
```

#### Script 2: Configurar políticas RLS
```sql
-- Archivo: supabase/22-policies-ventas.sql

-- Habilitar RLS
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;

-- Políticas para ventas
CREATE POLICY "Permitir lectura de ventas a todos"
  ON ventas FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de ventas a todos"
  ON ventas FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de ventas a todos"
  ON ventas FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de ventas a todos"
  ON ventas FOR DELETE USING (true);

-- Políticas para venta_items
CREATE POLICY "Permitir lectura de items de venta a todos"
  ON venta_items FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de items de venta a todos"
  ON venta_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir actualización de items de venta a todos"
  ON venta_items FOR UPDATE USING (true);

CREATE POLICY "Permitir eliminación de items de venta a todos"
  ON venta_items FOR DELETE USING (true);
```

### 2. Verificar Instalación

Ejecuta estas consultas para verificar que todo está correcto:

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('ventas', 'venta_items');

-- Verificar índices
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('ventas', 'venta_items');

-- Verificar políticas RLS
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('ventas', 'venta_items');
```

### 3. Acceder al Sistema

Una vez instalado, puedes acceder a:

- **Punto de Venta**: `http://localhost:3000/admin/ventas`
- **Historial**: `http://localhost:3000/admin/ventas/historial`

## Estructura de Archivos Creados

```
tienda-confecciones/
├── app/
│   └── admin/
│       └── ventas/
│           ├── page.tsx                    # Punto de venta
│           └── historial/
│               └── page.tsx                # Historial de ventas
├── supabase/
│   ├── 21-create-ventas-table.sql         # Crear tablas
│   └── 22-policies-ventas.sql             # Políticas RLS
├── types/
│   └── database.ts                         # Tipos actualizados
└── docs/
    ├── SISTEMA-VENTAS-POS.md              # Documentación completa
    └── INSTALACION-SISTEMA-VENTAS.md      # Este archivo
```

## Características Implementadas

### ✅ Punto de Venta
- Catálogo de productos con stock disponible
- Búsqueda y filtrado por categoría
- Selección de variantes (talla/colegio)
- Carrito de compra con gestión de cantidades
- Validación de stock en tiempo real
- Campo de notas opcional
- Confirmación antes de procesar
- Descuento automático de inventario

### ✅ Historial de Ventas
- Lista completa de transacciones
- Estadísticas generales (ventas, ingresos, items, promedio)
- Filtros por rango de fechas
- Vista detallada de cada venta
- Información del vendedor
- Visualización de items vendidos

### ✅ Base de Datos
- Tablas relacionales con integridad referencial
- Índices para optimizar consultas
- Políticas RLS configuradas
- Cascada en eliminación de ventas

## Datos de Prueba (Opcional)

Si quieres crear datos de prueba:

```sql
-- Insertar venta de prueba
INSERT INTO ventas (total, subtotal, descuento_total, cantidad_items, vendedor, notas)
VALUES (15000, 15000, 0, 2, 'admin@test.com', 'Venta de prueba');

-- Obtener el ID de la venta recién creada
SELECT id FROM ventas ORDER BY created_at DESC LIMIT 1;

-- Insertar items de prueba (reemplaza los UUIDs con valores reales)
INSERT INTO venta_items (
  venta_id, 
  producto_id, 
  variante_id, 
  producto_nombre, 
  talla, 
  colegio, 
  precio_unitario, 
  precio_final, 
  cantidad, 
  subtotal
)
VALUES (
  'uuid-de-la-venta',
  'uuid-del-producto',
  'uuid-de-la-variante',
  'Camisa Polo',
  'M',
  'Colegio A',
  7500,
  7500,
  2,
  15000
);
```

## Solución de Problemas

### Error: "relation ventas does not exist"
- Verifica que ejecutaste el script 21-create-ventas-table.sql
- Asegúrate de estar en el schema correcto (public)

### Error: "permission denied for table ventas"
- Ejecuta el script 22-policies-ventas.sql
- Verifica que RLS esté habilitado

### No aparecen productos en el POS
- Verifica que los productos tengan variantes con stock > 0
- Revisa que las tablas productos y variantes estén pobladas

### Stock no se descuenta
- Verifica que la función procesarVenta() se ejecute correctamente
- Revisa la consola del navegador para errores
- Verifica permisos de UPDATE en la tabla variantes

## Próximos Pasos

Después de la instalación, puedes:

1. **Probar el sistema**: Realiza una venta de prueba
2. **Revisar historial**: Verifica que se registró correctamente
3. **Verificar stock**: Confirma que se descontó del inventario
4. **Personalizar**: Ajusta estilos o funcionalidades según necesites

## Soporte

Para más información, consulta:
- `docs/SISTEMA-VENTAS-POS.md` - Documentación completa
- `app/admin/ventas/page.tsx` - Código del punto de venta
- `app/admin/ventas/historial/page.tsx` - Código del historial

---

**Versión**: 1.0.0
**Fecha**: 2024
**Estado**: ✅ Listo para producción
