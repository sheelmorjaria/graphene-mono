import { render, screen } from '../../test/test-utils';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';

const mockProduct = {
  id: '1',
  name: 'GrapheneOS Pixel 9 Pro',
  slug: 'grapheneos-pixel-9-pro',
  shortDescription: 'Privacy-focused Google Pixel 9 Pro with GrapheneOS pre-installed for maximum security and privacy.',
  price: 899.99,
  images: ['https://example.com/pixel9pro-1.jpg', 'https://example.com/pixel9pro-2.jpg'],
  condition: 'new',
  stockStatus: 'in_stock',
  category: {
    id: 'cat1',
    name: 'Smartphones',
    slug: 'smartphones'
  },
  createdAt: '2024-01-15T10:30:00Z'
};

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('ProductCard', () => {
  it('should render product information correctly', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
    expect(screen.getByText('Privacy-focused Google Pixel 9 Pro with GrapheneOS pre-installed for maximum security and privacy.')).toBeInTheDocument();
    expect(screen.getByText('£899.99')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('should display the main product image', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    const image = screen.getByAltText('GrapheneOS Pixel 9 Pro');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/pixel9pro-1.jpg');
  });

  it('should show placeholder image when no images provided', () => {
    const productWithoutImages = { ...mockProduct, images: [] };
    renderWithRouter(<ProductCard product={productWithoutImages} />);
    
    const image = screen.getByAltText('GrapheneOS Pixel 9 Pro');
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
  });

  it('should display condition badge with correct styling', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    const conditionBadge = screen.getByText('New');
    expect(conditionBadge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should display different condition badge styles', () => {
    const conditions = [
      { condition: 'excellent', expectedClass: 'bg-blue-100' },
      { condition: 'good', expectedClass: 'bg-yellow-100' },
      { condition: 'fair', expectedClass: 'bg-orange-100' }
    ];

    conditions.forEach(({ condition, expectedClass }) => {
      const productWithCondition = { ...mockProduct, condition, name: `Test ${condition}` };
      const { unmount } = renderWithRouter(<ProductCard product={productWithCondition} />);
      
      const conditionBadge = screen.getByText(condition.charAt(0).toUpperCase() + condition.slice(1));
      expect(conditionBadge).toHaveClass(expectedClass);
      
      unmount();
    });
  });

  it('should show out of stock status correctly', () => {
    const outOfStockProduct = { ...mockProduct, stockStatus: 'out_of_stock' };
    renderWithRouter(<ProductCard product={outOfStockProduct} />);
    
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toHaveClass('text-red-600');
  });

  it('should show low stock status correctly', () => {
    const lowStockProduct = { ...mockProduct, stockStatus: 'low_stock' };
    renderWithRouter(<ProductCard product={lowStockProduct} />);
    
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toHaveClass('text-yellow-600');
  });

  it('should have View Details button with correct link', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    const viewDetailsButton = screen.getByText('View Details');
    expect(viewDetailsButton).toBeInTheDocument();
    expect(viewDetailsButton).toHaveAttribute('href', '/products/grapheneos-pixel-9-pro');
  });

  it('should be responsive with proper CSS classes', () => {
    const { container } = renderWithRouter(<ProductCard product={mockProduct} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-md', 'overflow-hidden', 'transition-transform', 'hover:scale-105');
  });

  it('should truncate long descriptions', () => {
    const longDescProduct = {
      ...mockProduct,
      shortDescription: 'This is a very long description that should be truncated when it exceeds the maximum length allowed for display in the product card component to maintain proper layout and readability.'
    };
    
    renderWithRouter(<ProductCard product={longDescProduct} />);
    
    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass('line-clamp-2');
  });

  it('should format price correctly for different currencies', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    // Should display price with £ symbol and 2 decimal places
    expect(screen.getByText('£899.99')).toBeInTheDocument();
  });

  it('should handle missing category gracefully', () => {
    const productWithoutCategory = { ...mockProduct, category: null };
    renderWithRouter(<ProductCard product={productWithoutCategory} />);
    
    // Should still render the product card without errors
    expect(screen.getByText('GrapheneOS Pixel 9 Pro')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithRouter(<ProductCard product={mockProduct} />);
    
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
    
    const image = screen.getByAltText('GrapheneOS Pixel 9 Pro');
    expect(image).toBeInTheDocument();
    
    const link = screen.getByRole('link', { name: /view details/i });
    expect(link).toBeInTheDocument();
  });
});