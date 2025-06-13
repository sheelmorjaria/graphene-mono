import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../services/cartService';

const QuantitySelector = ({ item, onUpdateQuantity, isUpdating }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > 99 || newQuantity === quantity) {
      return;
    }
    
    setQuantity(newQuantity);
    await onUpdateQuantity(item.productId, newQuantity);
  };

  const handleInputChange = (e) => {
    const newQuantity = parseInt(e.target.value) || 1;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  const handleInputBlur = () => {
    handleQuantityChange(quantity);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleQuantityChange(quantity);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => handleQuantityChange(quantity - 1)}
        disabled={quantity <= 1 || isUpdating}
        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded"
        aria-label="Decrease quantity"
      >
        -
      </button>
      
      <input
        type="number"
        min="1"
        max="99"
        value={quantity}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyPress={handleKeyPress}
        disabled={isUpdating}
        className="w-16 h-8 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        aria-label="Quantity"
      />
      
      <button
        onClick={() => handleQuantityChange(quantity + 1)}
        disabled={quantity >= 99 || isUpdating}
        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed rounded"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
};

const CartItem = ({ item, onUpdateQuantity, onRemoveItem, isUpdating }) => {
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (window.confirm('Are you sure you want to remove this item from your cart?')) {
      setIsRemoving(true);
      try {
        await onRemoveItem(item.productId);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-gray-200 last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {item.productImage ? (
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <Link
          to={`/products/${item.productSlug}`}
          className="text-lg font-medium text-gray-900 hover:text-blue-600"
        >
          {item.productName}
        </Link>
        <div className="text-sm text-gray-500 mt-1">
          {formatCurrency(item.unitPrice)} each
        </div>
      </div>

      {/* Quantity Selector */}
      <div className="flex-shrink-0">
        <QuantitySelector
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          isUpdating={isUpdating}
        />
      </div>

      {/* Subtotal */}
      <div className="flex-shrink-0 w-24 text-right">
        <div className="text-lg font-medium text-gray-900">
          {formatCurrency(item.subtotal)}
        </div>
      </div>

      {/* Remove Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleRemove}
          disabled={isRemoving || isUpdating}
          className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed p-2"
          aria-label="Remove item"
        >
          {isRemoving ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

const CartPage = () => {
  const { cart, loading, error, updateCartItem, removeFromCart, clearCart, clearError, refreshCart: _refreshCart } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Shopping Cart - GrapheneOS Store';
  }, []);

  const handleUpdateQuantity = async (productId, quantity) => {
    setIsUpdating(true);
    try {
      await updateCartItem(productId, quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    setIsUpdating(true);
    try {
      await removeFromCart(productId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      setIsUpdating(true);
      try {
        await clearCart();
      } finally {
        setIsUpdating(false);
      }
    }
  };


  if (loading) {
    return (
      <div className="cart-page">
        <div className="container mx-auto px-4 py-8">
          <div className="loading text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Shopping Cart</h1>
          <nav className="text-sm text-gray-500">
            <Link to="/products" className="hover:text-blue-600">Products</Link>
            <span className="mx-2">/</span>
            <span>Cart</span>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <div className="flex justify-between items-center">
              <span>{error}</span>
              <button
                onClick={clearError}
                className="text-red-700 hover:text-red-900"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="empty-cart text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🛒</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Your Cart is Empty</h2>
              <p className="text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Cart Items ({cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''})
                  </h2>
                  {cart.items.length > 1 && (
                    <button
                      onClick={handleClearCart}
                      disabled={isUpdating}
                      className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed text-sm"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                {/* Desktop Table Header */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center md:py-3 md:border-b md:border-gray-200 md:text-sm md:font-medium md:text-gray-700">
                  <div className="col-span-5">Product</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Price</div>
                  <div className="col-span-2 text-right">Subtotal</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Cart Items */}
                <div className="space-y-4 md:space-y-0">
                  {cart.items.map((item) => (
                    <div key={item._id} className="md:hidden">
                      <CartItem
                        item={item}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveItem}
                        isUpdating={isUpdating}
                      />
                    </div>
                  ))}

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    {cart.items.map((item) => (
                      <div key={item._id} className="grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-200 last:border-b-0">
                        {/* Product Info */}
                        <div className="col-span-5 flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/products/${item.productSlug}`}
                              className="text-lg font-medium text-gray-900 hover:text-blue-600"
                            >
                              {item.productName}
                            </Link>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(item.unitPrice)} each
                            </div>
                          </div>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-2 flex justify-center">
                          <QuantitySelector
                            item={item}
                            onUpdateQuantity={handleUpdateQuantity}
                            isUpdating={isUpdating}
                          />
                        </div>

                        {/* Unit Price */}
                        <div className="col-span-2 text-right">
                          <span className="text-gray-900">{formatCurrency(item.unitPrice)}</span>
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 text-right">
                          <span className="text-lg font-medium text-gray-900">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => handleRemoveItem(item.productId)}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed p-2"
                            aria-label="Remove item"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({cart.totalItems})</span>
                    <span className="text-gray-900">{formatCurrency(cart.totalAmount)}</span>
                  </div>
                  
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">Calculated at checkout</span>
                  </div>
                  
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">
                        {formatCurrency(cart.finalTotal || cart.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>


                <button
                  onClick={() => navigate('/checkout')}
                  disabled={isUpdating}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isUpdating ? 'Updating...' : 'Proceed to Checkout'}
                </button>

                <Link
                  to="/products"
                  className="block w-full text-center text-blue-600 hover:text-blue-800 py-3 mt-3"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;