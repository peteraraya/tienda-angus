# Sistema de Gestión de Clientes

## Descripción General

Sistema completo de gestión de clientes integrado en el punto de venta que permite:
- Registrar clientes con información de contacto
- Buscar clientes existentes con autocomplete
- Asociar ventas a clientes específicos
- Mantener historial de compras por cliente
- Actualizar estadísticas automáticamente

## Estructura de Base de Datos

### Tabla: `clientes`

```sql
CREATE TABLE clientes (
  id UUID PRIMARY KEY,
  nombre TEXT NOT NULL,
  contacto TEXT NOT NULL,
  telefono TEXT NOT NULL,
  red_social TEXT,
  direccion TEXT,
  notas TEXT,
  total_compras INTEGER DEFAULT 0,
  cantidad_compras INTEGER DEFAULT 0,
  ultima_compra TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Campos Obligatorios:**
- `nombre`: Nombre completo del cliente
- `contacto`: Email o nombre de contacto
- `telefono`: Número de teléfono

**Campos Opcionales:**
- `red_social`: Usuario de Instagram, Facebook, etc.
- `direccion`: Dirección de entrega
- `notas`: Observaciones adicionales

**Campos Automáticos:**
- `total_compras`: Total histórico gastado (se actualiza con cada venta)
- `cantidad_compras`: Número de compras realizadas
- `ultima_compra`: Fecha de la última compra

### Relación con Ventas

La tabla `ventas` ahora incluye:
```sql
ALTER TABLE ventas ADD COLUMN cliente_id UUID REFERENCES clientes(id);
ALTER TABLE ventas ADD COLUMN cliente_nombre TEXT;
ALTER TABLE ventas ADD COLUMN cliente_telefono TEXT;
ALTER TABLE ventas ADD COLUMN cliente_contacto TEXT;
```

**Estrategia de datos:**
- `cliente_id`: Referencia para estadísticas y consultas
- `cliente_nombre`, `cliente_telefono`, `cliente_contacto`: Datos preservados por si el cliente se elimina

## Componente: ClienteAutocomplete

### Características

1. **Búsqueda Inteligente**
   - Autocomplete con mínimo 2 caracteres
   - Busca por nombre, teléfono o contacto
   - Resultados ordenados por cantidad de compras
   - Límite de 5 sugerencias

2. **Creación Rápida**
   - Formulario inline para nuevo cliente
   - Validación de campos obligatorios
   - Creación y selección automática

3. **Visualización Clara**
   - Tarjeta con información completa del cliente seleccionado
   - Indicador de compras anteriores
   - Botón para cambiar selección

### Estados del Componente

#### Estado 1: Sin Cliente Seleccionado
```tsx
<ClienteAutocomplete
  selectedCliente={null}
  onClienteSelect={setSelectedCliente}
/>
```
Muestra:
- Campo de búsqueda con placeholder
- Botón "Nuevo Cliente"
- Sugerencias al escribir

#### Estado 2: Cliente Seleccionado
```tsx
<ClienteAutocomplete
  selectedCliente={cliente}
  onClienteSelect={setSelectedCliente}
/>
```
Muestra:
- Tarjeta verde con información del cliente
- Datos de contacto
- Historial de compras
- Botón para limpiar selección

#### Estado 3: Formulario Nuevo Cliente
Muestra:
- Formulario con campos obligatorios y opcionales
- Botón "Crear Cliente"
- Botón para cancelar

## Flujo de Uso

### Caso 1: Cliente Existente

```
1. Usuario escribe en el campo de búsqueda
2. Sistema busca en tiempo real
3. Aparecen sugerencias
4. Usuario selecciona cliente
5. Se muestra tarjeta con información
6. Usuario puede procesar venta
```

### Caso 2: Cliente Nuevo

```
1. Usuario click en "Nuevo Cliente"
2. Se muestra formulario
3. Usuario completa campos obligatorios
4. Click en "Crear Cliente"
5. Cliente se crea y selecciona automáticamente
6. Usuario puede procesar venta
```

### Caso 3: Cambiar Cliente

```
1. Usuario click en X en tarjeta del cliente
2. Se limpia selección
3. Vuelve al estado de búsqueda
4. Usuario puede buscar otro cliente
```

## Integración con Ventas

### Validación Obligatoria

```typescript
async function procesarVenta() {
  if (!selectedCliente) {
    toast.error('Debes seleccionar un cliente para procesar la venta')
    return
  }
  // ... resto del proceso
}
```

### Actualización de Estadísticas

Al procesar una venta:
```typescript
await supabase
  .from('clientes')
  .update({
    total_compras: selectedCliente.total_compras + totales.total,
    cantidad_compras: selectedCliente.cantidad_compras + 1,
    ultima_compra: new Date().toISOString()
  })
  .eq('id', selectedCliente.id)
```

### Preservación de Datos

```typescript
const { data: venta } = await supabase
  .from('ventas')
  .insert({
    // ... otros campos
    cliente_id: selectedCliente.id,
    cliente_nombre: selectedCliente.nombre,
    cliente_telefono: selectedCliente.telefono,
    cliente_contacto: selectedCliente.contacto
  })
```

## Búsqueda y Autocomplete

### Query de Búsqueda

```typescript
const { data } = await supabase
  .from('clientes')
  .select('*')
  .or(`nombre.ilike.%${term}%,telefono.ilike.%${term}%,contacto.ilike.%${term}%`)
  .order('cantidad_compras', { ascending: false })
  .limit(5)
