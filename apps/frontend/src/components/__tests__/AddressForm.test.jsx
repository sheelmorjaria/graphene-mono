import React from 'react';
import { render, screen, waitFor, userEvent, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddressForm from '../AddressForm';

// The AddressForm labels now expose clean accessible names (field name +
// visually-hidden "required" word). Inputs are located by accessible label
// via getByLabelText; the country field is the only <select> (combobox).
const fullNameInput = () => screen.getByLabelText(/full name/i);
const addressLine1Input = () => screen.getByLabelText(/address line 1/i);
const addressLine2Input = () => screen.getByLabelText(/address line 2/i);
const cityInput = () => screen.getByLabelText(/^city/i);
const stateInput = () => screen.getByLabelText(/state\/province/i);
const postalInput = () => screen.getByLabelText(/postal code/i);
const phoneInput = () => screen.getByLabelText(/phone number/i);
const countrySelect = () => screen.getByRole('combobox');

describe('AddressForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render form with all required fields', () => {
      render(<AddressForm {...defaultProps} />);

      expect(fullNameInput()).toBeInTheDocument();
      expect(addressLine1Input()).toBeInTheDocument();
      expect(addressLine2Input()).toBeInTheDocument();
      expect(cityInput()).toBeInTheDocument();
      expect(stateInput()).toBeInTheDocument();
      expect(postalInput()).toBeInTheDocument();
      expect(countrySelect()).toBeInTheDocument();
      expect(phoneInput()).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /save address/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('should populate form with initial data when provided', () => {
      const initialData = {
        fullName: 'John Doe',
        addressLine1: '123 Main St',
        addressLine2: 'Apt 4B',
        city: 'New York',
        stateProvince: 'NY',
        postalCode: '10001',
        country: 'US',
        phoneNumber: '+1 (555) 123-4567'
      };

      render(<AddressForm {...defaultProps} initialData={initialData} />);

      expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
      expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Apt 4B')).toBeInTheDocument();
      expect(screen.getByDisplayValue('New York')).toBeInTheDocument();
      expect(screen.getByDisplayValue('NY')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10001')).toBeInTheDocument();
      expect(screen.getByDisplayValue('United States')).toBeInTheDocument();
      expect(screen.getByDisplayValue('+1 (555) 123-4567')).toBeInTheDocument();
    });

    it('should show edit mode button text when editing', () => {
      render(<AddressForm {...defaultProps} isEdit={true} />);

      expect(screen.getByRole('button', { name: /update address/i })).toBeInTheDocument();
    });

    it('should disable form when loading', () => {
      render(<AddressForm {...defaultProps} isLoading={true} />);

      expect(fullNameInput()).toBeDisabled();
      expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields on submit', async () => {
      render(<AddressForm {...defaultProps} />);

      // fireEvent.submit on the form (rather than userEvent.click on the
      // submit button) reliably triggers onSubmit in the jsdom + React 19
      // test environment.
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
        expect(screen.getByText('Address line 1 is required')).toBeInTheDocument();
        expect(screen.getByText('City is required')).toBeInTheDocument();
        expect(screen.getByText('State/Province is required')).toBeInTheDocument();
        expect(screen.getByText('Postal code is required')).toBeInTheDocument();
        // Country defaults to 'GB' so it has no required error
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate phone number format on blur', async () => {
      render(<AddressForm {...defaultProps} />);

      await userEvent.type(phoneInput(), 'invalid-phone');
      await userEvent.tab();

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid phone number')).toBeInTheDocument();
      });
    });

    it('should accept valid phone number formats', async () => {
      render(<AddressForm {...defaultProps} />);

      const input = phoneInput();

      // Test various valid formats
      const validNumbers = [
        '+1 (555) 123-4567',
        '+44 20 7946 0958',
        '555-123-4567',
        '5551234567'
      ];

      for (const number of validNumbers) {
        await userEvent.clear(input);
        await userEvent.type(input, number);
        await userEvent.tab();

        // Should not show error
        expect(screen.queryByText('Please enter a valid phone number')).not.toBeInTheDocument();
      }
    });

    it('should clear field errors when user starts typing', async () => {
      render(<AddressForm {...defaultProps} />);

      // Trigger validation errors via form submit
      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
      });

      // Start typing in the field
      await userEvent.type(fullNameInput(), 'John');

      await waitFor(() => {
        expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      render(<AddressForm {...defaultProps} />);

      await userEvent.type(fullNameInput(), 'John Doe');
      await userEvent.type(addressLine1Input(), '123 Main St');
      await userEvent.type(addressLine2Input(), 'Apt 4B');
      await userEvent.type(cityInput(), 'New York');
      await userEvent.type(stateInput(), 'NY');
      await userEvent.type(postalInput(), '10001');
      await userEvent.selectOptions(countrySelect(), 'US');
      await userEvent.type(phoneInput(), '+1 (555) 123-4567');

      const submitButton = screen.getByRole('button', { name: /save address/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          fullName: 'John Doe',
          addressLine1: '123 Main St',
          addressLine2: 'Apt 4B',
          city: 'New York',
          stateProvince: 'NY',
          postalCode: '10001',
          country: 'US',
          phoneNumber: '+1 (555) 123-4567'
        });
      });
    });

    it('should submit form without optional fields', async () => {
      render(<AddressForm {...defaultProps} />);

      await userEvent.type(fullNameInput(), 'Jane Smith');
      await userEvent.type(addressLine1Input(), '456 Oak Ave');
      await userEvent.type(cityInput(), 'Los Angeles');
      await userEvent.type(stateInput(), 'CA');
      await userEvent.type(postalInput(), '90210');
      await userEvent.selectOptions(countrySelect(), 'US');

      const submitButton = screen.getByRole('button', { name: /save address/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          fullName: 'Jane Smith',
          addressLine1: '456 Oak Ave',
          addressLine2: '',
          city: 'Los Angeles',
          stateProvince: 'CA',
          postalCode: '90210',
          country: 'US',
          phoneNumber: ''
        });
      });
    });

    it('should handle cancel button click', async () => {
      render(<AddressForm {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should prevent submission when loading', async () => {
      render(<AddressForm {...defaultProps} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();

      // Try to click anyway (should not trigger onSubmit)
      await userEvent.click(submitButton);
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form structure and labels', () => {
      render(<AddressForm {...defaultProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();

      // Required fields should have the required attribute
      expect(fullNameInput()).toHaveAttribute('required');
      expect(addressLine1Input()).toHaveAttribute('required');
      expect(cityInput()).toHaveAttribute('required');
      expect(stateInput()).toHaveAttribute('required');
      expect(postalInput()).toHaveAttribute('required');
      expect(countrySelect()).toHaveAttribute('required');

      // Optional fields should not have required attribute
      expect(addressLine2Input()).not.toHaveAttribute('required');
      expect(phoneInput()).not.toHaveAttribute('required');
    });

    it('should associate error messages with form fields', async () => {
      render(<AddressForm {...defaultProps} />);

      fireEvent.submit(screen.getByRole('form'));

      await waitFor(() => {
        const input = fullNameInput();
        const errorElement = screen.getByText('Full name is required');

        expect(errorElement).toBeInTheDocument();
        expect(input).toHaveAttribute('aria-describedby');
      });
    });
  });
});
