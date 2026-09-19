import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FlashServicePage from '../FlashServicePage';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: null, isAuthenticated: false }))
}));

vi.mock('../../components/SEO/SEOWrapper', () => ({
  default: ({ children }) => <div>{children}</div>
}));

vi.mock('../../components/checkout/FlashServiceForm', () => ({
  default: () => <div data-testid="flash-service-form">form</div>
}));

vi.mock('../../components/checkout/PayPalPayment', () => ({
  default: () => <div data-testid="paypal-payment">payment</div>
}));

vi.mock('../../services/flashOrderService', () => ({
  createFlashOrder: vi.fn(),
  formatFlashOrderCurrency: vi.fn((n) => `£${n.toFixed(2)}`),
  getShippingOption: vi.fn(() => ({ label: 'UK' }))
}));

const renderComponent = () => render(
  <BrowserRouter>
    <FlashServicePage />
  </BrowserRouter>
);

describe('FlashServicePage — device requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the carrier-unlocked and not-blacklisted requirements on the order step', () => {
    renderComponent();

    const requirements = screen.getByTestId('device-requirements');
    expect(requirements).toHaveTextContent(/carrier unlocked/i);
    expect(requirements).toHaveTextContent(/blacklisted/i);
    expect(requirements).toHaveTextContent(/IMEI/i);
  });

  it('renders the form step by default', () => {
    renderComponent();
    expect(screen.getByTestId('flash-service-form')).toBeInTheDocument();
  });
});
