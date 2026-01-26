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
        className="w-8 h-8 flex items-center justify-center bg-bg-elevated border border-border-subtle hover:border-cyan-400 disabled:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50 rounded text-text-primary hover:text-cyan-400 transition-colors"
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
        className="w-16 h-8 text-center border border-border-subtle rounded bg-bg-elevated text-text-primary focus:outline-none focus:border-cyan-400 disabled:bg-bg-elevated disabled:opacity-50 font-mono"
        aria-label="Quantity"
      />

      <button
        onClick={() => handleQuantityChange(quantity + 1)}
        disabled={quantity >= 99 || isUpdating}
        className="w-8 h-8 flex items-center justify-center bg-bg-elevated border border-border-subtle hover:border-cyan-400 disabled:bg-bg-elevated disabled:cursor-not-allowed disabled:opacity-50 rounded text-text-primary hover:text-cyan-400 transition-colors"
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
        await onRemoveItem(item.productId, item.variationId);
      } finally {
        setIsRemoving(false);
      }
    }
  };

  return (
    <div className="flex items-center space-x-4 py-4 border-b border-border-subtle last:border-b-0">
      {/* Product Image */}
      <div className="flex-shrink-0">
        {item.productImage ? (
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-16 h-16 object-cover rounded border border-border-subtle"
          />
        ) : (
          <div className="w-16 h-16 bg-bg-elevated border border-border-subtle rounded flex items-center justify-center">
            <span className="text-text-muted text-xs font-mono">No Image</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1">
        <Link
          to={`/products/${item.productSlug}`}
          className="text-lg font-medium text-text-primary hover:text-cyan-400 transition-colors"
        >
          {item.productName}
        </Link>
        <div className="text-sm text-text-secondary mt-1 font-mono">
          {formatCurrency(item.unitPrice)} each
        </div>
        {item.leadTime && (
          <div className="text-xs text-cyan-400 mt-1 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Lead time: {item.leadTime.displayText || '5-7 working days'}
          </div>
        )}
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
        <div className="text-lg font-medium text-cyan-400 font-mono">
          {formatCurrency(item.subtotal)}
        </div>
      </div>

      {/* Remove Button */}
      <div className="flex-shrink-0">
        <button
          onClick={handleRemove}
          disabled={isRemoving || isUpdating}
          className="text-red hover:text-red-700 disabled:text-text-muted disabled:cursor-not-allowed p-2 transition-colors"
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
    document.title = 'Shopping Cart - Graphene Security';
  }, []);

  const handleUpdateQuantity = async (productId, quantity) => {
    setIsUpdating(true);
    try {
      await updateCartItem(productId, quantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (productId, variationId) => {
    setIsUpdating(true);
    try {
      await removeFromCart(productId, variationId);
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
      <div className="cart-page min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="loading text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
            <p className="mt-4 text-text-muted font-mono">Loading your cart...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">Shopping Cart</h1>
          <p className="text-text-secondary">Review your items before checkout</p>
          <nav className="text-sm text-text-muted font-mono mt-4">
            <Link to="/products" className="hover:text-cyan-400 transition-colors">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-cyan-400">Cart</span>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-subtle border border-red text-red px-4 py-3 rounded-lg mb-6" role="alert">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              <button
                onClick={clearError}
                className="text-red hover:text-red-700 font-mono text-xl"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {cart.items.length === 0 ? (
          /* Empty Cart */
          <div className="empty-cart text-center py-16">
            <div className="card card-glow max-w-lg mx-auto p-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-cyan-subtle border border-cyan-400 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-text-primary mb-4">Your Cart is Empty</h2>
              <p className="text-text-secondary mb-8">
                Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
              </p>
              <Link
                to="/products"
                className="btn btn-primary"
              >
                Continue Shopping
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="card card-glow p-6 animate-fadeIn">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-heading text-xl font-bold text-text-primary flex items-center gap-2">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Cart Items ({cart.totalItems} item{cart.totalItems !== 1 ? 's' : ''})
                  </h2>
                  {cart.items.length > 1 && (
                    <button
                      onClick={handleClearCart}
                      disabled={isUpdating}
                      className="text-red hover:text-red-700 disabled:text-text-muted disabled:cursor-not-allowed text-sm font-mono"
                    >
                      Clear Cart
                    </button>
                  )}
                </div>

                {/* Desktop Table Header */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center md:py-3 md:border-b md:border-border-subtle md:text-sm md:font-medium md:text-text-muted">
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
                      <div key={item._id} className="grid grid-cols-12 gap-4 items-center py-4 border-b border-border-subtle last:border-b-0">
                        {/* Product Info */}
                        <div className="col-span-5 flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            {item.productImage ? (
                              <img
                                src={item.productImage}
                                alt={item.productName}
                                className="w-16 h-16 object-cover rounded border border-border-subtle"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-bg-elevated border border-border-subtle rounded flex items-center justify-center">
                                <span className="text-text-muted text-xs font-mono">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/products/${item.productSlug}`}
                              className="text-lg font-medium text-text-primary hover:text-cyan-400 transition-colors"
                            >
                              {item.productName}
                            </Link>
                            <div className="text-sm text-text-secondary font-mono">
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
                          <span className="text-text-primary font-mono">{formatCurrency(item.unitPrice)}</span>
                        </div>

                        {/* Subtotal */}
                        <div className="col-span-2 text-right">
                          <span className="text-lg font-medium text-cyan-400 font-mono">
                            {formatCurrency(item.subtotal)}
                          </span>
                        </div>

                        {/* Remove Button */}
                        <div className="col-span-1 flex justify-center">
                          <button
                            onClick={() => handleRemoveItem(item.productId, item.variationId)}
                            disabled={isUpdating}
                            className="text-red hover:text-red-700 disabled:text-text-muted disabled:cursor-not-allowed p-2 transition-colors"
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
              <div className="card card-glow p-6 sticky top-4 animate-fadeIn">
                <h2 className="font-heading text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Subtotal ({cart.totalItems})</span>
                    <span className="text-text-primary font-mono">{formatCurrency(cart.totalAmount)}</span>
                  </div>


                  <div className="flex justify-between">
                    <span className="text-text-secondary">Shipping</span>
                    <span className="text-text-muted text-sm font-mono">Calculated at checkout</span>
                  </div>

                  <div className="border-t border-border-subtle pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span className="text-text-primary">Total</span>
                      <span className="text-cyan-400 font-mono">
                        {formatCurrency(cart.finalTotal || cart.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>


                <button
                  onClick={() => navigate('/checkout')}
                  disabled={isUpdating}
                  className="btn btn-primary w-full"
                >
                  {isUpdating ? 'Updating...' : 'Proceed to Checkout'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>

                <Link
                  to="/products"
                  className="block w-full text-center text-cyan-400 hover:text-matrix-400 py-3 mt-3 font-mono text-sm transition-colors"
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
