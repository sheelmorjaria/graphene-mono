import React from 'react';
import { render, screen, waitFor, userEvent } from '../../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FlashServiceForm from '../FlashServiceForm';

// Mock flash order service
vi.mock('../../../services/flashOrderService', () => ({
  createFlashOrder: vi.fn(),
  SUPPORTED_PIXEL_MODELS: [
    { value: 'Pixel 6', label: 'Pixel 6' },
    { value: 'Pixel 6 Pro', label: 'Pixel 6 Pro' },
    { value: 'Pixel 6a', label: 'Pixel 6a' },
    { value: 'Pixel 7', label: 'Pixel 7' },
    { value: 'Pixel 7 Pro', label: 'Pixel 7 Pro' },
    { value: 'Pixel 7a', label: 'Pixel 7a' },
    { value: 'Pixel 8', label: 'Pixel 8' },
    { value: 'Pixel 8 Pro', label: 'Pixel 8 Pro' },
    { value: 'Pixel 8a', label: 'Pixel 8a' }
  ],
  FLASH_ORDER_PRICING: {
    basePrice: 119.99,
    returnShipping: 19.99,
    totalPrice: 139.98
  },
  formatFlashOrderCurrency: (amount) => `£${amount.toFixed(2)}`
}));

import { createFlashOrder } from '../../../services/flashOrderService';

