import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import ProductCard from '../ProductCard';

// ProductCard no longer renders an add-to-cart button (it only has a
// "View Details" link) and reads from the shared Auth/Cart contexts, so we
// render through the shared test-utils render which wires up those providers.

describe('ProductCard with Variations', () => {
  const mockProduct = {
    _id: 'product-1',
    name: 'Google Pixel 8',
    slug: 'google-pixel-8',
    shortDescription: 'Latest Google Pixel phone with GrapheneOS',
    baseModel: 'Pixel 8',
    priceRange: {
      min: 599,
      max: 699
    },
    images: ['pixel8-image1.jpg', 'pixel8-image2.jpg'],
    variations: [
      {
        _id: 'var-1',
        condition: 'excellent',
        color: 'Black',
        price: 699,
        salePrice: 649,
        stockStatus: 'in_stock',
        sku: 'PIX8-EXC-BLK'
      },
      {
        _id: 'var-2',
        condition: 'excellent',
        color: 'Blue',
        price: 699,
        stockStatus: 'low_stock',
        sku: 'PIX8-EXC-BLU'
      },
      {
        _id: 'var-3',
        condition: 'good',
        color: 'Black',
        price: 599,
        stockStatus: 'out_of_stock',
        sku: 'PIX8-GOOD-BLK'
      }
    ],
    availableColors: ['Black', 'Blue'],
    availableConditions: ['excellent'],
    isInStock: true,
    leadTime: { minDays: 7, maxDays: 10, displayText: '7-10 working days' },
    category: {
      _id: 'cat-1',
      name: 'Smartphones',
      slug: 'smartphones'
    },
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const renderProductCard = (product = mockProduct) => render(<ProductCard product={product} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render product with variation information', () => {
    renderProductCard();

    expect(screen.getByText('Google Pixel 8')).toBeInTheDocument();
    expect(screen.getByText('Latest Google Pixel phone with GrapheneOS')).toBeInTheDocument();
    // Price range is formatted with 2 decimals in GBP
    expect(screen.getByText('£599.00 - £699.00')).toBeInTheDocument();
  });

  it('should display available variations count', () => {
    renderProductCard();

    expect(screen.getByText('2 Colors')).toBeInTheDocument();
    expect(screen.getByText('1 Condition')).toBeInTheDocument();
  });

  it('should handle single color/condition correctly', () => {
    const singleVariationProduct = {
      ...mockProduct,
      availableColors: ['Black'],
      availableConditions: ['excellent']
    };

    renderProductCard(singleVariationProduct);

    expect(screen.getByText('1 Color')).toBeInTheDocument();
    expect(screen.getByText('1 Condition')).toBeInTheDocument();
  });

  it('should display same price when min and max are equal', () => {
    const singlePriceProduct = {
      ...mockProduct,
      priceRange: {
        min: 699,
        max: 699
      }
    };

    renderProductCard(singlePriceProduct);

    expect(screen.getByText('£699.00')).toBeInTheDocument();
    expect(screen.queryByText('£699.00 - £699.00')).not.toBeInTheDocument();
  });

  it('should show in stock status when variations are available', () => {
    renderProductCard();

    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toHaveClass('text-matrix-400');
  });

  it('should show out of stock when no variations are available', () => {
    const outOfStockProduct = {
      ...mockProduct,
      isInStock: false,
      availableColors: [],
      availableConditions: []
    };

    renderProductCard(outOfStockProduct);

    expect(screen.getAllByText('Out of Stock').length).toBeGreaterThan(0);
  });

  it('uses the out-of-stock placeholder image when out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      isInStock: false
    };

    renderProductCard(outOfStockProduct);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/images/placeholder-out-of-stock.png');
  });

  it('renders a View Details link instead of an add-to-cart button', () => {
    renderProductCard();

    // The current component exposes a "View Details" link, not an add-to-cart button.
    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    expect(viewDetailsLink).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it('should render view details link with the product slug', () => {
    renderProductCard();

    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    expect(viewDetailsLink).toBeInTheDocument();
    expect(viewDetailsLink).toHaveAttribute('href', '/products/google-pixel-8');
  });

  it('shows the product lead time when provided', () => {
    renderProductCard();

    expect(screen.getByText('7-10 working days')).toBeInTheDocument();
  });

  it('falls back to the standard lead time when not provided', () => {
    renderProductCard({ ...mockProduct, leadTime: undefined });

    expect(screen.getByText('3-5 days')).toBeInTheDocument();
  });

  it('should handle missing images gracefully', () => {
    const productWithoutImages = {
      ...mockProduct,
      images: []
    };

    renderProductCard(productWithoutImages);

    const image = screen.getByRole('img');
    // In-stock products with no images fall back to the placeholder.
    expect(image).toHaveAttribute('src', '/images/placeholder.png');
    expect(image).toHaveAttribute('alt', 'Google Pixel 8');
  });

  it('should handle missing price range gracefully', () => {
    const productWithoutPriceRange = {
      ...mockProduct,
      priceRange: null
    };

    renderProductCard(productWithoutPriceRange);

    expect(screen.getByText('£0.00')).toBeInTheDocument();
  });

  it('should handle empty variations gracefully', () => {
    const productWithoutVariations = {
      ...mockProduct,
      variations: [],
      availableColors: [],
      availableConditions: [],
      isInStock: false
    };

    renderProductCard(productWithoutVariations);

    // With no colors/conditions the option badges are not rendered at all.
    expect(screen.queryByText(/Colors/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Conditions/)).not.toBeInTheDocument();
    expect(screen.getAllByText('Out of Stock').length).toBeGreaterThan(0);
  });

  it('should have proper test IDs for testing', () => {
    renderProductCard();

    expect(screen.getByTestId('product-card-google-pixel-8')).toBeInTheDocument();
    expect(screen.getByTestId('product-title')).toBeInTheDocument();
    expect(screen.getByTestId('product-description')).toBeInTheDocument();
    expect(screen.getByTestId('product-price')).toBeInTheDocument();
    expect(screen.getByTestId('product-details')).toBeInTheDocument();
  });

  it('uses the View Details link as the primary action (no add-to-cart button)', () => {
    renderProductCard();

    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    // The current card surfaces a link, not a button, as the primary action.
    expect(viewDetailsLink.tagName).toBe('A');
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
  });

  it('should apply the expected card classes', () => {
    renderProductCard();

    const card = screen.getByTestId('product-card-google-pixel-8');
    // The card root uses the design-system card classes plus the group hover context.
    expect(card).toHaveClass('card');
    expect(card).toHaveClass('group');
  });

  it('should show correct styling for different elements', () => {
    renderProductCard();

    const title = screen.getByTestId('product-title');
    expect(title.tagName).toBe('H3');

    const price = screen.getByTestId('product-price');
    // Price uses the cyan accent color from the current theme.
    expect(price).toHaveClass('text-cyan-400');
    expect(price).toHaveClass('font-bold');
  });

  it('should format prices correctly with decimals', () => {
    const productWithDecimals = {
      ...mockProduct,
      priceRange: {
        min: 599.99,
        max: 699.5
      }
    };

    renderProductCard(productWithDecimals);

    expect(screen.getByText('£599.99 - £699.50')).toBeInTheDocument();
  });
});
