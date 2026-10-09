---
name: confecciones-angus-nextjs
description: Convenciones específicas de Confecciones Angus para tareas Next.js 16 App Router, React, TypeScript, Supabase y PostgreSQL.
---

# Proyecto Confecciones Angus

Este repositorio es una aplicación Next.js 16 App Router con React, TypeScript, Supabase/PostgreSQL, Tailwind CSS 4 y TanStack Query. Estas convenciones específicas prevalecen sobre cualquier skill o referencia de Vite, TanStack Router, NestJS u otro proyecto.

## Arquitectura y persistencia

- Mantener escrituras de base de datos en Server Actions o Route Handlers protegidos y preservar RLS.
- Las políticas privadas requieren `public.is_admin()`; no usar `TO authenticated USING (true)` para operaciones administrativas.
- La única cuenta autorizada se configura en Supabase Auth con `app_metadata.role = "admin"`. Ese metadato solo lo debe establecer un operador confiable, nunca el cliente.
- Operaciones multitabla deben ejecutarse en una función RPC/transacción; llamadas reintentables deben usar claves de idempotencia estables.
- Cambios de esquema van en migraciones SQL ordenadas y rerunnables bajo `supabase/`; sincronizar el esquema canónico para instalaciones nuevas.
- No enviar claves de servicio al navegador. Proteger Route Handlers con verificación de sesión/rol además de RLS.

## Datos y experiencia

- Preferir cargas acotadas, paginadas o agregadas; verificar y propagar todos los errores de Supabase.
- Las interfaces de administración deben ofrecer estados de carga, error, vacío y reintento.
- Usar enlaces semánticos para navegación, controles con etiquetas asociadas y foco visible.
- Diseñar para móvil desde el inicio y ofrecer objetivos táctiles cercanos a 44 × 44 px.

## Validación

- Ejecutar `npm run lint` y `npm run build` cuando el cambio lo permita.
- Si una migración necesita Supabase/PostgreSQL para verificarse y no hay instancia disponible, indicar esa limitación; no asumir que compila implica que el SQL se ejecutó correctamente.
