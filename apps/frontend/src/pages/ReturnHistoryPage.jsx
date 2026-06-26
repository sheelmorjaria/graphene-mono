import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserReturnRequests, formatReturnStatus, getReturnStatusColorClass, formatReturnDate } from '../services/returnService';
import { formatCurrency } from '../services/orderService';
import LoadingSpinner from '../components/LoadingSpinner';

const ReturnHistoryPage = () => {
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    document.title = 'My Returns - Graphene Security';
  }, []);

  useEffect(() => {
    loadReturnRequests();
  }, [currentPage, statusFilter]);

  const loadReturnRequests = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: 10,
        sortBy: 'requestDate',
        sortOrder: 'desc'
      };

      if (statusFilter) {
        params.status = statusFilter;
      }

      const response = await getUserReturnRequests(params);
      setReturnRequests(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load return requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
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
            <span className="text-cyan-400">My Returns</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center">
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">My Returns</h1>
              <p className="text-text-secondary">Track and manage your return requests</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card card-glow p-6 mb-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-text-secondary mb-2">
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="block w-full px-3 py-2 border border-border-subtle rounded-md bg-bg-elevated text-text-primary focus:outline-none focus:ring-cyan-400 focus:border-cyan-400"
              >
                <option value="">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="item_received">Item Received</option>
                <option value="processing_refund">Processing Refund</option>
                <option value="refunded">Refunded</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {pagination.total > 0 && (
              <div className="text-sm text-text-secondary font-mono mt-4 sm:mt-0">
                Showing {Math.min((currentPage - 1) * pagination.limit + 1, pagination.total)} - {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} returns
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-subtle border border-red rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red">Error</h3>
                <p className="text-sm text-red mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Return Requests List */}
        {!loading && returnRequests.length === 0 ? (
          <div className="card card-glow text-center py-16 animate-fadeIn">
            <div className="w-20 h-20 mx-auto mb-6 bg-matrix-subtle border border-matrix-400 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="font-display text-2xl font-bold text-cyan-400 mb-4 uppercase tracking-wider">No Return Requests</h2>
            <p className="text-text-secondary mb-8">
              {statusFilter
                ? `No return requests found with status "${formatReturnStatus(statusFilter)}"`
                : "You haven't submitted any return requests yet."
              }
            </p>
            <Link
              to="/orders"
              className="btn btn-primary inline-flex items-center px-6 py-3 rounded-lg"
            >
              View Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {returnRequests.map((returnRequest) => (
              <div key={returnRequest.id} className="card card-glow hover:border-cyan-400 transition-all">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Return Request Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary font-mono">
                          {returnRequest.formattedRequestNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReturnStatusColorClass(returnRequest.status)}`}>
                          {formatReturnStatus(returnRequest.status)}
                        </span>
                      </div>

                      <div className="text-sm text-text-secondary space-y-1">
                        <p>
                          <span className="font-medium">Order:</span> {returnRequest.orderNumber}
                        </p>
                        <p>
                          <span className="font-medium">Submitted:</span> {formatReturnDate(returnRequest.requestDate)}
                        </p>
                        <p>
                          <span className="font-medium">Items:</span> {returnRequest.totalItemsCount} item(s)
                        </p>
                        <p>
                          <span className="font-medium">Refund Amount:</span> {formatCurrency(returnRequest.totalRefundAmount)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col sm:flex-row gap-3">
                      <Link
                        to={`/my-account/returns/${returnRequest.id}`}
                        className="btn btn-primary inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>

                      <Link
                        to={`/orders/${returnRequest.orderId}`}
                        className="btn btn-secondary inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg"
                      >
                        View Order
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === 1
                    ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
                    : 'bg-bg-elevated text-text-primary hover:bg-bg-elevated/50 border border-border-subtle'
                }`}
              >
                Previous
              </button>

              {/* Page numbers */}
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    currentPage === page
                      ? 'bg-cyan-400 text-bg-primary'
                      : 'bg-bg-elevated text-text-primary hover:bg-bg-elevated/50 border border-border-subtle'
                  }`}
                >
                  {page}
                </button>
              ))}

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  currentPage === pagination.pages
                    ? 'bg-bg-elevated text-text-muted cursor-not-allowed'
                    : 'bg-bg-elevated text-text-primary hover:bg-bg-elevated/50 border border-border-subtle'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {loading && currentPage > 1 && (
          <div className="mt-8 text-center">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnHistoryPage;