import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useCheckout } from '../contexts/CheckoutContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../services/cartService';
import ShippingAddressSection from '../components/checkout/ShippingAddressSection';
import BillingAddressSection from '../components/checkout/BillingAddressSection';
import PaymentMethodSection from '../components/checkout/PaymentMethodSection';
import { placeOrder, validateOrderData } from '../services/orderService';

const CheckoutSteps = ({ currentStep }) => {
  const steps = [
    { id: 'shipping', label: 'Shipping', icon: '📦' },
    { id: 'payment', label: 'Payment', icon: '💳' },
    { id: 'review', label: 'Review', icon: '✓' }
  ];

  return (
    <div className="checkout-steps mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className={`flex items-center ${
              step.id === currentStep ? 'text-blue-600' : 
              steps.findIndex(s => s.id === currentStep) > index ? 'text-green-600' : 'text-gray-400'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                step.id === currentStep ? 'border-blue-600 bg-blue-50' : 
                steps.findIndex(s => s.id === currentStep) > index ? 'border-green-600 bg-green-50' : 'border-gray-300 bg-gray-50'
              }`}>
                <span className="text-lg">{step.icon}</span>
              </div>
              <span className="ml-3 font-medium">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-1 mx-4 ${
                steps.findIndex(s => s.id === currentStep) > index ? 'bg-green-600' : 'bg-gray-300'
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
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
      
      <div className="space-y-4 mb-6">
        {cart.items.map((item) => (
          <div key={item._id} className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {item.productImage ? (
                <img
                  src={item.productImage}
                  alt={item.productName}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-xs">No Image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 line-clamp-2">
                {item.productName}
              </div>
              <div className="text-sm text-gray-500">
                Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-900">
              {formatCurrency(item.subtotal)}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3 border-t pt-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({cart.totalItems} items)</span>
          <span className="text-gray-900">{formatCurrency(cart.totalAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-900">
            {checkoutState.shippingMethod ? (
              checkoutState.shippingMethod.isFreeShipping ? (
                <span className="text-green-600 font-medium">FREE</span>
              ) : (
                formatCurrency(shippingCost)
              )
            ) : (
              'Calculated at next step'
            )}
          </span>
        </div>
        {checkoutState.shippingMethod && (
          <div className="text-xs text-gray-500">
            via {checkoutState.shippingMethod.name}
          </div>
        )}
        <div className="border-t pt-3">
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-gray-900">Total</span>
            <span className="text-gray-900">{formatCurrency(orderTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSection = () => {
  const { nextStep, prevStep, canProceedToReview } = useCheckout();
  const [validationState, setValidationState] = useState({ isValid: false, error: null });

  const handleValidationChange = (state) => {
    setValidationState(state);
  };

  return (
    <div className="space-y-6">
      {/* Billing Address Section */}
      <BillingAddressSection />
      
      {/* Payment Method Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <PaymentMethodSection 
          isActive={true} 
          isCompleted={canProceedToReview}
          onValidationChange={handleValidationChange}
        />

        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Shipping
          </button>
          <button
            onClick={nextStep}
            disabled={!canProceedToReview}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              canProceedToReview
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
    paymentState, 
    shippingAddress, 
    billingAddress, 
    shippingMethod, 
    paymentMethod, 
    useSameAsShipping,
    orderSummary,
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
      if (!shippingAddress || !shippingMethod || !paymentMethod) {
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
          shippingAddress,
          billingAddress: useSameAsShipping ? shippingAddress : billingAddress,
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
          shippingAddress,
          billingAddress: useSameAsShipping ? shippingAddress : billingAddress,
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
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Review Your Order</h2>
      
      {/* Address Review */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address Review */}
        {checkoutState.shippingAddress && (
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-3">Shipping Address</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="font-medium">{checkoutState.shippingAddress.fullName}</div>
              <div className="text-sm text-gray-600 mt-1">
                <div>{checkoutState.shippingAddress.addressLine1}</div>
                {checkoutState.shippingAddress.addressLine2 && (
                  <div>{checkoutState.shippingAddress.addressLine2}</div>
                )}
                <div>
                  {checkoutState.shippingAddress.city}, {checkoutState.shippingAddress.stateProvince} {checkoutState.shippingAddress.postalCode}
                </div>
                <div>{checkoutState.shippingAddress.country}</div>
                {checkoutState.shippingAddress.phoneNumber && (
                  <div className="mt-1">Phone: {checkoutState.shippingAddress.phoneNumber}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Billing Address Review */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">Billing Address</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {checkoutState.useSameAsShipping ? (
              <div>
                <div className="text-sm text-blue-600 font-medium mb-2">Same as shipping address</div>
                {checkoutState.shippingAddress && (
                  <>
                    <div className="font-medium">{checkoutState.shippingAddress.fullName}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>{checkoutState.shippingAddress.addressLine1}</div>
                      {checkoutState.shippingAddress.addressLine2 && (
                        <div>{checkoutState.shippingAddress.addressLine2}</div>
                      )}
                      <div>
                        {checkoutState.shippingAddress.city}, {checkoutState.shippingAddress.stateProvince} {checkoutState.shippingAddress.postalCode}
                      </div>
                      <div>{checkoutState.shippingAddress.country}</div>
                    </div>
                  </>
                )}
              </div>
            ) : checkoutState.billingAddress ? (
              <>
                <div className="font-medium">{checkoutState.billingAddress.fullName}</div>
                <div className="text-sm text-gray-600 mt-1">
                  <div>{checkoutState.billingAddress.addressLine1}</div>
                  {checkoutState.billingAddress.addressLine2 && (
                    <div>{checkoutState.billingAddress.addressLine2}</div>
                  )}
                  <div>
                    {checkoutState.billingAddress.city}, {checkoutState.billingAddress.stateProvince} {checkoutState.billingAddress.postalCode}
                  </div>
                  <div>{checkoutState.billingAddress.country}</div>
                  {checkoutState.billingAddress.phoneNumber && (
                    <div className="mt-1">Phone: {checkoutState.billingAddress.phoneNumber}</div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">No billing address selected</div>
            )}
          </div>
        </div>
      </div>

      {/* Shipping Method Review */}
      {checkoutState.shippingMethod && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Shipping Method</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{checkoutState.shippingMethod.name}</div>
                <div className="text-sm text-gray-600">
                  {checkoutState.shippingMethod.estimatedDelivery}
                </div>
                {checkoutState.shippingMethod.description && (
                  <div className="text-sm text-gray-600 mt-1">
                    {checkoutState.shippingMethod.description}
                  </div>
                )}
              </div>
              <div className="text-right">
                {checkoutState.shippingMethod.isFreeShipping ? (
                  <span className="text-lg font-semibold text-green-600">FREE</span>
                ) : (
                  <span className="text-lg font-semibold text-gray-900">
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
        <h3 className="text-lg font-medium text-gray-800 mb-3">Order Items</h3>
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div key={item._id} className="flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
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
              <div className="flex-1">
                <div className="font-medium text-gray-900">{item.productName}</div>
                <div className="text-sm text-gray-600">
                  Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                </div>
              </div>
              <div className="text-lg font-medium text-gray-900">
                {formatCurrency(item.subtotal)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {orderError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">
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
          className={`px-6 py-3 rounded-lg transition-colors ${
            isProcessing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Back to Payment
        </button>
        <button
          onClick={handlePlaceOrder}
          disabled={isProcessing}
          className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center ${
            isProcessing 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {isProcessing && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    document.title = 'Checkout - GrapheneOS Store';
  }, []);

  // Show loading while checking authentication
  if (authLoading || cartLoading) {
    return (
      <div className="checkout-page">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="checkout-page">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">Login Required</h1>
            <p className="text-gray-600 mb-6">
              You need to be logged in to proceed with checkout.
            </p>
            <Link
              to="/login"
              state={{ from: '/checkout' }}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="checkout-page">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-6">
              Add some items to your cart before proceeding to checkout.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      case 'shipping':
        return <ShippingAddressSection />;
      case 'payment':
        return <PaymentSection />;
      case 'review':
        return <ReviewSection />;
      default:
        return <ShippingAddressSection />;
    }
  };

  return (
    <div className="checkout-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Checkout</h1>
          <nav className="text-sm text-gray-500">
            <Link to="/cart" className="hover:text-blue-600">Cart</Link>
            <span className="mx-2">/</span>
            <span>Checkout</span>
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