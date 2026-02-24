# Sistema de Filtros Avanzados - Panel de Administración

## Descripción
Se implementó un sistema de filtros avanzados en el panel de administración para facilitar la búsqueda rápida de productos según consultas específicas de clientes.

## Filtros Disponibles

### 1. Búsqueda por Nombre/Descripción
- Campo de texto con búsqueda en tiempo real
- Busca coincidencias en nombre y descripción del producto
- No distingue entre mayúsculas y minúsculas

### 2. Filtro por Categoría
- Selector desplegable con todas las categorías disponibles
- Muestra solo productos de la categoría seleccionada
- Opción "Todas las categorías" para ver todo

### 3. Filtro por Colegio
- Selector desplegable con todos los colegios disponibles
- Muestra productos que tienen variantes del colegio seleccionado
- Útil cuando un cliente pregunta: "¿Tienen uniformes del Colegio San Miguel?"

### 4. Filtro por Talla
- Selector desplegable con todas las tallas disponibles
- Ordenadas correctamente: 6, 8, 10, 12, 14, 16, S, M, L, XL
- Muestra productos que tienen variantes de la talla seleccionada
- Útil cuando un cliente pregunta: "¿Qué tienen en talla 12?"

## Características Adicionales

### Mensaje de Stock Específico
Cuando filtras por Colegio y/o Talla, aparece un mensaje destacado que muestra:
- **Stock disponible:** "Hay X unidades disponibles de talla Y para Colegio Z"
- **Sin stock:** "No hay stock disponible de talla Y para Colegio Z"
- **Colores visuales:**
  - Verde con ✓ cuando hay stock
  - Rojo con ✕ cuando no hay stock
- **Información detallada:** Muestra cuántas variantes coinciden con los filtros

Ejemplos de mensajes:
- "Hay 5 unidades disponibles de talla L para Simón Bolívar (2 variantes)"
- "Hay 1 unidad disponible de talla M para Liceo de Aplicación (1 variante)"
- "No hay stock disponible de talla S para Instituto Nacional"
- "Hay 12 unidades disponibles para Simón Bolívar (8 variantes)" (sin filtro de talla)
- "Hay 3 unidades disponibles de talla XL (3 variantes)" (sin filtro de colegio)

### Filtros Combinables
Todos los filtros funcionan en conjunto. Por ejemplo:
- Categoría: "pantalon" + Colegio: "Simón Bolívar" + Talla: "12"
- Muestra solo pantalones del Colegio Simón Bolívar disponibles en talla 12

### Botón "Limpiar Filtros"
- Aparece automáticamente cuando hay filtros activos
- Limpia todos los filtros con un solo clic
- Vuelve a mostrar todos los productos

### Badges de Filtros Activos
- Muestra visualmente qué filtros están aplicados
- Cada badge tiene un botón "✕" para remover ese filtro específico
- Colores diferentes para cada tipo de filtro:
  - Azul: Categoría
  - Morado: Colegio
  - Verde: Talla

### Contador de Resultados
- Muestra cuántos productos coinciden con los filtros
- Formato: "Mostrando X de Y productos"
- Se actualiza en tiempo real

## Casos de Uso Comunes

### Caso 1: Cliente pregunta por colegio específico
**Pregunta:** "¿Tienen uniformes del Instituto Nacional?"
**Acción:** Seleccionar "Instituto Nacional" en el filtro de Colegio
**Resultado:** Ver todos los productos disponibles para ese colegio

### Caso 2: Cliente busca talla específica
**Pregunta:** "¿Qué tienen en talla S?"
**Acción:** Seleccionar "S" en el filtro de Talla
**Resultado:** Ver todos los productos con stock en talla S

### Caso 3: Consulta combinada
**Pregunta:** "¿Tienen poleras del Liceo de Aplicación en talla M?"
**Acción:** 
1. Categoría: "polera"
2. Colegio: "Liceo de Aplicación"
3. Talla: "M"
**Resultado:** Ver solo poleras del Liceo de Aplicación disponibles en talla M

### Caso 4: Búsqueda por nombre
**Pregunta:** "¿Tienen el uniforme de educación física?"
**Acción:** Escribir "educación física" en el buscador
**Resultado:** Ver todos los productos que mencionen "educación física"

## Ventajas

1. **Respuesta Rápida:** Encuentra productos en segundos
2. **Precisión:** Filtra exactamente lo que el cliente necesita
3. **Eficiencia:** No necesitas revisar toda la lista manualmente
4. **Flexibilidad:** Combina múltiples filtros según necesites
5. **Visual:** Los badges muestran claramente qué estás filtrando

## Interfaz

### Diseño Responsive
- En pantallas grandes: Filtros en dos filas
  - Fila 1: Búsqueda + Categoría
  - Fila 2: Colegio + Talla + Botón Limpiar
- En móviles: Todos los filtros apilados verticalmente

### Modo Oscuro
- Todos los filtros funcionan perfectamente en modo oscuro
- Colores adaptados para buena legibilidad

## Implementación Técnica

### Estados
```typescript
const [searchTerm, setSearchTerm] = useState('')
const [selectedCategory, setSelectedCategory] = useState('')
const [selectedColegio, setSelectedColegio] = useState('')
const [selectedTalla, setSelectedTalla] = useState('')
```

### Lógica de Filtrado
```typescript
const filteredProducts = useMemo(() => {
  return productos.filter(producto => {
    const matchesSearch = searchTerm === '' || 
      producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === '' || 
      producto.categoria === selectedCategory

    const matchesColegio = selectedColegio === '' || 
      producto.variantes?.some(v => v.colegio === selectedColegio)

    const matchesTalla = selectedTalla === '' || 
      producto.variantes?.some(v => v.talla === selectedTalla)

    return matchesSearch && matchesCategory && matchesColegio && matchesTalla
  })
}, [productos, searchTerm, selectedCategory, selectedColegio, selectedTalla])
```

### Generación de Opciones
```typescript
// Categorías únicas
const categories = useMemo(() => {
  return [...new Set(productos.map(p => p.categoria))].sort()
}, [productos])

// Colegios únicos de todas las variantes
const colegios = useMemo(() => {
  const allColegios = productos.flatMap(p => p.variantes?.map(v => v.colegio) || [])
  return [...new Set(allColegios)].sort()
}, [productos])

// Tallas únicas ordenadas correctamente
const tallas = useMemo(() => {
  const allTallas = productos.flatMap(p => p.variantes?.map(v => v.talla) || [])
  const uniqueTallas = [...new Set(allTallas)]
  const order = ['6', '8', '10', '12', '14', '16', 'S', 'M', 'L', 'XL']
  return uniqueTallas.sort((a, b) => order.indexOf(a) - order.indexOf(b))
}, [productos])
```

## Próximas Mejoras Sugeridas

1. **Filtro por Stock:** Mostrar solo productos con/sin stock
2. **Filtro por Oferta:** Mostrar solo productos en oferta
3. **Ordenamiento:** Ordenar por precio, nombre, stock, etc.
4. **Exportar Resultados:** Exportar productos filtrados a CSV/Excel
5. **Guardar Filtros:** Guardar combinaciones de filtros frecuentes
