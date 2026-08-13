'use client'

import { useToast } from '@/app/components/ui/ToastContainer'
import { useConfirm } from '@/app/hooks/useConfirm'
import { formatPrice } from '@/lib/formatPrice'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchProductosAction, 
  deleteProductoAction,
  updateOfertaAction,
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

  /**
   * Fetches all products and their associated variants from the database using React Query.
   * Also maps school badges (insignias) to the corresponding variants.
   */
  const { data: productos = [], isLoading: isLoadingProductos } = useQuery({
    queryKey: ['adminProductos'],
    queryFn: fetchProductosAction,
  })

  // Mutaciones para operaciones de escritura que invalidan el caché al terminar
  const deleteMutation = useMutation({
    mutationFn: deleteProductoAction,
    onSuccess: () => {
      toast.success('Producto eliminado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al eliminar el producto')
  })

  const updateOfertaMutation = useMutation({
    mutationFn: async ({ id, nuevoEstado }: { id: string, nuevoEstado: boolean }) => {
      return await updateOfertaAction(id, nuevoEstado)
    },
    onSuccess: (nuevoEstado) => {
      toast.success(nuevoEstado ? 'Oferta activada exitosamente' : 'Oferta desactivada')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al cambiar el estado de la oferta')
  })

  const updateDescuentoMutation = useMutation({
    mutationFn: async ({ id, descuento }: { id: string, descuento: number }) => {
      return await updateDescuentoAction(id, descuento)
    },
    onSuccess: (descuento) => {
      toast.success(descuento === 0 ? 'Descuento eliminado' : `Descuento del ${descuento}% aplicado exitosamente`)
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al aplicar el descuento')
  })

  const duplicateMutation = useMutation({
    mutationFn: duplicateProductAction,
    onSuccess: () => {
      toast.success('Producto duplicado exitosamente')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al duplicar el producto')
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
      title: '¿Eliminar producto?',
      message: 'Se eliminará este producto y todas sus variantes. Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      variant: 'danger'
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
    mutationFn: async ({ varianteId, newStock }: { varianteId: string, newStock: number }) => {
      await updateVarianteStockAction(varianteId, newStock)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminProductos'] }),
    onError: () => toast.error('Error al actualizar el stock')
  })

  const updateProductNameMutation = useMutation({
    mutationFn: async ({ id, nombre }: { id: string, nombre: string }) => {
      await updateProductNameAction(id, nombre)
    },
    onSuccess: () => {
      toast.success('Nombre actualizado')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al actualizar el nombre')
  })

  const updateProductPriceMutation = useMutation({
    mutationFn: async ({ id, precio }: { id: string, precio: number }) => {
      await updateProductPriceAction(id, precio)
    },
    onSuccess: () => {
      toast.success('Precio actualizado')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al actualizar el precio')
  })

  const updateProductNotasMutation = useMutation({
    mutationFn: async ({ id, notas }: { id: string, notas: string }) => {
      return await updateProductNotasAction(id, notas)
    },
    onSuccess: (notas) => {
      toast.success(notas.trim() ? 'Notas guardadas' : 'Notas eliminadas')
      queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
    },
    onError: () => toast.error('Error al actualizar las notas')
  })

  return {
    productos,
    isLoadingProductos,
    deleteProducto,
    toggleOferta,
    updateDescuento,
    duplicateProduct,
    updateVarianteStockMutation,
    updateProductNameMutation,
    updateProductPriceMutation,
    updateProductNotasMutation,
    ConfirmDialog,
    refetchProductos: () => queryClient.invalidateQueries({ queryKey: ['adminProductos'] })
  }
}
