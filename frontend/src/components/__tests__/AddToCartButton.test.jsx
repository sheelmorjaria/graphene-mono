import { render, screen, userEvent, act } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddToCartButton from '../AddToCartButton';

describe('AddToCartButton', () => {
  const defaultProps = {
    productId: 'product-123',
    stockStatus: 'in_stock',
    stockQuantity: 25,
    onAddToCart: vi.fn(),
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render Add to Cart button for in stock products', () => {
    render(<AddToCartButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveClass('bg-blue-600', 'hover:bg-blue-700');
  });

  it('should show Out of Stock button when stockStatus is out_of_stock', () => {
    render(
      <AddToCartButton 
        {...defaultProps} 
        stockStatus="out_of_stock" 
        stockQuantity={0} 
      />
    );
    
    const button = screen.getByRole('button', { name: /out of stock/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
    expect(button).toHaveClass('bg-gray-400', 'cursor-not-allowed');
  });

  it('should show Low Stock warning for low_stock status', () => {
    render(
      <AddToCartButton 
        {...defaultProps} 
        stockStatus="low_stock" 
        stockQuantity={3} 
      />
    );
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    
    // Should show low stock warning (more specific text)
    expect(screen.getByText(/hurry! only 3 left in stock!/i)).toBeInTheDocument();
  });

  it('should call onAddToCart when clicked', async () => {
    const user = userEvent.setup();
    const mockOnAddToCart = vi.fn();
    
    render(<AddToCartButton {...defaultProps} onAddToCart={mockOnAddToCart} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    await act(async () => {
      await user.click(button);
    });
    
    expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    expect(mockOnAddToCart).toHaveBeenCalledWith('product-123', 1);
  });

  it('should show loading state when isLoading is true', () => {
    render(<AddToCartButton {...defaultProps} isLoading={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/adding.../i);
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<AddToCartButton {...defaultProps} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toBeDisabled();
  });

  it('should handle quantity selection', async () => {
    const user = userEvent.setup();
    render(<AddToCartButton {...defaultProps} showQuantitySelector={true} />);
    
    // Should show quantity selector
    const quantitySelect = screen.getByLabelText(/quantity/i);
    expect(quantitySelect).toBeInTheDocument();
    expect(quantitySelect).toHaveValue('1');
    
    // Change quantity
    await act(async () => {
      await user.selectOptions(quantitySelect, '3');
    });
    expect(quantitySelect).toHaveValue('3');
    
    // Click add to cart
    const button = screen.getByRole('button', { name: /add to cart/i });
    await act(async () => {
      await user.click(button);
    });
    
    expect(defaultProps.onAddToCart).toHaveBeenCalledWith('product-123', 3);
  });

  it('should limit quantity options based on stock', () => {
    render(
      <AddToCartButton 
        {...defaultProps} 
        stockQuantity={5} 
        showQuantitySelector={true} 
      />
    );
    
    const quantitySelect = screen.getByLabelText(/quantity/i);
    const options = Array.from(quantitySelect.querySelectorAll('option'));
    
    // Should show options 1-5 (limited by stock)
    expect(options).toHaveLength(5);
    expect(options[0]).toHaveValue('1');
    expect(options[4]).toHaveValue('5');
  });

  it('should show success state after successful add to cart', () => {
    render(<AddToCartButton {...defaultProps} showSuccess={true} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/added to cart/i);
    expect(button).toHaveClass('bg-green-600');
    expect(screen.getByLabelText(/success/i)).toBeInTheDocument();
  });

  it('should be accessible with proper ARIA attributes', () => {
    render(<AddToCartButton {...defaultProps} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    expect(button).toHaveAttribute('aria-describedby');
    
    // Should have stock status description (25 > 10 shows "In Stock")
    const stockDescription = screen.getByText(/in stock/i);
    expect(stockDescription).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockOnAddToCart = vi.fn();
    
    render(<AddToCartButton {...defaultProps} onAddToCart={mockOnAddToCart} />);
    
    const button = screen.getByRole('button', { name: /add to cart/i });
    
    // Focus and press Enter
    button.focus();
    expect(button).toHaveFocus();
    
    await act(async () => {
      await user.keyboard('{Enter}');
    });
    expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
    expect(mockOnAddToCart).toHaveBeenCalledWith('product-123', 1);
    
    // Press Space
    await act(async () => {
      await user.keyboard(' ');
    });
    expect(mockOnAddToCart).toHaveBeenCalledTimes(2);
    expect(mockOnAddToCart).toHaveBeenLastCalledWith('product-123', 1);
  });

  it('should show appropriate icons for different states', () => {
    const { rerender } = render(<AddToCartButton {...defaultProps} />);
    
    // In stock - should show cart icon
    expect(screen.getByLabelText(/cart icon/i)).toBeInTheDocument();
    
    // Out of stock
    rerender(
      <AddToCartButton 
        {...defaultProps} 
        stockStatus="out_of_stock" 
        stockQuantity={0} 
      />
    );
    expect(screen.getByLabelText(/unavailable icon/i)).toBeInTheDocument();
    
    // Loading state
    rerender(<AddToCartButton {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    
    // Success state
    rerender(<AddToCartButton {...defaultProps} showSuccess={true} />);
    expect(screen.getByLabelText(/success/i)).toBeInTheDocument();
  });

  it('should have responsive design', () => {
    const { container } = render(<AddToCartButton {...defaultProps} />);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('w-full', 'sm:w-auto');
    
    // Should be full width on mobile, auto width on larger screens
    expect(button).toHaveClass('px-6', 'py-3');
  });

  it('should handle error state', () => {
    render(<AddToCartButton {...defaultProps} error="Failed to add to cart" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
    expect(button).toHaveTextContent(/try again/i);
    
    // Should show error message
    expect(screen.getByText(/failed to add to cart/i)).toBeInTheDocument();
  });

  it('should reset states after timeout', async () => {
    vi.useFakeTimers();
    
    const { rerender } = render(<AddToCartButton {...defaultProps} showSuccess={true} />);
    
    // Should show success initially
    expect(screen.getByText(/added to cart/i)).toBeInTheDocument();
    
    // Fast forward 3 seconds
    vi.advanceTimersByTime(3000);
    
    // Should reset to normal state
    rerender(<AddToCartButton {...defaultProps} showSuccess={false} />);
    expect(screen.getByText(/add to cart/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });

  it('should handle maximum quantity limits', () => {
    render(
      <AddToCartButton 
        {...defaultProps} 
        stockQuantity={100} 
        showQuantitySelector={true}
        maxQuantity={10}
      />
    );
    
    const quantitySelect = screen.getByLabelText(/quantity/i);
    const options = Array.from(quantitySelect.querySelectorAll('option'));
    
    // Should respect maxQuantity limit even if stock is higher
    expect(options).toHaveLength(10);
    expect(options[9]).toHaveValue('10');
  });

  it('should show correct text for different stock levels', () => {
    const { rerender } = render(<AddToCartButton {...defaultProps} stockQuantity={100} />);
    
    // High stock - just show "in stock"
    expect(screen.getByText(/in stock/i)).toBeInTheDocument();
    
    // Low stock - show specific count
    rerender(<AddToCartButton {...defaultProps} stockStatus="low_stock" stockQuantity={2} />);
    expect(screen.getByText(/2 in stock/i)).toBeInTheDocument();
    
    // Out of stock
    rerender(<AddToCartButton {...defaultProps} stockStatus="out_of_stock" stockQuantity={0} />);
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
  });

  it('should handle custom button text', () => {
    render(
      <AddToCartButton 
        {...defaultProps} 
        buttonText="Buy Now"
        outOfStockText="Sold Out"
      />
    );
    
    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument();
    
    // Test out of stock text
    render(
      <AddToCartButton 
        {...defaultProps} 
        stockStatus="out_of_stock" 
        stockQuantity={0}
        outOfStockText="Sold Out"
      />
    );
    
    expect(screen.getByRole('button', { name: /sold out/i })).toBeInTheDocument();
  });
});