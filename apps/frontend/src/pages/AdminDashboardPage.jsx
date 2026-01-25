import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboardMetrics, isAdminAuthenticated, adminLogout, formatCurrency, formatNumber, getAdminUser } from '../services/adminService';

const MetricCard = ({ title, value, subtitle, icon, trend, color = 'cyan' }) => {
  const colorClasses = {
    cyan: 'bg-cyan-subtle text-cyan-400 border-cyan-400/30 shadow-glow-cyan',
    matrix: 'bg-matrix-subtle text-matrix-400 border-matrix-400/30 shadow-glow-matrix',
    pink: 'bg-pink-subtle text-pink-400 border-pink-400/30 shadow-glow-pink',
    purple: 'bg-purple-subtle text-purple-400 border-purple-400/30',
    amber: 'bg-amber-subtle text-amber-primary border-amber-primary/30'
  };

  return (
    <div className="group relative bg-bg-card overflow-hidden rounded-lg border border-border-subtle hover:border-border-cyan transition-all duration-300 hover:shadow-glow-cyan">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg border ${colorClasses[color]}`}>
            {icon}
          </div>
          <div className="ml-4 flex-1">
            <p className="text-sm font-heading font-semibold uppercase tracking-wider text-text-secondary truncate">{title}</p>
            <p className="text-2xl font-display font-bold text-cyan-400 font-mono">{value}</p>
            {subtitle && (
              <p className="text-sm text-text-muted mt-1 font-mono">{subtitle}</p>
            )}
            {trend && (
              <div className={`text-sm mt-1 font-mono uppercase tracking-wider ${trend.positive ? 'text-matrix-400' : 'text-pink-400'}`}>
                <span className="inline-block mr-1">{trend.positive ? '▲' : '▼'}</span> {trend.text}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
  );
};

const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const navigate = useNavigate();
  const adminUser = getAdminUser();

  const loadDashboardMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getDashboardMetrics();
      setMetrics(response.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Admin Dashboard - Graphene Security';
    
    // Check authentication
    if (!isAdminAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }

    loadDashboardMetrics();
  }, [navigate, loadDashboardMetrics]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      adminLogout();
    }
  };

  const formatLastUpdated = (date) => {
    if (!date) return '';
    
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-cyan-400/30 border-t-cyan-400 mx-auto mb-4 shadow-glow-cyan"></div>
            <p className="text-text-secondary font-mono uppercase tracking-wider">Initializing Dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-card border-b border-border-subtle relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-400 via-matrix-400 to-cyan-400"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link
                to="/"
                className="text-xl font-display font-bold text-cyan-400 hover:text-matrix-400 transition-colors uppercase tracking-wider"
              >
                Graphene Security
              </Link>
              <span className="ml-2 text-sm text-text-muted font-mono">/admin</span>
            </div>

            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-text-muted font-mono uppercase tracking-wider">
                  Last sync: {formatLastUpdated(lastUpdated)}
                </span>
              )}

              <button
                onClick={loadDashboardMetrics}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-cyan-400/30 text-sm font-mono uppercase tracking-wider rounded-lg text-cyan-400 bg-cyan-subtle hover:bg-cyan-400/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 transition-all duration-200"
              >
                <svg className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>

              <div className="flex items-center space-x-2">
                <div className="text-sm text-text-secondary font-mono">
                  Welcome, <span className="font-semibold text-cyan-400">{adminUser?.firstName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 border border-pink-400/30 text-sm font-mono uppercase tracking-wider rounded-lg text-pink-400 bg-pink-subtle hover:bg-pink-400/10 focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <h1 className="text-3xl font-display font-bold text-text-primary uppercase tracking-wider">Dashboard</h1>
          </div>
          <p className="text-text-secondary font-mono text-sm">
            // System performance metrics and analytics
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-pink-subtle border border-pink-400/30 rounded-lg animate-fadeIn">
            <div className="flex">
              <svg className="w-5 h-5 text-pink-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-sm font-heading font-semibold text-pink-400 uppercase tracking-wider">System Error</h3>
                <p className="text-sm text-pink-400/80 mt-1 font-mono">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics && (
          <div className="space-y-8">
            {/* Order Metrics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h2 className="text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Order Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Orders"
                  value={formatNumber(metrics.orders.total)}
                  subtitle="All time"
                  color="cyan"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Today's Orders"
                  value={formatNumber(metrics.orders.today)}
                  subtitle="Since midnight"
                  color="matrix"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Pending Orders"
                  value={formatNumber(metrics.orders.pending)}
                  subtitle="Requires attention"
                  color="amber"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Awaiting Shipment"
                  value={formatNumber(metrics.orders.awaitingShipment)}
                  subtitle="Ready to ship"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-4a2 2 0 00-2-2H8z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Revenue Metrics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-matrix-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <h2 className="text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Revenue Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  title="Total Revenue"
                  value={formatCurrency(metrics.revenue.total)}
                  subtitle="All time"
                  color="matrix"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  }
                />

                <MetricCard
                  title="Today's Revenue"
                  value={formatCurrency(metrics.revenue.today)}
                  subtitle="Since midnight"
                  color="cyan"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  }
                />

                <MetricCard
                  title="This Week"
                  value={formatCurrency(metrics.revenue.week)}
                  subtitle="Last 7 days"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="This Month"
                  value={formatCurrency(metrics.revenue.month)}
                  subtitle="Current month"
                  color="pink"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Customer Metrics */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h2 className="text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">New Customers</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Today"
                  value={formatNumber(metrics.customers.newToday)}
                  subtitle="New registrations"
                  color="matrix"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="This Week"
                  value={formatNumber(metrics.customers.newWeek)}
                  subtitle="Last 7 days"
                  color="cyan"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                />

                <MetricCard
                  title="This Month"
                  value={formatNumber(metrics.customers.newMonth)}
                  subtitle="Current month"
                  color="purple"
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h2 className="text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Link
                  to="/admin/orders"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-cyan-400/50 hover:shadow-glow-cyan transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-cyan-subtle text-cyan-400 rounded-lg border border-cyan-400/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Manage Orders</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">View and manage customer orders, update status</p>
                  </div>
                </Link>

                <Link
                  to="/admin/returns"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-amber-primary/50 transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-amber-subtle text-amber-primary rounded-lg border border-amber-primary/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m5 14-5-2a2 2 0 00-1.5 0l-5 2V7a2 2 0 012-2h4.5a2 2 0 011.5.65L16 7v8z" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Manage Returns</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">Process return requests and manage refunds</p>
                  </div>
                </Link>

                <Link
                  to="/admin/products"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-matrix-400/50 hover:shadow-glow-matrix transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-matrix-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-matrix-subtle text-matrix-400 rounded-lg border border-matrix-400/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Manage Products</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">Add, edit, and organize product catalog</p>
                  </div>
                </Link>

                <Link
                  to="/admin/categories"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-purple-400/50 transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-purple-subtle text-purple-400 rounded-lg border border-purple-400/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-6H5m14 12H5" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Categories</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">Create and organize product hierarchies</p>
                  </div>
                </Link>


                <Link
                  to="/admin/users"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-pink-400/50 transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-pink-subtle text-pink-400 rounded-lg border border-pink-400/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Manage Users</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">View customer accounts and admin users</p>
                  </div>
                </Link>

                <Link
                  to="/admin/reports"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-cyan-400/50 hover:shadow-glow-cyan transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-cyan-subtle text-cyan-400 rounded-lg border border-cyan-400/30">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">View Reports</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">Sales performance and business analytics</p>
                  </div>
                </Link>

                <Link
                  to="/admin/settings"
                  className="group relative bg-bg-card p-6 rounded-lg border border-border-subtle hover:border-text-muted/50 transition-all duration-300 block"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-text-muted/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-bg-elevated text-text-muted rounded-lg border border-border-subtle">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="ml-4 text-lg font-heading font-semibold text-text-primary uppercase tracking-wider">Settings</h3>
                    </div>
                    <p className="text-text-secondary text-sm font-mono">Configure store, shipping, taxes, payments</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboardPage;