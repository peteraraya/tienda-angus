'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos
const STORAGE_PREFIX = 'static_data_'

interface CacheData<T> {
  data: T
  timestamp: number
}

function getCachedData<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(STORAGE_PREFIX + key)
    if (!cached) return null

    const parsed: CacheData<T> = JSON.parse(cached)
    const now = Date.now()

    // Verificar si el caché expiró
    if (now - parsed.timestamp > CACHE_DURATION) {
      localStorage.removeItem(STORAGE_PREFIX + key)
      return null
    }

    return parsed.data
  } catch {
    return null
  }
}

function setCachedData<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  
  try {
    const cacheData: CacheData<T> = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(cacheData))
  } catch (error) {
    console.error('Error al guardar en caché:', error)
  }
}

export function useColegios() {
  const [colegios, setColegios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadColegios() {
      // Intentar cargar desde caché
      const cached = getCachedData<string[]>('colegios')
      if (cached) {
        setColegios(cached)
        setLoading(false)
        return
      }

      // Si no hay caché, cargar desde BD
      const { data } = await supabase
        .from('colegios')
        .select('nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (data) {
        const nombres = data.map(c => c.nombre)
        setColegios(nombres)
        setCachedData('colegios', nombres)
      }
      
      setLoading(false)
    }

    loadColegios()
  }, [])

  const refresh = async () => {
    setLoading(true)
    localStorage.removeItem(STORAGE_PREFIX + 'colegios')
    
    const { data } = await supabase
      .from('colegios')
      .select('nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (data) {
      const nombres = data.map(c => c.nombre)
      setColegios(nombres)
      setCachedData('colegios', nombres)
    }
    
    setLoading(false)
  }

  return { colegios, loading, refresh }
}

export function useCategorias() {
  const [categorias, setCategorias] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCategorias() {
      // Intentar cargar desde caché
      const cached = getCachedData<string[]>('categorias')
      if (cached) {
        setCategorias(cached)
        setLoading(false)
        return
      }

      // Si no hay caché, cargar desde BD
      const { data } = await supabase
        .from('categorias')
        .select('nombre')
        .eq('activo', true)
        .order('nombre', { ascending: true })

      if (data) {
        const nombres = data.map(c => c.nombre)
        setCategorias(nombres)
        setCachedData('categorias', nombres)
      }
      
      setLoading(false)
    }

    loadCategorias()
  }, [])

  const refresh = async () => {
    setLoading(true)
    localStorage.removeItem(STORAGE_PREFIX + 'categorias')
    
    const { data } = await supabase
      .from('categorias')
      .select('nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true })

    if (data) {
      const nombres = data.map(c => c.nombre)
      setCategorias(nombres)
      setCachedData('categorias', nombres)
    }
    
    setLoading(false)
  }

  return { categorias, loading, refresh }
}

// Hook genérico para otros datos estáticos
export function useStaticData<T>(
  table: string,
  cacheKey: string,
  selectQuery: string = '*',
  orderBy?: { column: string; ascending?: boolean }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      // Intentar cargar desde caché
      const cached = getCachedData<T[]>(cacheKey)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }

      // Si no hay caché, cargar desde BD
      let query = supabase.from(table).select(selectQuery)
      
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
      }

      const { data: result } = await query

      if (result) {
        setData(result as T[])
        setCachedData(cacheKey, result as T[])
      }
      
      setLoading(false)
    }

    loadData()
  }, [table, cacheKey, selectQuery, orderBy])

  const refresh = async () => {
    setLoading(true)
    localStorage.removeItem(STORAGE_PREFIX + cacheKey)
    
    let query = supabase.from(table).select(selectQuery)
    
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data: result } = await query

    if (result) {
      setData(result as T[])
      setCachedData(cacheKey, result as T[])
    }
    
    setLoading(false)
  }

  return { data, loading, refresh }
}

// Función para limpiar todo el caché
export function clearAllCache() {
  if (typeof window === 'undefined') return
  
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith(STORAGE_PREFIX)) {
      localStorage.removeItem(key)
    }
  })
}
