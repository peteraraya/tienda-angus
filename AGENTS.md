# Project guidance

This repository is a Next.js 16 App Router application using React, TypeScript, Supabase, and PostgreSQL. Do not apply the Vite/React/NestJS assumptions in the bundled `.opencode` reference material to this project.

- Keep database writes in server actions and preserve Supabase RLS.
- Add schema changes as ordered, rerunnable SQL migrations under `supabase/`; keep `supabase-schema.sql` consistent for fresh installs.
- Multi-table operations must use one database transaction/RPC. Requests that can be retried must carry a stable idempotency key.
- Load relevant `.opencode/skills/*/SKILL.md` instructions on demand; do not load unrelated skills into every task.
- Validate changes with `npm run lint` and `npm run build` when practical.

## Administración y Supabase Auth

- Solo la cuenta autorizada de administración debe tener `app_metadata.role = "admin"` en Supabase Auth. Asignar o retirar este metadato desde un canal confiable de administración (Dashboard o service role); nunca permitir que el cliente lo escriba.
- Aplicar `supabase/35-single-admin-access-and-dashboard.sql` después de las migraciones existentes. En una instalación nueva, ejecutar `supabase-schema.sql`, luego las migraciones 34 y 35.
- La migración 35 reemplaza las políticas anteriores para eliminar permisos públicos de lectura sobre datos privados y restringe escrituras y rutas administrativas. Las lecturas públicas del catálogo y referencias necesarias para la tienda se mantienen.
- No ejecutar `supabase-schema.sql` completo sobre una base con datos; aplicar solo las migraciones ordenadas.
- No acceder a datos administrativos desde componentes cliente cuando exista una Server Action equivalente. Comprobar siempre `error` en las respuestas Supabase y exponer un estado de error recuperable.
