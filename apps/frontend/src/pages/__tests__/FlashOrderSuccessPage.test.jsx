import React from 'react';
import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FlashOrderSuccessPage from '../FlashOrderSuccessPage';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock flashOrderService
vi.mock('../../services/flashOrderService', () => ({
  getFlashOrderInstructions: vi.fn()
}));

// Mock SEOWrapper to avoid side effects / duplicate text
vi.mock('../../components/SEO/SEOWrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="seo-wrapper" />
}));

import { getFlashOrderInstructions } from '../../services/flashOrderService';

const fullInstructions = {
  orderNumber: 'FLASH-1001',
  orderStatus: 'paid',
  paymentStatus: 'completed',
  poBoxAddress: {
    street: '123 PO Box St',
    city: 'London',
    postalCode: 'SW1A 1AA',
    country: 'United Kingdom'
  },
  instructions: 'Extra details here'
};

const renderPage = (query = '?orderId=order-123') => {
  return render(<FlashOrderSuccessPage />, {
    initialEntries: [`/flash/success${query}`]
  });
};

describe('FlashOrderSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    getFlashOrderInstructions.mockReturnValue(new Promise(() => {}));
    renderPage();

    expect(screen.getByText('Loading your order information...')).toBeInTheDocument();
  });

  it('shows error when no order id in query', async () => {
    render(<FlashOrderSuccessPage />, { initialEntries: ['/flash/success'] });

    await waitFor(() => {
      expect(screen.getByText('No order ID provided')).toBeInTheDocument();
    });
  });

  it('renders order instructions on success', async () => {
    getFlashOrderInstructions.mockResolvedValue(fullInstructions);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Order Confirmed!')).toBeInTheDocument();
    });

    expect(screen.getAllByText('FLASH-1001').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('123 PO Box St')).toBeInTheDocument();
    expect(screen.getByText('Extra details here')).toBeInTheDocument();
    expect(screen.getByText('Send Your Device To:')).toBeInTheDocument();
    expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    expect(screen.getByText('Print Instructions')).toBeInTheDocument();
  });

  it('shows payment pending message on 403 error', async () => {
    getFlashOrderInstructions.mockRejectedValue(new Error('Error 403: forbidden'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Please complete your payment to access shipping instructions.')).toBeInTheDocument();
    });
    expect(screen.getByText('Order Pending')).toBeInTheDocument();
  });

  it('shows payment pending message on complete payment error', async () => {
    getFlashOrderInstructions.mockRejectedValue(new Error('You must complete payment first'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Please complete your payment to access shipping instructions.')).toBeInTheDocument();
    });
  });

  it('shows generic error message on other failures', async () => {
    getFlashOrderInstructions.mockRejectedValue(new Error('Something went wrong'));
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('navigates to products when Return to Shop clicked (error state)', async () => {
    render(<FlashOrderSuccessPage />, { initialEntries: ['/flash/success'] });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /return to shop/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /return to shop/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('navigates to products when Continue Shopping clicked (success state)', async () => {
    getFlashOrderInstructions.mockResolvedValue(fullInstructions);
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Continue Shopping')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /continue shopping/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });

  it('calls getFlashOrderInstructions with the orderId', async () => {
    getFlashOrderInstructions.mockResolvedValue(fullInstructions);
    renderPage('?orderId=abc-999');

    await waitFor(() => {
      expect(getFlashOrderInstructions).toHaveBeenCalledWith('abc-999');
    });
  });
});
