# Contexto del Proyecto

Este archivo es la fuente de verdad del workspace actual. Si cualquier guía heredada de `.opencode` contradice este documento, prevalece el contexto de Confecciones Angus. La skill de referencia para el proyecto es [`confecciones-angus-nextjs`](../skills/confecciones-angus-nextjs/SKILL.md).

## 1. Producto

- **Nombre:** Tienda Confecciones Angus.
- **Propósito:** catálogo público de uniformes y gestión administrativa de ventas, inventario, pedidos a proveedores, solicitudes web y arreglos.
- **Usuarios:** clientes de la tienda y una única cuenta autorizada de administración.

## 2. Stack confirmado

| Capa | Tecnología |
|---|---|
| Aplicación | Next.js 16 App Router, React 19 y TypeScript |
| UI | Tailwind CSS 4; componentes y utilidades locales |
| Datos cliente | TanStack Query donde ya existe |
| Persistencia y autenticación | Supabase JS/SSR y PostgreSQL con RLS |
| Escrituras | Server Actions o Route Handlers protegidos; RPC/transacciones para operaciones multitabla |
| Migraciones | SQL ordenado en `supabase/`; `supabase-schema.sql` para instalación nueva |
| Validación | `npm run lint`, `npx tsc --noEmit`, `npm run build` (en Windows, `npm run build -- --webpack` si Turbopack tiene problemas) |

No asumir Vite, TanStack Router, NestJS, TypeORM, Prisma, una API propia independiente ni las convenciones del portafolio `react-base-app`.

## 3. Estructura relevante

- `app/`: rutas App Router, Server Actions, UI pública y administración.
- `app/actions/`: acceso a datos desde servidor.
- `app/admin/`: módulos administrativos.
- `app/utils/supabase/` o `utils/supabase/`: clientes Supabase de navegador/servidor; reutilizar los existentes.
- `types/database.ts`: tipos de dominio usados por la aplicación.
- `supabase/`: migraciones SQL en orden numérico.
- `supabase-schema.sql`: esquema consolidado de instalación nueva.
- `.opencode/skills/confecciones-angus-nextjs/SKILL.md`: convenciones específicas de este proyecto.

## 4. Arquitectura y seguridad obligatorias

- La cuenta autorizada se identifica con `app_metadata.role = "admin"` en Supabase Auth. Solo un canal confiable (Dashboard o service role) puede asignar o retirar ese metadato; nunca exponer esa escritura al cliente.
- Mantener RLS y verificar autorización en las superficies de servidor administrativas. No conceder acceso privado a todo `authenticated`.
- Las escrituras se ejecutan en Server Actions o Route Handlers. Los componentes cliente no consultan directamente datos administrativos si hay una acción equivalente.
- Operaciones multitabla atómicas usan una RPC/transacción de PostgreSQL. Toda solicitud reintentable conserva una clave de idempotencia estable y rechaza la reutilización de la misma clave con otro payload.
- No reservar inventario para solicitudes web pendientes; validar el precio y stock en servidor al crear la solicitud y confirmar disponibilidad posteriormente.
- Las solicitudes de arreglo iniciales no adjuntan fotos; se coordinan por el canal humano existente.
- Comprobar siempre el `error` de Supabase; mostrar fallos recuperables, no éxitos falsos ni valores por defecto que oculten errores.
- Crear migraciones rerunnables y ordenadas. Para una base existente, aplicar solo las migraciones pendientes; no ejecutar el esquema consolidado sobre una base con datos.
- El orden de instalación vigente está documentado en `supabase/README.md`. La cadena actual de migraciones de instalación parte de la 34 y llega a la 39.
- No enviar claves service-role ni secretos al navegador ni registrarlos en código/versionado.

## 5. Guía visual y UX

- Seguir la identidad ya presente en la aplicación: verde petróleo (`#123f3d`), dorado (`#d3a954`), superficies cálidas claras (`#fffdf9`) y superficies oscuras (`#142b2a`).
- Mantener los estados semánticos diferenciados; no reemplazar la identidad existente por la paleta azul de la plantilla anterior.
- Priorizar diseño móvil, foco visible, etiquetas asociadas, navegación semántica y controles táctiles de al menos 44 px.
- Las vistas administrativas deben incluir estados de carga, error, vacío y reintento.

## 6. Decisiones de arquitectura registradas

### 2026-10 — Aislamiento de la configuración de agentes
**Contexto:** el contenido original de `.opencode` describe un portafolio Vite/NestJS que no coincide con este repositorio.
**Decisión:** este archivo y la skill `confecciones-angus-nextjs` son la referencia del workspace. No aplicar instrucciones genéricas o skills Vite/NestJS a esta aplicación; usar solo skills que correspondan a una tarea y al stack real.

### 2026-10 — Solicitudes públicas
**Decisión:** pedidos de clientes y arreglos se registran como solicitudes independientes, con validación en servidor, consentimiento y protección idempotente. El stock no se reserva al registrar una solicitud de compra.

## 7. Glosario

- **Solicitud web:** intención de compra pendiente de confirmación; no es una compra a proveedor ni una venta confirmada.
- **Solicitud de arreglo:** petición para evaluar una reparación; el precio y fecha se confirman después de revisar la prenda.
- **Variante:** combinación de producto, colegio y talla a la que se asocian precio o existencias.
