import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAdminToken,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllFlashOrders,
  getFlashOrderById,
  updateFlashOrderStatus,
  getFlashOrderStats,
  getSalesReport,
  getProductPerformanceReport,
  getCustomerReport,
  getInventoryReport
} from '../adminService';

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    removeItem: vi.fn(key => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location (adminLogout redirects here on 401/403)
delete window.location;
window.location = { href: '' };

const TOKEN = 'valid-admin-token';

// Build a fetch response
const res = (data, { ok = true, status = 200 } = {}) => ({
  ok,
  status,
  json: async () => data
});

describe('adminService - uncovered functions (gaps)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('adminToken', TOKEN);
    window.location.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAdminToken', () => {
    it('returns the stored admin token', () => {
      expect(getAdminToken()).toBe(TOKEN);
    });

    it('returns null when no token set', () => {
      localStorageMock.removeItem('adminToken');
      expect(getAdminToken()).toBeNull();
    });
  });

  describe('getAllOrders', () => {
    it('fetches orders with default pagination/sort params', async () => {
      const mockData = { success: true, data: [], pagination: { page: 1, limit: 20 } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getAllOrders();

      const [url, opts] = fetch.mock.calls[0];
      expect(url).toContain('http://localhost:5000/api/admin/orders?');
      expect(url).toContain('page=1');
      expect(url).toContain('limit=20');
      expect(url).toContain('sortBy=createdAt');
      expect(url).toContain('sortOrder=desc');
      expect(opts.method).toBe('GET');
      expect(opts.headers.Authorization).toBe(`Bearer ${TOKEN}`);
      expect(result).toEqual(mockData);
    });

    it('appends optional filters when provided', async () => {
      fetch.mockResolvedValueOnce(res({ success: true }));

      await getAllOrders({
        status: 'pending',
        customerQuery: 'alice',
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        page: 2,
        limit: 5
      });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('status=pending');
      expect(url).toContain('customerQuery=alice');
      expect(url).toContain('startDate=2026-01-01');
      expect(url).toContain('endDate=2026-06-30');
      expect(url).toContain('page=2');
      expect(url).toContain('limit=5');
    });

    it('omits status param when status is "all"', async () => {
      fetch.mockResolvedValueOnce(res({ success: true }));

      await getAllOrders({ status: 'all' });

      const url = fetch.mock.calls[0][0];
      expect(url).not.toContain('status=');
    });

    it('throws when no auth token', async () => {
      localStorageMock.removeItem('adminToken');

      await expect(getAllOrders()).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Failed' }, { ok: false, status: 500 }));

      await expect(getAllOrders()).rejects.toThrow('Failed');
    });

    it('logs out and redirects on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));

      await expect(getAllOrders()).rejects.toThrow('Unauthorized');

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('adminToken');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getOrderById', () => {
    it('throws when orderId missing', async () => {
      await expect(getOrderById()).rejects.toThrow('Order ID is required');
    });

    it('fetches a single order by id', async () => {
      const mockData = { success: true, data: { _id: 'ord1' } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getOrderById('ord1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/orders/ord1',
        expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ Authorization: `Bearer ${TOKEN}` }) })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getOrderById('ord1')).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Not found' }, { ok: false, status: 404 }));
      await expect(getOrderById('ord1')).rejects.toThrow('Not found');
    });

    it('logs out on 403', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Forbidden' }, { ok: false, status: 403 }));
      await expect(getOrderById('ord1')).rejects.toThrow('Forbidden');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('updateOrderStatus', () => {
    it('throws when orderId missing', async () => {
      await expect(updateOrderStatus()).rejects.toThrow('Order ID is required');
    });

    it('PUTs status update', async () => {
      const mockData = { success: true };
      fetch.mockResolvedValueOnce(res(mockData));
      const statusData = { status: 'shipped' };

      const result = await updateOrderStatus('ord1', statusData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/orders/ord1/status',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(statusData) })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(updateOrderStatus('ord1', { status: 'x' })).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Bad status' }, { ok: false, status: 400 }));
      await expect(updateOrderStatus('ord1', { status: 'x' })).rejects.toThrow('Bad status');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(updateOrderStatus('ord1', { status: 'x' })).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getProducts (admin)', () => {
    it('fetches products with no params (no query string)', async () => {
      const mockData = { success: true, data: [] };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getProducts();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/products',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('builds query string from provided params, skipping empties', async () => {
      fetch.mockResolvedValueOnce(res({ success: true }));

      await getProducts({ category: 'phones', page: 2, skip: '', ignore: null, omit: undefined });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('category=phones');
      expect(url).toContain('page=2');
      expect(url).not.toContain('skip=');
      expect(url).not.toContain('ignore=');
      expect(url).not.toContain('omit=');
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getProducts()).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 500 }));
      await expect(getProducts()).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getProducts()).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getProductById', () => {
    it('fetches a product by id', async () => {
      const mockData = { success: true, data: { _id: 'prod1' } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getProductById('prod1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/products/prod1',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getProductById('prod1')).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'missing' }, { ok: false, status: 404 }));
      await expect(getProductById('prod1')).rejects.toThrow('missing');
    });

    it('logs out on 403', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Forbidden' }, { ok: false, status: 403 }));
      await expect(getProductById('prod1')).rejects.toThrow('Forbidden');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('createProduct', () => {
    it('POSTs JSON product data', async () => {
      const mockData = { success: true, data: { _id: 'newprod' } };
      fetch.mockResolvedValueOnce(res(mockData));
      const product = { name: 'Pixel 9', price: 899 };

      const result = await createProduct(product);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/products',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(product)
        })
      );
      expect(result).toEqual(mockData);
    });

    it('POSTs FormData without setting Content-Type', async () => {
      const formData = new FormData();
      formData.append('name', 'Pixel');
      fetch.mockResolvedValueOnce(res({ success: true }));

      await createProduct(formData);

      const opts = fetch.mock.calls[0][1];
      expect(opts.body).toBe(formData);
      expect(opts.headers['Content-Type']).toBeUndefined();
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(createProduct({})).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'validation' }, { ok: false, status: 400 }));
      await expect(createProduct({})).rejects.toThrow('validation');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(createProduct({})).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('updateProduct', () => {
    it('PUTs JSON product data', async () => {
      const mockData = { success: true };
      fetch.mockResolvedValueOnce(res(mockData));
      const product = { name: 'Updated' };

      const result = await updateProduct('prod1', product);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/products/prod1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(product)
        })
      );
      expect(result).toEqual(mockData);
    });

    it('PUTs FormData without setting Content-Type', async () => {
      const formData = new FormData();
      fetch.mockResolvedValueOnce(res({ success: true }));

      await updateProduct('prod1', formData);

      const opts = fetch.mock.calls[0][1];
      expect(opts.body).toBe(formData);
      expect(opts.headers['Content-Type']).toBeUndefined();
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(updateProduct('prod1', {})).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 400 }));
      await expect(updateProduct('prod1', {})).rejects.toThrow('fail');
    });

    it('logs out on 403', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Forbidden' }, { ok: false, status: 403 }));
      await expect(updateProduct('prod1', {})).rejects.toThrow('Forbidden');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getAllUsers', () => {
    it('fetches users with no params', async () => {
      const mockData = { success: true, data: [] };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getAllUsers();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('builds query string from params, skipping empties', async () => {
      fetch.mockResolvedValueOnce(res({ success: true }));

      await getAllUsers({ role: 'admin', page: 3, empty: '', nul: null, undef: undefined });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('role=admin');
      expect(url).toContain('page=3');
      expect(url).not.toContain('empty=');
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getAllUsers()).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 500 }));
      await expect(getAllUsers()).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getAllUsers()).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getUserById', () => {
    it('fetches a user by id', async () => {
      const mockData = { success: true, data: { _id: 'u1' } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getUserById('u1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/u1',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getUserById('u1')).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'missing' }, { ok: false, status: 404 }));
      await expect(getUserById('u1')).rejects.toThrow('missing');
    });

    it('logs out on 403', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Forbidden' }, { ok: false, status: 403 }));
      await expect(getUserById('u1')).rejects.toThrow('Forbidden');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('updateUserStatus', () => {
    it('PUTs user status update', async () => {
      const mockData = { success: true };
      fetch.mockResolvedValueOnce(res(mockData));
      const statusData = { isActive: false };

      const result = await updateUserStatus('u1', statusData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/users/u1/status',
        expect.objectContaining({ method: 'PUT', body: JSON.stringify(statusData) })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(updateUserStatus('u1', {})).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 400 }));
      await expect(updateUserStatus('u1', {})).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(updateUserStatus('u1', {})).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getAllFlashOrders', () => {
    it('fetches flash orders with default params', async () => {
      const mockData = { success: true, data: [] };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getAllFlashOrders();

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('http://localhost:5000/api/admin/flash-orders?');
      expect(url).toContain('sortBy=createdAt');
      expect(result).toEqual(mockData);
    });

    it('appends optional filters', async () => {
      fetch.mockResolvedValueOnce(res({ success: true }));

      await getAllFlashOrders({ status: 'pending', customerQuery: 'bob', startDate: 's', endDate: 'e' });

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('status=pending');
      expect(url).toContain('customerQuery=bob');
      expect(url).toContain('startDate=s');
      expect(url).toContain('endDate=e');
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getAllFlashOrders()).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 500 }));
      await expect(getAllFlashOrders()).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getAllFlashOrders()).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getFlashOrderById', () => {
    it('fetches a flash order by id', async () => {
      const mockData = { success: true, data: { _id: 'fo1' } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getFlashOrderById('fo1');

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/flash-orders/fo1',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getFlashOrderById('fo1')).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'missing' }, { ok: false, status: 404 }));
      await expect(getFlashOrderById('fo1')).rejects.toThrow('missing');
    });

    it('logs out on 403', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Forbidden' }, { ok: false, status: 403 }));
      await expect(getFlashOrderById('fo1')).rejects.toThrow('Forbidden');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('updateFlashOrderStatus', () => {
    it('PATCHes flash order status update', async () => {
      const mockData = { success: true };
      fetch.mockResolvedValueOnce(res(mockData));
      const statusData = { status: 'completed' };

      const result = await updateFlashOrderStatus('fo1', statusData);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/flash-orders/fo1/status',
        expect.objectContaining({ method: 'PATCH', body: JSON.stringify(statusData) })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(updateFlashOrderStatus('fo1', {})).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 400 }));
      await expect(updateFlashOrderStatus('fo1', {})).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(updateFlashOrderStatus('fo1', {})).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getFlashOrderStats', () => {
    it('fetches flash order statistics', async () => {
      const mockData = { success: true, data: { total: 10 } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getFlashOrderStats();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/flash-orders/stats',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getFlashOrderStats()).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 500 }));
      await expect(getFlashOrderStats()).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getFlashOrderStats()).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getSalesReport', () => {
    it('fetches sales report with date range', async () => {
      const mockData = { success: true, data: { totalRevenue: 1000 } };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getSalesReport('2026-01-01', '2026-06-30');

      const url = fetch.mock.calls[0][0];
      expect(url).toContain('http://localhost:5000/api/admin/reports/sales-summary?');
      expect(url).toContain('startDate=2026-01-01');
      expect(url).toContain('endDate=2026-06-30');
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getSalesReport('s', 'e')).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 500 }));
      await expect(getSalesReport('s', 'e')).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getSalesReport('s', 'e')).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getProductPerformanceReport', () => {
    it('fetches product performance report', async () => {
      const mockData = { success: true, data: [] };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getProductPerformanceReport('s', 'e');

      expect(fetch.mock.calls[0][0]).toContain('/admin/reports/product-performance');
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getProductPerformanceReport('s', 'e')).rejects.toThrow('No authentication token found');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getProductPerformanceReport('s', 'e')).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getCustomerReport', () => {
    it('fetches customer report', async () => {
      const mockData = { success: true, data: {} };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getCustomerReport('s', 'e');

      expect(fetch.mock.calls[0][0]).toContain('/admin/reports/customer-acquisition');
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getCustomerReport('s', 'e')).rejects.toThrow('No authentication token found');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getCustomerReport('s', 'e')).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });

  describe('getInventoryReport', () => {
    it('fetches inventory report', async () => {
      const mockData = { success: true, data: {} };
      fetch.mockResolvedValueOnce(res(mockData));

      const result = await getInventoryReport();

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/admin/reports/inventory-summary',
        expect.objectContaining({ method: 'GET' })
      );
      expect(result).toEqual(mockData);
    });

    it('throws when no token', async () => {
      localStorageMock.removeItem('adminToken');
      await expect(getInventoryReport()).rejects.toThrow('No authentication token found');
    });

    it('throws on non-ok response', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'fail' }, { ok: false, status: 500 }));
      await expect(getInventoryReport()).rejects.toThrow('fail');
    });

    it('logs out on 401', async () => {
      fetch.mockResolvedValueOnce(res({ error: 'Unauthorized' }, { ok: false, status: 401 }));
      await expect(getInventoryReport()).rejects.toThrow('Unauthorized');
      expect(window.location.href).toBe('/admin/login');
    });
  });
});
