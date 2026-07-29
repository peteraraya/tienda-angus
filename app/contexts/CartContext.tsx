'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  producto_id: string
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
  addToCart: (item: Omit<CartItem, 'id'>) => void
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
  const [isInitialized, setIsInitialized] = useState(false)

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('shopping_cart')
      if (savedCart) {
        setCart(JSON.parse(savedCart))
      }
    } catch (e) {
      console.error('Error loading cart:', e)
    }
    setIsInitialized(true)
  }, [])

  // Guardar en localStorage cuando cambia el carrito
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('shopping_cart', JSON.stringify(cart))
    }
  }, [cart, isInitialized])

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setCart(prev => {
      // Check if exact same product + talla + colegio already exists
      const existingItemIndex = prev.findIndex(
        item => item.producto_id === newItem.producto_id && 
                item.talla === newItem.talla && 
                item.colegio === newItem.colegio
      )

      if (existingItemIndex >= 0) {
        const updatedCart = [...prev]
        const currentItem = updatedCart[existingItemIndex]
        // No exceder stock disponible
        const newQuantity = Math.min(currentItem.cantidad + newItem.cantidad, currentItem.stock_disponible)
        updatedCart[existingItemIndex] = { ...currentItem, cantidad: newQuantity }
        return updatedCart
      }

      return [...prev, { ...newItem, id: crypto.randomUUID() }]
    })
    setIsCartOpen(true) // Abrir el carrito al agregar
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const updateQuantity = (id: string, cantidad: number) => {
    if (cantidad <= 0) {
      removeFromCart(id)
      return
    }

    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, cantidad: Math.min(cantidad, item.stock_disponible) }
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
