import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import VerifyEmail from '../VerifyEmail';

// Mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom: preserve real exports (MemoryRouter, useSearchParams)
// and only override useNavigate.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderVerifyEmail = (searchString = '?token=valid-token') => {
  return render(
    <MemoryRouter initialEntries={[`/verify-email${searchString}`]}>
      <VerifyEmail />
    </MemoryRouter>
  );
};

describe('VerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Loading state', () => {
    it('should show verifying state on mount while fetch is in flight', () => {
      // Never-resolving fetch so the verifying state stays visible
      mockFetch.mockImplementation(() => new Promise(() => {}));

      renderVerifyEmail();

      expect(
        screen.getByRole('heading', { name: /verifying your email/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/please wait while we verify your email address/i)
      ).toBeInTheDocument();
    });
  });

  describe('Successful verification', () => {
    it('should show success state when verification succeeds', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ success: true, message: 'ok' }),
      });

      renderVerifyEmail();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /email verified!/i })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('Your email has been verified successfully!')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/redirecting you to login page/i)
      ).toBeInTheDocument();
    });

    it('should call the verify endpoint with the token from query string', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      renderVerifyEmail('?token=abc-123');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('/api/auth/verify-email');
      expect(calledUrl).toContain('token=abc-123');
      expect(mockFetch.mock.calls[0][1]).toEqual(
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('Verification error / expired token', () => {
    it('should show error state when API returns failure with error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ success: false, error: 'Token has expired' }),
      });

      renderVerifyEmail();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /verification failed/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Token has expired')).toBeInTheDocument();
    });

    it('should show generic failure message when API returns failure without error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false }),
      });

      renderVerifyEmail();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /verification failed/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });

    it('should show network error message when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network down'));

      renderVerifyEmail();

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /verification failed/i })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          /an error occurred during verification. the link may be expired or invalid/i
        )
      ).toBeInTheDocument();
    });

    it('should show error state when no token is provided', async () => {
      renderVerifyEmail('');

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /verification failed/i })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('No verification token provided')
      ).toBeInTheDocument();
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should redirect to login with verified flag 3 seconds after success', async () => {
      vi.useFakeTimers();
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      renderVerifyEmail();

      // Let the fetch promise resolve and component re-render to success state.
      // (Microtasks flush without advancing the fake setTimeout timer.)
      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /email verified!/i })
        ).toBeInTheDocument();
      });

      // Navigate should not yet have been called by the 3s timer
      expect(mockNavigate).not.toHaveBeenCalled();

      // Advance past the 3-second redirect
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/login?verified=true');
    });

    it('should navigate to login when Go to Login button is clicked in success state', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      renderVerifyEmail();

      const goButton = await screen.findByRole('button', {
        name: /go to login/i,
      });
      await userEvent.click(goButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should navigate to register when Register Again button is clicked in error state', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'expired' }),
      });

      renderVerifyEmail();

      const registerButton = await screen.findByRole('button', {
        name: /register again/i,
      });
      await userEvent.click(registerButton);

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('should navigate to login when Go to Login button is clicked in error state', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ success: false, error: 'expired' }),
      });

      renderVerifyEmail();

      const loginButton = await screen.findByRole('button', {
        name: /go to login/i,
      });
      await userEvent.click(loginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
