import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import { vi } from 'vitest';
import PaymentSettings from '../PaymentSettings';

// Mock fetch globally (PaymentSettings uses raw fetch against API_BASE_URL).
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (PaymentSettings reads 'adminToken').
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
  url: 'http://localhost:5000/api/admin/settings/payments',
  headers: { get: vi.fn(() => contentType) },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

const sampleGateway = (over = {}) => ({
  _id: 'gw-1',
  name: 'PayPal',
  code: 'PAYPAL',
  type: 'digital_wallet',
  provider: 'paypal',
  isEnabled: true,
  isTestMode: true,
  isProperlyConfigured: true,
  supportedCurrencies: ['GBP', 'USD'],
  supportedCountries: ['GB'],
  description: 'Pay with PayPal',
  ...over
});

describe('PaymentSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('adminToken', 'admin-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    // Never-resolving fetch keeps loading true
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<PaymentSettings onMessage={vi.fn()} />);
    expect(screen.getByText('Loading payment gateways...')).toBeInTheDocument();
  });

  it('loads payment gateways on mount and renders them as cards', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [sampleGateway()] } })
    );

    render(<PaymentSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('PayPal')).toBeInTheDocument();
    });
    // Provider and type render in the card detail rows
    expect(screen.getByText('paypal')).toBeInTheDocument();
    expect(screen.getAllByText(/test/i).length).toBeGreaterThan(0);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/settings/payments',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' })
      })
    );
  });

  it('shows the empty-state message when no gateways are returned', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [] } })
    );

    render(<PaymentSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/No payment gateways found/i)
      ).toBeInTheDocument();
    });
  });

  it('reports a load error via onMessage when the fetch fails', async () => {
    const onMessage = vi.fn();
    mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

    render(<PaymentSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Failed to load payment gateways', 'error');
    });
  });

  it('opens the Add Payment Gateway modal and validates required fields on submit', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [] } })
    );

    const onMessage = vi.fn();
    render(<PaymentSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Payment Gateway', { selector: 'button' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Add Payment Gateway', { selector: 'button' }));

    // Modal heading appears (Add form)
    expect(screen.getAllByText('Add Payment Gateway').length).toBeGreaterThan(0);

    // Submit empty form -> validation error, no POST
    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Code is required')).toBeInTheDocument();
    });
    expect(onMessage).toHaveBeenCalledWith('Please fix the validation errors', 'error');
    // Only the initial GET should have happened
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('creates a gateway via POST when valid form is submitted', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [] } })
    );

    const onMessage = vi.fn();
    render(<PaymentSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Payment Gateway', { selector: 'button' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Add Payment Gateway', { selector: 'button' }));

    // Fill required fields
    fireEvent.change(screen.getByPlaceholderText('PayPal'), {
      target: { value: 'Stripe Card' }
    });
    fireEvent.change(screen.getByPlaceholderText('PAYPAL'), {
      target: { value: 'stripe_card' } // lowercased; component upper-cases it
    });

    // POST response + reload response
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [] } })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [] } })
    );

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const postCall = mockFetch.mock.calls[1];
    expect(postCall[1].method).toBe('POST');
    expect(JSON.parse(postCall[1].body).name).toBe('Stripe Card');
    expect(JSON.parse(postCall[1].body).code).toBe('STRIPE_CARD');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Payment gateway created successfully');
    });
  });

  it('toggles a gateway enabled/disabled via the card toggle button', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [sampleGateway()] } })
    );

    const onMessage = vi.fn();
    render(<PaymentSettings onMessage={onMessage} />);

    await waitFor(() => expect(screen.getByText('Disable')).toBeInTheDocument());

    // Toggle response, then reload response
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: {} })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { paymentGateways: [sampleGateway()] } })
    );

    fireEvent.click(screen.getByText('Disable'));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const toggleCall = mockFetch.mock.calls[1];
    expect(toggleCall[1].method).toBe('PUT');
    expect(toggleCall[0]).toContain('/toggle');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Payment gateway disabled successfully');
    });
  });
});
