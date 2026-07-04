import React from 'react';
import { render, screen, waitFor, fireEvent } from '../../../test/test-utils';
import { vi } from 'vitest';
import TaxSettings from '../TaxSettings';

// TaxSettings uses raw fetch against VITE_API_BASE_URL (http://localhost:5000/api)
// and reads 'adminToken' from localStorage.
const mockFetch = vi.fn();
global.fetch = mockFetch;

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
  url: 'http://localhost:5000/api/admin/settings/taxes',
  headers: { get: vi.fn(() => contentType) },
  json: async () => data,
  text: async () => JSON.stringify(data)
});

const sampleTaxRate = (over = {}) => ({
  _id: 'tax-1',
  name: 'UK VAT Standard Rate',
  region: 'United Kingdom',
  country: 'GB',
  state: '',
  postalCode: '',
  rate: 20,
  type: 'VAT',
  calculationMethod: 'inclusive',
  isActive: true,
  effectiveFrom: '2024-01-01T00:00:00.000Z',
  effectiveTo: null,
  ...over
});

describe('TaxSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('adminToken', 'admin-token');
    // window.confirm defaults to true
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    // Never-resolving fetch keeps loading true
    mockFetch.mockReturnValueOnce(new Promise(() => {}));
    render(<TaxSettings onMessage={vi.fn()} />);
    expect(screen.getByText('Loading tax rates...')).toBeInTheDocument();
  });

  it('loads tax rates on mount and renders them in the table', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );

    render(<TaxSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('UK VAT Standard Rate')).toBeInTheDocument();
    });
    expect(screen.getByText('United Kingdom, GB')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/admin/settings/taxes',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token' })
      })
    );
  });

  it('shows the empty-state message when no tax rates are returned', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [] } })
    );

    render(<TaxSettings onMessage={vi.fn()} />);

    await waitFor(() => {
      expect(
        screen.getByText(/No tax rates found/i)
      ).toBeInTheDocument();
    });
  });

  it('reports a load error via onMessage when the fetch fails', async () => {
    const onMessage = vi.fn();
    mockFetch.mockResolvedValueOnce(jsonResponse({}, { ok: false, status: 500 }));

    render(<TaxSettings onMessage={onMessage} />);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Failed to load tax rates', 'error');
    });
  });

  it('opens the Add Tax Rate modal and validates required fields on submit', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [] } })
    );

    const onMessage = vi.fn();
    render(<TaxSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Tax Rate', { selector: 'button' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Add Tax Rate', { selector: 'button' }));

    // Modal heading appears (Add form)
    expect(screen.getAllByText('Add Tax Rate').length).toBeGreaterThan(0);

    // Clear the required Name + Region fields to trigger validation
    fireEvent.change(screen.getByPlaceholderText('UK VAT Standard Rate'), {
      target: { value: '' }
    });
    fireEvent.change(screen.getByPlaceholderText('United Kingdom'), {
      target: { value: '' }
    });

    // Submit empty form -> validation error, no POST
    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Region is required')).toBeInTheDocument();
    });
    expect(onMessage).toHaveBeenCalledWith('Please fix the validation errors', 'error');
    // Only the initial GET should have happened
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('creates a tax rate via POST when a valid form is submitted', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [] } })
    );

    const onMessage = vi.fn();
    render(<TaxSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Tax Rate', { selector: 'button' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('Add Tax Rate', { selector: 'button' }));

    // Fill required Name + Region (defaults cover the rest: country GB, rate 20, etc.)
    fireEvent.change(screen.getByPlaceholderText('UK VAT Standard Rate'), {
      target: { value: 'UK VAT Standard Rate' }
    });
    fireEvent.change(screen.getByPlaceholderText('United Kingdom'), {
      target: { value: 'United Kingdom' }
    });

    // POST response + reload response
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );

    const form = document.querySelector('form');
    fireEvent.submit(form);

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));
    const postCall = mockFetch.mock.calls[1];
    expect(postCall[1].method).toBe('POST');
    expect(postCall[0]).toBe('http://localhost:5000/api/admin/settings/taxes');
    const body = JSON.parse(postCall[1].body);
    expect(body.name).toBe('UK VAT Standard Rate');
    expect(body.region).toBe('United Kingdom');
    expect(body.country).toBe('GB');
    expect(body.rate).toBe(20);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Tax rate created successfully');
    });
  });

  it('deactivates a tax rate via DELETE (after confirm) and reloads', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );

    const onMessage = vi.fn();
    render(<TaxSettings onMessage={onMessage} />);

    await waitFor(() => expect(screen.getByText('Deactivate')).toBeInTheDocument());

    // DELETE response, then reload response (empty after deactivation)
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: {} })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [] } })
    );

    fireEvent.click(screen.getByText('Deactivate'));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    // GET + DELETE + reload GET
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));

    const deleteCall = mockFetch.mock.calls[1];
    expect(deleteCall[1].method).toBe('DELETE');
    expect(deleteCall[0]).toBe('http://localhost:5000/api/admin/settings/taxes/tax-1');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Tax rate deactivated successfully');
    });
  });

  it('does not deactivate when the confirm dialog is cancelled', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );

    render(<TaxSettings onMessage={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Deactivate')).toBeInTheDocument());

    // Cancel confirm
    window.confirm.mockReturnValueOnce(false);

    fireEvent.click(screen.getByText('Deactivate'));

    await waitFor(() => expect(window.confirm).toHaveBeenCalled());
    // Only the initial GET should have happened — no DELETE
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('opens the Edit modal pre-filled for an existing tax rate', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );

    render(<TaxSettings onMessage={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Edit')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Edit'));

    // Edit heading shows, and the name field is pre-filled
    expect(screen.getByText('Edit Tax Rate')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('UK VAT Standard Rate')).toHaveValue('UK VAT Standard Rate');
    // Submit button says Update in edit mode
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('updates an existing tax rate via PUT', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate()] } })
    );

    const onMessage = vi.fn();
    render(<TaxSettings onMessage={onMessage} />);

    await waitFor(() => expect(screen.getByText('Edit')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Edit'));

    // Change the name
    fireEvent.change(screen.getByPlaceholderText('UK VAT Standard Rate'), {
      target: { value: 'UK VAT Standard (Updated)' }
    });

    // PUT response + reload response
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: {} })
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate({ name: 'UK VAT Standard (Updated)' })] } })
    );

    fireEvent.click(screen.getByText('Update'));

    // GET + PUT + reload GET
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3));
    const putCall = mockFetch.mock.calls[1];
    expect(putCall[1].method).toBe('PUT');
    expect(putCall[0]).toBe('http://localhost:5000/api/admin/settings/taxes/tax-1');
    expect(JSON.parse(putCall[1].body).name).toBe('UK VAT Standard (Updated)');

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Tax rate updated successfully');
    });
  });

  it('exercises all modal form fields and validation branches (rate, dates, minOrder)', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [] } })
    );

    const onMessage = vi.fn();
    render(<TaxSettings onMessage={onMessage} />);

    await waitFor(() =>
      expect(screen.getByText('Add Tax Rate', { selector: 'button' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('Add Tax Rate', { selector: 'button' }));

    const form = document.querySelector('form');

    // --- Fill required Name + Region first so only targeted validators fail ---
    fireEvent.change(screen.getByPlaceholderText('UK VAT Standard Rate'), {
      target: { value: 'Test Rate' }
    });
    fireEvent.change(screen.getByPlaceholderText('United Kingdom'), {
      target: { value: 'United Kingdom' }
    });

    // Use direct DOM queries to target ambiguous/placeholder-less fields robustly.
    const allTextInputs = form.querySelectorAll('input[type="text"]');
    // allTextInputs order: [name, region, state, postalCode]
    fireEvent.change(allTextInputs[2], { target: { value: 'England' } }); // state
    fireEvent.change(allTextInputs[3], { target: { value: 'SW1A 1AA' } }); // postalCode

    // Rate > 100 -> validation error
    const numberInputs = form.querySelectorAll('input[type="number"]');
    // [rate, priority, minimumOrderValue]
    fireEvent.change(numberInputs[0], { target: { value: '150' } });
    // Minimum order value negative -> validation error
    fireEvent.change(numberInputs[2], { target: { value: '-5' } });

    // Effective To before Effective From -> validation error
    const dateInputs = form.querySelectorAll('input[type="date"]');
    fireEvent.change(dateInputs[1], { target: { value: '2020-01-01' } });

    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Tax rate must be between 0 and 100')).toBeInTheDocument();
      expect(screen.getByText('Effective to date must be after effective from date')).toBeInTheDocument();
      expect(screen.getByText('Minimum order value cannot be negative')).toBeInTheDocument();
    });
    expect(onMessage).toHaveBeenCalledWith('Please fix the validation errors', 'error');

    // --- Fix values; errors clear as user types ---
    fireEvent.change(numberInputs[0], { target: { value: '20' } });
    fireEvent.change(numberInputs[2], { target: { value: '0' } });
    fireEvent.change(dateInputs[1], { target: { value: '' } });

    // Exercise selects + checkbox + priority + description
    const selects = form.querySelectorAll('select');
    // [country, type, calculationMethod]
    fireEvent.change(selects[1], { target: { value: 'GST' } });
    fireEvent.change(selects[2], { target: { value: 'exclusive' } });

    const activeCheckbox = form.querySelector('input[type="checkbox"]');
    fireEvent.click(activeCheckbox);

    fireEvent.change(numberInputs[1], { target: { value: '5' } }); // priority

    const textarea = form.querySelector('textarea');
    fireEvent.change(textarea, { target: { value: 'A test description' } });

    // --- Now submit successfully ---
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: {} }));
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: { taxRates: [] } }));

    fireEvent.submit(form);

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith('Tax rate created successfully');
    });
  });

  it('closes the modal via the Cancel button', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [] } })
    );

    render(<TaxSettings onMessage={vi.fn()} />);

    await waitFor(() =>
      expect(screen.getByText('Add Tax Rate', { selector: 'button' })).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText('Add Tax Rate', { selector: 'button' }));

    // Modal heading visible
    expect(screen.getByText('Create')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    // Modal closed — the Create submit button is gone
    await waitFor(() => {
      expect(screen.queryByText('Create')).not.toBeInTheDocument();
    });
  });

  it('does not render the Deactivate button for inactive tax rates', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ success: true, data: { taxRates: [sampleTaxRate({ isActive: false })] } })
    );

    render(<TaxSettings onMessage={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Inactive')).toBeInTheDocument());
    // Edit button present, Deactivate absent
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByText('Deactivate')).not.toBeInTheDocument();
  });
});
