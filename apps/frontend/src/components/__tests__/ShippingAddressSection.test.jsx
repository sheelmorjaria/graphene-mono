import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ShippingAddressSection from '../checkout/ShippingAddressSection';
import { CheckoutProvider } from '../../contexts/CheckoutContext';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock services
vi.mock('../../services/addressService', () => ({
  getUserAddresses: vi.fn(),
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
    country: 'USA',
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
    country: 'USA',
    phoneNumber: '555-5678',
    isDefault: false
  }
];

const mockCheckoutContext = {
  checkoutState: {
    step: 'shipping',
    shippingAddress: null,
    paymentMethod: null,
    orderNotes: ''
  },
  addresses: mockAddresses,
  addressesLoading: false,
  addressesError: '',
  setShippingAddress: jest.fn(),
  nextStep: jest.fn(),
  canProceedToPayment: false,
  refreshAddresses: jest.fn()
};

const renderWithProviders = (contextOverrides = {}) => {
  const contextValue = { ...mockCheckoutContext, ...contextOverrides };
  
  return render(
    <AuthProvider value={{ isAuthenticated: true, user: { _id: '1' } }}>
      <CheckoutProvider value={contextValue}>
        <ShippingAddressSection />
      </CheckoutProvider>
    </AuthProvider>
  );
};

describe('ShippingAddressSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Address Display', () => {
    it('should render shipping address section', () => {
      renderWithProviders();
      
      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('Choose a shipping address:')).toBeInTheDocument();
    });

    it('should display available addresses', () => {
      renderWithProviders();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
    });

    it('should show default badge for default address', () => {
      renderWithProviders();
      
      expect(screen.getByText('Default')).toBeInTheDocument();
    });

    it('should show phone numbers when available', () => {
      renderWithProviders();
      
      expect(screen.getByText('Phone: 555-1234')).toBeInTheDocument();
      expect(screen.getByText('Phone: 555-5678')).toBeInTheDocument();
    });

    it('should show no addresses message when list is empty', () => {
      renderWithProviders({ addresses: [] });
      
      expect(screen.getByText('No Addresses Found')).toBeInTheDocument();
      expect(screen.getByText("You haven't added any shipping addresses yet.")).toBeInTheDocument();
    });
  });

  describe('Address Selection', () => {
    it('should highlight selected address', () => {
      const selectedAddress = mockAddresses[0];
      renderWithProviders({
        checkoutState: { ...mockCheckoutContext.checkoutState, shippingAddress: selectedAddress },
        canProceedToPayment: true
      });
      
      const selectedCard = screen.getByText('John Doe').closest('div');
      expect(selectedCard).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should call setShippingAddress when address is selected', async () => {
      const setShippingAddress = jest.fn();
      renderWithProviders({ setShippingAddress });
      
      const addressCard = screen.getByText('Jane Smith').closest('div');
      await userEvent.click(addressCard);
      
      expect(setShippingAddress).toHaveBeenCalledWith(mockAddresses[1]);
    });

    it('should show selected address summary', () => {
      const selectedAddress = mockAddresses[0];
      renderWithProviders({
        checkoutState: { ...mockCheckoutContext.checkoutState, shippingAddress: selectedAddress }
      });
      
      expect(screen.getByText('Selected Shipping Address:')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Add New Address', () => {
    it('should show add new address button', () => {
      renderWithProviders();
      
      expect(screen.getByText('+ Add New Address')).toBeInTheDocument();
    });

    it('should show add address form when button is clicked', async () => {
      renderWithProviders();
      
      const addButton = screen.getByText('+ Add New Address');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Address')).toBeInTheDocument();
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
      });
    });

    it('should handle form submission for new address', async () => {
      const mockResponse = {
        data: {
          address: {
            _id: '3',
            fullName: 'New User',
            addressLine1: '789 New St',
            city: 'Newtown',
            stateProvince: 'TX',
            postalCode: '54321',
            country: 'USA'
          }
        }
      };
      
      addUserAddress.mockResolvedValue(mockResponse);
      const setShippingAddress = jest.fn();
      const refreshAddresses = jest.fn();
      
      renderWithProviders({ setShippingAddress, refreshAddresses });
      
      // Click add new address
      const addButton = screen.getByText('+ Add New Address');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Address')).toBeInTheDocument();
      });
      
      // Fill form
      await userEvent.type(screen.getByLabelText(/full name/i), 'New User');
      await userEvent.type(screen.getByLabelText(/address line 1/i), '789 New St');
      await userEvent.type(screen.getByLabelText(/city/i), 'Newtown');
      await userEvent.type(screen.getByLabelText(/state/i), 'TX');
      await userEvent.type(screen.getByLabelText(/postal code/i), '54321');
      await userEvent.type(screen.getByLabelText(/country/i), 'USA');
      
      // Submit form
      const saveButton = screen.getByText('Save Address');
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        expect(addUserAddress).toHaveBeenCalledWith({
          fullName: 'New User',
          addressLine1: '789 New St',
          addressLine2: '',
          city: 'Newtown',
          stateProvince: 'TX',
          postalCode: '54321',
          country: 'USA',
          phoneNumber: ''
        });
        expect(refreshAddresses).toHaveBeenCalled();
        expect(setShippingAddress).toHaveBeenCalledWith(mockResponse.data.address);
      });
    });

    it('should handle form cancellation', async () => {
      renderWithProviders();
      
      // Click add new address
      const addButton = screen.getByText('+ Add New Address');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Address')).toBeInTheDocument();
      });
      
      // Cancel form
      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.getByText('Choose a shipping address:')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Address', () => {
    it('should show edit address form when edit button is clicked', async () => {
      renderWithProviders();
      
      const editButtons = screen.getAllByText('Edit');
      await userEvent.click(editButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Address')).toBeInTheDocument();
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
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
      const setShippingAddress = jest.fn();
      const refreshAddresses = jest.fn();
      
      renderWithProviders({ setShippingAddress, refreshAddresses });
      
      // Click edit
      const editButtons = screen.getAllByText('Edit');
      await userEvent.click(editButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Address')).toBeInTheDocument();
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
        expect(refreshAddresses).toHaveBeenCalled();
        expect(setShippingAddress).toHaveBeenCalledWith(mockResponse.data.address);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when addresses are loading', () => {
      renderWithProviders({ addressesLoading: true });
      
      expect(screen.getByText('Loading addresses...')).toBeInTheDocument();
    });

    it('should show loading state during form submission', async () => {
      addUserAddress.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      renderWithProviders();
      
      // Click add new address
      const addButton = screen.getByText('+ Add New Address');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Address')).toBeInTheDocument();
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

  describe('Error Handling', () => {
    it('should show error message when addresses fail to load', () => {
      renderWithProviders({
        addressesError: 'Failed to load addresses'
      });
      
      expect(screen.getByText('Failed to load addresses')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle retry when address loading fails', async () => {
      const refreshAddresses = jest.fn();
      renderWithProviders({
        addressesError: 'Failed to load addresses',
        refreshAddresses
      });
      
      const retryButton = screen.getByText('Retry');
      await userEvent.click(retryButton);
      
      expect(refreshAddresses).toHaveBeenCalled();
    });

    it('should show error when form submission fails', async () => {
      addUserAddress.mockRejectedValue(new Error('Server error'));
      renderWithProviders();
      
      // Click add new address
      const addButton = screen.getByText('+ Add New Address');
      await userEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('Add New Address')).toBeInTheDocument();
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
  });

  describe('Continue Button', () => {
    it('should disable continue button when no address is selected', () => {
      renderWithProviders();
      
      const continueButton = screen.getByText('Continue to Payment');
      expect(continueButton).toBeDisabled();
    });

    it('should enable continue button when address is selected', () => {
      renderWithProviders({
        canProceedToPayment: true,
        checkoutState: {
          ...mockCheckoutContext.checkoutState,
          shippingAddress: mockAddresses[0]
        }
      });
      
      const continueButton = screen.getByText('Continue to Payment');
      expect(continueButton).not.toBeDisabled();
    });

    it('should call nextStep when continue button is clicked', async () => {
      const nextStep = jest.fn();
      renderWithProviders({
        canProceedToPayment: true,
        checkoutState: {
          ...mockCheckoutContext.checkoutState,
          shippingAddress: mockAddresses[0]
        },
        nextStep
      });
      
      const continueButton = screen.getByText('Continue to Payment');
      await userEvent.click(continueButton);
      
      expect(nextStep).toHaveBeenCalled();
    });
  });
});