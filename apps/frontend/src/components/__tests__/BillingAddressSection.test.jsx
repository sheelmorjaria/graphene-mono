import React from 'react';
import { render, screen, waitFor, userEvent, cleanup } from '../../test/test-utils';
import { vi } from 'vitest';
import BillingAddressSection from '../checkout/BillingAddressSection';

// Mock checkout context hook
const mockSetBillingAddress = vi.fn();
const mockSetUseSameAsShipping = vi.fn();
const mockRefreshAddresses = vi.fn();

vi.mock('../../contexts/CheckoutContext', async () => ({
  ...(await vi.importActual('../../contexts/CheckoutContext')),
  useCheckout: () => mockCheckoutContext
}));

// Mock services
vi.mock('../../services/addressService', () => ({
  addUserAddress: vi.fn(),
  updateUserAddress: vi.fn()
}));

import { addUserAddress, updateUserAddress } from '../../services/addressService';

const mockAddresses = [
  {
    _id: '1',
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    addressLine2: '',
    city: 'Anytown',
    stateProvince: 'CA',
    postalCode: '12345',
    country: 'US',
    phoneNumber: '555-1234',
    isDefault: true
  },
  {
    _id: '2',
    fullName: 'Jane Smith',
    addressLine1: '456 Oak Ave',
    addressLine2: 'Apt 2B',
    city: 'Somewhere',
    stateProvince: 'NY',
    postalCode: '67890',
    country: 'US',
    phoneNumber: '555-5678',
    isDefault: false
  }
];

const mockShippingAddress = {
  _id: 'shipping1',
  fullName: 'Shipping User',
  addressLine1: '789 Ship St',
  addressLine2: '',
  city: 'Shiptown',
  stateProvince: 'TX',
  postalCode: '54321',
  country: 'USA',
  phoneNumber: '555-9999'
};

let mockCheckoutContext = {
  checkoutState: {
    step: 'payment',
    shippingAddress: mockShippingAddress,
    billingAddress: null,
    useSameAsShipping: true,
    paymentMethod: null,
    orderNotes: ''
  },
  addresses: mockAddresses,
  addressesLoading: false,
  addressesError: '',
  setBillingAddress: mockSetBillingAddress,
  setUseSameAsShipping: mockSetUseSameAsShipping,
  refreshAddresses: mockRefreshAddresses
};

const renderWithProviders = (contextOverrides = {}) => {
  mockCheckoutContext = { ...mockCheckoutContext, ...contextOverrides };
  return render(<BillingAddressSection />);
};

