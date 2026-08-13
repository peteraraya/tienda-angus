'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface Variante {
  id: string
  producto_id: string
  talla: string
  colegio: string
  stock: number
  precio?: number | null
}

interface Producto {
  id: string
  nombre: string
  descripcion: string
  precio: number
  categoria: string
  imagen_url?: string
  imagenes?: string[]
  stock_total?: number
  variantes_count?: number
  descuento_porcentaje?: number
  en_oferta?: boolean
  notas?: string
  variantes?: Variante[]
  created_at?: string
}

// Fetch productos con variantes
async function fetchProductos(): Promise<Producto[]> {
  const { data: productosData, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  // Cargar colegios con sus insignias
  const { data: colegiosData } = await supabase
    .from('colegios')
    .select('nombre, insignia_url')
    .eq('activo', true)

  const colegiosMap = new Map(
    colegiosData?.map(c => [c.nombre, c.insignia_url]) || []
  )

  // Cargar todas las variantes
  const { data: variantesData } = await supabase
    .from('variantes')
    .select('*')

  // Agrupar variantes por producto
  const variantesPorProducto = new Map<string, Variante[]>()
  variantesData?.forEach(variante => {
    if (!variantesPorProducto.has(variante.producto_id)) {
      variantesPorProducto.set(variante.producto_id, [])
    }
    variantesPorProducto.get(variante.producto_id)!.push({
      ...variante,
      insignia_url: colegiosMap.get(variante.colegio)
    })
  })

  // Combinar productos con sus variantes
  const productos: Producto[] = productosData?.map(producto => {
    const variantes = variantesPorProducto.get(producto.id) || []
    const stock_total = variantes.reduce((sum, v) => sum + v.stock, 0)
    
    return {
      ...producto,
      variantes,
      stock_total,
      variantes_count: variantes.length
    }
  }) || []

  return productos
}

// Hook principal para productos
export function useProductos() {
  return useQuery({
    queryKey: ['productos'],
    queryFn: fetchProductos,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

// Hook para un producto específico
export function useProducto(id: string) {
  return useQuery({
    queryKey: ['producto', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Cargar variantes
      const { data: variantes } = await supabase
        .from('variantes')
        .select('*')
        .eq('producto_id', id)

      return {
        ...data,
        variantes: variantes || []
      }
    },
    enabled: !!id,
  })
}

// Mutation para actualizar stock de variante
export function useUpdateVarianteStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, stock }: { id: string; stock: number }) => {
      const { error } = await supabase
        .from('variantes')
        .update({ stock })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

// Mutation para actualizar descuento
export function useUpdateDescuento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      descuento_porcentaje 
    }: { 
      id: string
      descuento_porcentaje: number 
    }) => {
      const { error } = await supabase
        .from('productos')
        .update({ descuento_porcentaje })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

// Mutation para toggle oferta
export function useToggleOferta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, en_oferta }: { id: string; en_oferta: boolean }) => {
      const { error } = await supabase
        .from('productos')
        .update({ en_oferta })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

// Mutation para eliminar producto
export function useDeleteProducto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}

// Mutation para duplicar producto
export function useDuplicateProducto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productoId: string) => {
      // Obtener producto original
      const { data: producto } = await supabase
        .from('productos')
        .select('*')
        .eq('id', productoId)
        .single()

      if (!producto) throw new Error('Producto no encontrado')

      // Crear copia
      const { data: nuevoProducto, error: errorProducto } = await supabase
        .from('productos')
        .insert([{
          nombre: `${producto.nombre} (Copia)`,
          descripcion: producto.descripcion,
          precio: producto.precio,
          categoria: producto.categoria,
          imagen_url: producto.imagen_url,
          imagenes: producto.imagenes,
          descuento_porcentaje: producto.descuento_porcentaje,
          en_oferta: producto.en_oferta,
          notas: producto.notas
        }])
        .select()
        .single()

      if (errorProducto) throw errorProducto

      // Copiar variantes
      const { data: variantes } = await supabase
        .from('variantes')
        .select('*')
        .eq('producto_id', productoId)

      if (variantes && variantes.length > 0) {
        const nuevasVariantes = variantes.map(v => ({
          producto_id: nuevoProducto.id,
          talla: v.talla,
          colegio: v.colegio,
          stock: v.stock,
          precio: v.precio
        }))

        await supabase.from('variantes').insert(nuevasVariantes)
      }

      return nuevoProducto
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
    },
  })
}
