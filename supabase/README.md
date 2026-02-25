# Scripts SQL para Supabase

Ejecuta estos scripts en orden en el SQL Editor de Supabase.

## Orden de ejecución:

1. **01-create-tables.sql** - Crea la tabla de productos
2. **02-create-variantes.sql** - Crea la tabla de variantes
3. **03-enable-rls.sql** - Habilita RLS en productos
4. **04-enable-rls-variantes.sql** - Habilita RLS en variantes
5. **05-policies-productos-select.sql** - Política de lectura pública para productos
6. **06-policies-productos-insert.sql** - Política de inserción para productos
7. **07-policies-productos-update.sql** - Política de actualización para productos
8. **08-policies-productos-delete.sql** - Política de eliminación para productos
9. **09-policies-variantes-select.sql** - Política de lectura pública para variantes
10. **10-policies-variantes-insert.sql** - Política de inserción para variantes
11. **11-policies-variantes-update.sql** - Política de actualización para variantes
12. **12-policies-variantes-delete.sql** - Política de eliminación para variantes
13. **13-add-discount-fields.sql** - Agrega campos de descuento y oferta
14. **14-add-multiple-images.sql** - Agrega soporte para múltiples imágenes
15. **15-fix-productos-schema.sql** - Corrige esquema de productos
16. **16-create-colegios-table.sql** - Crea tabla de colegios
17. **17-create-categorias-table.sql** - Crea tabla de categorías
18. **18-policies-categorias.sql** - Políticas RLS para categorías
19. **19-policies-colegios.sql** - Políticas RLS para colegios

## Instrucciones:

1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido de cada archivo en orden
4. Ejecuta cada script presionando "Run"
5. Verifica que no haya errores antes de continuar con el siguiente

## Verificación:

Después de ejecutar todos los scripts, verifica en:
- **Database > Tables** que existan las tablas `productos`, `variantes`, `colegios` y `categorias`
- **Authentication > Policies** que existan todas las políticas creadas para cada tabla
