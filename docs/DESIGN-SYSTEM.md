# Design System - Tienda de Confecciones

Sistema de diseño centralizado con componentes reutilizables para mantener consistencia en toda la aplicación.

## 📦 Componentes Disponibles

### 1. Toast (Notificaciones)

Sistema de notificaciones toast con 4 variantes: success, error, warning, info.

**Uso:**
```tsx
import { useToast } from '@/app/components/ui/ToastContainer'

function MiComponente() {
  const toast = useToast()
  
  // Métodos disponibles
  toast.success('¡Operación exitosa!')
  toast.error('Ocurrió un error')
  toast.warning('Advertencia importante')
  toast.info('Información útil')
  
  // O usar el método genérico
  toast.showToast('Mensaje personalizado', 'success')
}
```

**Características:**
- Auto-cierre después de 4 segundos (configurable)
- Animación slide-in desde la derecha
- Apilamiento automático de múltiples toasts
- Botón de cierre manual
- Iconos contextuales según el tipo

---

### 2. ConfirmDialog (Diálogos de Confirmación)

Reemplaza los `alert()` y `confirm()` nativos con diálogos modernos.

**Uso con Hook:**
```tsx
import { useConfirm } from '@/app/hooks/useConfirm'

function MiComponente() {
  const { confirm, ConfirmDialog } = useConfirm()
  
  async function handleDelete() {
    const confirmed = await confirm({
      title: '¿Eliminar producto?',
      message: 'Esta acción no se puede deshacer',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger' // 'danger' | 'warning' | 'info'
    })
    
    if (confirmed) {
      // Usuario confirmó
      await deleteProduct()
    }
  }
  
  return (
    <>
      <button onClick={handleDelete}>Eliminar</button>
      <ConfirmDialog />
    </>
  )
}
```

**Variantes:**
- `danger`: Rojo - Para acciones destructivas
- `warning`: Amarillo - Para advertencias
- `info`: Azul - Para información general

---

### 3. Button (Botones)

Botones consistentes con múltiples variantes y tamaños.

**Uso:**
```tsx
import { Button } from '@/app/components/ui'

<Button variant="primary" size="md">
  Guardar
</Button>

<Button 
  variant="danger" 
  size="lg"
  icon={<TrashIcon />}
  fullWidth
>
  Eliminar Todo
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost'
- `size`: 'sm' | 'md' | 'lg'
- `icon`: ReactNode - Icono opcional
- `fullWidth`: boolean - Ancho completo
- Todos los props nativos de `<button>`

---

### 4. Input (Campos de Entrada)

Inputs con labels, errores y helper text integrados.

**Uso:**
```tsx
import { Input } from '@/app/components/ui'

<Input
  label="Correo Electrónico"
  type="email"
  placeholder="usuario@ejemplo.com"
  error={errors.email}
  helperText="Ingresa un correo válido"
  icon={<EmailIcon />}
/>
```

**Props:**
- `label`: string - Etiqueta del campo
- `error`: string - Mensaje de error
- `helperText`: string - Texto de ayuda
- `icon`: ReactNode - Icono a la izquierda
- Todos los props nativos de `<input>`

---

### 5. Modal (Modales)

Modales reutilizables con diferentes tamaños.

**Uso:**
```tsx
import { Modal } from '@/app/components/ui'

const [isOpen, setIsOpen] = useState(false)

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Detalles del Producto"
  size="lg"
>
  <div>Contenido del modal...</div>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `children`: ReactNode

---

## 🎨 Guía de Uso

### Reemplazar alerts nativos

**Antes:**
```tsx
alert('Producto creado exitosamente')
```

**Después:**
```tsx
const toast = useToast()
toast.success('Producto creado exitosamente')
```

### Reemplazar confirms nativos

**Antes:**
```tsx
if (confirm('¿Eliminar este producto?')) {
  deleteProduct()
}
```

**Después:**
```tsx
const { confirm, ConfirmDialog } = useConfirm()

const confirmed = await confirm({
  title: '¿Eliminar producto?',
  message: 'Esta acción no se puede deshacer',
  variant: 'danger'
})

if (confirmed) {
  deleteProduct()
}
```

---

## 🚀 Ejemplo Completo

```tsx
'use client'

import { useState } from 'react'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { Button, Input, Modal } from '@/app/components/ui'

export default function EjemploPage() {
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [nombre, setNombre] = useState('')

  async function handleSubmit() {
    if (!nombre) {
      toast.error('El nombre es requerido')
      return
    }

    const confirmed = await confirm({
      title: '¿Guardar cambios?',
      message: 'Se guardará el producto con estos datos',
      variant: 'info'
    })

    if (confirmed) {
      // Guardar...
      toast.success('Producto guardado exitosamente')
      setIsModalOpen(false)
    }
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        Nuevo Producto
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear Producto"
        size="md"
      >
        <Input
          label="Nombre del Producto"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Camisa Polo"
        />
        
        <div className="flex gap-3 mt-6">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleSubmit}>
            Guardar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog />
    </>
  )
}
```

---

## 📝 Notas

- Todos los componentes soportan dark mode automáticamente
- Las animaciones están optimizadas para rendimiento
- Los componentes son accesibles (keyboard navigation, ARIA labels)
- El ToastProvider debe estar en el layout raíz (ya configurado)

---

## 🎯 Próximos Pasos

Para migrar toda la aplicación:

1. Buscar todos los `alert()` y reemplazar con `toast.error()` o `toast.info()`
2. Buscar todos los `confirm()` y reemplazar con `useConfirm()`
3. Estandarizar botones usando el componente `Button`
4. Usar `Input` para formularios consistentes