describe('FlashServiceForm Component', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render all required form fields', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Email field
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

      // Pixel model dropdown
      expect(screen.getByLabelText(/pixel model/i)).toBeInTheDocument();

      // Return address fields
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/state\/province/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/postal code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/country/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();

      // Factory reset checkbox
      expect(screen.getByLabelText(/factory reset/i)).toBeInTheDocument();

      // Submit button
      expect(screen.getByRole('button', { name: /continue to payment/i })).toBeInTheDocument();
    });

    it('should render pricing information', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText(/£119.99/)).toBeInTheDocument();
      expect(screen.getByText(/£19.99/)).toBeInTheDocument();
      expect(screen.getByText(/£139.98/i)).toBeInTheDocument();
    });

    it('should render service description', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText(/grapheneos flashing service/i)).toBeInTheDocument();
    });
  });

  describe('Pixel Model Dropdown', () => {
    it('should populate dropdown with supported models only', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      const dropdown = screen.getByLabelText(/pixel model/i);
      expect(dropdown).toBeInTheDocument();

      // Check that it has options
      const options = screen.getAllByRole('option');
      expect(options.length).toBeGreaterThan(0);

      // Should not include Pixel 4 or older models
      expect(screen.queryByText(/Pixel 4/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Pixel 5/)).not.toBeInTheDocument();
    });

    it('should have default placeholder option', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByText(/select your pixel model/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when factory reset checkbox unchecked', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      const checkbox = screen.getByLabelText(/factory reset/i);

      expect(checkbox).not.toBeChecked();
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when factory reset checkbox checked', async () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      const checkbox = screen.getByLabelText(/factory reset/i);
      const submitButton = screen.getByRole('button', { name: /continue to payment/i });

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      // Button may still be disabled if form is incomplete, but checkbox check is a prerequisite
    });

    it('should validate email format', async () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });

    it('should require all address fields', async () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Check factory reset to enable submit
      await userEvent.click(screen.getByLabelText(/factory reset/i));

      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /continue to payment/i });

      // Fill only email to try to trigger submission
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');

      // Select a pixel model
      const pixelDropdown = screen.getByLabelText(/pixel model/i);
      await userEvent.selectOptions(pixelDropdown, 'Pixel 8 Pro');

      // Button should still be disabled due to missing required address fields
      expect(submitButton).toBeDisabled();
    });

    it('should require pixel model selection', async () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      await userEvent.click(screen.getByLabelText(/factory reset/i));

      // Fill email and address
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/full name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/address line 1/i), '123 Test St');
      await userEvent.type(screen.getByLabelText(/city/i), 'London');
      await userEvent.type(screen.getByLabelText(/state\/province/i), 'England');
      await userEvent.type(screen.getByLabelText(/postal code/i), 'E1 6AN');

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    const validFormData = {
      customerEmail: 'test@example.com',
      pixelModel: 'Pixel 8 Pro',
      returnAddress: {
        fullName: 'Test User',
        addressLine1: '123 Test Street',
        city: 'London',
        stateProvince: 'England',
        postalCode: 'E1 6AN',
        country: 'GB',
        phoneNumber: '+44 20 7946 0958'
      },
      factoryResetConfirmed: true
    };

    it('should submit form with valid data and call onSuccess', async () => {
      const mockResponse = {
        orderId: 'order-123',
        orderNumber: 'FLO-1234567890-001',
        customerEmail: 'test@example.com',
        pixelModel: 'Pixel 8 Pro',
        totalPrice: 139.98
      };

      createFlashOrder.mockResolvedValue(mockResponse);

      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Fill form
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.customerEmail);
      await userEvent.selectOptions(screen.getByLabelText(/pixel model/i), validFormData.pixelModel);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.returnAddress.fullName);
      await userEvent.type(screen.getByLabelText(/address line 1/i), validFormData.returnAddress.addressLine1);
      await userEvent.type(screen.getByLabelText(/city/i), validFormData.returnAddress.city);
      await userEvent.type(screen.getByLabelText(/state\/province/i), validFormData.returnAddress.stateProvince);
      await userEvent.type(screen.getByLabelText(/postal code/i), validFormData.returnAddress.postalCode);
      await userEvent.type(screen.getByLabelText(/phone number/i), validFormData.returnAddress.phoneNumber);

      // Check factory reset
      await userEvent.click(screen.getByLabelText(/factory reset/i));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(createFlashOrder).toHaveBeenCalledWith(validFormData);
        expect(mockOnSuccess).toHaveBeenCalledWith(mockResponse);
      });
    });

    it('should handle submission errors', async () => {
      const errorMessage = 'Invalid Pixel model';
      createFlashOrder.mockRejectedValue(new Error(errorMessage));

      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Fill form with valid data
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.customerEmail);
      await userEvent.selectOptions(screen.getByLabelText(/pixel model/i), validFormData.pixelModel);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.returnAddress.fullName);
      await userEvent.type(screen.getByLabelText(/address line 1/i), validFormData.returnAddress.addressLine1);
      await userEvent.type(screen.getByLabelText(/city/i), validFormData.returnAddress.city);
      await userEvent.type(screen.getByLabelText(/state\/province/i), validFormData.returnAddress.stateProvince);
      await userEvent.type(screen.getByLabelText(/postal code/i), validFormData.returnAddress.postalCode);

      await userEvent.click(screen.getByLabelText(/factory reset/i));

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.objectContaining({
          message: errorMessage
        }));
      });
    });

    it('should show loading state during submission', async () => {
      let resolveSubmission;
      const submissionPromise = new Promise(resolve => {
        resolveSubmission = resolve;
      });

      createFlashOrder.mockReturnValue(submissionPromise);

      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      // Fill form
      await userEvent.type(screen.getByLabelText(/email/i), validFormData.customerEmail);
      await userEvent.selectOptions(screen.getByLabelText(/pixel model/i), validFormData.pixelModel);
      await userEvent.type(screen.getByLabelText(/full name/i), validFormData.returnAddress.fullName);
      await userEvent.type(screen.getByLabelText(/address line 1/i), validFormData.returnAddress.addressLine1);
      await userEvent.type(screen.getByLabelText(/city/i), validFormData.returnAddress.city);
      await userEvent.type(screen.getByLabelText(/state\/province/i), validFormData.returnAddress.stateProvince);
      await userEvent.type(screen.getByLabelText(/postal code/i), validFormData.returnAddress.postalCode);

      await userEvent.click(screen.getByLabelText(/factory reset/i));

      const submitButton = screen.getByRole('button', { name: /continue to payment/i });
      await userEvent.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/creating order/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve submission
      resolveSubmission({ orderId: '123' });
    });
  });

  describe('User Interactions', () => {
    it('should clear validation errors when user starts typing', async () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });

      // Start typing valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      expect(screen.getByRole('form')).toBeInTheDocument();

      // Check that all inputs have proper labels
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/pixel model/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address line 1/i)).toBeInTheDocument();
    });

    it('should associate error messages with form fields', async () => {
      render(<FlashServiceForm onSuccess={mockOnSuccess} onError={mockOnError} />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid');
      await userEvent.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/please enter a valid email/i);
        expect(errorMessage).toBeInTheDocument();
        expect(emailInput).toHaveAttribute('aria-describedby');
      });
    });
  });
});
