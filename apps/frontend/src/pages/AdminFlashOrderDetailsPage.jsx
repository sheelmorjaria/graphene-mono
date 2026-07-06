import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getFlashOrderById, updateFlashOrderStatus, isAdminAuthenticated, formatCurrency } from '../services/adminService';

const AdminFlashOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    orderStatus: '',
    paymentStatus: '',
    note: ''
  });

  useEffect(() => {
    document.title = 'Flash Order Details - Admin Dashboard';

    // Check authentication
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }

    loadOrder();
  }, [id, navigate]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getFlashOrderById(id);
      setOrder(response.data);
      setStatusForm({
        orderStatus: response.data.orderStatus,
        paymentStatus: response.data.paymentStatus,
        note: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load flash order');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();

    try {
      setUpdating(true);
      setError('');

      const updateData = {
        orderStatus: statusForm.orderStatus,
        paymentStatus: statusForm.paymentStatus,
        note: statusForm.note
      };

      // Only include fields that have changed
      if (updateData.orderStatus === order.orderStatus) {
        delete updateData.orderStatus;
      }
      if (updateData.paymentStatus === order.paymentStatus) {
        delete updateData.paymentStatus;
      }
      if (!updateData.note) {
        delete updateData.note;
      }

      // Ensure at least one field is being updated
      if (Object.keys(updateData).length === 0) {
        setError('No changes to update');
        setUpdating(false);
        return;
      }

      await updateFlashOrderStatus(id, updateData);
      await loadOrder();
      setShowStatusModal(false);
      setStatusForm(prev => ({ ...prev, note: '' }));
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      Awaiting_Payment: 'bg-yellow-100 text-yellow-800',
      Paid: 'bg-blue-100 text-blue-800',
      Device_Received: 'bg-purple-100 text-purple-800',
      Flashing_In_Progress: 'bg-indigo-100 text-indigo-800',
      Shipped_Back: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
      Refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ');
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      Unpaid: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-green-100 text-green-800',
      Failed: 'bg-red-100 text-red-800',
      Refunded: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getNextStatuses = (currentStatus) => {
    const workflow = {
      Awaiting_Payment: ['Paid', 'Cancelled'],
      Paid: ['Device_Received', 'Cancelled', 'Refunded'],
      Device_Received: ['Flashing_In_Progress', 'Cancelled', 'Refunded'],
      Flashing_In_Progress: ['Shipped_Back', 'Cancelled', 'Refunded'],
      Shipped_Back: [],
      Cancelled: [],
      Refunded: []
    };
    return workflow[currentStatus] || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-8 text-center">
            <p className="text-red-400 mb-4">{error || 'Flash Order not found'}</p>
            <Link
              to="/admin/flash-orders"
              className="inline-block px-4 py-2 bg-cyan-400 text-text-on-accent rounded-lg hover:shadow-glow-cyan transition-all"
            >
              Back to Flash Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-card shadow-sm border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link
                to="/admin/flash-orders"
                className="text-cyan-400 hover:text-cyan-300 mr-2"
              >
                ← Back to Flash Orders
              </Link>
              <span className="text-text-muted">/</span>
              <span className="ml-2 text-text-primary font-medium font-mono">{order.orderNumber}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-bg-card rounded-lg border border-border-subtle p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-text-primary mb-2">
                {order.orderNumber}
              </h1>
              <p className="text-text-secondary">Created on {formatDate(order.createdAt)}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadgeColor(order.orderStatus)}`}>
                {formatStatus(order.orderStatus)}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowStatusModal(true)}
            className="px-4 py-2 bg-cyan-400 text-text-on-accent font-heading font-semibold text-sm uppercase tracking-wider rounded-lg hover:shadow-glow-cyan transition-all"
          >
            Update Status
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary">Name</label>
                <p className="text-text-primary">{order.returnAddress?.fullName || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Email</label>
                <p className="text-text-primary">{order.customerEmail}</p>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Phone</label>
                <p className="text-text-primary">{order.returnAddress?.phoneNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Device Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary">Pixel Model</label>
                <p className="text-text-primary font-semibold">{order.pixelModel}</p>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Factory Reset Confirmed</label>
                <p className={order.factoryResetConfirmed ? 'text-green-400' : 'text-red-400'}>
                  {order.factoryResetConfirmed ? '✓ Yes' : '✗ No'}
                </p>
              </div>
            </div>
          </div>

          {/* Return Address */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Return Address</h2>
            <div className="space-y-1 text-text-primary">
              <p className="font-semibold">{order.returnAddress?.fullName}</p>
              <p>{order.returnAddress?.addressLine1}</p>
              {order.returnAddress?.addressLine2 && <p>{order.returnAddress.addressLine2}</p>}
              <p>{order.returnAddress?.city}</p>
              <p>{order.returnAddress?.stateProvince}</p>
              <p>{order.returnAddress?.postalCode}</p>
              <p>{order.returnAddress?.country}</p>
            </div>
          </div>

          {/* PO Box Address (Only shown if paid) */}
          {order.paymentStatus === 'Completed' && order.poBoxAddress ? (
            <div className="bg-bg-card rounded-lg border border-cyan-400/30 p-6">
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                PO Box Address
              </h2>
              <div className="space-y-1 text-text-primary bg-bg-elevated p-4 rounded-lg">
                <p className="font-semibold">{order.poBoxAddress.street}</p>
                <p>{order.poBoxAddress.city}</p>
                <p>{order.poBoxAddress.postalCode}</p>
                <p>{order.poBoxAddress.country}</p>
              </div>
              {order.poBoxAddress.instructions && (
                <div className="mt-4 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
                  <p className="text-sm text-text-secondary">{order.poBoxAddress.instructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">PO Box Address</h2>
              <div className="text-center py-4">
                <svg className="w-12 h-12 mx-auto text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-text-secondary">PO Box address will be revealed after payment is completed</p>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Flashing Service</span>
                <span className="text-text-primary font-mono">{formatCurrency(order.basePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Return Shipping</span>
                <span className="text-text-primary font-mono">{formatCurrency(order.returnShipping)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping Region</span>
                <span className="text-text-primary font-mono">{(order.shippingRegion || 'uk').toUpperCase()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border-subtle font-semibold">
                <span className="text-text-primary">Total</span>
                <span className="text-cyan-400 font-mono">{formatCurrency(order.totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {order.paymentDetails ? (
            <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Payment Details</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-text-secondary">PayPal Order ID</label>
                  <p className="font-mono text-text-primary">{order.paymentDetails.paypalOrderId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-text-secondary">Transaction ID</label>
                  <p className="font-mono text-text-primary">{order.paymentDetails.paypalTransactionId || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-text-secondary">Payer Email</label>
                  <p className="text-text-primary">{order.paymentDetails.paypalPayerEmail || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
              <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Payment Details</h2>
              <p className="text-text-secondary">No payment details available</p>
            </div>
          )}
        </div>

        {/* Status History */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6 mt-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Status History</h2>
            <div className="space-y-4">
              {order.statusHistory.slice().reverse().map((entry, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-cyan-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary">{formatStatus(entry.status)}</p>
                    <p className="text-sm text-text-secondary">{formatDate(entry.timestamp)}</p>
                    {entry.note && <p className="text-sm text-text-muted mt-1">{entry.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-card rounded-lg border border-border-subtle max-w-md w-full p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Update Order Status</h2>

            <form onSubmit={handleStatusUpdate}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                    Order Status
                  </label>
                  <select
                    value={statusForm.orderStatus}
                    onChange={(e) => setStatusForm({ ...statusForm, orderStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="Awaiting_Payment">Awaiting Payment</option>
                    <option value="Paid">Paid</option>
                    <option value="Device_Received">Device Received</option>
                    <option value="Flashing_In_Progress">Flashing In Progress</option>
                    <option value="Shipped_Back">Shipped Back</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                    Payment Status
                  </label>
                  <select
                    value={statusForm.paymentStatus}
                    onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                    Note (Optional)
                  </label>
                  <textarea
                    value={statusForm.note}
                    onChange={(e) => setStatusForm({ ...statusForm, note: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    placeholder="Add a note about this status change..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 px-4 py-2 bg-cyan-400 text-text-on-accent font-heading font-semibold text-sm uppercase tracking-wider rounded-lg hover:shadow-glow-cyan transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setStatusForm({
                      orderStatus: order.orderStatus,
                      paymentStatus: order.paymentStatus,
                      note: ''
                    });
                  }}
                  className="px-4 py-2 bg-bg-elevated border border-border-subtle text-text-primary font-heading font-semibold text-sm uppercase tracking-wider rounded-lg hover:bg-bg-hover transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFlashOrderDetailsPage;
