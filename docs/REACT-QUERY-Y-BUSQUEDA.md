# 🚀 React Query y Búsqueda Full-Text

Implementación de React Query (TanStack Query) para gestión de estado y búsqueda full-text avanzada.

---

## 📦 Instalación

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## ⚙️ Configuración

### QueryProvider

**Archivo**: `app/providers/QueryProvider.tsx`

Configuración global de React Query:
- **staleTime**: 5 minutos (datos considerados frescos)
- **gcTime**: 10 minutos (tiempo en caché)
- **refetchOnWindowFocus**: false (no recargar al cambiar de ventana)
- **retry**: 1 intento (en caso de error)

### Integración en Layout

El `QueryProvider` envuelve toda la aplicación en `app/layout.tsx`:

```typescript
<QueryProvider>
  <ToastProvider>
    {children}
  </ToastProvider>
</QueryProvider>
```

---

## 🎣 Hooks Disponibles

### 1. useProductos()

Obtiene todos los productos con sus variantes.

```typescript
import { useProductos } from '@/app/hooks/useProductos'

function MiComponente() {
  const { data: productos, isLoading, error, refetch } = useProductos()

  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {productos?.map(producto => (
        <div key={producto.id}>{producto.nombre}</div>
      ))}
    </div>
  )
}
```

**Características**:
- ✅ Caché automático de 2 minutos
- ✅ Incluye variantes y stock total
- ✅ Revalidación inteligente

### 2. useProducto(id)

Obtiene un producto específico.

```typescript
const { data: producto, isLoading } = useProducto(productoId)
```

### 3. Mutations

#### useUpdateVarianteStock()

```typescript
const updateStock = useUpdateVarianteStock()

updateStock.mutate(
  { id: varianteId, stock: 50 },
  {
    onSuccess: () => toast.success('Stock actualizado'),
    onError: () => toast.error('Error al actualizar')
  }
)
```

#### useUpdateDescuento()

```typescript
const updateDescuento = useUpdateDescuento()

updateDescuento.mutate({
  id: productoId,
  descuento_porcentaje: 15
})
```

#### useToggleOferta()

```typescript
const toggleOferta = useToggleOferta()

toggleOferta.mutate({
  id: productoId,
  en_oferta: true
})
```

#### useDeleteProducto()

```typescript
const deleteProducto = useDeleteProducto()

deleteProducto.mutate(productoId, {
  onSuccess: () => toast.success('Producto eliminado')
})
```

#### useDuplicateProducto()

```typescript
const duplicateProducto = useDuplicateProducto()

duplicateProducto.mutate(productoId, {
  onSuccess: (nuevoProducto) => {
    toast.success(`Producto duplicado: ${nuevoProducto.nombre}`)
  }
})
```

---

## 🔍 Búsqueda Full-Text

### useSearchProductos()

Búsqueda avanzada con múltiples filtros.

```typescript
import { useSearchProductos } from '@/app/hooks/useSearch'

function BusquedaAvanzada() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoria, setCategoria] = useState('')
  
  const { data: productos, isLoading } = useSearchProductos({
    query: searchTerm,
    categoria,
    colegio: 'Colegio San Agustín',
    talla: 'M',
    stockFilter: 'disponible',
    minPrecio: 10000,
    maxPrecio: 50000
  })

  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar productos..."
      />
      {/* Renderizar productos */}
    </div>
  )
}
```

**Filtros Disponibles**:
- `query`: Búsqueda full-text en nombre
- `categoria`: Filtrar por categoría
- `colegio`: Filtrar por colegio
- `talla`: Filtrar por talla
- `stockFilter`: 'disponible' | 'bajo' | 'agotado'
- `minPrecio`: Precio mínimo
- `maxPrecio`: Precio máximo

### useSearchClientes()

```typescript
const { data: clientes } = useSearchClientes('Juan')
```

Busca en: nombre, teléfono, contacto

### useSearchInsumos()

```typescript
const { data: insumos } = useSearchInsumos('tela', 'Telas')
```

Busca en: nombre, descripción

### useSearchSuggestions()

Sugerencias de búsqueda en tiempo real.

```typescript
const { data: suggestions } = useSearchSuggestions(
  searchTerm,
  'productos'
)
```

---

## 🎨 Componente SearchBar

**Archivo**: `app/components/SearchBar.tsx`

Barra de búsqueda con sugerencias automáticas.

```typescript
import SearchBar from '@/app/components/SearchBar'

function MiComponente() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <SearchBar
      value={searchTerm}
      onChange={setSearchTerm}
      placeholder="🔍 Buscar productos..."
      type="productos"
      onSearch={(value) => console.log('Buscar:', value)}
    />
  )
}
```

**Props**:
- `value`: Valor actual
- `onChange`: Callback al cambiar
- `placeholder`: Texto placeholder
- `type`: 'productos' | 'clientes' | 'insumos'
- `onSearch`: Callback al presionar Enter
- `className`: Clases CSS adicionales

**Características**:
- ✅ Sugerencias automáticas
- ✅ Búsqueda al presionar Enter
- ✅ Botón para limpiar
- ✅ Loading indicator
- ✅ Dark mode
- ✅ Keyboard navigation (Enter, Escape)

