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
    document.title = 'My Returns - GrapheneOS Store';
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
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSpinner />
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
            <span>My Returns</span>
          </nav>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Returns</h1>
              <p className="text-gray-600 mt-2">Track and manage your return requests</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
              <div className="text-sm text-gray-600 mt-4 sm:mt-0">
                Showing {Math.min((currentPage - 1) * pagination.limit + 1, pagination.total)} - {Math.min(currentPage * pagination.limit, pagination.total)} of {pagination.total} returns
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Return Requests List */}
        {!loading && returnRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">No Return Requests</h2>
            <p className="text-gray-600 mb-8">
              {statusFilter 
                ? `No return requests found with status "${formatReturnStatus(statusFilter)}"`
                : "You haven't submitted any return requests yet."
              }
            </p>
            <Link
              to="/orders"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {returnRequests.map((returnRequest) => (
              <div key={returnRequest.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* Return Request Info */}
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {returnRequest.formattedRequestNumber}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReturnStatusColorClass(returnRequest.status)}`}>
                          {formatReturnStatus(returnRequest.status)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
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
                        className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                      
                      <Link
                        to={`/orders/${returnRequest.orderId}`}
                        className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
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
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
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
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
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
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
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