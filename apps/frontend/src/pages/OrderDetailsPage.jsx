import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserOrderDetails, formatCurrency, cancelOrder } from '../services/orderService';
import { getUserReturnRequests, formatReturnStatus, getReturnStatusColorClass } from '../services/returnService';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [returnRequest, setReturnRequest] = useState(null);
  const [loadingReturn, setLoadingReturn] = useState(false);

  const loadOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getUserOrderDetails(orderId);
      const orderData = response.data.order;
      setOrder(orderData);
      
      // If order has return request, fetch return details
      if (orderData.hasReturnRequest) {
        loadReturnRequest();
      }
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId, loadReturnRequest]);

  const loadReturnRequest = useCallback(async () => {
    try {
      setLoadingReturn(true);
      
      // Get all return requests and find the one for this order
      const response = await getUserReturnRequests();
      if (response.data && response.data.length > 0) {
        // Get the most recent return request for this order
        const returnReq = response.data.find(req => req.orderId === orderId);
        setReturnRequest(returnReq);
      }
    } catch (err) {
      console.error('Failed to load return request:', err);
    } finally {
      setLoadingReturn(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  useEffect(() => {
    document.title = order 
      ? `Order ${order.orderNumber} - Graphene Security`
      : 'Order Details - Graphene Security';
  }, [order]);

  const canCancelOrder = (status) => {
    const cancellableStatuses = ['pending', 'processing'];
    return cancellableStatuses.includes(status);
  };

  const canRequestReturn = (order) => {
    if (!order) return false;
    
    // Order must be delivered
    if (order.status !== 'delivered') return false;
    
    // Must have a delivery date
    if (!order.deliveryDate) return false;
    
    // Must be within return window (30 days)
    const deliveryDate = new Date(order.deliveryDate);
    const returnWindowEnd = new Date(deliveryDate);
    returnWindowEnd.setDate(returnWindowEnd.getDate() + 30);
    
    const now = new Date();
    if (now > returnWindowEnd) return false;
    
    // Cannot already have an active return request
    if (order.hasReturnRequest) return false;
    
    return true;
  };

  const handleCancelOrder = async () => {
    try {
      setCancelling(true);
      setCancelError('');
      
      await cancelOrder(orderId);
      
      // Update local order state
      setOrder(prev => ({ ...prev, status: 'cancelled' }));
      setShowCancelModal(false);
      
      // Show success message (you might want to add a toast notification)
      alert('Order cancelled successfully. Refund has been initiated.');
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
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
        <div className="order-header mb-6 animate-fadeIn">
          <nav className="breadcrumb">
            <Link to="/orders" className="breadcrumb-link">My Orders</Link>
            <span className="breadcrumb-separator">/</span>
            <span>Order {order.orderNumber}</span>
          </nav>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="order-number">
                Order {order.orderNumber}
              </h1>
              <p className="order-date mt-1">
                Placed on {order.formattedDate}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span 
                className={`status-badge status-${order.status.replace('_', '-')} hover-scale`}
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
            <div className="card order-items animate-fadeIn">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Items</h2>
                <div className="space-y-0">
                  {order.items.map((item, index) => (
                    <div key={item._id} className={`order-item animate-slideIn`} style={{ animationDelay: `${index * 0.1}s` }}>
                      {item.productImage && (
                        <img 
                          src={item.productImage} 
                          alt={item.productName}
                          className="order-item-image"
                        />
                      )}
                      <div className="order-item-details">
                        <Link 
                          to={`/products/${item.productSlug}`}
                          className="order-item-name"
                        >
                          {item.productName}
                        </Link>
                        <div className="order-item-quantity mt-1">
                          Quantity: {item.quantity}
                        </div>
                      </div>
                      <div className="order-item-price">
                        <div className="order-item-total">
                          {formatCurrency(item.totalPrice)}
                        </div>
                        <div className="order-item-unit-price">
                          {formatCurrency(item.unitPrice)} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Enhanced Shipping Tracking */}
            {(order.status === 'shipped' || order.status === 'out_for_delivery' || order.status === 'delivered' || order.trackingNumber || order.trackingUrl) && (
              <div className="card tracking-card animate-fadeIn">
                <div className="card-body">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    📦 Shipping & Tracking Information
                  </h2>
                  
                  {/* Shipping Method */}
                  {order.shippingMethod && (
                    <div className="shipping-method-card mb-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Shipping Method:</span>
                          <div className="text-sm text-gray-900 mt-1">{order.shippingMethod.name}</div>
                        </div>
                        <div className="shipping-cost">
                          {formatCurrency(order.shippingMethod.cost)}
                        </div>
                      </div>
                      {order.shippingMethod.estimatedDelivery && (
                        <div className="shipping-estimate mt-2">
                          Estimated delivery: {order.shippingMethod.estimatedDelivery}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tracking Information */}
                  {order.trackingNumber && (
                    <div className="mb-4">
                      <span className="text-sm font-medium text-gray-700">Tracking Number:</span>
                      <div className="mt-2">
                        <span className="tracking-number">
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
                        className="tracking-button hover-lift"
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
                    <div className="alert alert-info">
                      <p className="text-sm">
                        📦 Your order has been shipped! Tracking information will be available soon.
                      </p>
                    </div>
                  )}

                  {order.status === 'out_for_delivery' && (
                    <div className="alert alert-warning">
                      <p className="text-sm">
                        🚚 Your order is out for delivery! You should receive it today.
                      </p>
                    </div>
                  )}

                  {order.status === 'delivered' && (
                    <div className="alert alert-success">
                      <p className="text-sm">
                        ✅ Your order has been delivered! We hope you enjoy your purchase.
                      </p>
                    </div>
                  )}

                  {/* Cancel Order Button */}
                  {canCancelOrder(order.status) && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="btn btn-danger w-full sm:w-auto"
                        disabled={cancelling}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}

                  {/* Request Return Button */}
                  {canRequestReturn(order) && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Link
                        to={`/my-account/orders/${orderId}/return`}
                        className="btn btn-secondary w-full sm:w-auto"
                      >
                        Request Return
                      </Link>
                      <p className="text-xs text-gray-500 mt-2">
                        Items can be returned within 30 days of delivery
                      </p>
                    </div>
                  )}

                  {/* Return Request Status Section */}
                  {order.hasReturnRequest && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Return Request Status</h3>
                      
                      {loadingReturn ? (
                        <div className="text-sm text-gray-600">Loading return request details...</div>
                      ) : returnRequest ? (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Return Request: {returnRequest.formattedRequestNumber}
                              </p>
                              <p className="text-xs text-gray-500">
                                Submitted on {new Date(returnRequest.requestDate).toLocaleDateString('en-GB', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReturnStatusColorClass(returnRequest.status)}`}>
                              {formatReturnStatus(returnRequest.status)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">{returnRequest.totalItemsCount}</span> item(s) - 
                            Refund amount: <span className="font-medium">{formatCurrency(returnRequest.totalRefundAmount)}</span>
                          </div>
                          
                          <Link
                            to={`/my-account/returns/${returnRequest.id}`}
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Return Details
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      ) : (
                        <div className="alert alert-info">
                          <p className="text-sm">
                            📦 A return request has been submitted for this order. You will receive updates via email.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancelled Status Message */}
                  {order.status === 'cancelled' && (
                    <div className="alert alert-error mt-4">
                      <p className="text-sm">
                        ❌ This order has been cancelled. If a refund was initiated, it should appear in your account within 5-10 business days.
                      </p>
                    </div>
                  )}
                </div>
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
            <div className="order-summary animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-3">
                <div className="order-summary-line">
                  <span className="order-summary-label">Subtotal</span>
                  <span className="order-summary-value">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="order-summary-line">
                  <span className="order-summary-label">Shipping</span>
                  <span className="order-summary-value">{formatCurrency(order.shipping)}</span>
                </div>
                <div className="order-summary-line">
                  <span className="order-summary-label">Tax</span>
                  <span className="order-summary-value">{formatCurrency(order.tax)}</span>
                </div>
                <div className="order-summary-total">
                  <div className="order-summary-line">
                    <span className="order-summary-label">Total</span>
                    <span className="order-summary-value">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Address Display - Combined or Separate */}
            {(() => {
              const addressesAreSame = order?.shippingAddress && order?.billingAddress &&
                order.shippingAddress.fullName === order.billingAddress.fullName &&
                order.shippingAddress.addressLine1 === order.billingAddress.addressLine1 &&
                order.shippingAddress.addressLine2 === order.billingAddress.addressLine2 &&
                order.shippingAddress.city === order.billingAddress.city &&
                order.shippingAddress.postalCode === order.billingAddress.postalCode &&
                order.shippingAddress.country === order.billingAddress.country;

              if (addressesAreSame) {
                // Show single delivery address
                return (
                  <div className="address-card animate-fadeIn">
                    <h2 className="address-title">Delivery Address</h2>
                    <p className="text-sm text-gray-500 mb-2">Shipping and billing address</p>
                    <div>
                      {formatAddress(order.shippingAddress).map((line, index) => (
                        <div key={index} className="address-line">{line}</div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                // Show separate addresses
                return (
                  <>
                    {/* Shipping Address */}
                    <div className="address-card animate-fadeIn">
                      <h2 className="address-title">Shipping Address</h2>
                      <div>
                        {formatAddress(order.shippingAddress).map((line, index) => (
                          <div key={index} className="address-line">{line}</div>
                        ))}
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="address-card animate-fadeIn">
                      <h2 className="address-title">Billing Address</h2>
                      <div>
                        {formatAddress(order.billingAddress).map((line, index) => (
                          <div key={index} className="address-line">{line}</div>
                        ))}
                      </div>
                    </div>
                  </>
                );
              }
            })()}

            {/* Payment Information */}
            <div className="payment-card animate-fadeIn">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Payment Method:</span>
                  <div className="payment-method mt-1">
                    <span className="text-sm text-gray-900">
                      {order.paymentMethodDisplay}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                  <div className="mt-1">
                    <span className={`payment-status ${order.paymentStatus}`}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Cancel Order
            </h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to cancel this order? This action cannot be undone. 
              If payment was processed, a refund will be initiated and should appear in your account within 5-10 business days.
            </p>
            
            {cancelError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {cancelError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelError('');
                }}
                className="btn btn-secondary"
                disabled={cancelling}
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                className="btn btn-danger"
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsPage;