import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllFlashOrders, isAdminAuthenticated, formatCurrency } from '../services/adminService';
import Pagination from '../components/Pagination';

const AdminFlashOrdersListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});

  // Filter and sort state
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: 'all',
    customerQuery: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Manage Flash Orders - Admin Dashboard';

    // Check authentication
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }

    loadOrders();
  }, [navigate, filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getAllFlashOrders(filters);
      setOrders(response.data.orders);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load flash orders');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleSortChange = (sortBy) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: newSortOrder,
      page: 1
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: 'all',
      customerQuery: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
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

  const getSortIcon = (column) => {
    if (filters.sortBy !== column) {
      return (
        <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (filters.sortOrder === 'asc') {
      return (
        <svg className="w-4 h-4 ml-1 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4 ml-1 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8V20m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading flash orders...</p>
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
                to="/admin"
                className="text-cyan-400 hover:text-cyan-300 mr-2"
              >
                ← Back to Dashboard
              </Link>
              <span className="text-text-muted">/</span>
              <span className="ml-2 text-text-primary font-medium">Manage Flash Orders</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-text-primary">Flash Orders</h1>
          <p className="text-text-secondary mt-1">
            Manage GrapheneOS flashing service orders
          </p>
        </div>

        {/* Filters */}
        <div className="bg-bg-card p-6 rounded-lg border border-border-subtle mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <option value="all">All Statuses</option>
                <option value="Awaiting_Payment">Awaiting Payment</option>
                <option value="Paid">Paid</option>
                <option value="Device_Received">Device Received</option>
                <option value="Flashing_In_Progress">Flashing In Progress</option>
                <option value="Shipped_Back">Shipped Back</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            {/* Search Filter */}
            <div>
              <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.customerQuery}
                onChange={(e) => handleFilterChange('customerQuery', e.target.value)}
                placeholder="Email, order number..."
                className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>

            <div>
              <label className="block text-sm font-heading font-semibold text-text-primary uppercase tracking-wider mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 bg-bg-elevated border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={clearFilters}
              className="text-sm text-text-secondary hover:text-cyan-400 transition-colors"
            >
              Clear Filters
            </button>
            <div className="text-sm text-text-secondary">
              {pagination.total || 0} orders found
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-bg-card rounded-lg border border-border-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-bg-elevated border-b border-border-subtle">
                <tr>
                  <th
                    onClick={() => handleSortChange('orderNumber')}
                    className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider cursor-pointer hover:text-cyan-400"
                  >
                    Order Number {getSortIcon('orderNumber')}
                  </th>
                  <th
                    onClick={() => handleSortChange('customerEmail')}
                    className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider cursor-pointer hover:text-cyan-400"
                  >
                    Customer {getSortIcon('customerEmail')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider">
                    Device
                  </th>
                  <th
                    onClick={() => handleSortChange('orderStatus')}
                    className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider cursor-pointer hover:text-cyan-400"
                  >
                    Status {getSortIcon('orderStatus')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider">
                    Payment
                  </th>
                  <th
                    onClick={() => handleSortChange('totalPrice')}
                    className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider cursor-pointer hover:text-cyan-400"
                  >
                    Total {getSortIcon('totalPrice')}
                  </th>
                  <th
                    onClick={() => handleSortChange('createdAt')}
                    className="px-6 py-3 text-left text-xs font-heading font-semibold text-text-primary uppercase tracking-wider cursor-pointer hover:text-cyan-400"
                  >
                    Created {getSortIcon('createdAt')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-heading font-semibold text-text-primary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-bg-hover transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-cyan-400">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">{order.returnAddress?.fullName || 'N/A'}</div>
                      <div className="text-xs text-text-secondary">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-primary">{order.pixelModel}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.orderStatus)}`}>
                        {formatStatus(order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-text-primary">{formatCurrency(order.totalPrice)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-text-secondary">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/admin/flash-orders/${order._id}`}
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-text-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-text-secondary">No flash orders found</p>
              <p className="text-sm text-text-muted mt-1">Try adjusting your filters or check back later</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminFlashOrdersListPage;
