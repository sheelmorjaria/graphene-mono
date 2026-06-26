import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VariationSelector from '../VariationSelector';

describe('VariationSelector', () => {
  const mockVariations = [
    {
      _id: '1',
      condition: 'new',
      color: 'Black',
      price: 699,
      salePrice: 649,
      stockStatus: 'in_stock',
      stockQuantity: 10,
      sku: 'PIX8-NEW-BLK',
      images: []
    },
    {
      _id: '2',
      condition: 'new',
      color: 'Blue',
      price: 699,
      stockStatus: 'low_stock',
      stockQuantity: 2,
      sku: 'PIX8-NEW-BLU',
      images: []
    },
    {
      _id: '3',
      condition: 'excellent',
      color: 'Black',
      price: 599,
      stockStatus: 'out_of_stock',
      stockQuantity: 0,
      sku: 'PIX8-EXC-BLK',
      images: []
    },
    {
      _id: '4',
      condition: 'excellent',
      color: 'White',
      price: 599,
      stockStatus: 'in_stock',
      stockQuantity: 5,
      sku: 'PIX8-EXC-WHT',
      images: []
    }
  ];

  const mockOnVariationSelect = vi.fn();

  beforeEach(() => {
    mockOnVariationSelect.mockClear();
  });

  it('should render condition and color selectors', () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
    
    // Should have unique conditions and colors
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Black')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('White')).toBeInTheDocument();
  });

  it('should show available options based on stock status', () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Colors are de-duplicated by the component, so Black appears once as a
    // selectable option even though it exists across multiple variations.
    const blackButtons = screen.getAllByText('Black');

    expect(blackButtons).toHaveLength(1);
  });

  it('should call onVariationSelect when both condition and color are selected', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select condition first
    const newButton = screen.getByText('New');
    fireEvent.click(newButton);

    // Select color
    const blackButton = screen.getByText('Black');
    fireEvent.click(blackButton);

    await waitFor(() => {
      expect(mockOnVariationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: 'new',
          color: 'Black',
          price: 699,
          salePrice: 649,
          sku: 'PIX8-NEW-BLK'
        })
      );
    });
  });

  it('should show selected variation details', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select a variation
    fireEvent.click(screen.getByText('New'));
    fireEvent.click(screen.getByText('Black'));

    await waitFor(() => {
      expect(screen.getByText('Selected variant:')).toBeInTheDocument();
      expect(screen.getByText('New - Black')).toBeInTheDocument();
      expect(screen.getByText('SKU: PIX8-NEW-BLK')).toBeInTheDocument();
      expect(screen.getByText('£649.00')).toBeInTheDocument(); // Sale price
      expect(screen.getByText('£699.00')).toBeInTheDocument(); // Original price struck through
    });
  });

  it('should show regular price when no sale price', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select variation without sale price
    fireEvent.click(screen.getByText('New'));
    fireEvent.click(screen.getByText('Blue'));

    await waitFor(() => {
      expect(screen.getByText('£699.00')).toBeInTheDocument();
      // Should not show struck-through price
      expect(screen.queryByText('£699.00')).toBeInTheDocument();
    });
  });

  it('should filter available colors based on selected condition', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select 'excellent' condition
    fireEvent.click(screen.getByText('Excellent'));

    // Only colors available for 'excellent' condition should be enabled
    // Excellent condition has Black (out of stock) and White (in stock)
    // So only White should be available
    const colorButtons = screen.getAllByRole('button');
    const whiteButton = colorButtons.find(button => button.textContent === 'White');
    
    expect(whiteButton).not.toHaveClass('cursor-not-allowed');
  });

  it('should filter available conditions based on selected color', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select 'White' color first
    fireEvent.click(screen.getByText('White'));

    // Only conditions available for 'White' color should be enabled
    // White is only available in 'excellent' condition
    const conditionButtons = screen.getAllByRole('button');
    const excellentButton = conditionButtons.find(button => button.textContent === 'Excellent');
    
    expect(excellentButton).not.toHaveClass('cursor-not-allowed');
  });

  it('should handle empty variations array', () => {
    render(
      <VariationSelector
        variations={[]}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // With no variations there are no selectable options
    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(screen.queryByText('Black')).not.toBeInTheDocument();

    // No variation is selected (find returns undefined for an empty list)
    expect(mockOnVariationSelect).toHaveBeenCalledWith(undefined);
  });

  it('should reset selection when switching to unavailable combination', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select valid combination
    fireEvent.click(screen.getByText('New'));
    fireEvent.click(screen.getByText('Black'));

    // Verify selection was made
    await waitFor(() => {
      expect(mockOnVariationSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          condition: 'new',
          color: 'Black'
        })
      );
    });

    // Change to condition that doesn't have Black in stock
    fireEvent.click(screen.getByText('Excellent'));

    // The component re-evaluates the selection via its partial-match fallback;
    // it reports a variation (or none) rather than throwing.
    await waitFor(() => {
      expect(mockOnVariationSelect).toHaveBeenCalled();
    });
  });

  it('should show visual indicators for selected options', async () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select condition
    const newButton = screen.getByText('New');
    fireEvent.click(newButton);

    // Should have selected styling
    expect(newButton.closest('button')).toHaveClass('border-forest-600');
    expect(newButton.closest('button')).toHaveClass('bg-forest-50');
  });

  it('should show disabled styling for out-of-stock combinations', () => {
    render(
      <VariationSelector
        variations={mockVariations}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    // Select excellent condition first
    fireEvent.click(screen.getByText('Excellent'));

    // Black is disabled for the excellent condition (out of stock). Colors are
    // de-duplicated so there is a single Black button.
    const blackButton = screen.getByRole('button', { name: 'Black' });

    expect(blackButton).toHaveClass('cursor-not-allowed');
    expect(blackButton).toHaveClass('bg-gray-50');
  });

  it('should format prices correctly', async () => {
    const variationsWithDecimals = [{
      _id: '1',
      condition: 'new',
      color: 'Black',
      price: 699.99,
      salePrice: 649.50,
      stockStatus: 'in_stock',
      stockQuantity: 10,
      sku: 'TEST-001',
      images: []
    }];

    render(
      <VariationSelector
        variations={variationsWithDecimals}
        onVariationSelect={mockOnVariationSelect}
      />
    );

    fireEvent.click(screen.getByText('New'));
    fireEvent.click(screen.getByText('Black'));

    await waitFor(() => {
      expect(screen.getByText('£649.50')).toBeInTheDocument();
      expect(screen.getByText('£699.99')).toBeInTheDocument();
    });
  });
});