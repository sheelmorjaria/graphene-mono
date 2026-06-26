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
      ? `Return ${returnRequest.formattedRequestNumber} - Graphene Security`
      : 'Return Details - Graphene Security';
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
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="card card-glow text-center py-16 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 bg-red-subtle border border-red rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">Error Loading Return Request</h2>
            <p className="text-text-secondary mb-8">{error}</p>
            <Link
              to="/my-account/returns"
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg"
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
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="card card-glow text-center py-16 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 bg-matrix-subtle border border-matrix-400 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">Return Request Not Found</h2>
            <p className="text-text-secondary mb-8">
              The return request you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link
              to="/my-account/returns"
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg"
            >
              Back to Returns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeIn">
          <nav className="text-sm text-text-muted font-mono mb-4">
            <Link to="/my-account" className="text-cyan-400 hover:text-matrix-400 transition-colors">My Account</Link>
            <span className="mx-2 text-text-muted">/</span>
            <Link to="/my-account/returns" className="text-cyan-400 hover:text-matrix-400 transition-colors">My Returns</Link>
            <span className="mx-2 text-text-muted">/</span>
            <span className="text-cyan-400">{returnRequest.formattedRequestNumber}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">
                Return Request {returnRequest.formattedRequestNumber}
              </h1>
              <p className="text-text-secondary">
                Submitted on {formatReturnDate(returnRequest.requestDate)}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6">
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
            <div className="card card-glow p-6 animate-fadeIn">
              <h2 className="font-heading text-xl font-bold text-cyan-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Return Status Timeline
              </h2>

              <div className="space-y-4">
                {getStatusTimeline().map((step) => (
                  <div key={step.status} className={`flex items-start ${step.completed ? 'text-text-primary' : 'text-text-muted'}`}>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed
                        ? returnRequest.status === step.status
                          ? 'bg-cyan-400 text-bg-primary'
                          : 'bg-matrix-400 text-bg-primary'
                        : 'bg-bg-elevated text-text-muted border border-border-subtle'
                    }`}>
                      {step.completed ? (
                        returnRequest.status === step.status ? (
                          <div className="w-2 h-2 bg-bg-primary rounded-full"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <div className="w-2 h-2 bg-text-muted rounded-full"></div>
                      )}
                    </div>

                    <div className="ml-4 flex-1">
                      <p className={`text-sm font-medium ${step.completed ? 'text-text-primary' : 'text-text-muted'}`}>
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-text-muted mt-1 font-mono">
                          {formatReturnDate(step.date)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Return Items */}
            <div className="card card-glow p-6 animate-fadeIn">
              <h2 className="font-heading text-xl font-bold text-cyan-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Returned Items
              </h2>

              <div className="space-y-4">
                {returnRequest.items.map((item, index) => (
                  <div key={index} className="border border-border-subtle rounded-lg p-4 bg-bg-elevated">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-text-primary">{item.productName}</h3>
                        <p className="text-sm text-text-secondary mt-1 font-mono">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-text-primary font-mono">{formatCurrency(item.totalRefundAmount)}</p>
                        <p className="text-sm text-text-secondary font-mono">{formatCurrency(item.unitPrice)} each</p>
                      </div>
                    </div>

                    <div className="border-t border-border-subtle pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-text-secondary">Reason</p>
                          <p className="text-sm text-text-primary mt-1">{getReasonDisplay(item.reason)}</p>
                        </div>
                        {item.reasonDescription && (
                          <div>
                            <p className="text-sm font-medium text-text-secondary">Description</p>
                            <p className="text-sm text-text-primary mt-1">{item.reasonDescription}</p>
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
              <div className="card card-glow p-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-bold text-cyan-400 mb-6 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Supporting Images
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {returnRequest.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.url}
                        alt={image.description || `Return image ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-border-subtle cursor-pointer hover:border-cyan-400 transition-colors"
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      {image.description && (
                        <p className="text-xs text-text-secondary mt-1 truncate">{image.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Notes */}
            {returnRequest.adminNotes && (
              <div className="card card-glow p-6 animate-fadeIn">
                <h2 className="font-heading text-xl font-bold text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Notes from Support
                </h2>
                <div className="bg-bg-elevated border border-border-subtle rounded-lg p-4">
                  <p className="text-text-primary">{returnRequest.adminNotes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Return Summary */}
            <div className="card card-glow p-6 animate-fadeIn">
              <h2 className="font-heading text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Return Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Return ID</span>
                  <span className="text-sm font-medium text-text-primary font-mono">{returnRequest.formattedRequestNumber}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Order Number</span>
                  <Link
                    to={`/orders/${returnRequest.orderId}`}
                    className="text-sm font-medium text-cyan-400 hover:text-matrix-400"
                  >
                    {returnRequest.orderNumber}
                  </Link>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Items Count</span>
                  <span className="text-sm font-medium text-text-primary">{returnRequest.totalItemsCount}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Refund Amount</span>
                  <span className="text-sm font-medium text-cyan-400 font-mono">{formatCurrency(returnRequest.totalRefundAmount)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-sm text-text-secondary">Status</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getReturnStatusColorClass(returnRequest.status)}`}>
                    {formatReturnStatus(returnRequest.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Return Shipping Address */}
            {returnRequest.returnShippingAddress && (
              <div className="card card-glow p-6 animate-fadeIn">
                <h2 className="font-heading text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Return Shipping Address
                </h2>

                <div className="text-sm text-text-primary space-y-1 font-mono">
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
              <div className="card card-glow p-6 animate-fadeIn">
                <h2 className="font-heading text-lg font-bold text-cyan-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Refund Information
                </h2>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Refund ID</span>
                    <span className="text-sm font-medium text-text-primary font-mono">{returnRequest.refundId}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-text-secondary">Refund Status</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      returnRequest.refundStatus === 'succeeded' ? 'text-matrix-400 bg-matrix-subtle' :
                      returnRequest.refundStatus === 'failed' ? 'text-red bg-red-subtle' :
                      returnRequest.refundStatus === 'canceled' ? 'text-text-muted bg-bg-elevated' :
                      'text-amber bg-amber-subtle'
                    }`}>
                      {returnRequest.refundStatus ? returnRequest.refundStatus.charAt(0).toUpperCase() + returnRequest.refundStatus.slice(1) : 'Unknown'}
                    </span>
                  </div>

                  {returnRequest.refundProcessedDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-text-secondary">Processed</span>
                      <span className="text-sm font-medium text-text-primary font-mono">
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
                className="btn btn-primary block w-full text-center px-4 py-2 text-sm font-medium rounded-lg"
              >
                View Original Order
              </Link>

              <Link
                to="/my-account/returns"
                className="btn btn-secondary block w-full text-center px-4 py-2 text-sm font-medium rounded-lg"
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