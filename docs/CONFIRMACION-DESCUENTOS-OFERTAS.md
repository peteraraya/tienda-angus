# Confirmación de Descuentos y Ofertas

## Descripción

Sistema de confirmación mediante modales para aplicar descuentos y activar/desactivar ofertas en el panel administrativo.

## Funcionalidad

### 1. Confirmación de Descuentos

Cuando se selecciona un porcentaje de descuento en el selector, aparece un modal de confirmación que muestra:

- Título: "¿Aplicar descuento?"
- Nombre del producto
- Porcentaje de descuento seleccionado
- Precio original
- Precio con descuento
- Ahorro total en pesos chilenos

**Casos especiales:**
- Si se selecciona 0% (sin descuento), NO se muestra confirmación y se elimina directamente
- Si no hay cambio en el porcentaje, no se hace nada
- Si el usuario cancela, el selector vuelve al valor anterior

**Ejemplo de mensaje:**
```
Se aplicará un descuento del 20% a "Polera Escolar".

Precio original: $15.000
Precio con descuento: $12.000
Ahorro: $3.000
```

### 2. Confirmación de Ofertas

Cuando se hace clic en el botón de oferta, aparece un modal de confirmación:

**Al activar oferta:**
- Título: "¿Activar oferta?"
- Mensaje: Se marcará "[nombre producto]" como producto en oferta. Aparecerá con una insignia especial.
- Botón: "Activar Oferta" (variante warning - naranja)

**Al desactivar oferta:**
- Título: "¿Desactivar oferta?"
- Mensaje: Se quitará la marca de oferta de "[nombre producto]".
- Botón: "Desactivar" (variante info - azul)

## Componentes Utilizados

### useConfirm Hook
```typescript
const { confirm, ConfirmDialog } = useConfirm()

const confirmed = await confirm({
  title: '¿Aplicar descuento?',
  message: 'Mensaje detallado...',
  confirmText: 'Aplicar Descuento',
  variant: 'warning'
})
```

### Toast Notifications
```typescript
toast.success('Descuento del 20% aplicado exitosamente')
toast.error('El descuento debe estar entre 0 y 100')
```

## Variantes de Modal

- **warning** (naranja): Para acciones que modifican precios o activan ofertas
- **info** (azul): Para acciones informativas o desactivaciones
- **danger** (rojo): Para eliminaciones (no usado en descuentos/ofertas)

## Flujo de Usuario

1. Usuario selecciona un descuento o hace clic en oferta
2. Aparece modal de confirmación con información detallada
3. Usuario puede:
   - Confirmar: Se aplica el cambio y muestra toast de éxito
   - Cancelar: No se hace nada, el estado vuelve al anterior
4. La lista de productos se recarga automáticamente

## Beneficios

- Previene cambios accidentales en precios
- Muestra información clara antes de aplicar cambios
- Permite al usuario revisar el impacto del descuento
- Mejora la experiencia de usuario con feedback visual
- Mantiene consistencia con el design system de la aplicación

## Archivos Modificados

- `app/admin/page.tsx`: Funciones `toggleOferta()` y `updateDescuento()`
- Utiliza componentes del design system: `useConfirm`, `useToast`

## Notas Técnicas

- La confirmación es asíncrona usando `async/await`
- Si el usuario cancela, se llama a `loadProductos()` para revertir el estado del selector
- Los mensajes están en español para mantener consistencia con la aplicación
- Los precios se formatean usando la función `formatPrice()` (formato chileno)
