import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import { vi } from 'vitest';
import ShippingSettings from '../ShippingSettings';

// Mock fetch globally (ShippingSettings uses raw fetch against API_BASE_URL).
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (ShippingSettings reads 'adminToken').
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

const jsonResponse = (data, { ok = true, status = 200, contentType = 'application/json' } = {}) => ({
  ok,
  status,
  statusText: ok ? 'OK' : 'Error',
  url: 'http://localhost:5000/api/admin/settings/shipping',
  headers: { get: vi.fn(() => contentType) },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

const sampleMethod = (over = {}) => ({
  _id: 'ship-1',
  name: 'Standard Delivery',
  code: 'STANDARD',
  description: 'Standard delivery',
  baseCost: 4.99,
  estimatedDeliveryDays: { min: 2, max: 4 },
  formattedDelivery: '2-4 days',
  isActive: true,
  ...over
});

describe('ShippingSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('adminToken', 'admin-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<ShippingSettings onMessage={vi.fn()} />);
    expect(screen.getByText('Loading shipping methods...')).toBeInTheDocument();
  });

  it('loads shipping methods on mount and renders them as table rows', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { shippingMethods: [sampleMethod()] }
      })
    );

    render(<ShippingSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Standard Delivery')).toBeInTheDocument();
    });
    // Base cost formatted to 2dp
    expect(screen.getByText('£4.99')).toBeInTheDocument();
    // Status badge for active method
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/settings/shipping',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' })
      })
    );
  });

  it('shows the empty-state row when no shipping methods are returned', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { shippingMethods: [] } })
    );

    render(<ShippingSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/No shipping methods found/i)).toBeInTheDocument();
    });
  });

  it('reports a load error via onMessage when the fetch fails', async () => {
    const onMessage = vi.fn();
    mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

    render(<ShippingSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load shipping methods'),
        'error'
      );
    });
  });

  it('opens the Add Shipping Method modal and validates required fields on submit', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { shippingMethods: [] } })
    );

    const onMessage = vi.fn();
    render(<ShippingSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Shipping Method', { selector: 'button' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Add Shipping Method', { selector: 'button' }));

    // Modal heading present (Add form)
    expect(screen.getAllByText('Add Shipping Method').length).toBeGreaterThan(0);

    // Submit empty form -> validation errors, no POST
    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Code is required')).toBeInTheDocument();
    });
    expect(onMessage).toHaveBeenCalledWith('Please fix the validation errors', 'error');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('creates a shipping method via POST when valid form is submitted', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { shippingMethods: [] } })
    );

    const onMessage = vi.fn();
    render(<ShippingSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Shipping Method', { selector: 'button' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Add Shipping Method', { selector: 'button' }));

    // Fill required fields: name + code (defaults already satisfy the rest)
    fireEvent.change(screen.getByPlaceholderText('Standard Delivery'), {
      target: { value: 'Express Delivery' }
    });
    fireEvent.change(screen.getByPlaceholderText('STANDARD'), {
      target: { value: 'express' } // component upper-cases it
    });

    // POST response + reload response
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { shippingMethods: [] } })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { shippingMethods: [] } })
    );

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const postCall = mockFetch.mock.calls[1];
    expect(postCall[1].method).toBe('POST');
    expect(JSON.parse(postCall[1].body).name).toBe('Express Delivery');
    expect(JSON.parse(postCall[1].body).code).toBe('EXPRESS');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Shipping method created successfully');
    });
  });

  it('deactivates a shipping method via the Deactivate button', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        success: true,
        data: { shippingMethods: [sampleMethod()] }
      })
    );

    const onMessage = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<ShippingSettings onMessage={onMessage} />);

    await waitFor(() => expect(screen.getByText('Deactivate')).toBeInTheDocument());

    // DELETE response + reload response
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: {} })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { shippingMethods: [] } })
    );

    fireEvent.click(screen.getByText('Deactivate'));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const deleteCall = mockFetch.mock.calls[1];
    expect(deleteCall[1].method).toBe('DELETE');
    expect(deleteCall[0]).toContain('/ship-1');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Shipping method deactivated successfully');
    });
  });
});
