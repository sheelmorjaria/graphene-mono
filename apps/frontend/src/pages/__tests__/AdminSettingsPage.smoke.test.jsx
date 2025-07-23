import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import AdminSettingsPage from '../AdminSettingsPage';

// Mock the settings components to avoid complex dependencies
vi.mock('../../components/settings/GeneralSettings', () => ({
  default: () => <div data-testid="general-settings">General Settings Component</div>
}));

vi.mock('../../components/settings/ShippingSettings', () => ({
  default: () => <div data-testid="shipping-settings">Shipping Settings Component</div>
}));

vi.mock('../../components/settings/TaxSettings', () => ({
  default: () => <div data-testid="tax-settings">Tax Settings Component</div>
}));

vi.mock('../../components/settings/PaymentSettings', () => ({
  default: () => <div data-testid="payment-settings">Payment Settings Component</div>
}));

// Create a mock AuthContext value for admin user
const _mockAuthContextValue = {
  user: {
    id: 1,
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin'
  },
  login: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: true,
  loading: false
};

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the settings page with tabs', () => {
    render(<AdminSettingsPage />);

    // Check if the main title is rendered
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Check if tab navigation is rendered
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Shipping')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
  });

  it('should show general settings by default', () => {
    render(<AdminSettingsPage />);

    // General settings should be visible by default
    expect(screen.getByTestId('general-settings')).toBeInTheDocument();
    
    // Other tabs should not be visible
    expect(screen.queryByTestId('shipping-settings')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tax-settings')).not.toBeInTheDocument();
    expect(screen.queryByTestId('payment-settings')).not.toBeInTheDocument();
  });

  it('should have proper tab structure', () => {
    render(<AdminSettingsPage />);

    // Check for navigation tabs (they are buttons, not formal tabs)
    const generalTab = screen.getByRole('button', { name: /general/i });
    const shippingTab = screen.getByRole('button', { name: /shipping/i });
    const taxTab = screen.getByRole('button', { name: /tax/i });
    const paymentsTab = screen.getByRole('button', { name: /payments/i });
    
    expect(generalTab).toBeInTheDocument();
    expect(shippingTab).toBeInTheDocument();
    expect(taxTab).toBeInTheDocument();
    expect(paymentsTab).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<AdminSettingsPage />);
    }).not.toThrow();
  });
});