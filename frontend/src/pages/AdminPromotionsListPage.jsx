import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCheck, FaTimes, FaFilter, FaSort } from 'react-icons/fa';
import promotionService from '../services/promotionService';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const AdminPromotionsListPage = () => {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPromotions, setTotalPromotions] = useState(0);
  const [deletingPromoId, setDeletingPromoId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchPromotions();
  }, [currentPage, searchTerm, typeFilter, statusFilter, sortBy, sortOrder]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await promotionService.getAllPromotions({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        type: typeFilter,
        status: statusFilter,
        sortBy,
        sortOrder
      });

      setPromotions(response.promotions);
      setTotalPages(response.totalPages);
      setTotalPromotions(response.totalPromotions);
    } catch (err) {
      setError(err.message || 'Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleStatusUpdate = async (promoId, newStatus) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [promoId]: true }));
      await promotionService.updatePromotionStatus(promoId, newStatus);
      await fetchPromotions();
    } catch (err) {
      setError(err.message || 'Failed to update promotion status');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [promoId]: false }));
    }
  };

  const handleDelete = async (promoId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      setDeletingPromoId(promoId);
      await promotionService.deletePromotion(promoId);
      await fetchPromotions();
    } catch (err) {
      setError(err.message || 'Failed to delete promotion');
    } finally {
      setDeletingPromoId(null);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatValue = (type, value) => {
    switch (type) {
      case 'percentage':
        return `${value}%`;
      case 'fixed_amount':
        return `£${value.toFixed(2)}`;
      case 'free_shipping':
        return 'Free Shipping';
      default:
        return value;
    }
  };

  const getStatusBadgeClass = (status, isExpired) => {
    if (isExpired) return 'bg-gray-100 text-gray-800';
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !promotions.length) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Promotions</h1>
        <button
          onClick={() => navigate('/admin/promotions/new')}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <FaPlus />
          Add New Promotion
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 pr-3 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={typeFilter}
            onChange={handleTypeFilter}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="percentage">Percentage Off</option>
            <option value="fixed_amount">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
          </select>

          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
            <option value="expired">Expired</option>
          </select>

          <button
            onClick={() => handleSort(sortBy === 'createdAt' ? 'name' : 'createdAt')}
            className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FaSort />
            Sort by {sortBy === 'createdAt' ? 'Date' : 'Name'}
          </button>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name/Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type & Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valid Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promotions.map((promotion) => (
              <tr key={promotion._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                    <div className="text-sm text-gray-500">{promotion.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {promotion.type === 'percentage' && 'Percentage Off'}
                    {promotion.type === 'fixed_amount' && 'Fixed Amount'}
                    {promotion.type === 'free_shipping' && 'Free Shipping'}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {formatValue(promotion.type, promotion.value)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {promotion.timesUsed} / {promotion.totalUsageLimit || '∞'}
                  </div>
                  <div className="text-sm text-gray-500">
                    Per user: {promotion.perUserUsageLimit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(promotion.startDate)}
                  </div>
                  <div className="text-sm text-gray-500">
                    to {formatDate(promotion.endDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(promotion.displayStatus || promotion.status, promotion.isExpired)}`}>
                    {promotion.isExpired ? 'Expired' : (promotion.displayStatus || promotion.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {!promotion.isExpired && promotion.status !== 'active' && (
                      <button
                        onClick={() => handleStatusUpdate(promotion._id, 'active')}
                        disabled={updatingStatus[promotion._id]}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        title="Activate"
                      >
                        <FaCheck />
                      </button>
                    )}
                    {!promotion.isExpired && promotion.status === 'active' && (
                      <button
                        onClick={() => handleStatusUpdate(promotion._id, 'inactive')}
                        disabled={updatingStatus[promotion._id]}
                        className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                        title="Deactivate"
                      >
                        <FaTimes />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/admin/promotions/${promotion._id}/edit`)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(promotion._id)}
                      disabled={deletingPromoId === promotion._id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {promotions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No promotions found. {searchTerm || typeFilter || statusFilter ? 'Try adjusting your filters.' : 'Create your first promotion!'}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600 text-center">
        Showing {promotions.length} of {totalPromotions} promotions
      </div>
    </div>
  );
};

export default AdminPromotionsListPage;