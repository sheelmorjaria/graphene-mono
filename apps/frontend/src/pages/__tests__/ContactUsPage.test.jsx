import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContactUsPage from '../ContactUsPage';
import { AuthStateContext, AuthDispatchContext } from '../../contexts/AuthContext';
import * as supportService from '../../services/supportService';

// Mock the support service
vi.mock('../../services/supportService', () => ({
  submitContactForm: vi.fn()
}));

// Mock user for pre-fill tests
const mockUser = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
};

// Build a real AuthContext value matching the reducer state shape so the
// component's useAuth() call resolves correctly. AuthProvider ignores any
// `value` prop, so we provide the context objects directly.
const noopDispatch = () => {};

const AuthStateWrapper = ({ children, isAuthenticated = false, user = null }) => (
  <AuthStateContext.Provider
    value={{
      user,
      isAuthenticated,
      isLoading: false,
      error: null
    }}
  >
    <AuthDispatchContext.Provider value={noopDispatch}>
      {children}
    </AuthDispatchContext.Provider>
  </AuthStateContext.Provider>
);

const renderContactUsPage = (authProps = {}) => {
  return render(
    <AuthStateWrapper {...authProps}>
      <ContactUsPage />
    </AuthStateWrapper>
  );
};

describe('ContactUsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document title
    document.title = '';
  });

  describe('Initial render', () => {
    it('renders contact form with all required fields', () => {
      renderContactUsPage();

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/order number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('sets page title correctly', () => {
      renderContactUsPage();
      expect(document.title).toBe('Contact Us - Graphene Security');
    });

    it('displays subject dropdown options', () => {
      renderContactUsPage();

      const subjectSelect = screen.getByLabelText(/subject/i);
      expect(subjectSelect).toBeInTheDocument();

      // Check if default option is present
      expect(screen.getByText('Select a subject')).toBeInTheDocument();
    });
  });

  describe('Pre-filled form for authenticated users', () => {
    it('pre-fills name and email for logged-in users', async () => {
      renderContactUsPage({ isAuthenticated: true, user: mockUser });

      // Pre-fill happens in a useEffect after mount
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      await waitFor(() => {
        expect(nameInput.value).toBe('John Doe');
        expect(emailInput.value).toBe('john.doe@example.com');
      });
    });

    it('does not pre-fill fields for non-authenticated users', () => {
      renderContactUsPage({ isAuthenticated: false });

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      expect(nameInput.value).toBe('');
      expect(emailInput.value).toBe('');
    });
  });

  describe('Form validation', () => {
    it('shows validation error for empty full name', async () => {
      renderContactUsPage();

      const nameInput = screen.getByLabelText(/full name/i);

      // The component validates on change; type then clear to trigger the
      // required-error (focus/blur alone do not run validation).
      fireEvent.change(nameInput, { target: { value: 'a' } });
      fireEvent.change(nameInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email format', async () => {
      renderContactUsPage();

      const emailInput = screen.getByLabelText(/email address/i);

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    it('shows validation error for empty email', async () => {
      renderContactUsPage();

      const emailInput = screen.getByLabelText(/email address/i);

      fireEvent.change(emailInput, { target: { value: 'a' } });
      fireEvent.change(emailInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for empty subject', async () => {
      renderContactUsPage();

      const subjectSelect = screen.getByLabelText(/subject/i);

      // Select a value then reset to the empty default option
      fireEvent.change(subjectSelect, { target: { value: 'order-inquiry' } });
      fireEvent.change(subjectSelect, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Please select a subject')).toBeInTheDocument();
      });
    });

    it('shows validation error for empty message', async () => {
      renderContactUsPage();

      const messageTextarea = screen.getByLabelText(/message/i);

      fireEvent.change(messageTextarea, { target: { value: 'a' } });
      fireEvent.change(messageTextarea, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });
    });

    it('validates email format in real-time', async () => {
      renderContactUsPage();

      const emailInput = screen.getByLabelText(/email address/i);

      // Type invalid email
      fireEvent.change(emailInput, { target: { value: 'test@' } });

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });

      // Type valid email
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      await waitFor(() => {
        expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    const fillValidForm = () => {
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByLabelText(/subject/i), {
        target: { value: 'product-question' }
      });
      fireEvent.change(screen.getByLabelText(/message/i), {
        target: { value: 'Test message' }
      });
    };

    it('prevents submission with validation errors', async () => {
      renderContactUsPage();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Full name is required')).toBeInTheDocument();
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Please select a subject')).toBeInTheDocument();
        expect(screen.getByText('Message is required')).toBeInTheDocument();
      });

      expect(supportService.submitContactForm).not.toHaveBeenCalled();
    });

    it('submits form with valid data', async () => {
      supportService.submitContactForm.mockResolvedValue({
        success: true,
        message: 'Message sent successfully'
      });

      renderContactUsPage();
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supportService.submitContactForm).toHaveBeenCalledWith({
          fullName: 'John Doe',
          email: 'john@example.com',
          subject: 'product-question',
          orderNumber: '',
          message: 'Test message'
        });
      });
    });

    it('shows loading state during submission', async () => {
      supportService.submitContactForm.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );

      renderContactUsPage();
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      expect(screen.getByText('Sending...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('shows success message after successful submission', async () => {
      supportService.submitContactForm.mockResolvedValue({
        success: true,
        message: 'Message sent successfully'
      });

      renderContactUsPage();
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Message Sent!')).toBeInTheDocument();
        expect(screen.getByText(/Your message has been sent/i)).toBeInTheDocument();
      });
    });

    it('shows error message on submission failure', async () => {
      supportService.submitContactForm.mockRejectedValue(
        new Error('Network error')
      );

      renderContactUsPage();
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send message. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles rate limit error specifically', async () => {
      supportService.submitContactForm.mockRejectedValue(
        new Error('Too many requests - rate limit exceeded')
      );

      renderContactUsPage();
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Too many submissions. Please wait before trying again.')).toBeInTheDocument();
      });
    });

    it('clears form after successful submission', async () => {
      supportService.submitContactForm.mockResolvedValue({
        success: true,
        message: 'Message sent successfully'
      });

      renderContactUsPage();
      fillValidForm();

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Message Sent!')).toBeInTheDocument();
      });

      // Click "Send Another Message" to go back to form
      const sendAnotherButton = screen.getByText('Send Another Message');
      fireEvent.click(sendAnotherButton);

      // Form should be cleared
      expect(screen.getByLabelText(/full name/i).value).toBe('');
      expect(screen.getByLabelText(/email address/i).value).toBe('');
      expect(screen.getByLabelText(/subject/i).value).toBe('');
      expect(screen.getByLabelText(/order number/i).value).toBe('');
      expect(screen.getByLabelText(/message/i).value).toBe('');
    });

    it('includes optional order number in submission', async () => {
      supportService.submitContactForm.mockResolvedValue({
        success: true,
        message: 'Message sent successfully'
      });

      renderContactUsPage();
      fillValidForm();

      fireEvent.change(screen.getByLabelText(/order number/i), {
        target: { value: 'ORD-12345' }
      });

      const submitButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supportService.submitContactForm).toHaveBeenCalledWith({
          fullName: 'John Doe',
          email: 'john@example.com',
          subject: 'product-question',
          orderNumber: 'ORD-12345',
          message: 'Test message'
        });
      });
    });
  });
});
