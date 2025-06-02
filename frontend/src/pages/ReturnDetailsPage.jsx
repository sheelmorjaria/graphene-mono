import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReturnRequestDetails, formatReturnStatus, getReturnStatusColorClass, formatReturnDate } from '../services/returnService';
import { formatCurrency } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';

const ReturnDetailsPage = () => {
  const { returnRequestId } = useParams();
  const [returnRequest, setReturnRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReturnDetails();
  }, [returnRequestId]);

  useEffect(() => {
    document.title = returnRequest 
      ? `Return ${returnRequest.formattedRequestNumber} - GrapheneOS Store`
      : 'Return Details - GrapheneOS Store';
  }, [returnRequest]);

  const loadReturnDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getReturnRequestDetails(returnRequestId);
      setReturnRequest(response.data.returnRequest);
    } catch (err) {
      setError(err.message || 'Failed to load return request details');
    } finally {
      setLoading(false);
    }
  };

  const getReasonDisplay = (reason) => {
    const reasonMap = {
      'damaged_received': 'Damaged on Arrival',
      'wrong_item_sent': 'Wrong Item Sent',
      'not_as_described': 'Not as Described',
      'changed_mind': 'Changed Mind',
      'wrong_size': 'Wrong Size',
      'quality_issues': 'Quality Issues',
      'defective_item': 'Defective Item',
      'other': 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const getStatusTimeline = () => {
    const timeline = [
      {
        status: 'pending_review',
        label: 'Pending Review',
        date: returnRequest?.requestDate,
        completed: true
      },
      {
        status: 'approved',
        label: 'Approved',
        date: returnRequest?.approvedDate,
        completed: ['approved', 'item_received', 'processing_refund', 'refunded', 'closed'].includes(returnRequest?.status)
      },
      {
        status: 'item_received',
        label: 'Item Received',
        date: returnRequest?.itemReceivedDate,
        completed: ['item_received', 'processing_refund', 'refunded', 'closed'].includes(returnRequest?.status)
      },
      {
        status: 'processing_refund',
        label: 'Processing Refund',
        date: null,
        completed: ['processing_refund', 'refunded', 'closed'].includes(returnRequest?.status)
      },
      {
        status: 'refunded',
        label: 'Refunded',
        date: returnRequest?.refundProcessedDate,
        completed: returnRequest?.status === 'refunded' || returnRequest?.status === 'closed'
      }
    ];

    if (returnRequest?.status === 'rejected') {
      return [{
        status: 'pending_review',
        label: 'Pending Review',
        date: returnRequest?.requestDate,
        completed: true
      }, {
        status: 'rejected',
        label: 'Rejected',
        date: returnRequest?.updatedAt,
        completed: true
      }];
    }

    return timeline;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="error-container text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Error Loading Return Request</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link
              to="/my-account/returns"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!returnRequest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="not-found text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Return Request Not Found</h2>
            <p className="text-gray-600 mb-8">
              The return request you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              to="/my-account/returns"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="breadcrumb mb-4">
            <Link to="/my-account" className="breadcrumb-link">My Account</Link>
            <span className="breadcrumb-separator">/</span>
            <Link to="/my-account/returns" className="breadcrumb-link">My Returns</Link>
            <span className="breadcrumb-separator">/</span>
            <span>{returnRequest.formattedRequestNumber}</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Return Request {returnRequest.formattedRequestNumber}
              </h1>
              <p className="text-gray-600 mt-2">
                Submitted on {formatReturnDate(returnRequest.requestDate)}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReturnStatusColorClass(returnRequest.status)}`}>
                {formatReturnStatus(returnRequest.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Return Status Timeline</h2>
              
              <div className="space-y-4">
                {getStatusTimeline().map((step, index) => (
                  <div key={step.status} className={`flex items-start ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? returnRequest.status === step.status 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.completed ? (
                        returnRequest.status === step.status ? (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-1">
                      <p className={`text-sm font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formatReturnDate(step.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Returned Items</h2>
              
              <div className="space-y-4">
                {returnRequest.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.productName}</h3>
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.totalRefundAmount)}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.unitPrice)} each</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Reason</p>
                          <p className="text-sm text-gray-900 mt-1">{getReasonDisplay(item.reason)}</p>
                        </div>
                        {item.reasonDescription && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Description</p>
                            <p className="text-sm text-gray-900 mt-1">{item.reasonDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            {returnRequest.images && returnRequest.images.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Supporting Images</h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {returnRequest.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.description || `Return image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      {image.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">{image.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {returnRequest.adminNotes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Notes from Support</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700">{returnRequest.adminNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Return Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Summary</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Return ID</span>
                  <span className="text-sm font-medium text-gray-900">{returnRequest.formattedRequestNumber}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Order Number</span>
                  <Link 
                    to={`/orders/${returnRequest.orderId}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {returnRequest.orderNumber}
                  </Link>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Items Count</span>
                  <span className="text-sm font-medium text-gray-900">{returnRequest.totalItemsCount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Refund Amount</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(returnRequest.totalRefundAmount)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getReturnStatusColorClass(returnRequest.status)}`}>
                    {formatReturnStatus(returnRequest.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Return Shipping Address */}
            {returnRequest.returnShippingAddress && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Return Shipping Address</h2>
                
                <div className="text-sm text-gray-700 space-y-1">
                  {returnRequest.returnShippingAddress.companyName && (
                    <div>{returnRequest.returnShippingAddress.companyName}</div>
                  )}
                  <div>{returnRequest.returnShippingAddress.addressLine1}</div>
                  {returnRequest.returnShippingAddress.addressLine2 && (
                    <div>{returnRequest.returnShippingAddress.addressLine2}</div>
                  )}
                  <div>
                    {returnRequest.returnShippingAddress.city}, {returnRequest.returnShippingAddress.stateProvince} {returnRequest.returnShippingAddress.postalCode}
                  </div>
                  <div>{returnRequest.returnShippingAddress.country}</div>
                </div>
              </div>
            )}

            {/* Refund Information */}
            {returnRequest.refundId && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Refund Information</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Refund ID</span>
                    <span className="text-sm font-medium text-gray-900">{returnRequest.refundId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Refund Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      returnRequest.refundStatus === 'succeeded' ? 'text-green-600 bg-green-50' :
                      returnRequest.refundStatus === 'failed' ? 'text-red-600 bg-red-50' :
                      returnRequest.refundStatus === 'canceled' ? 'text-gray-600 bg-gray-50' :
                      'text-yellow-600 bg-yellow-50'
                    }`}>
                      {returnRequest.refundStatus.charAt(0).toUpperCase() + returnRequest.refundStatus.slice(1)}
                    </span>
                  </div>
                  
                  {returnRequest.refundProcessedDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Processed</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(returnRequest.refundProcessedDate).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Link
                to={`/orders/${returnRequest.orderId}`}
                className="block w-full text-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Original Order
              </Link>
              
              <Link
                to="/my-account/returns"
                className="block w-full text-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Returns
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnDetailsPage;