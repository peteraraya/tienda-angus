# Tienda de Confecciones - Next.js + Supabase

Sistema de gestión de inventario para tienda de confecciones con panel de administración y catálogo público.

## Configuración

### 1. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. En el SQL Editor, ejecuta los scripts de la carpeta `supabase/` en orden (01 al 12)
   - Lee las instrucciones en `supabase/README.md`
3. Copia las credenciales de tu proyecto

### 2. Variables de Entorno

Edita `.env.local` con tus credenciales de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Crear Usuario Admin

En Supabase Dashboard > Authentication > Users, crea un usuario con email y contraseña.

### 4. Instalar y Ejecutar

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura

- `/` - Catálogo público de productos
- `/admin` - Panel de administración (requiere login, solo accesible por URL)
- `/admin/nuevo` - Crear nuevo producto
- `/admin/editar/[id]` - Editar producto existente

## Características

- Autenticación con Supabase Auth
- CRUD completo de productos
- Sistema de variantes: múltiples tallas y colores por producto
- Tallas disponibles: 6, 8, 10, 12, 14, 16, S, M, L, XL
- Colores predefinidos: Blanco, Negro, Azul, Rojo, Verde, Amarillo, Rosa, Gris, Beige, Morado
- Control de stock individual por variante (talla + color)
- Visualización pública del catálogo con tallas y colores disponibles
- Gestión de imágenes de productos
- Responsive design con Tailwind CSS
- Panel admin accesible solo por URL (sin botón en página principal)
