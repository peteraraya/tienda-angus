# Scripts SQL para Supabase

Ejecuta estos scripts en orden en el SQL Editor de Supabase.

## Instalación y actualización

- **Proyecto nuevo:** ejecuta `supabase-schema.sql` desde la raíz y luego las migraciones `34` a `40`, en ese orden.
- **Proyecto existente:** no vuelvas a ejecutar todo el historial. Aplica solamente las migraciones que aún no se hayan ejecutado, en orden numérico. La `36` incorpora solicitudes de compra web, la `37` las integra al dashboard, la `38` incorpora el registro estructurado de arreglos sin adjuntos, la `39` añade sus pendientes a las métricas y la `40` agrega paginación, filtros y resumen del inventario administrativo en servidor.
- Las migraciones `34` a `40` están diseñadas para poder repetirse. Las solicitudes públicas validan los datos en servidor y rechazan reutilizar una clave idempotente con otro contenido.

## Instrucciones:

1. Ve a tu proyecto en Supabase.
2. Abre el SQL Editor y ejecuta solo el esquema o las migraciones pendientes, según corresponda.
3. Verifica que no haya errores antes de continuar.

## Verificación:

Después de instalar la migración 36, verifica en **Database > Tables** que existan `solicitudes_pedido` y `solicitud_pedido_items`. La función pública solo puede crear solicitudes; la lectura y gestión de estas tablas queda restringida al administrador mediante RLS.
