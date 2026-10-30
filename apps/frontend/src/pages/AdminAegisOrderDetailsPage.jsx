import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getAegisOrderById, updateAegisOrderStatus, refundAegisOrder, isAdminAuthenticated, formatCurrency } from '../services/adminService';

const AdminAegisOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [statusForm, setStatusForm] = useState({
    orderStatus: '',
    paymentStatus: '',
    note: ''
  });

  useEffect(() => {
    document.title = 'Aegis Order Details - Admin Dashboard';

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
      const response = await getAegisOrderById(id);
      setOrder(response.data);
      setStatusForm({
        orderStatus: response.data.orderStatus,
        paymentStatus: response.data.paymentStatus,
        note: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load Aegis order');
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

      await updateAegisOrderStatus(id, updateData);
      await loadOrder();
      setShowStatusModal(false);
      setStatusForm(prev => ({ ...prev, note: '' }));
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // Full refund only, and only before the licence has been delivered
  const refundable = order
    && order.paymentStatus === 'Completed'
    && ['Paid', 'Cancelled'].includes(order.orderStatus);
  const nonRefundable = order
    && order.paymentStatus === 'Completed'
    && order.orderStatus === 'Fulfilled';
  const refundAmount = order?.amountGbp || 0;

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      setRefundError('A reason is required for the refund record');
      return;
    }
    try {
      setRefundLoading(true);
      setRefundError('');
      await refundAegisOrder(order._id || id, {
        reason: refundReason.trim()
      });
      setShowRefundModal(false);
      setRefundReason('');
      await loadOrder();
    } catch (err) {
      setRefundError(err.message || 'Failed to refund Aegis order');
    } finally {
      setRefundLoading(false);
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
      Fulfilled: 'bg-green-100 text-green-800',
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
      Paid: ['Fulfilled', 'Cancelled', 'Refunded'],
      Fulfilled: [],
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
            <p className="text-red-400 mb-4">{error || 'Aegis Order not found'}</p>
            <Link
              to="/admin/aegis-orders"
              className="inline-block px-4 py-2 bg-cyan-400 text-text-on-accent rounded-lg hover:shadow-glow-cyan transition-all"
            >
              Back to Aegis Orders
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
                to="/admin/aegis-orders"
                className="text-cyan-400 hover:text-cyan-300 mr-2"
              >
                ← Back to Aegis Orders
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
          {refundable && (
            <button
              onClick={() => { setRefundError(''); setShowRefundModal(true); }}
              className="ml-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              data-testid="refund-aegis-order-button"
            >
              Refund Licence
            </button>
          )}
          {nonRefundable && (
            <span className="ml-3 text-xs text-red-400" data-testid="non-refundable-note">
              Non-refundable per policy — licence has been delivered
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary">Email</label>
                <p className="text-text-primary">{order.customerEmail}</p>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Delivery Method</label>
                <p className="text-text-primary">Digital — installer kit and setup guide by email</p>
              </div>
            </div>
          </div>

          {/* Licence Information */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Licence Information</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-text-secondary">Product</label>
                <p className="text-text-primary font-semibold">Aegis Hardening Suite</p>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Licensed Device</label>
                <p className="text-text-primary font-semibold">Pixel {order.pixelModel}</p>
              </div>
              <div>
                <label className="text-sm text-text-secondary">Licence Terms</label>
                <p className="text-text-primary">Lifetime, one device · 12 months of updates</p>
              </div>
              {order.downloadCount > 0 && (
                <div>
                  <label className="text-sm text-text-secondary">Kit Downloads</label>
                  <p className="text-text-primary">
                    {order.downloadCount}{order.lastDownloadedAt ? ` · last ${formatDate(order.lastDownloadedAt)}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6">
            <h2 className="text-xl font-display font-semibold text-text-primary mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Aegis Licence</span>
                <span className="text-text-primary font-mono">{formatCurrency(order.amountGbp)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border-subtle font-semibold">
                <span className="text-text-primary">Total Paid</span>
                <span className="text-cyan-400 font-mono">{formatCurrency(order.amountGbp)}</span>
              </div>
              {order.totalRefundedAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Refunded</span>
                  <span className="text-red-400 font-mono">-{formatCurrency(order.totalRefundedAmount)}</span>
                </div>
              )}
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

        {/* Refund History */}
        {order.refundHistory && order.refundHistory.length > 0 && (
          <div className="bg-bg-card rounded-lg border border-border-subtle p-6 mt-6" data-testid="refund-history">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-2">Refund History</h2>
            <ul className="space-y-1">
              {order.refundHistory.map((entry, index) => (
                <li key={index} className="text-sm flex items-center gap-2">
                  <span className={entry.status === 'succeeded' ? 'text-green-400' : entry.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}>
                    {entry.status === 'succeeded' ? '✓' : entry.status === 'failed' ? '✗' : '…'}
                  </span>
                  <span className="font-mono">{formatCurrency(entry.amount)}</span>
                  <span className="text-text-muted text-xs">
                    {entry.refundId ? `${entry.refundId} · ` : ''}{entry.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

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
                    <option value="Fulfilled">Fulfilled</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                  {getNextStatuses(order.orderStatus).length > 0 && (
                    <p className="mt-2 text-xs text-text-muted">
                      Usual next: {getNextStatuses(order.orderStatus).map(formatStatus).join(' · ')}
                    </p>
                  )}
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

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" data-testid="refund-modal">
          <div className="bg-bg-card rounded-lg border border-border-subtle max-w-md w-full p-6">
            <h2 className="text-lg font-display font-semibold text-text-primary mb-1">Refund Aegis Licence</h2>
            <p className="text-xs text-text-muted mb-4">
              Full refund of the licence price. This cannot be undone.
            </p>

            <div className="space-y-4">
              <div className="bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-sm flex justify-between" data-testid="refund-amount-display">
                <span className="text-text-muted">Refund amount</span>
                <span className="font-mono text-cyan-400">{formatCurrency(refundAmount)}</span>
              </div>

              <div>
                <label htmlFor="refund-reason" className="block text-xs text-text-muted mb-1">Reason (required)</label>
                <textarea
                  id="refund-reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Customer could not complete installation; duplicate purchase"
                />
              </div>

              {refundError && (
                <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2 text-sm text-red-400" data-testid="refund-error">
                  {refundError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowRefundModal(false); setRefundError(''); }}
                  disabled={refundLoading}
                  className="px-4 py-2 rounded-lg border border-border-subtle hover:bg-bg-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefund}
                  disabled={refundLoading || !refundReason.trim()}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
                  data-testid="refund-confirm-button"
                >
                  {refundLoading ? 'Refunding…' : `Refund ${formatCurrency(refundAmount)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAegisOrderDetailsPage;
