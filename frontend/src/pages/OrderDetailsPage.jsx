import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserOrderDetails, formatCurrency, getStatusColor } from '../services/orderService';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  useEffect(() => {
    document.title = order 
      ? `Order ${order.orderNumber} - GrapheneOS Store`
      : 'Order Details - GrapheneOS Store';
  }, [order]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getUserOrderDetails(orderId);
      setOrder(response.data.order);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    
    const lines = [
      address.fullName,
      address.addressLine1,
      address.addressLine2,
      `${address.city}, ${address.stateProvince} ${address.postalCode}`,
      address.country
    ].filter(Boolean);
    
    if (address.phoneNumber) {
      lines.push(`Phone: ${address.phoneNumber}`);
    }
    
    return lines;
  };

  if (loading) {
    return (
      <div className="order-details-page">
        <div className="container mx-auto px-4 py-8">
          <div className="loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-details-page">
        <div className="container mx-auto px-4 py-8">
          <div className="error-container text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Error Loading Order</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link
              to="/orders"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-page">
        <div className="container mx-auto px-4 py-8">
          <div className="not-found text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Order Not Found</h2>
            <p className="text-gray-600 mb-8">
              The order you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-details-page">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <nav className="text-sm text-gray-500 mb-4">
            <Link to="/orders" className="hover:text-blue-600">My Orders</Link>
            <span className="mx-2">/</span>
            <span>Order {order.orderNumber}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Order {order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Placed on {order.formattedDate}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span 
                className="inline-flex px-3 py-2 text-sm font-semibold rounded-full text-white"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.statusDisplay}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status Timeline */}
            <OrderStatusTimeline 
              currentStatus={order.status} 
              statusHistory={order.statusHistory || []} 
            />

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item._id} className="flex items-start space-x-4 py-4 border-b border-gray-200 last:border-b-0">
                    {item.productImage && (
                      <img 
                        src={item.productImage} 
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <Link 
                        to={`/products/${item.productSlug}`}
                        className="text-lg font-medium text-gray-900 hover:text-blue-600"
                      >
                        {item.productName}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1">
                        Quantity: {item.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-medium text-gray-900">
                        {formatCurrency(item.totalPrice)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(item.unitPrice)} each
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Shipping Tracking */}
            {(order.status === 'shipped' || order.status === 'out_for_delivery' || order.status === 'delivered' || order.trackingNumber || order.trackingUrl) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  📦 Shipping & Tracking Information
                </h2>
                
                {/* Shipping Method */}
                {order.shippingMethod && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Shipping Method:</span>
                        <div className="text-sm text-gray-900 mt-1">{order.shippingMethod.name}</div>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(order.shippingMethod.cost)}
                      </div>
                    </div>
                    {order.shippingMethod.estimatedDelivery && (
                      <div className="text-xs text-gray-600 mt-2">
                        Estimated delivery: {order.shippingMethod.estimatedDelivery}
                      </div>
                    )}
                  </div>
                )}

                {/* Tracking Information */}
                {order.trackingNumber && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-gray-700">Tracking Number:</span>
                    <div className="mt-1 p-2 bg-blue-50 rounded border border-blue-200">
                      <span className="text-sm text-blue-900 font-mono font-medium">
                        {order.trackingNumber}
                      </span>
                    </div>
                  </div>
                )}

                {/* Track Package Button */}
                {order.trackingUrl && (
                  <div className="mb-4">
                    <a 
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Track Package
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Status-specific messages */}
                {order.status === 'shipped' && !order.trackingNumber && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      📦 Your order has been shipped! Tracking information will be available soon.
                    </p>
                  </div>
                )}

                {order.status === 'out_for_delivery' && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      🚚 Your order is out for delivery! You should receive it today.
                    </p>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      ✅ Your order has been delivered! We hope you enjoy your purchase.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Order Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Notes</h2>
                <p className="text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="text-gray-900">{formatCurrency(order.tax)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount
                      {order.discountCode && (
                        <span className="text-xs ml-1">({order.discountCode})</span>
                      )}
                    </span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Address</h2>
              <div className="text-sm text-gray-700">
                {formatAddress(order.shippingAddress).map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>

            {/* Billing Address */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Billing Address</h2>
              <div className="text-sm text-gray-700">
                {formatAddress(order.billingAddress).map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                  <div className="text-sm text-gray-900 mt-1">
                    {order.paymentMethodDisplay}
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                  <div className="text-sm text-gray-900 mt-1 capitalize">
                    {order.paymentStatus}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;