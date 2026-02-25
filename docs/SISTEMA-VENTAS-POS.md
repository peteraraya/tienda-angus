# Sistema de Punto de Venta (POS)

## Descripción General

Sistema completo de punto de venta integrado en el panel de administración que permite:
- Registrar ventas con múltiples productos y variantes
- Descontar automáticamente del inventario
- Mantener historial completo de transacciones
- Generar estadísticas de ventas
- Filtrar ventas por fecha

## Estructura de Base de Datos

### Tabla: `ventas`
Almacena la información principal de cada venta.

```sql
CREATE TABLE ventas (
  id UUID PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE,
  total INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  descuento_total INTEGER DEFAULT 0,
  cantidad_items INTEGER NOT NULL,
  notas TEXT,
  vendedor TEXT,
  created_at TIMESTAMP WITH TIME ZONE
);
```

**Campos:**
- `id`: Identificador único de la venta
- `fecha`: Fecha y hora de la venta
- `total`: Monto total de la venta (después de descuentos)
- `subtotal`: Suma de todos los items
- `descuento_total`: Total de descuentos aplicados
- `cantidad_items`: Número total de items vendidos
- `notas`: Observaciones opcionales de la venta
- `vendedor`: Email o nombre del administrador que realizó la venta

### Tabla: `venta_items`
Almacena el detalle de cada producto vendido.

```sql
CREATE TABLE venta_items (
  id UUID PRIMARY KEY,
  venta_id UUID REFERENCES ventas(id),
  producto_id UUID REFERENCES productos(id),
  variante_id UUID REFERENCES variantes(id),
  producto_nombre TEXT NOT NULL,
  talla TEXT NOT NULL,
  colegio TEXT NOT NULL,
  precio_unitario INTEGER NOT NULL,
  descuento_porcentaje INTEGER DEFAULT 0,
  precio_final INTEGER NOT NULL,
  cantidad INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE
);
```

**Campos:**
- `venta_id`: Referencia a la venta principal
- `producto_id`: Referencia al producto (para estadísticas)
- `variante_id`: Referencia a la variante específica
- `producto_nombre`: Nombre del producto (guardado por si se elimina)
- `talla`: Talla vendida
- `colegio`: Colegio de la variante
- `precio_unitario`: Precio original del producto
- `descuento_porcentaje`: Descuento aplicado (%)
- `precio_final`: Precio después del descuento
- `cantidad`: Unidades vendidas
- `subtotal`: precio_final × cantidad

## Componentes

### 1. Punto de Venta (`/admin/ventas`)

**Características:**
- Vista dividida en dos paneles:
  - Panel izquierdo: Catálogo de productos
  - Panel derecho: Carrito de compra
- Búsqueda y filtrado de productos
- Solo muestra productos con stock disponible
- Selección de variantes (talla/colegio)
- Gestión de cantidades en el carrito
- Validación de stock disponible
- Campo de notas opcional
- Confirmación antes de procesar venta

**Funcionalidades:**
```typescript
// Agregar producto al carrito
agregarAlCarrito(producto, variante)

// Actualizar cantidad
actualizarCantidad(variante_id, nuevaCantidad)

// Eliminar del carrito
eliminarDelCarrito(variante_id)

// Vaciar carrito completo
vaciarCarrito()

// Procesar venta
procesarVenta()
```

### 2. Historial de Ventas (`/admin/ventas/historial`)

**Características:**
- Lista completa de ventas ordenadas por fecha
- Estadísticas generales:
  - Total de ventas
  - Ingresos totales
  - Items vendidos
  - Promedio por venta
- Filtros por rango de fechas
- Vista expandible de detalles de cada venta
- Información del vendedor
- Notas de la venta

**Estadísticas:**
```typescript
const stats = {
  totalVentas: number,      // Cantidad de ventas
  totalIngresos: number,    // Suma de todos los totales
  totalItems: number,       // Suma de items vendidos
  promedioVenta: number     // Ingreso promedio por venta
}
```

