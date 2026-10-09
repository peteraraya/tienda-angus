'use client'

import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { formatPrice } from '@/lib/formatPrice'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef } from 'react'
import { 
  fetchProductosAction, 
  deleteProductoAction,
  updateOfertaAction,
  toggleActivoProductoAction,
  updateDescuentoAction,
  duplicateProductAction,
  updateVarianteStockAction,
  updateProductNameAction,
  updateProductPriceAction,
  updateProductNotasAction,
  type Producto,
  type Variante
} from '@/app/actions/productos'

export type { Producto, Variante }

/**
 * Custom hook to manage the state and actions of products in the admin panel.
 * Handles fetching, deleting, duplicating, and updating products and their variants.
 * Interacts directly with the Supabase client and uses TanStack React Query for caching.
 * 
 * @returns {Object} Product state, loading status, and action methods
 */
export function useAdminProductos() {
  const toast = useToast()
  const { confirm, ConfirmDialog } = useConfirm()
  const queryClient = useQueryClient()
  const duplicateRequestKeys = useRef(new Map<string, string>())

  /**
   * Fetches all products and their associated variants from the database using React Query.
   * Also maps school badges (insignias) to the corresponding variants.
   */
  const {
    data: productos = [],
    isLoading: isLoadingProductos,
    isError: isErrorProductos,
    error: errorProductos,
    refetch: refetchProductos
  } = useQuery({
    queryKey: ['adminProductos'],
    queryFn: fetchProductosAction,
  })

  // Mutaciones para operaciones de escritura que invalidan el caché al terminar
  const deleteMutation = useMutation({
    mutationFn: deleteProductoAction,
    onSuccess: () => {
      toast.success('Producto archivado; se conserva en el historial de ventas')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo archivar el producto')
  })

  const updateOfertaMutation = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string, nuevoEstado: boolean }) => {
      return await updateOfertaAction(id, nuevoEstado)
    },
    onSuccess: (nuevoEstado) => {
      toast.success(nuevoEstado ? 'Oferta activada exitosamente' : 'Oferta desactivada')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado de la oferta')
  })

  const toggleActivoMutation = useMutation({
    mutationFn: async ({ id, currentState }: { id: string, currentState: boolean }) => {
      return await toggleActivoProductoAction(id, currentState)
    },
    onSuccess: (nuevoEstado) => {
      toast.success(nuevoEstado ? 'Producto activado' : 'Producto desactivado')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo cambiar el estado del producto')
  })

  const updateDescuentoMutation = useMutation({
    mutationFn: async ({ id, descuento }: { id: string, descuento: number }) => {
      return await updateDescuentoAction(id, descuento)
    },
    onSuccess: (descuento) => {
      toast.success(descuento === 0 ? 'Descuento eliminado' : `Descuento del ${descuento}% aplicado exitosamente`)
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo aplicar el descuento')
  })

  const duplicateMutation = useMutation({
    mutationFn: async (producto: Producto) => {
      let requestKey = duplicateRequestKeys.current.get(producto.id)
      if (!requestKey) {
        requestKey = crypto.randomUUID()
        duplicateRequestKeys.current.set(producto.id, requestKey)
      }
      await duplicateProductAction(producto, requestKey)
    },
    onSuccess: async (_, producto) => {
      await queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
      duplicateRequestKeys.current.delete(producto.id)
      toast.success('Producto duplicado exitosamente')
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo duplicar el producto')
  })

  /**
   * Wrapper Functions for Confirmations
   */

  /**
   * Deletes a product and all its variants after user confirmation.
   * 
   * @param {string} id - The ID of the product to delete
   */
  async function deleteProducto(id: string) {
    const confirmed = await confirm({
      title: '¿Archivar producto?',
      message: 'El producto dejará de estar disponible en la tienda. Se conservará junto con sus variantes y ventas históricas.',
      confirmText: 'Archivar',
      variant: 'warning'
    })

    if (!confirmed) return
    deleteMutation.mutate(id)
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
    updateOfertaMutation.mutate({ id, nuevoEstado })
  }

  async function toggleActivoProducto(id: string, currentState: boolean) {
    const producto = productos.find(p => p.id === id)
    const nuevoEstado = !currentState

    const confirmed = await confirm({
      title: nuevoEstado ? '¿Activar producto?' : '¿Desactivar producto?',
      message: nuevoEstado
        ? `Se activará "${producto?.nombre}" y volverá a mostrarse en el catálogo.`
        : `Se desactivará "${producto?.nombre}" y dejará de aparecer en el catálogo público.`,
      confirmText: nuevoEstado ? 'Activar' : 'Desactivar',
      variant: nuevoEstado ? 'success' : 'warning'
    })

    if (!confirmed) return
    toggleActivoMutation.mutate({ id, currentState })
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
      updateDescuentoMutation.mutate({ id, descuento })
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

    if (confirmed) {
      updateDescuentoMutation.mutate({ id, descuento })
    }
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
    duplicateMutation.mutate(producto)
  }

  const updateVarianteStockMutation = useMutation({
    mutationFn: async ({ varianteId, expectedStock, newStock }: { varianteId: string, expectedStock: number, newStock: number }) => {
      await updateVarianteStockAction(varianteId, expectedStock, newStock)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProductos'] }),
    onError: (error) => toast.error(error.message || 'Error al actualizar el stock')
  })

  const updateProductNameMutation = useMutation({
    mutationFn: async ({ id, nombre }: { id: string, nombre: string }) => {
      await updateProductNameAction(id, nombre)
    },
    onSuccess: () => {
      toast.success('Nombre actualizado')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el nombre')
  })

  const updateProductPriceMutation = useMutation({
    mutationFn: async ({ id, precio }: { id: string, precio: number }) => {
      await updateProductPriceAction(id, precio)
    },
    onSuccess: () => {
      toast.success('Precio actualizado')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el precio')
  })

  const updateProductNotasMutation = useMutation({
    mutationFn: async ({ id, notas }: { id: string, notas: string }) => {
      return await updateProductNotasAction(id, notas)
    },
    onSuccess: (notas) => {
      toast.success(notas.trim() ? 'Notas guardadas' : 'Notas eliminadas')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: error => toast.error(error instanceof Error ? error.message : 'No se pudieron actualizar las notas')
  })

  return {
    productos,
    isLoadingProductos,
    isErrorProductos,
    errorProductos,
    refetchProductos,
    deleteProducto,
    toggleOferta,
    toggleActivoProducto,
    updateDescuento,
    duplicateProduct,
    updateVarianteStockMutation,
    updateProductNameMutation,
    updateProductPriceMutation,
    updateProductNotasMutation,
    ConfirmDialog
  }
}
