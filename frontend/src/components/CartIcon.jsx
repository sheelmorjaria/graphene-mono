import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const CartIcon = () => {
  const { itemCount } = useCart();

  return (
    <Link 
      to="/cart" 
      className="relative hover:text-blue-300 transition-colors"
      title="Shopping Cart"
    >
      <svg 
        className="w-6 h-6" 
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
      {itemCount > 0 && (
        <span 
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold"
          aria-label={`${itemCount} items in cart`}
        >
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
};

export default CartIcon;