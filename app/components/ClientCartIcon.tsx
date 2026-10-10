'use client'

import { useCart } from '../contexts/CartContext'

export default function ClientCartIcon() {
  const { cartCount, setIsCartOpen } = useCart()

  return (
    <button 
      onClick={() => setIsCartOpen(true)}
      type="button"
      aria-label={`Abrir pedido${cartCount > 0 ? `, ${cartCount} prendas` : ''}`}
      className="relative min-h-11 min-w-11 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#123f3d] dark:focus-visible:ring-[#e7c77c]"
      title="Mi Pedido"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {cartCount > 0 && (
        <span key={cartCount} className="absolute top-0 right-0 inline-flex min-h-5 min-w-5 items-center justify-center px-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-[#123f3d] dark:bg-[#e7c77c] dark:text-[#123f3d] rounded-full animate-[cart-bump_300ms_ease-out]">
          {cartCount}
        </span>
      )}
    </button>
  )
}
