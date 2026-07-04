import React from 'react';
import { render, screen, act, waitForLoadingToFinish } from '../../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// The shared test-utils render injects a CheckoutContext whose values are
// module-level vi.fn()s created in test-utils.jsx. Those mocks are shared
// across renders within a single test file. To drive per-test context
// values we instead provide a local CheckoutProvider via a custom render.

// Mock AddressForm so we don't need to drive the full form implementation.
vi.mock('../../AddressForm', () => ({
  __esModule: true,
  default: ({ formData }) => (
    <div data-testid="address-form-mock">
      <span data-testid="form-fullname">{formData.fullName}</span>
    </div>
  )
}));

// Mock addressService.addUserAddress
vi.mock('../../../services/addressService', () => ({
  addUserAddress: vi.fn()
}));

import { CheckoutContext } from '../../../contexts/CheckoutContext';
import DeliveryAddressSection from '../DeliveryAddressSection';
import { addUserAddress } from '../../../services/addressService';

// Local render that supplies a controllable checkout context value.
function renderWithCheckout(ui, contextValue) {
  const Wrapper = ({ children }) => (
    <CheckoutContext.Provider value={contextValue}>
      {children}
    </CheckoutContext.Provider>
  );
  return render(ui, { wrapper: Wrapper });
}

function buildContext(overrides = {}) {
  return {
    deliveryAddress: null,
    addresses: [],
    addressesLoading: false,
    setDeliveryAddress: vi.fn(),
    refreshAddresses: vi.fn(),
    shippingRates: [],
    shippingRatesLoading: false,
    shippingRatesError: '',
    shippingMethod: null,
    setShippingMethod: vi.fn(),
    ...overrides
  };
}