## Flujo de Venta

### 1. Selección de Productos
```
Usuario → Busca producto → Selecciona variante → Agrega al carrito
```

### 2. Gestión del Carrito
```
Carrito → Ajusta cantidades → Agrega más productos → Revisa total
```

### 3. Procesamiento
```
Confirmar venta → Validar stock → Crear registro → Descontar inventario → Limpiar carrito
```

### 4. Descuento de Inventario
```sql
-- Para cada item en el carrito:
UPDATE variantes 
SET stock = stock - cantidad_vendida 
WHERE id = variante_id
```

## Validaciones

### Stock Disponible
- No permite agregar más unidades que el stock disponible
- Muestra advertencia al alcanzar el límite
- Valida stock antes de procesar la venta

### Carrito Vacío
- No permite procesar venta con carrito vacío
- Muestra mensaje de error

### Confirmación
- Requiere confirmación explícita antes de procesar
- Muestra resumen de la venta en el diálogo

## Cálculos

### Precio Final por Item
```typescript
const precio_final = descuento_porcentaje > 0
  ? precio_unitario - (precio_unitario * descuento_porcentaje / 100)
  : precio_unitario
```

### Subtotal por Item
```typescript
const subtotal_item = precio_final * cantidad
```

### Totales de la Venta
```typescript
const subtotal = sum(items.map(i => i.precio_final * i.cantidad))
const descuento_total = sum(items.map(i => 
  (i.precio_unitario - i.precio_final) * i.cantidad
))
const total = subtotal
const cantidad_items = sum(items.map(i => i.cantidad))
```

## Interfaz de Usuario

### Panel de Productos
- **Búsqueda**: Campo de texto para filtrar por nombre/categoría
- **Filtro de categoría**: Dropdown con todas las categorías
- **Tarjetas de producto**: 
  - Imagen del producto
  - Nombre y categoría
  - Precio (con descuento si aplica)
  - Grid de variantes disponibles
  - Indicador de stock por variante

### Panel del Carrito
- **Header**: Título con contador de items
- **Lista de items**:
  - Nombre del producto
  - Variante (colegio y talla)
  - Controles de cantidad (+/-)
  - Precio unitario y subtotal
  - Botón eliminar
- **Resumen**:
  - Cantidad de items
  - Descuentos aplicados
  - Total a pagar
- **Campo de notas**: Textarea opcional
- **Acciones**:
  - Botón "Vaciar" (gris)
  - Botón "Procesar Venta" (verde)

### Historial
- **Estadísticas**: 4 tarjetas con métricas principales
- **Filtros**: Fecha inicio y fecha fin
- **Lista de ventas**:
  - ID corto de la venta
  - Fecha y hora
  - Vendedor
  - Cantidad de items
  - Total
  - Notas (si hay)
  - Botón expandir para ver detalle

## Permisos y Seguridad

### Políticas RLS
```sql
-- Todas las operaciones permitidas para usuarios autenticados
CREATE POLICY "Permitir todo a autenticados"
  ON ventas FOR ALL
  USING (true);

CREATE POLICY "Permitir todo a autenticados"
  ON venta_items FOR ALL
  USING (true);
```

### Registro de Vendedor
```typescript
const { data: { user } } = await supabase.auth.getUser()
const vendedor = user?.email || 'Administrador'
```

## Casos de Uso

### Caso 1: Venta Simple
```
1. Admin accede a /admin/ventas
2. Busca "Camisa Polo"
3. Selecciona variante "Colegio A - Talla M"
4. Producto se agrega al carrito con cantidad 1
5. Revisa total
6. Click en "Procesar Venta"
7. Confirma en el diálogo
8. Sistema:
   - Crea registro en ventas
   - Crea item en venta_items
   - Descuenta 1 unidad del stock de la variante
   - Muestra mensaje de éxito
   - Limpia el carrito
```

### Caso 2: Venta Múltiple
```
1. Admin agrega varios productos al carrito
2. Ajusta cantidades según necesidad
3. Agrega notas: "Venta para evento escolar"
4. Procesa la venta
5. Sistema procesa todos los items en una transacción
```

