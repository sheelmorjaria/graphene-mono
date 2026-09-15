import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllDevices, receiveDevice, getProducts, isAdminAuthenticated } from '../services/adminService.js';

const STATUS_BADGE = {
  in_stock: 'bg-green-100 text-green-800',
  allocated: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  returned: 'bg-gray-100 text-gray-800',
  quarantined: 'bg-red-100 text-red-800'
};

// Device Management (IMEI tracking): list + receive-stock. USB barcode
// scanners type digits + Enter, so scan inputs are autoFocus and submit on
// Enter. Allocation happens on the order page; verification on the return
// page.
const AdminDevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [imeiFilter, setImeiFilter] = useState('');
  const [page, setPage] = useState(1);

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [receiveForm, setReceiveForm] = useState({ imei: '', serialNumber: '', productId: '', variationId: '' });
  const [receiveError, setReceiveError] = useState(null);
  const [receiveLoading, setReceiveLoading] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      window.location.href = '/admin/login';
      return;
    }
    loadDevices();
  }, [page, statusFilter]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const filters = { page, limit: 20 };
      if (statusFilter) filters.status = statusFilter;
      if (imeiFilter.trim()) filters.imei = imeiFilter.trim();
      const response = await getAllDevices(filters);
      setDevices(response.data.devices);
      setPagination(response.data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await getProducts({ limit: 100, status: 'active' });
      setProducts(response.data.products || []);
    } catch (err) {
      setReceiveError('Could not load products: ' + err.message);
    }
  };

  const openReceiveModal = () => {
    setReceiveForm({ imei: '', serialNumber: '', productId: '', variationId: '' });
    setReceiveError(null);
    setShowReceiveModal(true);
    if (products.length === 0) {
      loadProducts();
    }
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{15}$/.test(receiveForm.imei.trim())) {
      setReceiveError('IMEI must be exactly 15 digits');
      return;
    }
    if (!receiveForm.productId) {
      setReceiveError('Select a product');
      return;
    }

    try {
      setReceiveLoading(true);
      setReceiveError(null);
      await receiveDevice({
        imei: receiveForm.imei.trim(),
        serialNumber: receiveForm.serialNumber.trim() || undefined,
        productId: receiveForm.productId,
        variationId: receiveForm.variationId || undefined
      });
      setSuccess(`Device ${receiveForm.imei.trim()} received into stock`);
      setShowReceiveModal(false);
      loadDevices();
    } catch (err) {
      setReceiveError(err.message);
    } finally {
      setReceiveLoading(false);
    }
  };

  const selectedProduct = products.find((p) => String(p._id) === String(receiveForm.productId));

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="bg-bg-card shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link to="/admin" className="text-cyan-400 hover:text-cyan-300">← Back to Dashboard</Link>
            <span className="text-gray-600">/</span>
            <span>Device Management</span>
          </div>
          <button
            type="button"
            onClick={openReceiveModal}
            data-testid="receive-device-button"
            className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 transition-colors"
          >
            + Receive Device
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg" data-testid="devices-error">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg" data-testid="devices-success">
            {success}
          </div>
        )}

        <div className="bg-bg-card rounded-lg border border-gray-800 p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label htmlFor="device-status-filter" className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              id="device-status-filter"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              <option value="in_stock">In stock</option>
              <option value="allocated">Allocated</option>
              <option value="shipped">Shipped</option>
              <option value="returned">Returned</option>
              <option value="quarantined">Quarantined</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label htmlFor="device-imei-filter" className="block text-xs text-gray-400 mb-1">IMEI lookup</label>
            <input
              id="device-imei-filter"
              type="text"
              inputMode="numeric"
              placeholder="Scan or type a 15-digit IMEI, press Enter"
              value={imeiFilter}
              onChange={(e) => setImeiFilter(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); loadDevices(); } }}
              className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => { setPage(1); loadDevices(); }}
            className="px-4 py-2 rounded-lg border border-cyan-500 text-cyan-400 hover:bg-cyan-500/10 text-sm"
          >
            Search
          </button>
        </div>

        <div className="bg-bg-card rounded-lg border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 text-sm text-gray-400">
            {loading ? 'Loading devices…' : `${pagination.total} device(s)`}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="devices-table">
              <thead className="bg-bg-primary text-left text-xs text-gray-400 uppercase">
                <tr>
                  <th className="px-4 py-3">IMEI</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Received</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device._id} className="border-t border-gray-800">
                    <td className="px-4 py-3 font-mono">{device.imei}</td>
                    <td className="px-4 py-3">
                      {device.productId?.name || device.productName || '—'}
                      {device.sku ? <span className="block text-xs text-gray-500">{device.sku}</span> : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_BADGE[device.status] || 'bg-gray-100 text-gray-800'}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {device.orderId ? (
                        <Link to={`/admin/orders/${device.orderId._id || device.orderId}`} className="text-cyan-400 hover:text-cyan-300 font-mono text-xs">
                          {device.orderNumber || 'View order'}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {device.createdAt ? new Date(device.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && devices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No devices yet — receive your first device to start IMEI tracking.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {pagination.pages > 1 && (
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between text-sm">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-gray-400">Page {pagination.page} of {pagination.pages}</span>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-gray-700 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>

      {showReceiveModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50" data-testid="receive-modal">
          <div className="bg-bg-card rounded-lg border border-gray-800 max-w-md w-full p-6">
            <h2 className="text-lg font-semibold mb-1">Receive Device</h2>
            <p className="text-xs text-gray-400 mb-4">Scan the IMEI with your USB scanner — it types the digits and presses Enter.</p>
            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div>
                <label htmlFor="receive-imei" className="block text-xs text-gray-400 mb-1">IMEI (15 digits)</label>
                <input
                  id="receive-imei"
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={receiveForm.imei}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, imei: e.target.value }))}
                  className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 font-mono"
                  placeholder="123456789012345"
                />
              </div>
              <div>
                <label htmlFor="receive-serial" className="block text-xs text-gray-400 mb-1">Serial number (optional)</label>
                <input
                  id="receive-serial"
                  type="text"
                  value={receiveForm.serialNumber}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, serialNumber: e.target.value }))}
                  className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label htmlFor="receive-product" className="block text-xs text-gray-400 mb-1">Product</label>
                <select
                  id="receive-product"
                  value={receiveForm.productId}
                  onChange={(e) => setReceiveForm((f) => ({ ...f, productId: e.target.value, variationId: '' }))}
                  className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2"
                >
                  <option value="">Select a product…</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
              {selectedProduct?.variations?.length > 0 && (
                <div>
                  <label htmlFor="receive-variation" className="block text-xs text-gray-400 mb-1">Variation (optional)</label>
                  <select
                    id="receive-variation"
                    value={receiveForm.variationId}
                    onChange={(e) => setReceiveForm((f) => ({ ...f, variationId: e.target.value }))}
                    className="w-full bg-bg-primary border border-gray-700 rounded-lg px-3 py-2"
                  >
                    <option value="">Not specified</option>
                    {selectedProduct.variations.map((v) => (
                      <option key={v._id} value={v._id}>
                        {[v.condition, v.color, v.storage].filter(Boolean).join(' · ')} — {v.sku}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {receiveError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm" data-testid="receive-error">
                  {receiveError}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReceiveModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-700 hover:bg-bg-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiveLoading}
                  className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-medium hover:bg-cyan-400 disabled:opacity-50"
                  data-testid="receive-submit"
                >
                  {receiveLoading ? 'Receiving…' : 'Receive into stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDevicesPage;