describe('BillingAddressSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckoutContext = {
      checkoutState: {
        step: 'payment',
        shippingAddress: mockShippingAddress,
        billingAddress: null,
        useSameAsShipping: true,
        paymentMethod: null,
        orderNotes: ''
      },
      addresses: mockAddresses,
      addressesLoading: false,
      addressesError: '',
      setBillingAddress: mockSetBillingAddress,
      setUseSameAsShipping: mockSetUseSameAsShipping,
      refreshAddresses: mockRefreshAddresses
    };
  });

  describe('Same as Shipping Option', () => {
    it('should render billing address section with same as shipping checkbox', () => {
      renderWithProviders();

      expect(screen.getByText('Billing Address')).toBeInTheDocument();
      expect(screen.getByText('Use shipping address as billing address')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('should show shipping address when using same as shipping', () => {
      renderWithProviders();

      expect(screen.getByText('Billing Address (Same as Shipping):')).toBeInTheDocument();
      expect(screen.getByText('Shipping User')).toBeInTheDocument();
      expect(screen.getByText('789 Ship St')).toBeInTheDocument();
    });

    it('should call setUseSameAsShipping when checkbox is toggled', async () => {
      renderWithProviders();

      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);

      expect(mockSetUseSameAsShipping).toHaveBeenCalledWith(false);
    });

    it('should hide address selection when using same as shipping', () => {
      renderWithProviders();

      expect(screen.queryByText('Choose a billing address:')).not.toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Separate Billing Address', () => {
    const separateBillingContext = {
      checkoutState: {
        step: 'payment',
        shippingAddress: mockShippingAddress,
        billingAddress: null,
        useSameAsShipping: false,
        paymentMethod: null,
        orderNotes: ''
      },
      addresses: mockAddresses,
      addressesLoading: false,
      addressesError: '',
      setBillingAddress: mockSetBillingAddress,
      setUseSameAsShipping: mockSetUseSameAsShipping,
      refreshAddresses: mockRefreshAddresses
    };

    it('should show address selection when not using same as shipping', () => {
      renderWithProviders(separateBillingContext);

      expect(screen.getByText('Choose a billing address:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display available addresses', () => {
      renderWithProviders(separateBillingContext);

      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should call setBillingAddress when address is selected', async () => {
      renderWithProviders(separateBillingContext);

      const addressCard = screen.getByText('Jane Smith').closest('div');
      await userEvent.click(addressCard);

      expect(mockSetBillingAddress).toHaveBeenCalledWith(mockAddresses[1]);
    });

    it('should highlight selected billing address', () => {
      renderWithProviders({
        ...separateBillingContext,
        checkoutState: {
          ...separateBillingContext.checkoutState,
          billingAddress: mockAddresses[1]
        }
      });

      // "Jane Smith" appears in both the address card and the selected-address summary;
      // climb to the AddressCard root carrying the border classes
      const selectedCard = screen.getAllByText('Jane Smith')[0].closest('.border-2');
      expect(selectedCard).toHaveClass('border-cyan-400', 'bg-cyan-subtle');
    });

    it('should show selected billing address summary', () => {
      renderWithProviders({
        ...separateBillingContext,
        checkoutState: {
          ...separateBillingContext.checkoutState,
          billingAddress: mockAddresses[1]
        }
      });

      expect(screen.getByText('Selected Billing Address:')).toBeInTheDocument();
      expect(screen.getAllByText('Jane Smith')[1]).toBeInTheDocument(); // Second instance in summary
    });

    it('should show add new address button', () => {
      renderWithProviders(separateBillingContext);

      expect(screen.getByText('+ Add New Billing Address')).toBeInTheDocument();
    });

    it('should show empty state when no addresses available', () => {
      renderWithProviders({
        ...separateBillingContext,
        addresses: []
      });

      expect(screen.getByText('No Addresses Found')).toBeInTheDocument();
      expect(screen.getByText("You haven't added any addresses yet.")).toBeInTheDocument();
    });
  });

  describe('Add New Address', () => {
    const separateBillingContext = {
      checkoutState: {
        step: 'payment',
        shippingAddress: mockShippingAddress,
        billingAddress: null,
        useSameAsShipping: false,
        paymentMethod: null,
        orderNotes: ''
      },
      addresses: mockAddresses,
      addressesLoading: false,
      addressesError: '',
      setBillingAddress: mockSetBillingAddress,
      setUseSameAsShipping: mockSetUseSameAsShipping,
      refreshAddresses: mockRefreshAddresses
    };

    it('should show add address form when button is clicked', async () => {
      renderWithProviders(separateBillingContext);

      const addButton = screen.getByText('+ Add New Billing Address');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Billing Address')).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });
    });

    it('should handle form submission for new address', async () => {
      const mockResponse = {
        data: {
          address: {
            _id: '3',
            fullName: 'New Billing User',
            addressLine1: '999 Bill St',
            city: 'Billtown',
            stateProvince: 'FL',
            postalCode: '99999',
            country: 'USA'
          }
        }
      };

      addUserAddress.mockResolvedValue(mockResponse);

      renderWithProviders(separateBillingContext);

      // Click add new address
      const addButton = screen.getByText('+ Add New Billing Address');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Billing Address')).toBeInTheDocument();
      });

      // Fill form
      await userEvent.type(screen.getByLabelText(/full name/i), 'New Billing User');
      await userEvent.type(screen.getByLabelText(/address line 1/i), '999 Bill St');
      await userEvent.type(screen.getByLabelText(/city/i), 'Billtown');
      await userEvent.type(screen.getByLabelText(/state/i), 'FL');
      await userEvent.type(screen.getByLabelText(/postal code/i), '99999');
      await userEvent.type(screen.getByLabelText(/country/i), 'USA');

      // Submit form
      const saveButton = screen.getByText('Save Address');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(addUserAddress).toHaveBeenCalled();
        expect(mockRefreshAddresses).toHaveBeenCalled();
        expect(mockSetBillingAddress).toHaveBeenCalledWith(mockResponse.data.address);
      });
    });

    it('should handle form cancellation', async () => {
      renderWithProviders(separateBillingContext);

      // Click add new address
      const addButton = screen.getByText('+ Add New Billing Address');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Billing Address')).toBeInTheDocument();
      });

      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Choose a billing address:')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Address', () => {
    const separateBillingContext = {
      checkoutState: {
        step: 'payment',
        shippingAddress: mockShippingAddress,
        billingAddress: null,
        useSameAsShipping: false,
        paymentMethod: null,
        orderNotes: ''
      },
      addresses: mockAddresses,
      addressesLoading: false,
      addressesError: '',
      setBillingAddress: mockSetBillingAddress,
      setUseSameAsShipping: mockSetUseSameAsShipping,
      refreshAddresses: mockRefreshAddresses
    };

    it('should show edit form when edit button is clicked', async () => {
      renderWithProviders(separateBillingContext);

      const editButtons = screen.getAllByText('Edit');
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Billing Address')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      });
    });

    it('should handle form submission for address edit', async () => {
      const mockResponse = {
        data: {
          address: {
            ...mockAddresses[0],
            fullName: 'John Updated'
          }
        }
      };

      updateUserAddress.mockResolvedValue(mockResponse);

      renderWithProviders(separateBillingContext);

      // Click edit
      const editButtons = screen.getAllByText('Edit');
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Billing Address')).toBeInTheDocument();
      });

      // Update name
      const nameInput = screen.getByDisplayValue('John Doe');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'John Updated');

      // Submit form
      const updateButton = screen.getByText('Update Address');
      await userEvent.click(updateButton);

      await waitFor(() => {
        expect(updateUserAddress).toHaveBeenCalledWith('1', expect.objectContaining({
          fullName: 'John Updated'
        }));
        expect(mockRefreshAddresses).toHaveBeenCalled();
        expect(mockSetBillingAddress).toHaveBeenCalledWith(mockResponse.data.address);
      });
    });
  });

  describe('Loading and Error States', () => {
    const separateBillingContext = {
      checkoutState: {
        step: 'payment',
        shippingAddress: mockShippingAddress,
        billingAddress: null,
        useSameAsShipping: false,
        paymentMethod: null,
        orderNotes: ''
      },
      addresses: mockAddresses,
      addressesLoading: false,
      addressesError: '',
      setBillingAddress: mockSetBillingAddress,
      setUseSameAsShipping: mockSetUseSameAsShipping,
      refreshAddresses: mockRefreshAddresses
    };

    it('should show loading spinner when addresses are loading', () => {
      renderWithProviders({
        ...separateBillingContext,
        addressesLoading: true
      });

      expect(screen.getByText('Loading addresses...')).toBeInTheDocument();
    });

    it('should show error message when addresses fail to load', () => {
      renderWithProviders({
        ...separateBillingContext,
        addressesError: 'Failed to load addresses'
      });

      expect(screen.getByText('Failed to load addresses')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle retry when address loading fails', async () => {
      renderWithProviders({
        ...separateBillingContext,
        addressesError: 'Failed to load addresses'
      });

      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);

      expect(mockRefreshAddresses).toHaveBeenCalled();
    });

    it('should show error when form submission fails', async () => {
      addUserAddress.mockRejectedValue(new Error('Server error'));
      renderWithProviders(separateBillingContext);

      // Click add new address
      const addButton = screen.getByText('+ Add New Billing Address');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Billing Address')).toBeInTheDocument();
      });

      // Fill form
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/address line 1/i), '123 Test St');
      await userEvent.type(screen.getByLabelText(/city/i), 'Test City');
      await userEvent.type(screen.getByLabelText(/state/i), 'TS');
      await userEvent.type(screen.getByLabelText(/postal code/i), '12345');
      await userEvent.type(screen.getByLabelText(/country/i), 'USA');

      // Submit form
      const saveButton = screen.getByText('Save Address');
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Server error')).toBeInTheDocument();
      });
    });

    it('should show loading state during form submission', async () => {
      addUserAddress.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      renderWithProviders(separateBillingContext);

      // Click add new address
      const addButton = screen.getByText('+ Add New Billing Address');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Billing Address')).toBeInTheDocument();
      });

      // Fill minimal required fields
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/address line 1/i), '123 Test St');
      await userEvent.type(screen.getByLabelText(/city/i), 'Test City');
      await userEvent.type(screen.getByLabelText(/state/i), 'TS');
      await userEvent.type(screen.getByLabelText(/postal code/i), '12345');
      await userEvent.type(screen.getByLabelText(/country/i), 'USA');

      // Submit form
      const saveButton = screen.getByText('Save Address');
      await userEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });
  });

  describe('Context Integration', () => {
    it('should clear form state when switching to same as shipping', async () => {
      renderWithProviders({
        checkoutState: {
          ...mockCheckoutContext.checkoutState,
          useSameAsShipping: false
        }
      });

      // Start adding new address
      const addButton = screen.getByText('+ Add New Billing Address');
      await userEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Billing Address')).toBeInTheDocument();
      });

      // Switch to same as shipping (this would be done by parent component)
      cleanup();
      renderWithProviders({
        checkoutState: {
          ...mockCheckoutContext.checkoutState,
          useSameAsShipping: true
        }
      });

      // Form should be hidden
      expect(screen.queryByText('Add New Billing Address')).not.toBeInTheDocument();
      expect(screen.getByText('Billing Address (Same as Shipping):')).toBeInTheDocument();
    });
  });
});