---

## 💡 Ventajas de React Query

### 1. Caché Inteligente

```typescript
// Primera llamada: fetch desde BD
const { data } = useProductos()

// Segunda llamada (dentro de 5 min): desde caché
const { data } = useProductos()
```

### 2. Revalidación Automática

```typescript
// Después de una mutación, los datos se revalidan automáticamente
const updateStock = useUpdateVarianteStock()

updateStock.mutate({ id, stock }, {
  onSuccess: () => {
    // useProductos() se actualiza automáticamente
  }
})
```

### 3. Optimistic Updates

```typescript
const updateStock = useUpdateVarianteStock()

updateStock.mutate(
  { id, stock },
  {
    onMutate: async (newData) => {
      // Actualizar UI inmediatamente
      await queryClient.cancelQueries({ queryKey: ['productos'] })
      const previousData = queryClient.getQueryData(['productos'])
      
      queryClient.setQueryData(['productos'], (old) => {
        // Actualizar datos optimistamente
        return updateProductInList(old, newData)
      })

      return { previousData }
    },
    onError: (err, newData, context) => {
      // Revertir en caso de error
      queryClient.setQueryData(['productos'], context.previousData)
    }
  }
)
```

### 4. Estados de Carga

```typescript
const { data, isLoading, isFetching, isError, error } = useProductos()

if (isLoading) return <Skeleton />
if (isError) return <Error message={error.message} />
if (isFetching) return <RefreshIndicator />

return <ProductList productos={data} />
```

### 5. Parallel Queries

```typescript
function Dashboard() {
  const productos = useProductos()
  const clientes = useSearchClientes('')
  const insumos = useSearchInsumos('', '')

  // Todas las queries se ejecutan en paralelo
  const isLoading = productos.isLoading || clientes.isLoading || insumos.isLoading

  if (isLoading) return <Loading />

  return (
    <div>
      <ProductosWidget data={productos.data} />
      <ClientesWidget data={clientes.data} />
      <InsumosWidget data={insumos.data} />
    </div>
  )
}
```

---

## 🔧 DevTools

En desarrollo, React Query DevTools está disponible:

- Presiona el ícono flotante en la esquina inferior
- Ver todas las queries activas
- Inspeccionar caché
- Forzar refetch
- Ver estados de loading/error

---

## 📊 Comparación: Antes vs Después

### Antes (useState + useEffect)

```typescript
const [productos, setProductos] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  async function loadProductos() {
    try {
      setLoading(true)
      const { data } = await supabase.from('productos').select('*')
      setProductos(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  loadProductos()
}, [])

// Problemas:
// ❌ Sin caché
// ❌ Recargas innecesarias
// ❌ Código repetitivo
// ❌ Difícil sincronizar estado
```

### Después (React Query)

```typescript
const { data: productos, isLoading, error } = useProductos()

// Ventajas:
// ✅ Caché automático
// ✅ Revalidación inteligente
// ✅ Código limpio
// ✅ Estado sincronizado
// ✅ DevTools incluidas
```

---

## 🎯 Mejores Prácticas

### 1. Query Keys Consistentes

```typescript
// ✅ Bueno
['productos']
['producto', id]
['search-productos', { query, categoria }]

// ❌ Malo
['getProductos']
['prod', id]
```

### 2. Invalidación Selectiva

```typescript
// Invalidar solo productos
queryClient.invalidateQueries({ queryKey: ['productos'] })

// Invalidar todo
queryClient.invalidateQueries()
```

### 3. Stale Time Apropiado

```typescript
// Datos que cambian frecuentemente
staleTime: 1 * 60 * 1000 // 1 minuto

// Datos estáticos
staleTime: 10 * 60 * 1000 // 10 minutos

// Datos en tiempo real
staleTime: 0 // Siempre revalidar
```

### 4. Error Handling

```typescript
const { data, error, isError } = useProductos()

if (isError) {
  return (
    <div className="error">
      <h3>Error al cargar productos</h3>
      <p>{error.message}</p>
      <button onClick={() => refetch()}>Reintentar</button>
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### Los datos no se actualizan

```typescript
// Forzar refetch
const { refetch } = useProductos()
refetch()

// O invalidar query
queryClient.invalidateQueries({ queryKey: ['productos'] })
```

### Demasiadas peticiones

```typescript
// Aumentar staleTime
staleTime: 5 * 60 * 1000 // 5 minutos
```

### Caché no funciona

```typescript
// Verificar que las query keys sean consistentes
// ✅ Bueno
useQuery({ queryKey: ['productos'] })
useQuery({ queryKey: ['productos'] }) // Usa el mismo caché

// ❌ Malo
useQuery({ queryKey: ['productos'] })
useQuery({ queryKey: ['products'] }) // Caché diferente
```

---

## 📚 Recursos

- [React Query Docs](https://tanstack.com/query/latest)
- [React Query DevTools](https://tanstack.com/query/latest/docs/react/devtools)
- [Supabase + React Query](https://supabase.com/docs/guides/getting-started/tutorials/with-react)

---

**Fecha de Implementación**: Diciembre 2024  
**Versión**: 1.0  
**Estado**: ✅ COMPLETADO