### Caso 3: Consulta de Historial
```
1. Admin accede a /admin/ventas/historial
2. Ve estadísticas generales
3. Filtra por rango de fechas
4. Expande una venta para ver detalle
5. Revisa productos vendidos y cantidades
```

## Reportes y Estadísticas

### Métricas Disponibles
- **Total de ventas**: Cantidad de transacciones
- **Ingresos totales**: Suma de todos los totales
- **Items vendidos**: Suma de todas las cantidades
- **Promedio por venta**: Ingresos / Cantidad de ventas

### Filtros
- **Por fecha**: Rango de fechas personalizado
- **Por vendedor**: (futuro) Filtrar por admin específico
- **Por producto**: (futuro) Ventas de un producto específico

## Integraciones

### Con Inventario
- Descuento automático de stock al procesar venta
- Validación de stock disponible antes de agregar al carrito
- Actualización en tiempo real del stock

### Con Productos
- Guarda nombre del producto por si se elimina
- Mantiene referencia al producto para estadísticas
- Preserva precios y descuentos al momento de la venta

## Mejoras Futuras

### Funcionalidades Pendientes
- [ ] Impresión de ticket de venta
- [ ] Exportar historial a Excel/PDF
- [ ] Gráficos de ventas por período
- [ ] Productos más vendidos
- [ ] Ventas por categoría
- [ ] Ventas por colegio
- [ ] Devoluciones y reembolsos
- [ ] Descuentos manuales por venta
- [ ] Métodos de pago (efectivo, tarjeta, transferencia)
- [ ] Caja diaria (apertura/cierre)
- [ ] Múltiples vendedores con permisos
- [ ] Notificaciones de stock bajo después de venta

### Optimizaciones
- [ ] Caché de productos frecuentes
- [ ] Búsqueda por código de barras
- [ ] Atajos de teclado para POS
- [ ] Modo offline con sincronización
- [ ] Vista de impresión optimizada

## Mantenimiento

### Respaldo de Datos
```sql
-- Exportar ventas del mes
SELECT * FROM ventas 
WHERE fecha >= date_trunc('month', CURRENT_DATE);

-- Exportar items de ventas del mes
SELECT vi.* FROM venta_items vi
JOIN ventas v ON vi.venta_id = v.id
WHERE v.fecha >= date_trunc('month', CURRENT_DATE);
```

### Limpieza de Datos
```sql
-- Eliminar ventas antiguas (opcional, con precaución)
DELETE FROM ventas 
WHERE fecha < NOW() - INTERVAL '2 years';
```

### Auditoría
```sql
-- Ventas por vendedor
SELECT vendedor, COUNT(*) as total_ventas, SUM(total) as ingresos
FROM ventas
GROUP BY vendedor
ORDER BY ingresos DESC;

-- Productos más vendidos
SELECT producto_nombre, SUM(cantidad) as total_vendido
FROM venta_items
GROUP BY producto_nombre
ORDER BY total_vendido DESC
LIMIT 10;
```

## Solución de Problemas

### Stock negativo
Si el stock queda negativo por error:
```sql
UPDATE variantes 
SET stock = 0 
WHERE stock < 0;
```

### Venta sin items
No debería ocurrir por validación, pero si sucede:
```sql
DELETE FROM ventas 
WHERE id NOT IN (SELECT DISTINCT venta_id FROM venta_items);
```

### Inconsistencia en totales
Recalcular totales de una venta:
```sql
UPDATE ventas v
SET 
  subtotal = (SELECT SUM(subtotal) FROM venta_items WHERE venta_id = v.id),
  cantidad_items = (SELECT SUM(cantidad) FROM venta_items WHERE venta_id = v.id)
WHERE id = 'venta_id_aqui';
```

---

**Última actualización**: Sistema de Ventas POS
**Versión**: 1.0.0
**Estado**: ✅ Implementado y Funcional
