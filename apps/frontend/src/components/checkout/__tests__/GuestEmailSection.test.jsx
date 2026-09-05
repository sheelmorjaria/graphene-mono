import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import GuestEmailSection from '../GuestEmailSection';

// Light checkout-context stub — only what this component consumes
const checkoutRef = { current: { guestEmail: '', setGuestEmail: vi.fn() } };

vi.mock('../../../contexts/CheckoutContext', () => ({
  isValidEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || ''),
  useCheckout: () => checkoutRef.current
}));

describe('GuestEmailSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkoutRef.current = { guestEmail: '', setGuestEmail: vi.fn() };
  });

  it('renders the email input with a required marker', () => {
    render(<GuestEmailSection />);

    const input = screen.getByTestId('guest-email-input');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
    expect(screen.getByText(/Email Address/)).toBeInTheDocument();
  });

  it('shows the receipt hint before the field is touched', () => {
    render(<GuestEmailSection />);

    expect(
      screen.getByText(/order confirmation and receipt will be emailed/i)
    ).toBeInTheDocument();
    expect(screen.queryByTestId('guest-email-error')).not.toBeInTheDocument();
  });

  it('routes input through setGuestEmail on change (context normalizes)', () => {
    render(<GuestEmailSection />);

    fireEvent.change(screen.getByTestId('guest-email-input'), {
      target: { value: 'Guest@Example.COM' }
    });

    expect(checkoutRef.current.setGuestEmail).toHaveBeenCalledWith('Guest@Example.COM');
  });

  it('shows a validation error on blur when empty', () => {
    render(<GuestEmailSection />);

    fireEvent.blur(screen.getByTestId('guest-email-input'));

    expect(screen.getByTestId('guest-email-error')).toBeInTheDocument();
    expect(
      screen.getByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it('shows a validation error on blur when malformed', () => {
    checkoutRef.current.guestEmail = 'not-an-email';
    render(<GuestEmailSection />);

    fireEvent.blur(screen.getByTestId('guest-email-input'));

    expect(screen.getByTestId('guest-email-error')).toBeInTheDocument();
  });

  it('shows no error on blur when the email is valid', () => {
    checkoutRef.current.guestEmail = 'guest@example.com';
    render(<GuestEmailSection />);

    fireEvent.blur(screen.getByTestId('guest-email-input'));

    expect(screen.queryByTestId('guest-email-error')).not.toBeInTheDocument();
  });
});