```

**Características:**
- Búsqueda case-insensitive
- Busca en múltiples campos
- Prioriza clientes frecuentes
- Limita resultados para rendimiento

### Índices de Base de Datos

```sql
CREATE INDEX idx_clientes_nombre ON clientes USING gin(to_tsvector('spanish', nombre));
CREATE INDEX idx_clientes_telefono ON clientes(telefono);
CREATE INDEX idx_clientes_contacto ON clientes(contacto);
```

## Interfaz de Usuario

### Campo de Búsqueda
- Fondo amarillo (indica obligatorio)
- Placeholder descriptivo
- Icono de usuario
- Mensaje de ayuda (mínimo 2 caracteres)

### Sugerencias
- Dropdown con fondo blanco
- Borde amarillo
- Hover con fondo amarillo claro
- Información completa por cliente:
  - Nombre en negrita
  - Teléfono con icono 📞
  - Contacto con icono 📧
  - Badge de compras anteriores 💚

### Cliente Seleccionado
- Tarjeta verde (indica éxito)
- Icono de usuario
- Información organizada
- Botón X para limpiar

### Formulario Nuevo Cliente
- Tarjeta azul
- Campos claramente etiquetados
- Asterisco (*) en obligatorios
- Botón de crear destacado

## Validaciones

### Frontend
```typescript
if (!nuevoCliente.nombre || !nuevoCliente.contacto || !nuevoCliente.telefono) {
  alert('Nombre, contacto y teléfono son obligatorios')
  return
}
```

### Base de Datos
```sql
nombre TEXT NOT NULL,
contacto TEXT NOT NULL,
telefono TEXT NOT NULL
```

## Estadísticas de Cliente

### Campos Calculados

- **total_compras**: Se suma el total de cada venta
- **cantidad_compras**: Se incrementa en 1 por venta
- **ultima_compra**: Se actualiza con la fecha actual

### Uso en Interfaz

```tsx
{cliente.cantidad_compras > 0 && (
  <p className="text-xs text-green-600">
    💚 {cliente.cantidad_compras} compras anteriores
  </p>
)}
```

## Historial de Ventas

### Visualización de Cliente

En el historial, cada venta muestra:
```tsx
{venta.cliente_nombre && (
  <span className="text-sm font-semibold text-blue-600">
    🛍️ {venta.cliente_nombre}
  </span>
)}
```

### Detalle Expandido

Al expandir una venta:
```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <h4>Información del Cliente</h4>
  <p><strong>Nombre:</strong> {venta.cliente_nombre}</p>
  <p><strong>Teléfono:</strong> {venta.cliente_telefono}</p>
  <p><strong>Contacto:</strong> {venta.cliente_contacto}</p>
</div>
```

## Casos de Uso

### Caso 1: Cliente Frecuente
```
1. Vendedor escribe "Juan"
2. Aparece "Juan Pérez" con 5 compras anteriores
3. Vendedor selecciona
4. Sistema muestra historial
5. Procesa venta rápidamente
```

### Caso 2: Cliente Nuevo por Teléfono
```
1. Cliente llama para hacer pedido
2. Vendedor busca por teléfono
3. No encuentra resultados
4. Click en "Nuevo Cliente"
5. Completa formulario con datos del cliente
6. Crea y procesa venta
```

### Caso 3: Cliente con Dirección
```
1. Vendedor busca cliente
2. Selecciona cliente
3. Ve dirección guardada
4. Confirma dirección de entrega
5. Procesa venta
```

## Mejoras Futuras

### Funcionalidades Pendientes
- [ ] Página de gestión de clientes
- [ ] Editar información de cliente
- [ ] Historial de compras por cliente
- [ ] Clientes más frecuentes
- [ ] Exportar lista de clientes
- [ ] Importar clientes desde Excel
- [ ] Notas por cliente
- [ ] Etiquetas/categorías de clientes
- [ ] Programa de fidelidad
- [ ] Descuentos por cliente

### Reportes
- [ ] Top 10 clientes por compras
- [ ] Clientes nuevos por período
- [ ] Clientes inactivos
- [ ] Análisis de retención

## Seguridad y Privacidad

### Políticas RLS
```sql
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a autenticados"
  ON clientes FOR ALL
  USING (true);
```

### Protección de Datos
- Solo administradores autenticados pueden acceder
- Datos sensibles no se exponen en URLs
- Información preservada en ventas por auditoría

## Mantenimiento

### Actualizar Estadísticas Manualmente

Si las estadísticas se desincronizaron:
```sql
UPDATE clientes c
SET 
  total_compras = (
    SELECT COALESCE(SUM(total), 0) 
    FROM ventas 
    WHERE cliente_id = c.id
  ),
  cantidad_compras = (
    SELECT COUNT(*) 
    FROM ventas 
    WHERE cliente_id = c.id
  ),
  ultima_compra = (
    SELECT MAX(fecha) 
    FROM ventas 
    WHERE cliente_id = c.id
  );
```

### Limpiar Clientes Sin Compras

```sql
-- Ver clientes sin compras
SELECT * FROM clientes WHERE cantidad_compras = 0;

-- Eliminar clientes sin compras (opcional, con precaución)
DELETE FROM clientes 
WHERE cantidad_compras = 0 
AND created_at < NOW() - INTERVAL '6 months';
```

## Solución de Problemas

### Autocomplete no muestra resultados
- Verifica que escribiste al menos 2 caracteres
- Revisa que existan clientes en la base de datos
- Verifica la consola del navegador para errores

### No se puede crear cliente
- Verifica que completaste todos los campos obligatorios
- Revisa permisos en Supabase
- Verifica políticas RLS

### Estadísticas incorrectas
- Ejecuta el script de actualización manual
- Verifica que las ventas tengan cliente_id correcto

---

**Última actualización**: Sistema de Clientes
**Versión**: 1.0.0
**Estado**: ✅ Implementado y Funcional
