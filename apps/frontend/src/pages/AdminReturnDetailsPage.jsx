import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReturnRequestById, updateReturnRequestStatus, formatCurrency } from '../services/adminService';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminReturnDetailsPage = () => {
  const { returnRequestId } = useParams();
  const navigate = useNavigate();
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const statusOptions = [
    { value: 'pending_review', label: 'Pending Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'item_received', label: 'Item Received' },
    { value: 'processing_refund', label: 'Processing Refund' },
    { value: 'refunded', label: 'Refunded' },
    { value: 'closed', label: 'Closed' }
  ];

  const fetchReturnRequestDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getReturnRequestById(returnRequestId);
      setReturnRequest(response.data.returnRequest);
    } catch (err) {
      console.error('Error fetching return request details:', err);
      setError(err.message || 'Failed to fetch return request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (returnRequestId) {
      fetchReturnRequestDetails();
    }
  }, [returnRequestId]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;

    try {
      setUpdateLoading(true);
      
      const updateData = {
        newStatus: selectedStatus,
        adminNotes: adminNotes.trim() || undefined
      };

      if (selectedStatus === 'rejected' && rejectionReason.trim()) {
        updateData.rejectionReason = rejectionReason.trim();
      }

      const response = await updateReturnRequestStatus(returnRequestId, updateData);
      setReturnRequest(response.data.returnRequest);
      setShowStatusModal(false);
      setSelectedStatus('');
      setRejectionReason('');
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating return request status:', err);
      setError(err.message || 'Failed to update return request status');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleRefundClick = () => {
    if (returnRequest?.order?._id) {
      navigate(`/admin/orders/${returnRequest.order._id}`, { 
        state: { showRefundModal: true, returnRequestId: returnRequest._id } 
      });
    }
  };

  const getStatusBadgeClass = (status) => {
    const baseClasses = "px-3 py-1 text-sm font-medium rounded-full";
    switch (status) {
      case 'pending_review':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'approved':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'item_received':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'processing_refund':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'refunded':
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case 'closed':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatStatus = (status) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatReason = (reason) => {
    return reason.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error && !returnRequest) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
        <div className="mt-4">
          <Link
            to="/admin/returns"
            className="text-sm text-red-600 hover:text-red-500 underline"
          >
            ← Back to Return Requests
          </Link>
        </div>
      </div>
    );
  }

  if (!returnRequest) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Return request not found.</p>
        <Link
          to="/admin/returns"
          className="mt-4 text-blue-600 hover:text-blue-500 underline"
        >
          ← Back to Return Requests
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/admin/returns" className="text-gray-400 hover:text-gray-500">
                  Return Requests
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
                  </svg>
                  <span className="ml-4 text-sm font-medium text-gray-500">
                    RET-{returnRequest.returnRequestNumber}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
          <div className="mt-2 flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Return Request RET-{returnRequest.returnRequestNumber}
            </h1>
            <span className={getStatusBadgeClass(returnRequest.status)}>
              {formatStatus(returnRequest.status)}
            </span>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Update Status
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Return Request Details */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Return Request Details</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Request Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(returnRequest.requestDate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Refund Amount</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-semibold">
                    {formatCurrency(returnRequest.totalRefundAmount)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Customer</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {returnRequest.customer ? 
                      `${returnRequest.customer.firstName} ${returnRequest.customer.lastName}` :
                      'Unknown Customer'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Customer Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {returnRequest.customer?.email || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Order Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {returnRequest.order ? (
                      <Link
                        to={`/admin/orders/${returnRequest.order._id}`}
                        className="text-blue-600 hover:text-blue-500 underline"
                      >
                        {returnRequest.order.orderNumber}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Return Window</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {returnRequest.returnWindow} days
                    {returnRequest.isWithinReturnWindow ? (
                      <span className="ml-2 text-green-600">(Within window)</span>
                    ) : (
                      <span className="ml-2 text-red-600">(Outside window)</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Returned Items */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Returned Items</h3>
            </div>
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {returnRequest.items?.map((item, index) => (
                  <li key={index} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-500">
                          Reason: {formatReason(item.reason)}
                        </p>
                        {item.reasonDescription && (
                          <p className="text-sm text-gray-500 mt-1">
                            "{item.reasonDescription}"
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                        <p className="text-sm text-gray-500">
                          Total: {formatCurrency(item.totalRefundAmount)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Images */}
          {returnRequest.images && returnRequest.images.length > 0 && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Supporting Images</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {returnRequest.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image.url}
                        alt={image.description || `Return image ${index + 1}`}
                        className="h-24 w-full object-cover rounded-lg"
                      />
                      {image.description && (
                        <p className="mt-2 text-xs text-gray-500">{image.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          {returnRequest.adminNotes && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Admin Notes</h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {returnRequest.adminNotes}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Status Timeline</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Request Submitted</p>
                    <p className="text-xs text-gray-500">{formatDate(returnRequest.requestDate)}</p>
                  </div>
                </div>
                
                {returnRequest.approvedDate && (
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-xs text-gray-500">{formatDate(returnRequest.approvedDate)}</p>
                    </div>
                  </div>
                )}
                
                {returnRequest.itemReceivedDate && (
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Item Received</p>
                      <p className="text-xs text-gray-500">{formatDate(returnRequest.itemReceivedDate)}</p>
                    </div>
                  </div>
                )}
                
                {returnRequest.refundProcessedDate && (
                  <div className="flex items-center space-x-3">
                    <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Refund Processed</p>
                      <p className="text-xs text-gray-500">{formatDate(returnRequest.refundProcessedDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Return Address */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Return Address</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <address className="text-sm text-gray-900 not-italic">
                {returnRequest.returnShippingAddress?.companyName}<br />
                {returnRequest.returnShippingAddress?.addressLine1}<br />
                {returnRequest.returnShippingAddress?.addressLine2 && (
                  <>{returnRequest.returnShippingAddress.addressLine2}<br /></>
                )}
                {returnRequest.returnShippingAddress?.city}, {returnRequest.returnShippingAddress?.stateProvince}<br />
                {returnRequest.returnShippingAddress?.postalCode}<br />
                {returnRequest.returnShippingAddress?.country}
              </address>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6 space-y-3">
              {returnRequest.status === 'approved' && (
                <button
                  type="button"
                  onClick={handleRefundClick}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Issue Refund
                </button>
              )}
              
              <Link
                to={`/admin/orders/${returnRequest.order?._id}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Original Order
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Update Return Status</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    New Status
                  </label>
                  <select
                    id="status"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="">Select status...</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStatus === 'rejected' && (
                  <div>
                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                      Rejection Reason *
                    </label>
                    <textarea
                      id="rejectionReason"
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this return request..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700">
                    Admin Notes
                  </label>
                  <textarea
                    id="adminNotes"
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any internal notes about this status change..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedStatus('');
                    setRejectionReason('');
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStatusUpdate}
                  disabled={updateLoading || !selectedStatus || (selectedStatus === 'rejected' && !rejectionReason.trim())}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturnDetailsPage;