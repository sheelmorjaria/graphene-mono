import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { CartProvider } from '../../contexts/CartContext';

// Mock the CartContext
const mockAddToCart = vi.fn();
vi.mock('../../contexts/CartContext', () => ({
  CartProvider: ({ children }) => children,
  useCart: () => ({
    addToCart: mockAddToCart
  })
}));

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <CartProvider>
      {children}
    </CartProvider>
  </BrowserRouter>
);

describe('ProductCard', () => {
  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Google Pixel 7',
    slug: 'google-pixel-7',
    shortDescription: 'Latest Google smartphone with advanced camera',
    price: 599.99,
    images: ['/images/pixel7-1.jpg', '/images/pixel7-2.jpg'],
    condition: 'new',
    stockStatus: 'in_stock',
    stockQuantity: 10
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddToCart.mockResolvedValue({ success: true });
  });

  it('renders product information correctly', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Google Pixel 7')).toBeInTheDocument();
    expect(screen.getByText('£599.99')).toBeInTheDocument();
    expect(screen.getByText('Latest Google smartphone with advanced camera')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('displays product image correctly', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const image = screen.getByAltText('Google Pixel 7');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/pixel7-1.jpg');
  });

  it('displays fallback image when no images provided', () => {
    const productWithoutImages = { ...mockProduct, images: [] };
    
    render(
      <TestWrapper>
        <ProductCard product={productWithoutImages} />
      </TestWrapper>
    );

    const image = screen.getByAltText('Google Pixel 7');
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
  });

  it('shows out of stock status correctly', () => {
    const outOfStockProduct = {
      ...mockProduct,
      stockStatus: 'out_of_stock',
      stockQuantity: 0
    };
    
    render(
      <TestWrapper>
        <ProductCard product={outOfStockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    
    // Add to cart button should show "Out of Stock" and be disabled
    const addToCartButton = screen.getByRole('button', { name: /out of stock/i });
    expect(addToCartButton).toBeDisabled();
  });

  it('shows low stock status correctly', () => {
    const lowStockProduct = {
      ...mockProduct,
      stockStatus: 'low_stock',
      stockQuantity: 3
    };
    
    render(
      <TestWrapper>
        <ProductCard product={lowStockProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('handles add to cart action correctly', async () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 1);
    });
  });

  it('shows loading state during add to cart', async () => {
    // Mock a delayed response
    mockAddToCart.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true }), 100)
    ));

    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    // Should show loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(addToCartButton).toBeDisabled();

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });
  });

  it('navigates to product details when View Details is clicked', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    expect(viewDetailsLink).toHaveAttribute('href', '/products/google-pixel-7');
  });

  it('displays different condition states correctly', () => {
    const conditions = [
      { condition: 'new', expected: 'New' },
      { condition: 'excellent', expected: 'Excellent' },
      { condition: 'good', expected: 'Good' },
      { condition: 'fair', expected: 'Fair' }
    ];

    conditions.forEach(({ condition, expected }) => {
      const productWithCondition = { ...mockProduct, condition };
      
      const { unmount } = render(
        <TestWrapper>
          <ProductCard product={productWithCondition} />
        </TestWrapper>
      );

      expect(screen.getByText(expected)).toBeInTheDocument();
      unmount();
    });
  });

  it('prevents add to cart when out of stock', async () => {
    const outOfStockProduct = {
      ...mockProduct,
      stockStatus: 'out_of_stock',
      stockQuantity: 0
    };
    
    render(
      <TestWrapper>
        <ProductCard product={outOfStockProduct} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /out of stock/i });
    fireEvent.click(addToCartButton);

    // Should not call addToCart
    expect(mockAddToCart).not.toHaveBeenCalled();
  });

  it('prevents add to cart when already adding', async () => {
    // Mock a delayed response
    mockAddToCart.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true }), 100)
    ));

    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    
    // Click multiple times quickly
    fireEvent.click(addToCartButton);
    fireEvent.click(addToCartButton);
    fireEvent.click(addToCartButton);

    // Should only be called once
    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledTimes(1);
    });
  });

  it('stops propagation on add to cart button click', () => {
    const cardClickHandler = vi.fn();
    
    render(
      <TestWrapper>
        <div onClick={cardClickHandler}>
          <ProductCard product={mockProduct} />
        </div>
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    // Card click handler should not be called due to event.stopPropagation()
    expect(cardClickHandler).not.toHaveBeenCalled();
  });

  it('prevents navigation on add to cart button click', () => {
    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    
    // Create a custom event
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'preventDefault', { value: preventDefault });
    Object.defineProperty(clickEvent, 'stopPropagation', { value: stopPropagation });
    
    fireEvent(addToCartButton, clickEvent);
    
    expect(stopPropagation).toHaveBeenCalled();
  });

  it('handles missing product data gracefully', () => {
    const incompleteProduct = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Basic Product',
      slug: 'basic-product',
      price: 99.99,
      condition: 'new',
      stockStatus: 'in_stock'
      // Missing other fields
    };
    
    render(
      <TestWrapper>
        <ProductCard product={incompleteProduct} />
      </TestWrapper>
    );

    expect(screen.getByText('Basic Product')).toBeInTheDocument();
    expect(screen.getByText('£99.99')).toBeInTheDocument();
  });

  it('formats price correctly', () => {
    const productWithDecimalPrice = {
      ...mockProduct,
      price: 599.5
    };
    
    render(
      <TestWrapper>
        <ProductCard product={productWithDecimalPrice} />
      </TestWrapper>
    );

    expect(screen.getByText('£599.50')).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    // Should be wrapped in an article element
    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();

    // Should have proper heading
    const heading = screen.getByRole('heading', { name: 'Google Pixel 7' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
  });

  it('has accessible image with proper alt text', () => {
    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Google Pixel 7');
  });

  it('handles add to cart failure gracefully', async () => {
    mockAddToCart.mockResolvedValue({ success: false });

    render(
      <TestWrapper>
        <ProductCard product={mockProduct} />
      </TestWrapper>
    );

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      // Button should return to normal state even if add to cart fails
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      expect(addToCartButton).not.toBeDisabled();
    });
  });
});