# Agentes de Pedro Araya 

> Equipo de agentes de IA especializados para desarrollar el portafolio **`react-base-app`**: proyecto full-stack — frontend SPA de Vite + React 19 + TanStack (Router/Query/Form) + Tailwind y backend NestJS con API propia. No es una plantilla genérica — cada agente, skill y documento de contexto está adaptado a este proyecto.

---

## Contenido

1. [Vista general](#vista-general)
2. [El equipo](#el-equipo)
3. [Estructura del repositorio](#estructura-del-repositorio)
4. [Cómo se relacionan las piezas](#cómo-se-relacionan-las-piezas)
5. [Empezar a usar los agentes](#empezar-a-usar-los-agentes)
6. [Al adaptar este repo a otro proyecto](#al-adaptar-este-repo-a-otro-proyecto)
7. [Integridad del repositorio](#integridad-del-repositorio)
8. [Licencia y autor](#licencia-y-autor)

---

## Vista general

Este repositorio define cómo trabaja un **equipo de agentes de IA** sobre `react-base-app`: quién hace qué, qué conocimiento especializado usa cada uno, qué reglas respetar y cómo se pasa el trabajo entre agentes.

| | |
|---|---|
| Agentes | 5 (`orchestrator`, `frontend`, `backend`, `designer`, `qa-tester`) |
| Skills | 14 en `/skills` (9 activas en `react-base-app` + 4 de stack ampliado + 1 de proyecto externo) |
| Documentos de contexto | 5 en `/context` |
| Especificaciones | 3 en `/specs` (2 features: `career-timeline` completa, `portfolio-engagement` en diseño) |
| Licencia | MIT |

La navegación completa de los archivos `.md` (mapa de conexiones, orden de lectura y reglas) vive en [`AGENTS.md`](./AGENTS.md) — es el punto de entrada para cualquier cliente de agentes.

## El equipo

| Agente | Archivo | Dominio |
|---|---|---|
| **Orquestador** | [`orchestration/orchestrator.md`](./orchestration/orchestrator.md) | Clasifica solicitudes, secuencia el flujo entre agentes, gestiona handoffs y mantiene `/context` coherente |
| **Frontend Senior** | [`agents/frontend.md`](./agents/frontend.md) | React 19 / Vite / TanStack, estado cliente, consumo de APIs, visualización de datos |
| **Backend Senior** | [`agents/backend.md`](./agents/backend.md) | NestJS, API propia, DTOs/validación, auth, base de datos, infraestructura/despliegue |
| **Diseñador UX/UI** | [`agents/designer.md`](./agents/designer.md) | Flujo de usuario, sistema de diseño blue, especificación de estados, accesibilidad |
| **QA Engineer** | [`agents/qa-tester.md`](./agents/qa-tester.md) | Estrategia y automatización de testing full-stack, casos límite, gates de calidad |

Para saber a qué agente corresponde cada tipo de solicitud, ver la [matriz de roles](./roles/roles-matrix.md).

## Estructura del repositorio

| Carpeta | Contenido |
|---|---|
| [`/agents`](./agents/agents-README.md) | Identidad, tono, dominio técnico y autonomía de cada agente (`frontend`, `backend`, `designer`, `qa-tester`) + el índice del equipo |
| [`/orchestration`](./orchestration/orchestrator.md) | El `orchestrator` (clasifica y coordina el flujo) y el [runbook de incidentes](./orchestration/incident-runbook.md) |
| [`/roles`](./roles/roles-matrix.md) | Matriz de responsabilidades — qué agente resuelve qué tipo de solicitud |
| [`/skills`](./skills/skills-README.md) | Conocimiento especializado por dominio — carpetas `skills/<nombre>/SKILL.md` (formato que carga opencode) que los agentes consultan de forma autónoma — stack full-stack + librerías alternativas |
| [`/context`](./context/project-context.md) | Contexto vivo del proyecto: `project-context.md`, `design-tokens.md`, `handoff-protocol.md`, `definition-of-done.md`, `pr-convention.md` |
| [`/specs`](./specs/feature-spec-template.md) | Plantillas y specs reales de features — incluye la [career timeline](./specs/career-timeline.md) (completa) y el [portfolio engagement](./specs/portfolio-engagement.md) con su [contrato de API](./specs/api/portfolio-engagement.md) |

## Cómo se relacionan las piezas

```
El usuario pide algo
        │
        ▼
orchestrator.md ───────────────────► clasifica la solicitud
        │
        ├──► roles-matrix.md            qué agente(s) corresponden
        ├──► context/project-context.md reglas a respetar (prioridad máxima)
        │
        ▼
agents/*.md (frontend | backend | designer | qa-tester)
        │
        ├──► skills/<nombre>/SKILL.md       conocimiento que ACTIVA la tarea
        ├──► context/handoff-protocol   al pasar trabajo al siguiente agente
        │
        ▼
specs/[feature].md ──► definition-of-done.md → "feature completa"
```

1. El usuario le pide algo a `orchestrator`, quien clasifica la solicitud y decide qué agente(s) la resuelven y en qué secuencia.
2. Cada agente consulta de forma autónoma las skills de `/skills` que su tarea activa y siempre revisa `/context` antes de empezar — el contexto del proyecto tiene prioridad sobre cualquier guía genérica.
3. El trabajo entre agentes se pasa con un **handoff explícito** ([`context/handoff-protocol.md`](./context/handoff-protocol.md)), nunca de forma implícita o resumida.
4. Una feature se marca `completa` en `/specs` solo cuando cumple el checklist de [`context/definition-of-done.md`](./context/definition-of-done.md).
5. Un incidente en producción suspende el flujo normal y sigue [`orchestration/incident-runbook.md`](./orchestration/incident-runbook.md).

## Empezar a usar los agentes

Este repositorio se consume desde un cliente/orquestador de agentes de IA (ej. Claude Code, opencode) que apunte al proyecto objetivo:

1. Clona este repositorio junto al proyecto (`react-base-app`) que va a trabajar.
2. Configura tu cliente para que cargue los archivos de `/agents` como definiciones de agente y conceda acceso de lectura a `/skills`, `/context` y `/specs`.
3. Dirige las solicitudes a `orchestrator.md` cuando no estén claramente acotadas a un solo dominio; invoca un agente de `/agents` directamente cuando el dominio es obvio (ver la [tabla del índice](./agents/agents-README.md)).

## Al adaptar este repo a otro proyecto

Este equipo está fuertemente acoplado a `react-base-app` (stack, paleta de color, backend propio). Si lo vas a usar con **otro proyecto**, la adaptación es obligatoria y está documentada en un solo lugar:

➡️ **[`ADAPTING.md`](./ADAPTING.md)** — mapa archivo por archivo (qué editar y qué se rompe si lo saltas), 3 perfiles de proyecto (full-stack / frontend-only / otro stack de backend), orden de edición y checklist de verificación pre-uso.

## Integridad del repositorio

Este repo se mantiene por consistencia: si una tabla menciona un archivo que no existe, o una skill está listada pero no está en `/skills`, es un error a corregir, no un archivo implícito. Antes de cerrar un PR, verifica que:

- Los enlaces internos entre los `.md` apunten a archivos reales.
- Toda skill referenciada en una tabla de activación exista físicamente en `/skills` — y toda skill presente tenga un agente que la consuma (o esté listada como "disponible" en `skills-README.md`).
- Las skills del stack ampliado (Next.js, Nivo, Plotly, Leaflet) se usen solo explícitamente — no se activen como default en el frontend Vite/recharts de `react-base-app`.

## Licencia y autor

Todos los archivos de este repositorio están bajo la [licencia MIT](https://opensource.org/licenses/MIT).

Autor: [Pedro Araya Gálvez](https://github.com/peteraraya).