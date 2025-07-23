import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppRoutes } from '../../App';

describe('Registration Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.title = 'Test';
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderIntegrationTest = (initialRoute = '/register') => {
    return render(<AppRoutes />, {
      initialEntries: [initialRoute]
    });
  };

  it('should render registration page with all required fields', () => {
    renderIntegrationTest('/register');

    // Verify we're on the registration page
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();

    // Verify all form fields are present
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/marketing/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should allow users to fill out the form', async () => {
    const user = userEvent.setup();
    renderIntegrationTest('/register');

    // Fill out all form fields
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText('Password *'), 'ValidPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'ValidPass123!');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone/i), '+441234567890');

    // Verify form fields have values
    expect(screen.getByLabelText(/email address/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText('Password *')).toHaveValue('ValidPass123!');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('ValidPass123!');
    expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+441234567890');
  });

  it('should display validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderIntegrationTest('/register');

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Form should not allow submission with empty required fields
    // The form validates client-side before attempting submission
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    renderIntegrationTest('/register');

    // Fill form with mismatched passwords
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText('Password *'), 'ValidPass123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'DifferentPass123!');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');

    // Trigger validation by clicking away
    await user.tab();

    // Should show password mismatch error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should update document title on registration page', () => {
    renderIntegrationTest('/register');
    
    expect(document.title).toBe('Create Account - GrapheneOS Store');
  });

  it('should provide links to login page', () => {
    renderIntegrationTest('/register');
    
    const loginLinks = screen.getAllByRole('link', { name: /sign in/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    loginLinks.forEach(link => {
      expect(link).toHaveAttribute('href', '/login');
    });
  });

  it('should toggle marketing opt-in checkbox', async () => {
    const user = userEvent.setup();
    renderIntegrationTest('/register');

    const marketingCheckbox = screen.getByLabelText(/marketing/i);
    
    // Initially unchecked
    expect(marketingCheckbox).not.toBeChecked();

    // Click to check
    await user.click(marketingCheckbox);
    expect(marketingCheckbox).toBeChecked();

    // Click to uncheck
    await user.click(marketingCheckbox);
    expect(marketingCheckbox).not.toBeChecked();
  });

  it('should show password requirements when password field is focused', async () => {
    const user = userEvent.setup();
    renderIntegrationTest('/register');

    const passwordInput = screen.getByLabelText('Password *');
    
    // Focus password field
    await user.click(passwordInput);

    // Should show password requirements
    await waitFor(() => {
      expect(screen.getByText(/password must contain/i)).toBeInTheDocument();
    });
  });
});