# 🎭 Sistema de Datos Dummy

Sistema completo de datos de prueba para desarrollo, demos y testing de la aplicación.

---

## 📋 Contenido

El sistema genera automáticamente:

- ✅ **5 Colegios** con insignias
- ✅ **7 Categorías** de productos
- ✅ **20 Productos** con descripciones e imágenes
- ✅ **500 Variantes** (20 productos × 5 colegios × 5 tallas)
- ✅ **20 Proveedores** con información completa
- ✅ **15 Insumos** con stock y precios
- ✅ **30 Clientes** con historial de compras
- ✅ **20 Pedidos** (pendientes, recibidos, cancelados)
- ✅ **50 Ventas** con diferentes fechas y montos

---

## 🚀 Uso Rápido

### Configuración Inicial (Solo Primera Vez)

Antes de usar los scripts, necesitas agregar tu Service Role Key de Supabase:

1. Ve a tu [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Project Settings** > **API**
4. Copia la **service_role** key (NO la anon key)
5. Agrégala a tu `.env.local`:

```bash
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

⚠️ **IMPORTANTE**: Esta key tiene permisos completos y NO debe usarse en el frontend ni compartirse públicamente.

### Opción 1: Poblar Base de Datos (Recomendado)

```bash
# 1. Poblar la base de datos con datos dummy
npm run seed:dummy

# 2. Cuando termines las pruebas, limpiar los datos
npm run clean:dummy
```

### Opción 2: Modo Dummy en Memoria (Experimental)

```bash
# En .env.local
NEXT_PUBLIC_USE_DUMMY_DATA=true
```

⚠️ **Nota**: El modo en memoria aún no está implementado en todas las páginas. Se recomienda usar la Opción 1.

---

## 📊 Datos Generados

### Productos
- 20 productos variados (camisas, pantalones, faldas, chalecos, etc.)
- Precios entre $10,000 y $30,000
- Algunos con descuentos (10-20%)
- Imágenes placeholder con colores representativos

### Variantes
- Cada producto tiene variantes para los 5 colegios
- 5 tallas por colegio (XS, S, M, L, XL)
- Stock aleatorio entre 5 y 55 unidades
- Total: 500 variantes

### Proveedores
- 20 proveedores con datos completos
- RUT, teléfono, email, dirección
- Historial de pedidos y montos
- 80% activos, 20% inactivos

### Insumos
- 15 insumos diferentes (telas, botones, hilos, cierres, etc.)
- Diferentes unidades de medida (metros, unidades, rollos, etc.)
- Stock actual y mínimo
- Algunos con stock crítico para probar alertas

### Clientes
- 30 clientes con información variada
- Historial de compras realista
- Algunos con redes sociales y direcciones
- Clientes VIP marcados

### Pedidos
- 20 pedidos distribuidos en 60 días
- Estados: pendiente, recibido, cancelado
- Fechas esperadas y de recepción
- Montos entre $50,000 y $550,000

### Ventas
- 50 ventas distribuidas en 90 días
- Algunas con descuentos
- Vinculadas a clientes dummy
- Montos realistas

---

## 🛠️ Scripts Disponibles

### `npm run seed:dummy`
Pobla la base de datos con todos los datos dummy.

**Características:**
- Usa `upsert` para no duplicar datos
- Respeta dependencias entre tablas
- Muestra progreso en consola
- Resumen al finalizar

**Salida esperada:**
```
🌱 Iniciando población de datos dummy...

📚 Insertando colegios...
✅ 5 colegios insertados

👕 Insertando productos...
✅ 20 productos insertados

...

🎉 ¡Datos dummy insertados exitosamente!

📊 Resumen:
   - 5 colegios
   - 7 categorías
   - 20 productos
   - 500 variantes
   - 20 proveedores
   - 15 insumos
   - 30 clientes
   - 20 pedidos
   - 50 ventas
```

### `npm run clean:dummy`
Elimina todos los datos dummy de la base de datos.

**Características:**
- Elimina en orden inverso (respeta dependencias)
- Solo elimina registros con IDs dummy (col-, prod-, etc.)
- No afecta datos reales
- Confirmación en consola

**Salida esperada:**
```
🧹 Iniciando limpieza de datos dummy...

💰 Eliminando ventas dummy...
✅ Ventas eliminadas

📋 Eliminando pedidos dummy...
✅ Pedidos eliminados

...

🎉 ¡Datos dummy eliminados exitosamente!
```

---

## 🎯 Casos de Uso

### 1. Demo para Cliente
```bash
# Antes de la demo
npm run seed:dummy

# Después de la demo
npm run clean:dummy
```

### 2. Desarrollo de Nuevas Funcionalidades
```bash
# Poblar datos para probar
npm run seed:dummy

# Desarrollar y probar...

# Limpiar cuando termines
npm run clean:dummy
```

### 3. Testing de Reportes
```bash
# Los datos incluyen ventas de los últimos 90 días
npm run seed:dummy

# Probar reportes, gráficos, estadísticas...
```

### 4. Capacitación de Usuarios
```bash
# Ambiente de práctica con datos realistas
npm run seed:dummy

# Los usuarios pueden practicar sin miedo
```

---

## 🔍 Identificación de Datos Dummy

Todos los datos dummy tienen IDs con prefijos específicos:

- `col-*`: Colegios
- `cat-*`: Categorías
- `prod-*`: Productos
- `var-*`: Variantes
- `prov-*`: Proveedores
- `ins-*`: Insumos
- `cli-*`: Clientes
- `ped-*`: Pedidos
- `ven-*`: Ventas

Esto permite:
- Identificarlos fácilmente en la base de datos
- Eliminarlos sin afectar datos reales
- Filtrarlos en consultas si es necesario

---

## ⚠️ Advertencias

### NO usar en Producción
```bash
# ❌ NUNCA ejecutar en producción
NEXT_PUBLIC_SUPABASE_URL=https://produccion.supabase.co npm run seed:dummy
```

### Verificar Ambiente
Antes de ejecutar los scripts, verifica que estés en el ambiente correcto:

```bash
# Ver variables de entorno
echo $NEXT_PUBLIC_SUPABASE_URL

# Debe ser tu ambiente de desarrollo/staging
```

### Backup Recomendado
Aunque los scripts solo afectan datos dummy, es buena práctica:

```bash
# Hacer backup antes de poblar
# (comando específico de tu proveedor de BD)
```

---

## 🔧 Personalización

### Modificar Cantidad de Datos

Edita `lib/dummyData.ts`:

```typescript
// Cambiar de 20 a 50 productos
for (let i = 6; i <= 50; i++) {
  // ...
}

// Cambiar de 30 a 100 clientes
for (let i = 3; i <= 100; i++) {
  // ...
}
```

### Agregar Nuevos Tipos de Datos

```typescript
// En lib/dummyData.ts
export const dummyNuevoTipo = [
  {
    id: 'nuevo-1',
    // ... campos
  },
]

// En scripts/seedDummyData.ts
const { error } = await supabase
  .from('nuevo_tipo')
  .upsert(dummyNuevoTipo, { onConflict: 'id' })
```

---

## 📝 Notas Técnicas

### Dependencias
- Los scripts usan `tsx` para ejecutar TypeScript directamente
- Requieren las mismas variables de entorno que la app
- Usan el cliente de Supabase con las mismas credenciales

### Performance
- La inserción de 500+ registros toma ~5-10 segundos
- Usa `upsert` para evitar duplicados
- Las eliminaciones son rápidas (~2-3 segundos)

### Datos Realistas
- Fechas distribuidas en el tiempo
- Montos y cantidades aleatorios pero realistas
- Relaciones coherentes entre tablas
- Estados variados (activo/inactivo, pendiente/completado, etc.)

---

## 🐛 Troubleshooting

### Error: "Faltan variables de entorno"
```bash
# Verificar que existan en .env.local
cat .env.local | grep SUPABASE

# Asegúrate de tener SUPABASE_SERVICE_ROLE_KEY configurada
```

### Error: "row-level security policy"
```bash
# Necesitas usar la Service Role Key, no la Anon Key
# Agrega SUPABASE_SERVICE_ROLE_KEY a tu .env.local
# La encuentras en: Supabase Dashboard > Project Settings > API
```

### Error: "tsx: command not found"
```bash
# Instalar tsx
npm install -D tsx
```

### Error: "Permission denied"
```bash
# Verificar permisos de Supabase
# El ANON_KEY debe tener permisos de escritura
```

### Los datos no aparecen
```bash
# Verificar que se insertaron
npm run seed:dummy

# Revisar la consola de Supabase
# Verificar políticas RLS
```

---

## 🎉 Conclusión

El sistema de datos dummy te permite:
- ✅ Probar la aplicación con datos realistas
- ✅ Hacer demos profesionales
- ✅ Desarrollar sin preocuparte por datos de prueba
- ✅ Capacitar usuarios en ambiente seguro
- ✅ Limpiar fácilmente cuando termines

¡Disfruta probando tu aplicación con datos completos! 🚀
