# Atajos de Teclado - Panel Admin

## Descripción

Sistema de atajos de teclado para mejorar la productividad en el panel de administración. Permite realizar acciones comunes sin usar el mouse.

## Atajos Disponibles

### 🔍 Ctrl+F - Buscar Productos
- **Función**: Enfoca automáticamente el campo de búsqueda
- **Uso**: Presiona `Ctrl+F` (o `Cmd+F` en Mac) en cualquier momento
- **Beneficio**: Búsqueda rápida sin necesidad de hacer scroll o click

### ✅ Enter - Guardar Cambios
- **Función**: Guarda los cambios en edición inline
- **Contextos**:
  - Editar nombre de producto
  - Editar precio de producto
  - Editar stock de variante
  - Guardar notas (en modal)
- **Uso**: Después de escribir, presiona `Enter` para confirmar

### ❌ Esc - Cancelar Edición
- **Función**: Cancela la edición actual y cierra modales
- **Contextos**:
  - Cancelar edición de nombre
  - Cancelar edición de precio
  - Cancelar edición de stock
  - Cerrar modal de notas
  - Cerrar modal de precio
  - Cerrar ayuda de atajos
- **Uso**: Presiona `Esc` para salir sin guardar

### ❓ ? - Mostrar Ayuda
- **Función**: Muestra el modal con todos los atajos disponibles
- **Uso**: Presiona `?` (Shift+/) cuando no estés escribiendo en un campo
- **Alternativa**: Click en el botón flotante azul con "?" en la esquina inferior derecha

## Componentes

### KeyboardShortcuts.tsx
Componente principal que maneja:
- Listeners de eventos de teclado
- Modal de ayuda con diseño elegante
- Botón flotante de ayuda
- Integración con refs para búsqueda

### Integración en AdminPage
```typescript
const searchInputRef = useRef<HTMLInputElement>(null)

// En el input de búsqueda
<input ref={searchInputRef} ... />

// Al final del componente
<KeyboardShortcuts searchInputRef={searchInputRef} />
```

## Características

### ✨ Diseño Elegante
- Modal con backdrop blur
- Tarjetas de colores por tipo de acción:
  - 🔵 Azul: Búsqueda
  - 🟢 Verde: Guardar
  - 🔴 Rojo: Cancelar
  - 🟣 Morado: Ayuda
- Teclas estilo kbd con sombras
- Responsive y dark mode compatible

### 🎯 Inteligente
- No interfiere con inputs/textareas (excepto Ctrl+F)
- Previene comportamiento por defecto del navegador
- Funciona en toda la página admin
- Se oculta automáticamente al imprimir

### ♿ Accesible
- Botón flotante siempre visible
- Tooltips descriptivos
- Cierre con Esc o click fuera
- Indicadores visuales claros

## Flujo de Uso

### Edición Rápida de Nombre
1. Hover sobre nombre → aparece ícono de lápiz
2. Click en nombre o ícono
3. Escribir nuevo nombre
4. `Enter` para guardar o `Esc` para cancelar

### Edición Rápida de Precio
1. Click en precio
2. Se abre modal con input enfocado
3. Escribir nuevo precio
4. `Enter` para guardar o `Esc` para cancelar

### Búsqueda Rápida
1. `Ctrl+F` desde cualquier parte
2. Campo de búsqueda se enfoca y selecciona
3. Escribir término de búsqueda
4. Resultados se filtran en tiempo real

### Gestión de Stock
1. Click en botón de editar stock (✏️)
2. Input numérico aparece enfocado
3. Escribir nuevo stock
4. `Enter` para guardar o `Esc` para cancelar

## Beneficios

### 🚀 Productividad
- Menos clicks necesarios
- Flujo de trabajo más rápido
- Menos movimiento del mouse

### 💡 Descubribilidad
- Botón de ayuda siempre visible
- Modal informativo con ejemplos
- Tooltips en botones

### 🎨 UX Mejorada
- Feedback visual inmediato
- Transiciones suaves
- Diseño consistente con el sistema

## Compatibilidad

### Navegadores
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera

### Sistemas Operativos
- ✅ Windows (Ctrl+F)
- ✅ macOS (Cmd+F)
- ✅ Linux (Ctrl+F)

### Dispositivos
- ✅ Desktop/Laptop (funcionalidad completa)
- ⚠️ Tablet (limitado a touch)
- ❌ Mobile (no aplicable)

## Notas Técnicas

### Prevención de Conflictos
```typescript
// Solo activa ? si no está en input
if (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
  e.preventDefault()
  setShowHelp(true)
}
```

### Manejo de Refs
```typescript
// Enfoca y selecciona el input de búsqueda
searchInputRef?.current?.focus()
searchInputRef?.current?.select()
```

### Event Listeners
```typescript
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [searchInputRef, showHelp])
```

## Futuras Mejoras

### Posibles Adiciones
- [ ] Ctrl+S para guardar cambios globales
- [ ] Ctrl+N para nuevo producto
- [ ] Ctrl+E para editar producto seleccionado
- [ ] Flechas arriba/abajo para navegar productos
- [ ] Ctrl+D para duplicar producto
- [ ] Ctrl+Delete para eliminar producto
- [ ] Ctrl+P para imprimir (ya existe nativamente)

### Mejoras UX
- [ ] Animaciones de entrada/salida
- [ ] Sonidos de feedback (opcional)
- [ ] Personalización de atajos
- [ ] Historial de comandos
- [ ] Barra de comandos estilo Cmd+K

## Mantenimiento

### Agregar Nuevo Atajo
1. Agregar handler en `handleKeyDown`
2. Actualizar modal de ayuda con nueva tarjeta
3. Documentar en este archivo
4. Probar en todos los navegadores

### Modificar Atajo Existente
1. Actualizar lógica en `handleKeyDown`
2. Actualizar texto en modal de ayuda
3. Actualizar documentación
4. Notificar a usuarios del cambio

## Soporte

Si encuentras problemas con los atajos:
1. Verifica que no haya extensiones del navegador interfiriendo
2. Prueba en modo incógnito
3. Revisa la consola del navegador
4. Reporta el issue con detalles del navegador/OS

---

**Última actualización**: Fase 2 - Sistema de Atajos de Teclado
**Versión**: 1.0.0
**Estado**: ✅ Implementado y Funcional
