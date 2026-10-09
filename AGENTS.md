# Project guidance

This repository is a Next.js 16 App Router application using React, TypeScript, Supabase, and PostgreSQL. Do not apply the Vite/React/NestJS assumptions in the bundled `.opencode` reference material to this project.

- Keep database writes in server actions and preserve Supabase RLS.
- Add schema changes as ordered, rerunnable SQL migrations under `supabase/`; keep `supabase-schema.sql` consistent for fresh installs.
- Multi-table operations must use one database transaction/RPC. Requests that can be retried must carry a stable idempotency key.
- Load relevant `.opencode/skills/*/SKILL.md` instructions on demand; do not load unrelated skills into every task.
- Validate changes with `npm run lint` and `npm run build` when practical.
