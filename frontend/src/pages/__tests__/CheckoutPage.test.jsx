import React from 'react';
import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import CheckoutPage from '../CheckoutPage';
import { CheckoutProvider } from '../../contexts/CheckoutContext';

import { vi } from 'vitest';

// Mock services
vi.mock('../../services/addressService', () => ({
  getUserAddresses: vi.fn(),
  addUserAddress: vi.fn(),
  updateUserAddress: vi.fn()
}));

vi.mock('../../services/cartService', () => ({
  getCart: vi.fn(),
  formatCurrency: vi.fn((amount) => `£${amount.toFixed(2)}`)
}));

import { getUserAddresses } from '../../services/addressService';
import { getCart } from '../../services/cartService';

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

const mockCart = {
  items: [
    {
      _id: 'item1',
      productId: 'prod1',
      productName: 'GrapheneOS Pixel 9',
      productSlug: 'grapheneos-pixel-9',
      productImage: 'https://example.com/pixel9.jpg',
      unitPrice: 899.99,
      quantity: 1,
      subtotal: 899.99
    },
    {
      _id: 'item2',
      productId: 'prod2',
      productName: 'GrapheneOS Pixel 9 Pro',
      productSlug: 'grapheneos-pixel-9-pro',
      productImage: 'https://example.com/pixel9pro.jpg',
      unitPrice: 999.99,
      quantity: 2,
      subtotal: 1999.98
    }
  ],
  totalItems: 3,
  totalAmount: 2899.97
};

const renderWithProviders = () => {
  return render(
    <CheckoutProvider>
      <CheckoutPage />
    </CheckoutProvider>
  );
};

describe('CheckoutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getUserAddresses.mockResolvedValue({ data: { addresses: mockAddresses } });
    getCart.mockResolvedValue({ data: { cart: mockCart } });
  });

  describe('Page Rendering', () => {
    it('should render checkout page with proper title', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(document.title).toBe('Checkout - GrapheneOS Store');
      });
      
      expect(screen.getByRole('heading', { name: /checkout/i })).toBeInTheDocument();
    });

    it('should render checkout steps', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Shipping')).toBeInTheDocument();
        expect(screen.getByText('Payment')).toBeInTheDocument();
        expect(screen.getByText('Review')).toBeInTheDocument();
      });
    });

    it('should render cart summary', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
        expect(screen.getByText('GrapheneOS Pixel 9')).toBeInTheDocument();
        expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
        expect(screen.getByText('£2899.97')).toBeInTheDocument();
      });
    });
  });

  describe('Authentication States', () => {
    it('should show loading state while checking auth', () => {
      renderWithProviders({ isLoading: true });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show login prompt for unauthenticated users', () => {
      renderWithProviders({ isAuthenticated: false, isLoading: false, user: null });
      
      expect(screen.getByText('Login Required')).toBeInTheDocument();
      expect(screen.getByText('You need to be logged in to proceed with checkout.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /login to continue/i })).toBeInTheDocument();
    });

    it('should show empty cart message when cart is empty', () => {
      renderWithProviders({}, { cart: { items: [], totalItems: 0, totalAmount: 0 } });
      
      expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
      expect(screen.getByText('Add some items to your cart before proceeding to checkout.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
    });
  });

  describe('Shipping Address Section', () => {
    it('should show shipping address selection by default', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
        expect(screen.getByText('Choose a shipping address:')).toBeInTheDocument();
      });
    });

    it('should display available addresses', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      });
    });

    it('should show default address badge', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Default')).toBeInTheDocument();
      });
    });

    it('should allow address selection', async () => {
      renderWithProviders();
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
      
      // Select an address
      const addressCard = screen.getByText('Jane Smith').closest('div');
      await user.click(addressCard);
      
      await waitFor(() => {
        expect(screen.getByText('Selected Shipping Address:')).toBeInTheDocument();
      });
    });

    it('should show add new address option', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('+ Add New Address')).toBeInTheDocument();
      });
    });

    it('should enable continue button when address is selected', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(continueButton).toBeInTheDocument();
        // Default address should be auto-selected
        expect(continueButton).not.toBeDisabled();
      });
    });
  });

  describe('Step Navigation', () => {
    it('should highlight current step', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        const shippingStep = screen.getByText('Shipping').closest('div');
        expect(shippingStep).toHaveClass('text-blue-600');
      });
    });

    it('should navigate to payment step', async () => {
      renderWithProviders();
      const user = userEvent.setup();
      
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(continueButton).not.toBeDisabled();
      });
      
      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
        expect(screen.getByText('Payment Coming Soon')).toBeInTheDocument();
      });
    });

    it('should navigate back from payment to shipping', async () => {
      renderWithProviders();
      const user = userEvent.setup();
      
      // Go to payment
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(continueButton).not.toBeDisabled();
      });
      
      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });
      
      // Go back to shipping
      const backButton = screen.getByRole('button', { name: /back to shipping/i });
      await user.click(backButton);
      
      await waitFor(() => {
        expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      });
    });

    it('should navigate to review step', async () => {
      renderWithProviders();
      const user = userEvent.setup();
      
      // Go to payment
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(continueButton).not.toBeDisabled();
      });
      
      const continueButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });
      
      // Go to review
      const reviewButton = screen.getByRole('button', { name: /continue to review/i });
      await user.click(reviewButton);
      
      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
        expect(screen.getByText('Order Items')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle address loading errors', async () => {
      getUserAddresses.mockRejectedValue(new Error('Failed to load addresses'));
      renderWithProviders();
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load addresses')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle cart loading state', () => {
      renderWithProviders({}, { loading: true });
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', async () => {
      renderWithProviders();
      
      await waitFor(() => {
        const container = screen.getByText('Checkout').closest('.checkout-page');
        expect(container).toBeInTheDocument();
        
        // Check for responsive grid classes
        const mainContent = container.querySelector('.grid');
        expect(mainContent).toHaveClass('lg:grid-cols-3');
      });
    });
  });

  describe('Order Review', () => {
    it('should display selected shipping address in review', async () => {
      renderWithProviders();
      const user = userEvent.setup();
      
      // Navigate to review step
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(continueButton).not.toBeDisabled();
      });
      
      let continueButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });
      
      continueButton = screen.getByRole('button', { name: /continue to review/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Review Your Order')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument(); // Default address
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
      });
    });

    it('should show place order button in review', async () => {
      renderWithProviders();
      const user = userEvent.setup();
      
      // Navigate to review step
      await waitFor(() => {
        const continueButton = screen.getByRole('button', { name: /continue to payment/i });
        expect(continueButton).not.toBeDisabled();
      });
      
      let continueButton = screen.getByRole('button', { name: /continue to payment/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByText('Payment Method')).toBeInTheDocument();
      });
      
      continueButton = screen.getByRole('button', { name: /continue to review/i });
      await user.click(continueButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /place order/i })).toBeInTheDocument();
      });
    });
  });
});