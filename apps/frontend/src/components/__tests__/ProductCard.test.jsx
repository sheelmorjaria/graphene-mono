import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import ProductCard from '../ProductCard';

describe('ProductCard', () => {
  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Google Pixel 7',
    slug: 'google-pixel-7',
    shortDescription: 'Latest Google smartphone with advanced camera',
    priceRange: { min: 599.99, max: 699.99 },
    images: ['/images/pixel7-1.jpg', '/images/pixel7-2.jpg'],
    availableColors: ['Black', 'Blue'],
    availableConditions: ['Excellent'],
    availableStorage: ['128GB', '256GB'],
    category: { _id: 'cat-1', name: 'Phones', slug: 'phones' },
    isInStock: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Google Pixel 7')).toBeInTheDocument();
    expect(screen.getByText('Latest Google smartphone with advanced camera')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
  });

  it('renders the price range', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('£599.99 - £699.99')).toBeInTheDocument();
  });

  it('renders a single price when range is flat', () => {
    render(<ProductCard product={{ ...mockProduct, priceRange: { min: 599.99, max: 599.99 } }} />);

    expect(screen.getByText('£599.99')).toBeInTheDocument();
  });

  it('displays the main product image', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Google Pixel 7');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/pixel7-1.jpg');
  });

  it('uses the placeholder image when no images are provided but in stock', () => {
    const productWithoutImages = { ...mockProduct, images: [] };

    render(<ProductCard product={productWithoutImages} />);

    const image = screen.getByAltText('Google Pixel 7');
    expect(image).toHaveAttribute('src', '/images/placeholder.png');
  });

  it('uses the out-of-stock placeholder and overlay when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, isInStock: false };

    render(<ProductCard product={outOfStockProduct} />);

    const image = screen.getByAltText('Google Pixel 7');
    expect(image).toHaveAttribute('src', '/images/placeholder-out-of-stock.png');
    // "Out of Stock" appears in both the image overlay and the stock status
    expect(screen.getAllByText('Out of Stock').length).toBeGreaterThan(0);
  });

  it('shows the category badge when a category is provided', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('phones')).toBeInTheDocument();
  });

  it('shows available option counts', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('2 Colors')).toBeInTheDocument();
    expect(screen.getByText('1 Condition')).toBeInTheDocument();
    expect(screen.getByText('2 Storage Options')).toBeInTheDocument();
  });

  it('navigates to product details when View Details is clicked', () => {
    render(<ProductCard product={mockProduct} />);

    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    expect(viewDetailsLink).toHaveAttribute('href', '/products/google-pixel-7');
  });

  it('handles missing product data gracefully', () => {
    const incompleteProduct = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Basic Product',
      slug: 'basic-product'
    };

    render(<ProductCard product={incompleteProduct} />);

    expect(screen.getByText('Basic Product')).toBeInTheDocument();
    // No price range defaults to £0.00
    expect(screen.getByText('£0.00')).toBeInTheDocument();
  });

  it('has proper semantic HTML structure', () => {
    render(<ProductCard product={mockProduct} />);

    const article = screen.getByRole('article');
    expect(article).toBeInTheDocument();

    const heading = screen.getByRole('heading', { name: 'Google Pixel 7' });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H3');
  });

  it('has accessible image with proper alt text', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('alt', 'Google Pixel 7');
  });

  it('shows the product lead time when provided', () => {
    const productWithLeadTime = {
      ...mockProduct,
      leadTime: { minDays: 3, maxDays: 5, displayText: '3-5 working days' }
    };

    render(<ProductCard product={productWithLeadTime} />);

    expect(screen.getByText('3-5 working days')).toBeInTheDocument();
  });

  it('falls back to the default lead time when not provided', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('5-7 working days')).toBeInTheDocument();
  });
});
