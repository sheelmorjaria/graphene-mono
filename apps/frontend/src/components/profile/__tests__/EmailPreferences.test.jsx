import React from 'react';
import { render, screen, waitFor, userEvent } from '../../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import EmailPreferences from '../EmailPreferences';

// Mock profileService
vi.mock('../../../services/profileService', () => ({
  getEmailPreferences: vi.fn(),
  updateEmailPreferences: vi.fn()
}));

import { getEmailPreferences, updateEmailPreferences } from '../../../services/profileService';

const basePreferences = {
  globalUnsubscribe: false,
  notifications: {
    orderStatusUpdates: true,
    deliveryUpdates: false,
    priceDropAlerts: false,
    backInStockAlerts: false,
    newProductAlerts: false
  },
  marketing: {
    promotions: false,
    newsletter: false,
    productRecommendations: false,
    surveyInvitations: false
  },
  emailStatus: { isValid: true }
};

describe('EmailPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    getEmailPreferences.mockReturnValue(new Promise(() => {}));
    render(<EmailPreferences />);

    expect(screen.queryByText('Email Preferences')).not.toBeInTheDocument();
    // Loading skeleton renders a card without the heading
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders preferences after successful load', async () => {
    getEmailPreferences.mockResolvedValue({ preferences: basePreferences });
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByText('Email Preferences')).toBeInTheDocument();
    });

    expect(screen.getByText('Order Status Updates')).toBeInTheDocument();
    expect(screen.getByText('Promotions & Offers')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
  });

  it('shows error when load fails', async () => {
    getEmailPreferences.mockRejectedValue(new Error('boom'));
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load email preferences')).toBeInTheDocument();
    });
  });

  it('toggles a notification checkbox', async () => {
    getEmailPreferences.mockResolvedValue({ preferences: basePreferences });
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByText('Order Status Updates')).toBeInTheDocument();
    });

    const orderStatus = screen.getByRole('checkbox', { name: /order status updates/i });
    expect(orderStatus).toBeChecked();

    await userEvent.click(orderStatus);
    expect(orderStatus).not.toBeChecked();
  });

  it('toggles the global unsubscribe checkbox', async () => {
    getEmailPreferences.mockResolvedValue({ preferences: basePreferences });
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByText('Unsubscribe from all emails')).toBeInTheDocument();
    });

    const global = screen.getByRole('checkbox', { name: /unsubscribe from all emails/i });
    expect(global).not.toBeChecked();

    await userEvent.click(global);
    expect(global).toBeChecked();
  });

  it('saves preferences and shows success message', async () => {
    getEmailPreferences.mockResolvedValue({ preferences: basePreferences });
    updateEmailPreferences.mockResolvedValue({ success: true });
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(updateEmailPreferences).toHaveBeenCalledWith(basePreferences);
    });

    await waitFor(() => {
      expect(screen.getByText('Email preferences updated successfully!')).toBeInTheDocument();
    });

    // Success message clears after 3 seconds
    vi.advanceTimersByTime(3100);
    await waitFor(() => {
      expect(screen.queryByText('Email preferences updated successfully!')).not.toBeInTheDocument();
    });
  });

  it('shows error when save fails', async () => {
    getEmailPreferences.mockResolvedValue({ preferences: basePreferences });
    updateEmailPreferences.mockRejectedValue(new Error('save failed'));
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update preferences. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows saving state on the button during save', async () => {
    getEmailPreferences.mockResolvedValue({ preferences: basePreferences });
    let resolveSave;
    updateEmailPreferences.mockReturnValue(new Promise(resolve => { resolveSave = resolve; }));
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /save preferences/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving\.\.\./i })).toBeDisabled();
    });

    resolveSave({ success: true });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save preferences/i })).toBeInTheDocument();
    });
  });

  it('shows email issue warning when email is not valid', async () => {
    getEmailPreferences.mockResolvedValue({
      preferences: { ...basePreferences, emailStatus: { isValid: false } }
    });
    render(<EmailPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/email issue/i)).toBeInTheDocument();
    });
  });
});
