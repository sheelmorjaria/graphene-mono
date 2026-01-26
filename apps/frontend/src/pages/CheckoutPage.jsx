import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCheckout } from '../contexts/CheckoutContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../services/cartService';
import DeliveryAddressSection from '../components/checkout/DeliveryAddressSection';
import ShippingAddressSection from '../components/checkout/ShippingAddressSection';
import BillingAddressSection from '../components/checkout/BillingAddressSection';
import PaymentMethodSection from '../components/checkout/PaymentMethodSection';
import { placeOrder, validateOrderData } from '../services/orderService';

const CheckoutSteps = ({ currentStep }) => {
  const steps = [
    { id: 'payment', label: 'Shipping & Payment', icon: '💳' },
    { id: 'review', label: 'Review', icon: '✓' }
  ];

  return (
    <div className="checkout-steps mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center ${
              step.id === currentStep ? 'text-cyan-400' :
              steps.findIndex(s => s.id === currentStep) > index ? 'text-matrix-400' : 'text-text-muted'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step.id === currentStep ? 'border-cyan-400 bg-cyan-subtle' :
                steps.findIndex(s => s.id === currentStep) > index ? 'border-matrix-400 bg-matrix-subtle' : 'border-border-subtle bg-bg-elevated'
              }`}>
                <span className="text-lg">{step.icon}</span>
              </div>
              <span className="ml-3 font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 ${
                steps.findIndex(s => s.id === currentStep) > index ? 'bg-matrix-400' : 'bg-border-subtle'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const CartSummary = () => {
  const { cart } = useCart();
  const { checkoutState, shippingCost, orderTotal } = useCheckout();

  return (
    <div
      data-testid="cart-summary"
      className="card card-glow p-6 sticky top-4"
    >
      <h2 className="text-xl font-display uppercase tracking-wider text-text-primary mb-4">Order Summary</h2>

      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div
            key={item._id}
            data-testid={`cart-item-${item._id}`}
            className="flex items-center space-x-3"
          >
            <div className="flex-shrink-0">
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-12 h-12 object-cover rounded border border-border-subtle"
                />
              ) : (
                <div className="w-12 h-12 bg-bg-elevated rounded flex items-center justify-center border border-border-subtle">
                  <span className="text-text-muted text-xs">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary line-clamp-2">
                {item.productName}
              </div>
              <div className="text-sm text-text-secondary font-mono">
                Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
              </div>
              {item.leadTime && (
                <div className="text-xs text-cyan-400 mt-1">
                  Lead time: {item.leadTime.displayText || '5-7 working days'}
                </div>
              )}
            </div>
            <div className="text-sm font-medium text-text-primary font-mono">
              {formatCurrency(item.subtotal)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t border-border-subtle pt-4">
        <div className="flex justify-between">
          <span className="text-text-secondary">Subtotal ({cart.totalItems} items)</span>
          <span className="text-text-primary font-mono">{formatCurrency(cart.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Shipping</span>
          <span className="text-text-primary font-mono">
            {checkoutState.shippingMethod ? (
              checkoutState.shippingMethod.isFreeShipping ? (
                <span className="text-matrix-400 font-medium">FREE</span>
              ) : (
                formatCurrency(shippingCost)
              )
            ) : (
              'Calculated at next step'
            )}
          </span>
        </div>
        {checkoutState.shippingMethod && (
          <div className="text-xs text-text-muted">
            via {checkoutState.shippingMethod.name}
          </div>
        )}
        <div className="border-t border-border-subtle pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-text-primary">Total</span>
            <span
              data-testid="order-total"
              className="text-text-primary font-mono"
            >
              {formatCurrency(orderTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSection = () => {
  const { nextStep, canProceedToReview } = useCheckout();
  const [_validationState, setValidationState] = useState({ isValid: false, error: null });

  const handleValidationChange = (state) => {
    setValidationState(state);
  };

  return (
    <div
      data-testid="checkout-form"
      className="space-y-6"
    >
      {/* Shipping Address Section */}
      <ShippingAddressSection />

      {/* Billing Address Section */}
      <BillingAddressSection />

      {/* Payment Method Section */}
      <div className="card card-glow p-6 animate-fadeIn">
        <h2 className="text-xl font-display uppercase tracking-wider text-cyan-400 mb-4">Payment Method</h2>
        <PaymentMethodSection
          isActive={true}
          isCompleted={canProceedToReview}
          onValidationChange={handleValidationChange}
        />

        <div className="flex justify-end mt-6">
          <button
            onClick={nextStep}
            disabled={!canProceedToReview}
            data-testid="checkout-button"
            className={`btn px-6 py-3 rounded-lg font-medium transition-colors ${
              canProceedToReview
                ? 'btn btn-primary'
                : 'btn btn-secondary opacity-50 cursor-not-allowed'
            }`}
          >
            Continue to Review
          </button>
        </div>
      </div>
    </div>
  );
};

const ReviewSection = () => {
  const {
    checkoutState,
    paymentState: _paymentState,
    shippingAddress,
    billingAddress,
    _deliveryAddress,
    shippingMethod,
    paymentMethod,
    orderSummary: _orderSummary,
    prevStep,
    resetCheckout
  } = useCheckout();
  const { cart, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderError, setOrderError] = useState(null);

  const navigate = useNavigate();

  const handlePlaceOrder = async () => {
    try {
      setIsProcessing(true);
      setOrderError(null);

      // Validate required data
      if (!shippingAddress || !billingAddress || !shippingMethod || !paymentMethod) {
        throw new Error('Please complete all required fields before proceeding.');
      }

      if (paymentMethod.type === 'paypal') {
        // For PayPal, we don't place the order here - PayPal handles the payment
        // and redirects to our success page which then creates the order
        setOrderError('Please use the PayPal button above to complete your payment.');
        return;
      }

      if (paymentMethod.type === 'bitcoin') {
        // For Bitcoin, create the order first, then redirect to Bitcoin payment page
        const orderData = {
          shippingAddress: shippingAddress,
          billingAddress: billingAddress,
          shippingMethod,
          paymentMethod,
          items: cart.items
        };

        // Validate order data
        const validation = validateOrderData(orderData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Create the order
        const orderResponse = await placeOrder(orderData);

        if (orderResponse.success) {
          // Clear cart and redirect to Bitcoin payment page
          clearCart();
          resetCheckout();
          navigate(`/payment/bitcoin/${orderResponse.data.order._id}`);
        } else {
          throw new Error(orderResponse.error || 'Failed to create order');
        }
        return;
      }

      if (paymentMethod.type === 'monero') {
        // For Monero, create the order first, then redirect to Monero payment page
        const orderData = {
          shippingAddress: shippingAddress,
          billingAddress: billingAddress,
          shippingMethod,
          paymentMethod,
          items: cart.items
        };

        // Validate order data
        const validation = validateOrderData(orderData);
        if (!validation.isValid) {
          throw new Error(validation.errors.join(', '));
        }

        // Create the order
        const orderResponse = await placeOrder(orderData);

        if (orderResponse.success) {
          // Clear cart and redirect to Monero payment page
          clearCart();
          resetCheckout();
          navigate(`/payment/monero/${orderResponse.data.order._id}`);
        } else {
          throw new Error(orderResponse.error || 'Failed to create order');
        }
        return;
      }

      // If we add other payment methods in the future, handle them here
      throw new Error('Selected payment method is not supported.');

    } catch (error) {
      console.error('Order validation error:', error);
      setOrderError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      data-testid="order-summary"
      className="card card-glow p-6 animate-fadeIn"
    >
      <h2 className="text-xl font-display uppercase tracking-wider text-cyan-400 mb-6">Review Your Order</h2>

      {/* Shipping Address Review */}
      {shippingAddress && (
        <div className="mb-6">
          <h3 className="text-lg font-heading text-text-primary mb-3">Shipping Address</h3>
          <div className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
            <div className="font-medium text-text-primary">{shippingAddress.fullName}</div>
            <div className="text-sm text-text-secondary mt-1">
              <div>{shippingAddress.addressLine1}</div>
              {shippingAddress.addressLine2 && (
                <div>{shippingAddress.addressLine2}</div>
              )}
              <div>
                {shippingAddress.city}, {shippingAddress.stateProvince} {shippingAddress.postalCode}
              </div>
              <div>{shippingAddress.country}</div>
              {shippingAddress.phoneNumber && (
                <div className="mt-1">Phone: {shippingAddress.phoneNumber}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Billing Address Review */}
      {billingAddress && (
        <div className="mb-6">
          <h3 className="text-lg font-heading text-text-primary mb-3">Billing Address</h3>
          <div className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
            <div className="font-medium text-text-primary">{billingAddress.fullName}</div>
            <div className="text-sm text-text-secondary mt-1">
              <div>{billingAddress.addressLine1}</div>
              {billingAddress.addressLine2 && (
                <div>{billingAddress.addressLine2}</div>
              )}
              <div>
                {billingAddress.city}, {billingAddress.stateProvince} {billingAddress.postalCode}
              </div>
              <div>{billingAddress.country}</div>
              {billingAddress.phoneNumber && (
                <div className="mt-1">Phone: {billingAddress.phoneNumber}</div>
              )}
            </div>
            {checkoutState.useSameAsShipping && (
              <div className="text-xs text-cyan-400 mt-2">
                ✓ Same as shipping address
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shipping Method Review */}
      {checkoutState.shippingMethod && (
        <div className="mb-6">
          <h3 className="text-lg font-heading text-text-primary mb-3">Shipping Method</h3>
          <div className="bg-bg-elevated rounded-lg p-4 border border-border-subtle">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium text-text-primary">{checkoutState.shippingMethod.name}</div>
                <div className="text-sm text-text-secondary">
                  {checkoutState.shippingMethod.estimatedDelivery}
                </div>
                {checkoutState.shippingMethod.description && (
                  <div className="text-sm text-text-secondary mt-1">
                    {checkoutState.shippingMethod.description}
                  </div>
                )}
              </div>
              <div className="text-right">
                {checkoutState.shippingMethod.isFreeShipping ? (
                  <span className="text-lg font-semibold text-matrix-400">FREE</span>
                ) : (
                  <span className="text-lg font-semibold text-text-primary font-mono">
                    {formatCurrency(checkoutState.shippingMethod.cost)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Items Review */}
      <div className="mb-6">
        <h3 className="text-lg font-heading text-text-primary mb-3">Order Items</h3>
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item._id} className="flex items-center space-x-4 bg-bg-elevated rounded-lg p-4 border border-border-subtle">
              <div className="flex-shrink-0">
                {item.productImage ? (
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded border border-border-subtle"
                  />
                ) : (
                  <div className="w-16 h-16 bg-bg-elevated rounded flex items-center justify-center border border-border-subtle">
                    <span className="text-text-muted text-xs">No Image</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-text-primary">{item.productName}</div>
                <div className="text-sm text-text-secondary font-mono">
                  Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
              </div>
              <div className="text-lg font-medium text-text-primary font-mono">
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {orderError && (
        <div className="mb-6 bg-red-subtle border border-red rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red">
                {orderError}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={isProcessing}
          className={`btn px-6 py-3 rounded-lg transition-colors ${
            isProcessing
              ? 'btn btn-secondary opacity-50 cursor-not-allowed'
              : 'btn btn-secondary'
          }`}
        >
          Back to Shipping & Payment
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          data-testid="place-order-button"
          className={`btn px-8 py-3 rounded-lg font-medium transition-colors flex items-center ${
            isProcessing
              ? 'btn btn-secondary opacity-50 cursor-not-allowed'
              : 'btn btn-primary'
          }`}
        >
          {isProcessing && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const { cart, loading: cartLoading } = useCart();
  const { checkoutState } = useCheckout();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    document.title = 'Checkout - Graphene Security';
  }, []);

  // Show loading while checking authentication
  if (authLoading || cartLoading) {
    return (
      <div className="checkout-page min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            <p className="mt-2 text-text-secondary">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="checkout-page min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-display uppercase tracking-wider text-text-primary mb-4">Login Required</h1>
            <p className="text-text-secondary mb-6">
              You need to be logged in to proceed with checkout.
            </p>
            <Link
              to="/login"
              state={{ from: '/checkout' }}
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg"
            >
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart message
  if (cart.items.length === 0) {
    return (
      <div className="checkout-page min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-display uppercase tracking-wider text-text-primary mb-4">Your Cart is Empty</h1>
            <p className="text-text-secondary mb-6">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link
              to="/products"
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (checkoutState.step) {
      case 'payment':
        return <PaymentSection />;
      case 'review':
        return <ReviewSection />;
      default:
        return <PaymentSection />;
    }
  };

  return (
    <div className="checkout-page min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <h1 className="text-3xl font-display uppercase tracking-wider text-cyan-400 mb-2">Checkout</h1>
          <p className="text-text-secondary mb-4">Complete your order securely</p>
          <nav className="text-sm text-text-muted font-mono">
            <Link to="/cart" className="text-cyan-400 hover:text-matrix-400">Cart</Link>
            <span className="mx-2">/</span>
            <span className="text-cyan-400">Checkout</span>
          </nav>
        </div>

        {/* Checkout Steps */}
        <CheckoutSteps currentStep={checkoutState.step} />

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            {renderCurrentStep()}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <CartSummary />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
