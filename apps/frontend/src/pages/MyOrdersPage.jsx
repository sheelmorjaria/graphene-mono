import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserOrders, formatCurrency, getStatusColor } from '../services/orderService';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('orderDate');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    loadOrders();
  }, [currentPage, sortBy, sortOrder]);

  useEffect(() => {
    document.title = 'My Orders - GrapheneOS Store';
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getUserOrders({
        page: currentPage,
        limit: 10,
        sortBy,
        sortOrder
      });
      
      setOrders(response.data.orders || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc'); // Default to descending for new field
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // Previous button
    if (pagination.hasPrevPage) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="pagination-btn"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (pagination.hasNextPage) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="pagination-btn"
        >
          Next
        </button>
      );
    }

    return (
      <div className="pagination">
        {pages}
      </div>
    );
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="container mx-auto px-4 py-8">
          <div className="loading">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="container mx-auto px-4 py-8">
        <div className="page-header">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2 uppercase tracking-wider">My Orders</h1>
          <p className="text-text-secondary mb-6">
            View and track all your past orders
          </p>
        </div>

        {error && (
          <div className="error-message bg-red-900/30 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-6" role="alert">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="h-16 w-16 mx-auto mb-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="text-2xl font-semibold text-text-primary mb-4 uppercase tracking-wider">No Orders Yet</h2>
              <p className="text-text-secondary mb-8">
                You haven't placed any orders yet. Start shopping to see your order history here.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="orders-summary mb-6">
              <p className="text-text-secondary">
                Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                {Math.min(currentPage * pagination.limit, pagination.totalOrders)} of{' '}
                {pagination.totalOrders} orders
              </p>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block card card-glow overflow-hidden">
              <table className="min-w-full divide-y divide-border-default">
                <thead className="bg-bg-elevated">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-bg-muted"
                      onClick={() => handleSortChange('orderNumber')}
                    >
                      Order # {getSortIcon('orderNumber')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-bg-muted"
                      onClick={() => handleSortChange('orderDate')}
                    >
                      Date {getSortIcon('orderDate')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-bg-muted"
                      onClick={() => handleSortChange('status')}
                    >
                      Status {getSortIcon('status')}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-bg-muted"
                      onClick={() => handleSortChange('totalAmount')}
                    >
                      Total {getSortIcon('totalAmount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-bg-elevated divide-y divide-border-default">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary font-mono">
                          {order.orderNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-primary">
                          {order.formattedDate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: getStatusColor(order.status) }}
                        >
                          {order.statusDisplay}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-primary font-mono">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary">
                          {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="card card-glow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-text-primary font-mono">
                        {order.orderNumber}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {order.formattedDate}
                      </div>
                    </div>
                    <span
                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.statusDisplay}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-text-primary font-mono">
                        {formatCurrency(order.totalAmount)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <Link
                      to={`/orders/${order._id}`}
                      className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;