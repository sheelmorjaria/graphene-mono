import React from 'react';
import { render, screen, waitFor, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MyAddressesPage from '../MyAddressesPage';

// Mock addressService
vi.mock('../../services/addressService', () => ({
  getUserAddresses: vi.fn(),
  addUserAddress: vi.fn(),
  updateUserAddress: vi.fn(),
  deleteUserAddress: vi.fn()
}));

import {
  getUserAddresses,
  addUserAddress,
  updateUserAddress,
  deleteUserAddress
} from '../../services/addressService';

// Mock AddressForm — expose an onSubmit trigger via a button
vi.mock('../../components/AddressForm', () => {
  const MockAddressForm = ({ onSubmit, onCancel, isEdit, isLoading }) => (
    <div data-testid="address-form">
      <span data-testid="form-mode">{isEdit ? 'edit' : 'add'}</span>
      <span data-testid="form-loading">{isLoading ? 'loading' : 'idle'}</span>
      <button onClick={() => onSubmit({ fullName: 'New Person' })}>Submit Form</button>
      <button onClick={onCancel}>Cancel Form</button>
    </div>
  );
  return { __esModule: true, default: MockAddressForm };
});

const makeAddress = (overrides = {}) => ({
  _id: 'addr-1',
  fullName: 'John Doe',
  addressLine1: '123 Main St',
  addressLine2: '',
  city: 'London',
  stateProvince: 'London',
  postalCode: 'SW1A 1AA',
  country: 'United Kingdom',
  phoneNumber: '07000000000',
  isDefault: false,
  ...overrides
});

describe('MyAddressesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading state initially', () => {
    getUserAddresses.mockReturnValue(new Promise(() => {}));
    render(<MyAddressesPage />);

    expect(screen.getByText('Loading addresses...')).toBeInTheDocument();
  });

  it('shows empty state when no addresses', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [] } });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't added any addresses yet.")).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /add your first address/i })).toBeInTheDocument();
  });

  it('renders addresses list on success', async () => {
    const addresses = [
      makeAddress({ _id: 'a1', fullName: 'John Doe', isDefault: true }),
      makeAddress({ _id: 'a2', fullName: 'Jane Smith' })
    ];
    getUserAddresses.mockResolvedValue({ data: { addresses } });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Default')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
  });

  it('shows error when load fails', async () => {
    getUserAddresses.mockRejectedValue(new Error('Cannot load'));
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Cannot load');
    });
  });

  it('uses fallback error message when err has no message', async () => {
    getUserAddresses.mockRejectedValue({});
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Failed to load addresses');
    });
  });

  it('opens add form when Add New Address clicked', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [] } });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText("You haven't added any addresses yet.")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /add your first address/i }));

    await waitFor(() => {
      expect(screen.getByText('Add New Address')).toBeInTheDocument();
    });
    expect(screen.getByTestId('form-mode')).toHaveTextContent('add');
  });

  it('opens edit form with selected address', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [makeAddress()] } });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByText('Edit Address')).toBeInTheDocument();
    });
    expect(screen.getByTestId('form-mode')).toHaveTextContent('edit');
  });

  it('adds an address via form submission', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [] } });
    addUserAddress.mockResolvedValue({ success: true });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add your first address/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /add your first address/i }));

    await waitFor(() => {
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Submit Form'));

    await waitFor(() => {
      expect(addUserAddress).toHaveBeenCalledWith({ fullName: 'New Person' });
    });
  });

  it('updates an address via form submission when editing', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [makeAddress({ _id: 'a1' })] } });
    updateUserAddress.mockResolvedValue({ success: true });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    await waitFor(() => {
      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Submit Form'));

    await waitFor(() => {
      expect(updateUserAddress).toHaveBeenCalledWith('a1', { fullName: 'New Person' });
    });
  });

  it('cancels the form', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [] } });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add your first address/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /add your first address/i }));

    await waitFor(() => {
      expect(screen.getByText('Cancel Form')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Cancel Form'));

    await waitFor(() => {
      expect(screen.getByText("You haven't added any addresses yet.")).toBeInTheDocument();
    });
  });

  it('deletes an address after confirmation', async () => {
    const addresses = [
      makeAddress({ _id: 'a1', fullName: 'John Doe' }),
      makeAddress({ _id: 'a2', fullName: 'Jane Smith' })
    ];
    getUserAddresses.mockResolvedValue({ data: { addresses } });
    deleteUserAddress.mockResolvedValue({ success: true });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(deleteUserAddress).toHaveBeenCalledWith('a1');
    });
  });

  it('does not delete when confirmation cancelled', async () => {
    const addresses = [
      makeAddress({ _id: 'a1', fullName: 'John Doe' }),
      makeAddress({ _id: 'a2', fullName: 'Jane Smith' })
    ];
    getUserAddresses.mockResolvedValue({ data: { addresses } });
    window.confirm = vi.fn(() => false);
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    expect(deleteUserAddress).not.toHaveBeenCalled();
  });

  it('shows delete error when delete fails', async () => {
    const addresses = [
      makeAddress({ _id: 'a1', fullName: 'John Doe' }),
      makeAddress({ _id: 'a2', fullName: 'Jane Smith' })
    ];
    getUserAddresses.mockResolvedValue({ data: { addresses } });
    deleteUserAddress.mockRejectedValue(new Error('Delete failed'));
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0]);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Delete failed');
    });
  });

  it('disables delete when only one address remains', async () => {
    getUserAddresses.mockResolvedValue({ data: { addresses: [makeAddress({ _id: 'a1' })] } });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    expect(deleteButton).toBeDisabled();
    expect(deleteButton).toHaveAttribute('title', 'Cannot delete your only address');
  });

  it('renders address line 2 when present', async () => {
    getUserAddresses.mockResolvedValue({
      data: { addresses: [makeAddress({ addressLine2: 'Apt 4B' })] }
    });
    render(<MyAddressesPage />);

    await waitFor(() => {
      expect(screen.getByText('Apt 4B')).toBeInTheDocument();
    });
  });
});
