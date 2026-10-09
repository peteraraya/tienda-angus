# Guía visual — Tienda Confecciones Angus

Esta guía describe las convenciones que ya usa la interfaz. No presupone una configuración de Tailwind distinta de `app/globals.css` ni agrega tokens de theme inexistentes. Prevalece sobre la paleta azul heredada de `react-base-app`.

## Stack de estilos

- Next.js App Router, React, TypeScript y Tailwind CSS 4.
- Usar utilidades `dark:` junto con su estado claro en el mismo componente.
- Mantener los cambios visuales coherentes con las clases y componentes de `app/components/ui`.

## Colores y contraste

- Fondos y superficies: marfil cálido (`#fffdf9`) y verde petróleo oscuro (`#142b2a`); usar las clases existentes del componente cuando ya definan su superficie.
- Texto principal: verde profundo (`#173b39`); texto secundario: verde grisáceo (`#5f7a73`); asegurar contraste en ambos temas.
- Identidad de marca: verde petróleo (`#123f3d`) con acento dorado (`#d3a954`).
- Verde, ámbar y rojo semánticos se reservan para éxito, advertencia y error, respectivamente; no sustituir con ellos los colores de marca.
- No combinar `text-white` con `bg-white` en el tema claro ni `text-white` con una superficie `gray-200` clara.
- Validar contraste WCAG AA en texto y estados; no comunicar estado solo mediante color.

## Interacción y responsive

- Inputs, botones y enlaces deben mostrar foco visible y estados hover/disabled.
- Los controles táctiles principales deben tener al menos 44 × 44 px (`min-h-11`, `min-w-11`).
- Diseñar primero para móvil; usar tablas con desplazamiento explícito solo cuando la información realmente requiera ancho tabular.
- Las acciones importantes deben permanecer visibles y entendibles sin hover.
- Dialogs deben tener nombre accesible, `aria-modal`, foco inicial y una forma clara de cerrar.

## Tipografía y espaciado

- Conservar la tipografía y jerarquías que ya definen `app/globals.css` y los componentes existentes.
- Preferir escala Tailwind (`p-2`, `p-4`, `gap-4`, etc.) antes de valores arbitrarios.
- Mantener títulos compactos en vistas administrativas densas y evitar que los encabezados persistentes oculten contenido.