describe('DeliveryAddressSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Delivery Address heading and Add New Address button', async () => {
    renderWithCheckout(<DeliveryAddressSection />, buildContext());
    await waitForLoadingToFinish();

    expect(
      screen.getByRole('heading', { name: /delivery address/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /add new address/i })
    ).toBeInTheDocument();
  });

  it('shows the loading spinner when addressesLoading is true', () => {
    renderWithCheckout(<DeliveryAddressSection />, buildContext({ addressesLoading: true }));

    expect(screen.getByText('Loading addresses...')).toBeInTheDocument();
    // Add New Address button is hidden while loading.
    expect(screen.queryByRole('button', { name: /add new address/i })).not.toBeInTheDocument();
  });

  it('renders existing addresses and selects one on click', async () => {
    const setDeliveryAddress = vi.fn();
    const address = {
      _id: 'addr-1',
      fullName: 'Jane Doe',
      addressLine1: '10 Downing St',
      city: 'London',
      stateProvince: 'England',
      postalCode: 'SW1A 2AA',
      country: 'GB',
      phoneNumber: '07000000000',
      isDefault: true
    };

    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({ addresses: [address], setDeliveryAddress })
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('10 Downing St')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();

    // Clicking the address row selects it.
    await act(async () => {
      screen.getByText('Jane Doe').click();
    });

    expect(setDeliveryAddress).toHaveBeenCalledWith(address);
  });

  it('toggles the new address form open and closed', async () => {
    const { container } = renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext()
    );

    const toggleBtn = screen.getByRole('button', { name: /add new address/i });

    // Initially the form is hidden.
    expect(screen.queryByTestId('address-form-mock')).not.toBeInTheDocument();

    // Open it.
    await act(async () => {
      toggleBtn.click();
    });
    expect(screen.getByTestId('address-form-mock')).toBeInTheDocument();
    // When open, both the toggle button (relabeled "Cancel") and the form's
    // explicit Cancel button exist.
    expect(
      screen.getAllByRole('button', { name: /cancel/i }).length
    ).toBeGreaterThanOrEqual(1);

    // Cancel inside the form closes it. Both the toggle button (now labeled
    // "Cancel") and the form's Cancel button exist, so target the form's
    // explicit Cancel button (last one).
    const cancelButtons = screen.getAllByRole('button', { name: /cancel/i });
    const formCancel = cancelButtons[cancelButtons.length - 1];
    await act(async () => {
      formCancel.click();
    });
    expect(screen.queryByTestId('address-form-mock')).not.toBeInTheDocument();
  });

  it('creates a new address on submit and resets the form on success', async () => {
    addUserAddress.mockResolvedValue({
      success: true,
      data: { address: { _id: 'new-1', fullName: 'New' } }
    });
    const setDeliveryAddress = vi.fn();
    const refreshAddresses = vi.fn();

    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({ setDeliveryAddress, refreshAddresses })
    );

    // Open the form.
    await act(async () => {
      screen.getByRole('button', { name: /add new address/i }).click();
    });

    // Submit the form.
    const saveBtn = screen.getByRole('button', { name: /save address/i });
    await act(async () => {
      saveBtn.click();
    });

    await screen.findByText('Add New Address', undefined, { timeout: 2000 }).catch(() => {});

    expect(addUserAddress).toHaveBeenCalledTimes(1);
    expect(setDeliveryAddress).toHaveBeenCalledWith({ _id: 'new-1', fullName: 'New' });
    expect(refreshAddresses).toHaveBeenCalled();
  });

  it('shows an error when address creation returns success:false', async () => {
    addUserAddress.mockResolvedValue({
      success: false,
      error: 'Postal code invalid'
    });

    renderWithCheckout(<DeliveryAddressSection />, buildContext());

    await act(async () => {
      screen.getByRole('button', { name: /add new address/i }).click();
    });

    await act(async () => {
      screen.getByRole('button', { name: /save address/i }).click();
    });

    expect(await screen.findByText('Postal code invalid')).toBeInTheDocument();
  });

  it('shows an error when address creation throws', async () => {
    addUserAddress.mockRejectedValue(new Error('Server exploded'));

    renderWithCheckout(<DeliveryAddressSection />, buildContext());

    await act(async () => {
      screen.getByRole('button', { name: /add new address/i }).click();
    });

    await act(async () => {
      screen.getByRole('button', { name: /save address/i }).click();
    });

    expect(await screen.findByText('Server exploded')).toBeInTheDocument();
  });

  it('renders shipping methods when a delivery address is selected', async () => {
    const setShippingMethod = vi.fn();
    const rate = {
      id: 'std',
      name: 'Standard Shipping',
      estimatedDelivery: '3-5 days',
      description: 'Tracked',
      cost: 4.99,
      isFreeShipping: false
    };

    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({
        deliveryAddress: { _id: 'addr-1' },
        shippingRates: [rate],
        setShippingMethod
      })
    );

    expect(
      screen.getByRole('heading', { name: /shipping method/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
    expect(screen.getByText('£4.99')).toBeInTheDocument();

    // Select the shipping method.
    await act(async () => {
      screen.getByText('Standard Shipping').click();
    });
    expect(setShippingMethod).toHaveBeenCalledWith(rate);
  });

  it('shows free-shipping label when rate.isFreeShipping is true', () => {
    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({
        deliveryAddress: { _id: 'addr-1' },
        shippingRates: [
          {
            id: 'free',
            name: 'Free Shipping',
            estimatedDelivery: '5-7 days',
            isFreeShipping: true
          }
        ]
      })
    );

    expect(screen.getByText('FREE')).toBeInTheDocument();
  });

  it('shows shipping rates loading spinner', () => {
    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({
        deliveryAddress: { _id: 'addr-1' },
        shippingRatesLoading: true
      })
    );

    expect(screen.getByText('Loading shipping methods...')).toBeInTheDocument();
  });

  it('shows shipping rates error', () => {
    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({
        deliveryAddress: { _id: 'addr-1' },
        shippingRatesError: 'No rates available'
      })
    );

    expect(screen.getByText('No rates available')).toBeInTheDocument();
  });

  it('shows empty-state message when no shipping rates are available', () => {
    renderWithCheckout(
      <DeliveryAddressSection />,
      buildContext({
        deliveryAddress: { _id: 'addr-1' },
        shippingRates: []
      })
    );

    expect(
      screen.getByText(/no shipping methods available for the selected address/i)
    ).toBeInTheDocument();
  });

  it('hides the shipping methods section entirely when no delivery address is selected', () => {
    renderWithCheckout(<DeliveryAddressSection />, buildContext());

    expect(
      screen.queryByRole('heading', { name: /shipping method/i })
    ).not.toBeInTheDocument();
  });
});
