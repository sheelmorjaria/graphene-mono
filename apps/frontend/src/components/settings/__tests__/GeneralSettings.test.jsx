import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import { vi } from 'vitest';
import GeneralSettings from '../GeneralSettings';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage (GeneralSettings reads 'adminToken')
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
  url: 'http://localhost:5000/api/admin/settings/general',
  headers: {
    get: vi.fn(() => contentType)
  },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

const validSettings = {
  storeName: 'Graphene Security',
  storeEmail: 'support@graphene.com',
  storePhone: '+44 20 1234 5678',
  storeAddress: { street: '1 Main St', city: 'London', postalCode: 'E1 1AA', country: 'GB' },
  defaultCurrency: 'GBP',
  defaultLanguage: 'en-gb',
  businessRegistrationNumber: '12345',
  vatNumber: 'GB123',
  timezone: 'Europe/London',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24',
  isMaintenanceMode: false,
  maintenanceMessage: ''
};

describe('GeneralSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('adminToken', 'admin-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders a loading state initially', () => {
    // Never-resolving fetch keeps loading true
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<GeneralSettings onMessage={vi.fn()} />);
    expect(screen.getByText('Loading general settings...')).toBeInTheDocument();
  });

  it('loads settings on mount and populates the form', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: validSettings }));

    render(<GeneralSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Graphene Security')).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue('support@graphene.com')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/settings/general',
      expect.objectContaining({
        headers: expect.objectContaining({ 'Authorization': 'Bearer admin-token' })
      })
    );
  });

  it('calls onMessage with an error when loading fails', async () => {
    const onMessage = vi.fn();
    mockFetch.mockResolvedValueOnce(jsonResponse(
      { error: 'Server boom' },
      { ok: false, status: 500 }
    ));

    render(<GeneralSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.stringContaining('Server boom'),
        'error'
      );
    });
  });

  it('shows validation errors and does not submit when required fields are empty', async () => {
    // Load with empty required fields
    mockFetch.mockResolvedValueOnce(jsonResponse({
      success: true,
      data: { ...validSettings, storeName: '', storeEmail: '' }
    }));

    const onMessage = vi.fn();
    render(<GeneralSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(screen.getByText('Store Information')).toBeInTheDocument();
    });
    const form = document.querySelector('form');

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Store name is required')).toBeInTheDocument();
      expect(screen.getByText('Store email is required')).toBeInTheDocument();
    });
    expect(onMessage).toHaveBeenCalledWith('Please fix the validation errors', 'error');
    // No PUT call should happen
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('saves valid settings via PUT and reports success', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: validSettings }));

    const onMessage = vi.fn();
    render(<GeneralSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(screen.getByText('Store Information')).toBeInTheDocument();
    });
    const form = document.querySelector('form');

    // PUT response
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: validSettings }));

    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
    const putCall = mockFetch.mock.calls[1];
    expect(putCall[1].method).toBe('PUT');
    expect(JSON.parse(putCall[1].body).storeName).toBe('Graphene Security');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('General settings saved successfully');
    });
  });

  it('reports an error when the save response is not ok', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: validSettings }));

    const onMessage = vi.fn();
    render(<GeneralSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(screen.getByText('Store Information')).toBeInTheDocument();
    });
    const form = document.querySelector('form');

    mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

    fireEvent.submit(form);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.stringContaining('Failed to save'),
        'error'
      );
    });
  });

  it('updates a nested address field via input change', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: validSettings }));

    render(<GeneralSettings onMessage={vi.fn()} />);

    const streetInput = await screen.findByDisplayValue('1 Main St');
    fireEvent.change(streetInput, { target: { value: '2 New Rd' } });

    await waitFor(() => {
      expect(screen.getByText('Store Information')).toBeInTheDocument();
    });
    const form = document.querySelector('form');
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: validSettings }));
    fireEvent.submit(form);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const putBody = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(putBody.storeAddress.street).toBe('2 New Rd');
  });
});
