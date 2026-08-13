'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { formatPrice } from '@/lib/formatPrice'
import type { Producto as DBProducto, Variante as DBVariante } from '@/types/database'

export interface Variante extends DBVariante {
  insignia_url?: string
}

export interface Producto extends DBProducto {
  stock_total?: number
  variantes_count?: number
  variantes?: Variante[]
}

/**
 * Custom hook to manage the state and actions of products in the admin panel.
 * Handles fetching, deleting, duplicating, and updating products and their variants.
 * Interacts directly with the Supabase client.
 * 
 * @returns {Object} Product state and action methods
 */
export function useAdminProductos() {
  const [productos, setProductos] = useState<Producto[]>([])
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()

  /**
   * Fetches all products and their associated variants from the database.
   * Also maps school badges (insignias) to the corresponding variants.
   */
  async function loadProductos() {
    const { data: productosData } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false })

    // Cargar colegios con sus insignias
    const { data: colegiosData } = await supabase
      .from('colegios')
      .select('nombre, insignia_url')

    // Crear mapa con normalización de nombres para evitar problemas de coincidencia
    const colegiosMap = new Map(
      colegiosData?.map(c => [c.nombre.trim(), c.insignia_url]) || []
    )

    if (productosData) {
      const productosConInfo = await Promise.all(
        productosData.map(async (producto) => {
          const { data: variantes } = await supabase
            .from('variantes')
            .select('*')
            .eq('producto_id', producto.id)

          // Agregar insignia_url a cada variante
          const variantesConInsignia = variantes?.map(v => ({
            ...v,
            insignia_url: colegiosMap.get(v.colegio.trim())
          })) || []

          const stock_total = variantes?.reduce((sum, v) => sum + v.stock, 0) || 0
          const variantes_count = variantes?.length || 0

          return {
            ...producto,
            stock_total,
            variantes_count,
            variantes: variantesConInsignia
          }
        })
      )

      setProductos(productosConInfo)
    }
  }

  /**
   * Deletes a product and all its variants after user confirmation.
   * 
   * @param {string} id - The ID of the product to delete
   */
  async function deleteProducto(id: string) {
    const confirmed = await confirm({
      title: '¿Eliminar producto?',
      message: 'Se eliminará este producto y todas sus variantes. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
    })

    if (!confirmed) return

    await supabase.from('productos').delete().eq('id', id)
    toast.success('Producto eliminado exitosamente')
    loadProductos()
  }

  /**
   * Toggles the "on sale" (en_oferta) status of a product after user confirmation.
   * 
   * @param {string} id - The ID of the product
   * @param {boolean} currentState - The current sale status
   */
  async function toggleOferta(id: string, currentState: boolean) {
    const producto = productos.find(p => p.id === id)
    const nuevoEstado = !currentState
    
    const confirmed = await confirm({
      title: nuevoEstado ? '¿Activar oferta?' : '¿Desactivar oferta?',
      message: nuevoEstado 
        ? `Se marcará "${producto?.nombre}" como producto en oferta. Aparecerá con una insignia especial.`
        : `Se quitará la marca de oferta de "${producto?.nombre}".`,
      confirmText: nuevoEstado ? 'Activar Oferta' : 'Desactivar',
      variant: nuevoEstado ? 'warning' : 'info'
    })

    if (!confirmed) return

    await supabase
      .from('productos')
      .update({ en_oferta: nuevoEstado })
      .eq('id', id)
    
    toast.success(nuevoEstado ? 'Oferta activada exitosamente' : 'Oferta desactivada')
    loadProductos()
  }

  /**
   * Updates the discount percentage of a product after user confirmation.
   * 
   * @param {string} id - The ID of the product
   * @param {number} descuento - The new discount percentage (0-100)
   */
  async function updateDescuento(id: string, descuento: number) {
    if (descuento < 0 || descuento > 100) {
      toast.error('El descuento debe estar entre 0 y 100')
      return
    }

    const producto = productos.find(p => p.id === id)
    const descuentoActual = producto?.descuento_porcentaje || 0
    
    // Si no hay cambio, no hacer nada
    if (descuento === descuentoActual) return

    // Si se está quitando el descuento (0%), no pedir confirmación
    if (descuento === 0) {
      await supabase
        .from('productos')
        .update({ descuento_porcentaje: descuento })
        .eq('id', id)
      toast.success('Descuento eliminado')
      loadProductos()
      return
    }

    // Calcular precios
    const precioOriginal = producto?.precio || 0
    const precioFinal = precioOriginal - (precioOriginal * descuento / 100)
    
    const confirmed = await confirm({
      title: '¿Aplicar descuento?',
      message: `Se aplicará un descuento del ${descuento}% a "${producto?.nombre}".\n\nPrecio original: ${formatPrice(precioOriginal)}\nPrecio con descuento: ${formatPrice(precioFinal)}\nAhorro: ${formatPrice(precioOriginal - precioFinal)}`,
      confirmText: 'Aplicar Descuento',
      variant: 'warning'
    })

    if (!confirmed) {
      // Revertir el select al valor anterior
      loadProductos()
      return
    }
    
    await supabase
      .from('productos')
      .update({ descuento_porcentaje: descuento })
      .eq('id', id)
    
    toast.success(`Descuento del ${descuento}% aplicado exitosamente`)
    loadProductos()
  }

  /**
   * Duplicates an existing product and all its variants.
   * Appends "(Copia)" to the name of the new product.
   * 
   * @param {Producto} producto - The product object to duplicate
   */
  async function duplicateProduct(producto: Producto) {
    const confirmed = await confirm({
      title: '¿Duplicar producto?',
      message: 'Se creará una copia de este producto con todas sus variantes',
      confirmText: 'Duplicar',
      variant: 'info'
    })

    if (!confirmed) return

    const { data: newProduct } = await supabase
      .from('productos')
      .insert({
        nombre: `${producto.nombre} (Copia)`,
        descripcion: producto.descripcion,
        precio: producto.precio,
        categoria: producto.categoria,
        imagen_url: producto.imagen_url,
        descuento_porcentaje: producto.descuento_porcentaje,
        en_oferta: producto.en_oferta
      })
      .select()
      .single()

    if (newProduct && producto.variantes) {
      const variantesToInsert = producto.variantes.map(v => ({
        producto_id: newProduct.id,
        talla: v.talla,
        colegio: v.colegio,
        stock: v.stock
      }))
      
      await supabase.from('variantes').insert(variantesToInsert)
    }
    
    toast.success('Producto duplicado exitosamente')
    loadProductos()
  }

  return {
    productos,
    setProductos,
    loadProductos,
    deleteProducto,
    toggleOferta,
    updateDescuento,
    duplicateProduct,
    ConfirmDialog
  }
}
