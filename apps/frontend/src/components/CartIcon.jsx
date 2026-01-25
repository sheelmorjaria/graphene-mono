import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CartIcon = () => {
  const { itemCount } = useCart();

  return (
    <Link
      to="/cart"
      className="relative group flex items-center justify-center p-2 text-text-secondary hover:text-cyan-400 transition-all duration-200"
      title="Shopping Cart"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-cyan-subtle rounded-lg scale-0 group-hover:scale-100 transition-transform duration-200"></div>

      <svg
        className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-label="Shopping cart"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 6.32a1 1 0 00.95 1.32h9.46a1 1 0 00.95-1.32L15 13M9 19v.01M20 19v.01"
        />
      </svg>

      {/* Cart Badge */}
      {itemCount > 0 && (
        <span
          className="absolute -top-1 -right-1 bg-gradient-to-r from-cyan-400 to-matrix-400 text-text-on-accent text-xs font-mono font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1 shadow-glow-cyan z-20"
          aria-label={`${itemCount} items in cart`}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}

      {/* Notification dot pulse for items */}
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 w-2 h-2 bg-matrix-400 rounded-full animate-ping z-10"></span>
      )}
    </Link>
  );
};

export default CartIcon;
