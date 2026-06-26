import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserOrderDetails, formatCurrency, formatOrderDate } from '../services/orderService';

const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Order Confirmation - Graphene Security';

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await getUserOrderDetails(orderId);
        setOrder(response.data.order);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 mb-4"></div>
          <p className="text-text-secondary font-mono">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-matrix-subtle border border-matrix-400 rounded-full mb-6">
            <svg className="h-8 w-8 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-cyan-400 mb-4">Order Received Now Processing</h1>
          <p className="text-text-secondary mb-6">
            Your order has been successfully received and is now being processed. You will receive an email confirmation shortly.
          </p>
          <div className="space-y-3">
            <Link
              to="/orders"
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg w-full justify-center"
            >
              View All Orders
            </Link>
            <Link
              to="/products"
              className="btn btn-secondary inline-flex items-center px-6 py-3 rounded-lg w-full justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div
          data-testid="order-confirmation"
          className="text-center mb-8 animate-fadeIn"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-matrix-subtle border border-matrix-400 rounded-full mb-4">
            <svg className="h-8 w-8 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-display uppercase tracking-wider text-cyan-400 mb-2">Order Confirmed!</h1>
          <p className="text-lg text-text-secondary">
            Thank you for your order. Your order number is
            <span
              data-testid="order-number"
              className="font-semibold font-mono text-text-primary"
            >
              #{order.orderNumber}
            </span>
          </p>
        </div>

        {/* Order Summary Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Order Details */}
          <div className="card card-glow p-6 animate-fadeIn">
            <h2 className="text-xl font-heading text-cyan-400 mb-4">Order Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Order Number:</span>
                <span
                  data-testid="order-id"
                  className="font-semibold font-mono text-text-primary"
                >
                  #{order.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Order Date:</span>
                <span className="font-semibold text-text-primary">{formatOrderDate(order.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Order Total:</span>
                <span
                  data-testid="order-total"
                  className="font-semibold text-lg font-mono text-text-primary"
                >
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  order.paymentStatus === 'completed'
                    ? 'bg-matrix-subtle text-matrix-400'
                    : 'bg-cyan-subtle text-cyan-400'
                }`}>
                  {order.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Information */}
          <div className="card card-glow p-6 animate-fadeIn">
            <h2 className="text-xl font-heading text-cyan-400 mb-4">Shipping Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-text-secondary text-sm">Shipping Address:</span>
                <div className="mt-1">
                  <div className="font-semibold text-text-primary">{order.shippingAddress.fullName}</div>
                  <div className="text-sm text-text-secondary">
                    <div>{order.shippingAddress.addressLine1}</div>
                    {order.shippingAddress.addressLine2 && (
                      <div>{order.shippingAddress.addressLine2}</div>
                    )}
                    <div>
                      {order.shippingAddress.city}, {order.shippingAddress.stateProvince} {order.shippingAddress.postalCode}
                    </div>
                    <div>{order.shippingAddress.country}</div>
                    {order.shippingAddress.phoneNumber && (
                      <div>Phone: {order.shippingAddress.phoneNumber}</div>
                    )}
                  </div>
                </div>
              </div>
              {order.shippingMethod && (
                <div>
                  <span className="text-text-secondary text-sm">Shipping Method:</span>
                  <div className="mt-1">
                    <div className="font-semibold text-text-primary">{order.shippingMethod.name}</div>
                    {order.shippingMethod.estimatedDelivery && (
                      <div className="text-sm text-text-secondary">{order.shippingMethod.estimatedDelivery}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div
          data-testid="order-details"
          className="card card-glow p-6 mb-8 animate-fadeIn"
        >
          <h2 className="text-xl font-heading text-cyan-400 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item._id}
                data-testid={`order-item-${item.productId || item._id}`}
                className="flex items-center space-x-4 pb-4 border-b border-border-subtle last:border-b-0"
              >
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
                  <h3 className="font-semibold text-text-primary">{item.productName}</h3>
                  <p className="text-sm text-text-secondary font-mono">
                    Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                  </p>
                </div>
                <div className="text-lg font-semibold text-text-primary font-mono">
                  {formatCurrency(item.totalPrice)}
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
          <div className="border-t border-border-subtle pt-4 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal:</span>
                <span className="font-mono text-text-primary">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping:</span>
                <span className="font-mono text-text-primary">{formatCurrency(order.shipping)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Tax:</span>
                  <span className="font-mono text-text-primary">{formatCurrency(order.tax)}</span>
                </div>
              )}
              <div className="border-t border-border-subtle pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-text-primary">Total:</span>
                  <span className="font-mono text-text-primary">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-cyan-subtle border border-cyan-400 rounded-lg p-6 mb-8 animate-fadeIn">
          <h2 className="text-lg font-heading text-cyan-400 mb-3">What's Next?</h2>
          <div className="space-y-2 text-text-secondary">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>You'll receive an order confirmation email shortly</span>
            </div>
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span>We'll notify you when your order ships</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={`/orders/${order._id}`}
            className="btn btn-primary inline-flex items-center justify-center px-6 py-3 rounded-lg"
          >
            View Order Details
          </Link>
          <Link
            to="/products"
            className="btn btn-secondary inline-flex items-center justify-center px-6 py-3 rounded-lg"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
