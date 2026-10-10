'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  producto_id: string
  variante_id: string
  nombre: string
  precio: number
  talla: string
  colegio: string
  cantidad: number
  imagen_url?: string
  stock_disponible: number
}

interface CartContextType {
  cart: CartItem[]
  addToCart: (item: Omit<CartItem, 'id'>) => 'added' | 'stock-limit' | 'request-limit'
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, cantidad: number) => void
  clearCart: () => void
  isCartOpen: boolean
  setIsCartOpen: (isOpen: boolean) => void
  cartTotal: number
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartLoaded, setCartLoaded] = useState(false)

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    let restoredCart: CartItem[] = []
    try {
      const savedCart = localStorage.getItem('shopping_cart')
      if (savedCart) {
        const parsedCart: unknown = JSON.parse(savedCart)
        if (!Array.isArray(parsedCart)) {
          throw new Error('El contenido guardado del carrito no es una lista')
        }

        restoredCart = parsedCart.filter((item): item is CartItem =>
          item !== null &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          typeof item.producto_id === 'string' &&
          typeof item.variante_id === 'string' &&
          typeof item.nombre === 'string' &&
          Number.isFinite(item.precio) &&
          typeof item.talla === 'string' &&
          typeof item.colegio === 'string' &&
          Number.isInteger(item.cantidad) &&
          item.cantidad > 0 &&
          Number.isInteger(item.stock_disponible) &&
          item.stock_disponible >= item.cantidad
        )
      }
    } catch (e) {
      console.error('Error loading cart:', e)
    }

    let active = true
    queueMicrotask(() => {
      if (!active) return
      setCart(restoredCart)
      setCartLoaded(true)
    })
    return () => {
      active = false
    }
  }, [])

  // Guardar en localStorage cuando cambia el carrito
  useEffect(() => {
    if (cartLoaded) {
      try {
        localStorage.setItem('shopping_cart', JSON.stringify(cart))
      } catch (e) {
        console.error('Error saving cart:', e)
      }
    }
  }, [cart, cartLoaded])

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    const existingItem = cart.find(item => item.variante_id === newItem.variante_id)
    const cartQuantity = cart.reduce((total, item) => total + item.cantidad, 0)
    if (existingItem) {
      const quantityWithoutItem = cartQuantity - existingItem.cantidad
      if (existingItem.cantidad + newItem.cantidad > newItem.stock_disponible) return 'stock-limit'
      if (quantityWithoutItem + existingItem.cantidad + newItem.cantidad > 99) return 'request-limit'
    } else {
      if (newItem.cantidad > newItem.stock_disponible) return 'stock-limit'
      if (cart.length >= 20 || cartQuantity + newItem.cantidad > 99 || newItem.cantidad > 99) return 'request-limit'
    }

    setCart(prev => {
      // Check if the exact same inventory variant already exists.
      const existingItemIndex = prev.findIndex(
        item => item.variante_id === newItem.variante_id
      )

      if (existingItemIndex >= 0) {
        const updatedCart = [...prev]
        const currentItem = updatedCart[existingItemIndex]
        // No exceder stock disponible
        const otherQuantity = prev.reduce((total, item, index) =>
          index === existingItemIndex ? total : total + item.cantidad, 0)
        const maxQuantity = Math.min(newItem.stock_disponible, 99 - otherQuantity, 99)
        const newQuantity = Math.min(currentItem.cantidad + newItem.cantidad, maxQuantity)
        if (newQuantity <= currentItem.cantidad) return prev
        updatedCart[existingItemIndex] = {
          ...currentItem,
          ...newItem,
          id: currentItem.id,
          cantidad: newQuantity
        }
        return updatedCart
      }

      const currentQuantity = prev.reduce((total, item) => total + item.cantidad, 0)
      if (
        prev.length >= 20 ||
        newItem.cantidad > 99 ||
        currentQuantity + newItem.cantidad > 99
      ) return prev

      return [...prev, { ...newItem, id: crypto.randomUUID() }]
    })
    setIsCartOpen(true) // Abrir el carrito al agregar
    return 'added'
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id)
      return
    }

    const currentItem = cart.find(item => item.id === id)
    if (!currentItem) return
    const otherQuantity = cart.reduce((total, item) => item.id === id ? total : total + item.cantidad, 0)
    const maxQuantity = Math.max(1, Math.min(currentItem.stock_disponible, 99 - otherQuantity, 99))

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, cantidad: Math.min(cantidad, maxQuantity) }
      }
      return item
    }))
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = cart.reduce((total, item) => total + (item.precio * item.cantidad), 0)
  const cartCount = cart.reduce((count, item) => count + item.cantidad, 0)

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isCartOpen,
      setIsCartOpen,
      cartTotal,
      cartCount
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
