import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getOrderById, isAdminAuthenticated, formatCurrency, updateOrderStatus, issueRefund } from '../services/adminService';

const AdminOrderDetailsPage = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Order Details - Admin Dashboard';
    
    // Check authentication
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }

    if (orderId) {
      loadOrderDetails();
    } else {
      setError('No order ID provided');
      setLoading(false);
    }
  }, [navigate, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getOrderById(orderId);
      setOrder(response.data.order);
    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      awaiting_shipment: 'bg-purple-100 text-purple-800',
      shipped: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatPaymentMethod = (paymentMethod) => {
    if (!paymentMethod) return 'Not specified';
    
    if (paymentMethod.type === 'card') {
      return `Card ending in ${paymentMethod.last4 || '****'}`;
    } else if (paymentMethod.type === 'paypal') {
      return 'PayPal';
    } else if (paymentMethod.type === 'bitcoin') {
      return 'Bitcoin';
    } else if (paymentMethod.type === 'monero') {
      return 'Monero';
    }
    
    return paymentMethod.type || 'Unknown';
  };

  const getValidNextStatuses = (currentStatus) => {
    const statusTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['awaiting_shipment', 'shipped', 'cancelled'],
      'awaiting_shipment': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': ['refunded'],
      'cancelled': [],
      'refunded': []
    };
    return statusTransitions[currentStatus] || [];
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    if (e.target.value !== 'shipped') {
      setTrackingNumber('');
      setTrackingUrl('');
    }
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus) return;
    
    if (selectedStatus === 'shipped' && (!trackingNumber.trim() || !trackingUrl.trim())) {
      setError('Tracking number and tracking URL are required when marking as shipped');
      return;
    }
    
    setShowConfirmDialog(true);
  };

  const confirmStatusUpdate = async () => {
    try {
      setStatusUpdateLoading(true);
      setError('');
      
      const statusData = {
        newStatus: selectedStatus
      };
      
      // Add tracking info if status is 'shipped'
      if (selectedStatus === 'shipped') {
        statusData.trackingNumber = trackingNumber.trim();
        statusData.trackingUrl = trackingUrl.trim();
      }
      
      await updateOrderStatus(orderId, statusData);
      
      // Close dialog and reset form
      setShowConfirmDialog(false);
      setSelectedStatus('');
      setTrackingNumber('');
      setTrackingUrl('');
      
      // Reload order details to show updated status
      await loadOrderDetails();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const cancelStatusUpdate = () => {
    setShowConfirmDialog(false);
    setSelectedStatus('');
    setTrackingNumber('');
    setTrackingUrl('');
  };

  const handleRefund = async () => {
    try {
      setRefundLoading(true);
      setError('');
      
      const refundAmountNum = parseFloat(refundAmount);
      if (isNaN(refundAmountNum) || refundAmountNum <= 0) {
        setError('Please enter a valid refund amount');
        return;
      }
      
      if (!refundReason.trim()) {
        setError('Please provide a reason for the refund');
        return;
      }
      
      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
      
      if (refundAmountNum > maxRefundable) {
        setError(`Refund amount cannot exceed ${formatCurrency(maxRefundable)}`);
        return;
      }
      
      const refundData = {
        refundAmount: refundAmountNum,
        refundReason: refundReason.trim()
      };
      
      await issueRefund(orderId, refundData);
      
      // Close modal and reset form
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      
      // Reload order details to show updated refund info
      await loadOrderDetails();
    } catch (err) {
      setError(err.message || 'Failed to process refund');
    } finally {
      setRefundLoading(false);
    }
  };

  const cancelRefund = () => {
    setShowRefundModal(false);
    setRefundAmount('');
    setRefundReason('');
    setError('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <Link 
                  to="/admin/orders" 
                  className="text-blue-600 hover:text-blue-500 mr-2"
                >
                  ← Back to Orders
                </Link>
                <span className="text-gray-500">/</span>
                <span className="ml-2 text-gray-900 font-medium">Order Details</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Order</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadOrderDetails}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link 
                to="/admin/orders" 
                className="text-blue-600 hover:text-blue-500 mr-2"
              >
                ← Back to Orders
              </Link>
              <span className="text-gray-500">/</span>
              <span className="ml-2 text-gray-900 font-medium">Order Details</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Order #{order?.orderNumber}
          </h1>
          <p className="text-gray-600 mt-1">
            Placed on {formatDate(order?.createdAt)}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order?.status)}`}>
                      {formatStatus(order?.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="mt-1 text-sm text-gray-900 font-medium">
                      {formatCurrency(order?.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Payment Status</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {order?.paymentStatus || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDate(order?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Update Section */}
            {order && getValidNextStatuses(order.status).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Update Order Status</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2">
                        New Status
                      </label>
                      <select
                        id="status-select"
                        value={selectedStatus}
                        onChange={handleStatusChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select new status...</option>
                        {getValidNextStatuses(order.status).map(status => (
                          <option key={status} value={status}>
                            {formatStatus(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedStatus === 'shipped' && (
                      <>
                        <div>
                          <label htmlFor="tracking-number" className="block text-sm font-medium text-gray-700 mb-2">
                            Tracking Number *
                          </label>
                          <input
                            type="text"
                            id="tracking-number"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            placeholder="Enter tracking number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label htmlFor="tracking-url" className="block text-sm font-medium text-gray-700 mb-2">
                            Tracking URL *
                          </label>
                          <input
                            type="url"
                            id="tracking-url"
                            value={trackingUrl}
                            onChange={(e) => setTrackingUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleUpdateStatus}
                      disabled={!selectedStatus || statusUpdateLoading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {statusUpdateLoading ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Refund Section */}
            {order && order.paymentStatus === 'completed' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Issue Refund</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">
                      Order Total: <span className="font-medium">{formatCurrency(order.finalAmount)}</span>
                    </p>
                    {order.refundHistory && order.refundHistory.length > 0 && (
                      <p className="text-sm text-gray-600 mb-2">
                        Total Refunded: <span className="font-medium">
                          {formatCurrency(order.totalRefundedAmount || 0)}
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Available to Refund: <span className="font-medium text-green-600">
                        {formatCurrency(order.totalAmount - (order.totalRefundedAmount || 0))}
                      </span>
                    </p>
                  </div>
                  
                  {order.refundHistory && order.refundHistory.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Refund History</h3>
                      <div className="bg-gray-50 rounded-md p-3">
                        {order.refundHistory.map((refund, index) => (
                          <div key={index} className="flex justify-between items-center py-1 text-sm">
                            <span className="text-gray-600">
                              {new Date(refund.date).toLocaleDateString()} - {refund.reason}
                            </span>
                            <span className={`font-medium ${
                              refund.status === 'succeeded' ? 'text-green-600' : 
                              refund.status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {formatCurrency(refund.amount)} ({refund.status})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const maxRefundable = order.totalAmount - (order.totalRefundedAmount || 0);
                      if (maxRefundable > 0) {
                        setRefundAmount(maxRefundable.toString());
                        setRefundReason('');
                        setShowRefundModal(true);
                      }
                    }}
                    disabled={(order.totalRefundedAmount || 0) >= order.totalAmount}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Issue Refund
                  </button>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Items Ordered</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {order?.items?.map((item) => (
                      <tr key={item._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-16 w-16 flex-shrink-0">
                              <img
                                className="h-16 w-16 rounded-lg object-cover"
                                src={item.image}
                                alt={item.name}
                                onError={(e) => {
                                  e.target.src = '/placeholder-product.jpg';
                                }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                SKU: {item.slug}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order History/Status Log */}
            {order?.statusHistory && order.statusHistory.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order History</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="flow-root">
                    <ul className="-mb-8">
                      {order.statusHistory.map((event, eventIdx) => (
                        <li key={eventIdx}>
                          <div className="relative pb-8">
                            {eventIdx !== order.statusHistory.length - 1 ? (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Status changed to <span className="font-medium text-gray-900">{formatStatus(event.status)}</span>
                                    {event.notes && (
                                      <span className="text-gray-500"> - {event.notes}</span>
                                    )}
                                  </p>
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  {formatDate(event.timestamp)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Customer & Order Info */}
          <div className="space-y-6">
            {/* Customer Information */}
            {order?.customer && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
                </div>
                <div className="px-6 py-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.customer.firstName} {order.customer.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.customer.email}
                    </p>
                  </div>
                  {order.customer.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {order.customer.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {order?.shippingAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && (
                      <p>{order.shippingAddress.addressLine2}</p>
                    )}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Address */}
            {order?.billingAddress && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Billing Address</h2>
                </div>
                <div className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    <p>{order.billingAddress.firstName} {order.billingAddress.lastName}</p>
                    <p>{order.billingAddress.addressLine1}</p>
                    {order.billingAddress.addressLine2 && (
                      <p>{order.billingAddress.addressLine2}</p>
                    )}
                    <p>{order.billingAddress.city}, {order.billingAddress.postalCode}</p>
                    <p>{order.billingAddress.country}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment & Shipping Methods */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Payment & Shipping</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Payment Method</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {formatPaymentMethod(order?.paymentMethod)}
                  </p>
                  {order?.paymentIntentId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Payment ID: {order.paymentIntentId}
                    </p>
                  )}
                </div>
                {order?.shippingMethod && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Shipping Method</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {order.shippingMethod.name}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatCurrency(order.shippingCost)}
                    </p>
                  </div>
                )}
                {order?.trackingNumber && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tracking Number</p>
                    <p className="mt-1 text-sm text-gray-900 font-mono">
                      {order.trackingNumber}
                    </p>
                    {order.trackingUrl && (
                      <a
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 text-xs text-blue-600 hover:text-blue-500"
                      >
                        Track Package →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Order Totals */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Order Totals</h2>
              </div>
              <div className="px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(order?.subtotalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">{formatCurrency(order?.shippingCost || 0)}</span>
                </div>
                {order?.taxAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    <span className="text-gray-900">{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-base font-medium text-gray-900">
                      {formatCurrency(order?.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Update Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Confirm Status Update
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to change the order status to <strong>{formatStatus(selectedStatus)}</strong>?
                </p>
                {selectedStatus === 'cancelled' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <p className="text-xs text-yellow-800">
                      <strong>Warning:</strong> This will initiate a refund and restock items.
                    </p>
                  </div>
                )}
                {selectedStatus === 'shipped' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 text-left">
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>Tracking Information:</strong>
                    </p>
                    <p className="text-xs text-blue-800">
                      Number: {trackingNumber}
                    </p>
                    <p className="text-xs text-blue-800">
                      URL: {trackingUrl}
                    </p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={confirmStatusUpdate}
                  disabled={statusUpdateLoading}
                  className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {statusUpdateLoading ? 'Updating...' : 'Confirm'}
                </button>
                <button
                  onClick={cancelStatusUpdate}
                  disabled={statusUpdateLoading}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                Issue Refund
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="refund-amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Amount (£)
                  </label>
                  <input
                    type="number"
                    id="refund-amount"
                    step="0.01"
                    min="0"
                    max={order ? order.totalAmount - (order.totalRefundedAmount || 0) : 0}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="0.00"
                  />
                  {order && (
                    <p className="text-xs text-gray-500 mt-1">
                      Maximum refundable: {formatCurrency(order.totalAmount - (order.totalRefundedAmount || 0))}
                    </p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="refund-reason" className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Reason *
                  </label>
                  <select
                    id="refund-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select reason...</option>
                    <option value="Customer request">Customer request</option>
                    <option value="Damaged item">Damaged item</option>
                    <option value="Wrong item sent">Wrong item sent</option>
                    <option value="Order cancellation">Order cancellation</option>
                    <option value="Quality issue">Quality issue</option>
                    <option value="Return approved">Return approved</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}
              </div>
              
              <div className="items-center px-4 py-3 mt-6 text-center">
                <button
                  onClick={handleRefund}
                  disabled={refundLoading || !refundAmount || !refundReason}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {refundLoading ? 'Processing...' : 'Refund'}
                </button>
                <button
                  onClick={cancelRefund}
                  disabled={refundLoading}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrderDetailsPage;