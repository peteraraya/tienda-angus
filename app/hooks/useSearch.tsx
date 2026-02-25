'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface SearchOptions {
  query: string
  categoria?: string
  colegio?: string
  talla?: string
  stockFilter?: 'disponible' | 'bajo' | 'agotado' | ''
  minPrecio?: number
  maxPrecio?: number
}

// Búsqueda full-text en productos
export function useSearchProductos(options: SearchOptions) {
  const { query, categoria, colegio, talla, stockFilter, minPrecio, maxPrecio } = options

  return useQuery({
    queryKey: ['search-productos', options],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('productos')
        .select(`
          *,
          variantes(*)
        `)
        .order('created_at', { ascending: false })

      // Búsqueda full-text si hay query
      if (query && query.trim() !== '') {
        // Usar búsqueda full-text en español
        queryBuilder = queryBuilder.textSearch(
          'nombre',
          query,
          {
            type: 'websearch',
            config: 'spanish'
          }
        )
      }

      // Filtro por categoría
      if (categoria) {
        queryBuilder = queryBuilder.eq('categoria', categoria)
      }

      // Filtro por rango de precio
      if (minPrecio !== undefined) {
        queryBuilder = queryBuilder.gte('precio', minPrecio)
      }
      if (maxPrecio !== undefined) {
        queryBuilder = queryBuilder.lte('precio', maxPrecio)
      }

      const { data: productos, error } = await queryBuilder

      if (error) throw error

      // Filtros adicionales en cliente (colegio, talla, stock)
      let filteredProductos = productos || []

      // Filtro por colegio
      if (colegio) {
        filteredProductos = filteredProductos.filter(p =>
          p.variantes?.some((v: any) => v.colegio === colegio)
        )
      }

      // Filtro por talla
      if (talla) {
        filteredProductos = filteredProductos.filter(p =>
          p.variantes?.some((v: any) => v.talla === talla)
        )
      }

      // Calcular stock total y aplicar filtro de stock
      filteredProductos = filteredProductos.map(p => {
        const stock_total = p.variantes?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0
        return { ...p, stock_total }
      })

      if (stockFilter) {
        filteredProductos = filteredProductos.filter(p => {
          const stock = p.stock_total || 0
          switch (stockFilter) {
            case 'disponible':
              return stock > 6
            case 'bajo':
              return stock > 0 && stock <= 6
            case 'agotado':
              return stock === 0
            default:
              return true
          }
        })
      }

      return filteredProductos
    },
    enabled: true,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

// Búsqueda full-text en clientes
export function useSearchClientes(query: string) {
  return useQuery({
    queryKey: ['search-clientes', query],
    queryFn: async () => {
      if (!query || query.trim() === '') {
        const { data, error } = await supabase
          .from('clientes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        return data
      }

      // Búsqueda full-text
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`nombre.ilike.%${query}%,telefono.ilike.%${query}%,contacto.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return data
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
  })
}

// Búsqueda full-text en insumos
export function useSearchInsumos(query: string, categoria?: string) {
  return useQuery({
    queryKey: ['search-insumos', query, categoria],
    queryFn: async () => {
      let queryBuilder = supabase
        .from('insumos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (query && query.trim() !== '') {
        queryBuilder = queryBuilder.or(
          `nombre.ilike.%${query}%,descripcion.ilike.%${query}%`
        )
      }

      if (categoria) {
        queryBuilder = queryBuilder.eq('categoria', categoria)
      }

      const { data, error } = await queryBuilder

      if (error) throw error
      return data
    },
    enabled: true,
    staleTime: 2 * 60 * 1000,
  })
}

// Búsqueda avanzada con sugerencias
export function useSearchSuggestions(query: string, type: 'productos' | 'clientes' | 'insumos') {
  return useQuery({
    queryKey: ['search-suggestions', query, type],
    queryFn: async () => {
      if (!query || query.length < 2) return []

      let suggestions: string[] = []

      switch (type) {
        case 'productos':
          const { data: productos } = await supabase
            .from('productos')
            .select('nombre')
            .ilike('nombre', `%${query}%`)
            .limit(5)
          suggestions = productos?.map(p => p.nombre) || []
          break

        case 'clientes':
          const { data: clientes } = await supabase
            .from('clientes')
            .select('nombre')
            .ilike('nombre', `%${query}%`)
            .limit(5)
          suggestions = clientes?.map(c => c.nombre) || []
          break

        case 'insumos':
          const { data: insumos } = await supabase
            .from('insumos')
            .select('nombre')
            .ilike('nombre', `%${query}%`)
            .limit(5)
          suggestions = insumos?.map(i => i.nombre) || []
          break
      }

      return suggestions
    },
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000,
  })
}
