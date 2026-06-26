import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VariationManager from '../VariationManager';

describe('VariationManager', () => {
  const mockOnVariationsChange = vi.fn();

  const mockVariations = [
    {
      _id: 'var-1',
      condition: 'new',
      color: 'Black',
      price: 699,
      salePrice: 649,
      stockQuantity: 10,
      stockStatus: 'in_stock',
      sku: 'PIX8-NEW-BLK',
      images: []
    },
    {
      _id: 'var-2',
      condition: 'excellent',
      color: 'Blue',
      price: 599,
      stockQuantity: 5,
      stockStatus: 'low_stock',
      sku: 'PIX8-EXC-BLU',
      images: []
    }
  ];

  beforeEach(() => {
    mockOnVariationsChange.mockClear();
  });

  it('should render variations manager with existing variations', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    expect(screen.getByText('Variations (2)')).toBeInTheDocument();
    expect(screen.getByText('Variation 1')).toBeInTheDocument();
    expect(screen.getByText('Variation 2')).toBeInTheDocument();
    expect(screen.getByText('Add Variation')).toBeInTheDocument();
  });

  it('should display variation details correctly', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Check first variation
    expect(screen.getByDisplayValue('Black')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PIX8-NEW-BLK')).toBeInTheDocument();
    expect(screen.getByDisplayValue('699')).toBeInTheDocument();
    expect(screen.getByDisplayValue('649')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();

    // Check second variation
    expect(screen.getByDisplayValue('Blue')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PIX8-EXC-BLU')).toBeInTheDocument();
    expect(screen.getByDisplayValue('599')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should populate price inputs for each variation', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Prices are rendered as editable input values (no formatted preview text)
    expect(screen.getByDisplayValue('699')).toBeInTheDocument();
    expect(screen.getByDisplayValue('649')).toBeInTheDocument();
    expect(screen.getByDisplayValue('599')).toBeInTheDocument();
  });

  it('should show variation preview with condition and color', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Display text includes condition, color and (empty) storage joined by ' - '
    expect(screen.getByText((_, node) => node?.textContent === 'new - Black - ')).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === 'excellent - Blue - ')).toBeInTheDocument();
  });

  it('should populate SKU and stock inputs', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // SKU and stock are rendered as editable inputs (no preview text)
    expect(screen.getByDisplayValue('PIX8-NEW-BLK')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('PIX8-EXC-BLU')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('should add new variation when Add Variation is clicked', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const addButton = screen.getByText('Add Variation');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          ...mockVariations,
          expect.objectContaining({
            condition: 'new',
            color: '',
            price: '',
            salePrice: '',
            stockQuantity: 0,
            stockStatus: 'in_stock',
            sku: '',
            images: []
          })
        ])
      );
    });
  });

  it('should remove variation when Remove is clicked', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([mockVariations[1]]);
    });
  });

  it('should prevent removing the last variation', () => {
    const singleVariation = [mockVariations[0]];
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <VariationManager
        variations={singleVariation}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Should not show remove button when only one variation
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();

    alertSpy.mockRestore();
  });

  it('should update variation field when input changes', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const colorInput = screen.getByDisplayValue('Black');
    fireEvent.change(colorInput, { target: { value: 'White' } });

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([
        {
          ...mockVariations[0],
          color: 'White'
        },
        mockVariations[1]
      ]);
    });
  });

  it('should update condition dropdown', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Condition is the first select in each variation card
    const conditionSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(conditionSelect, { target: { value: 'good' } });

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([
        {
          ...mockVariations[0],
          condition: 'good'
        },
        mockVariations[1]
      ]);
    });
  });

  it('should update price fields', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const priceInput = screen.getByDisplayValue('699');
    fireEvent.change(priceInput, { target: { value: '799' } });

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([
        {
          ...mockVariations[0],
          price: '799'
        },
        mockVariations[1]
      ]);
    });
  });

  it('should convert SKU to uppercase', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const skuInput = screen.getByDisplayValue('PIX8-NEW-BLK');
    fireEvent.change(skuInput, { target: { value: 'test-sku' } });

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([
        {
          ...mockVariations[0],
          sku: 'TEST-SKU'
        },
        mockVariations[1]
      ]);
    });
  });

  it('should update stock quantity as number', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const stockInputs = screen.getAllByDisplayValue('10');
    fireEvent.change(stockInputs[0], { target: { value: '15' } });

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([
        {
          ...mockVariations[0],
          stockQuantity: 15
        },
        mockVariations[1]
      ]);
    });
  });

  it('should update stock status dropdown', async () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Stock status is the second select in each variation card
    const stockStatusSelect = screen.getAllByRole('combobox')[1];
    fireEvent.change(stockStatusSelect, { target: { value: 'out_of_stock' } });

    await waitFor(() => {
      expect(mockOnVariationsChange).toHaveBeenCalledWith([
        {
          ...mockVariations[0],
          stockStatus: 'out_of_stock'
        },
        mockVariations[1]
      ]);
    });
  });

  it('should handle empty variations array', () => {
    render(
      <VariationManager
        variations={[]}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // No variation cards are rendered, but the Add Variation action remains
    expect(screen.getByText('Variations (0)')).toBeInTheDocument();
    expect(screen.getByText('Add Variation')).toBeInTheDocument();
    expect(screen.queryByText('Variation 1')).not.toBeInTheDocument();
  });

  it('should render all condition options', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const conditionSelects = screen.getAllByRole('combobox');
    const firstConditionSelect = conditionSelects.find(select => 
      select.querySelector('option[value="new"]')
    );

    expect(firstConditionSelect).toBeInTheDocument();
    expect(firstConditionSelect.querySelector('option[value="new"]')).toHaveTextContent('New');
    expect(firstConditionSelect.querySelector('option[value="excellent"]')).toHaveTextContent('Excellent');
    expect(firstConditionSelect.querySelector('option[value="good"]')).toHaveTextContent('Good');
    expect(firstConditionSelect.querySelector('option[value="fair"]')).toHaveTextContent('Fair');
  });

  it('should render all stock status options', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    const stockStatusSelects = screen.getAllByRole('combobox');
    const firstStockStatusSelect = stockStatusSelects.find(select => 
      select.querySelector('option[value="in_stock"]')
    );

    expect(firstStockStatusSelect).toBeInTheDocument();
    expect(firstStockStatusSelect.querySelector('option[value="in_stock"]')).toHaveTextContent('In Stock');
    expect(firstStockStatusSelect.querySelector('option[value="low_stock"]')).toHaveTextContent('Low Stock');
    expect(firstStockStatusSelect.querySelector('option[value="out_of_stock"]')).toHaveTextContent('Out of Stock');
  });

  it('should handle variations without sale price', () => {
    const variationsWithoutSalePrice = [{
      _id: 'var-1',
      condition: 'new',
      color: 'Black',
      price: 699,
      stockQuantity: 10,
      stockStatus: 'in_stock',
      sku: 'PIX8-NEW-BLK',
      images: []
    }];

    render(
      <VariationManager
        variations={variationsWithoutSalePrice}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Price is rendered as an input value; sale price input is empty
    expect(screen.getByDisplayValue('699')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('0.00').length).toBeGreaterThan(0);
  });

  it('should handle required field indicators', () => {
    render(
      <VariationManager
        variations={mockVariations}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Labels repeat for each variation card, so use the AllBy variant
    expect(screen.getAllByText('Condition *').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Color *').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SKU *').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Price (£) *').length).toBeGreaterThan(0);
  });

  it('should show proper placeholders', () => {
    render(
      <VariationManager
        variations={[]}
        onVariationsChange={mockOnVariationsChange}
      />
    );

    // Add a variation first
    fireEvent.click(screen.getByText('Add Variation'));

    expect(screen.getByPlaceholderText('e.g., Obsidian, Porcelain')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., PIX8-NEW-BLK')).toBeInTheDocument();
    // Both Price and Sale Price inputs share the "0.00" placeholder
    expect(screen.getAllByPlaceholderText('0.00').length).toBeGreaterThanOrEqual(1);
  });
});