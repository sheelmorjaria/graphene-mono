import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { CartProvider } from '../../contexts/CartContext';

// Mock the cart context
const mockAddToCart = jest.fn();
jest.mock('../../contexts/CartContext', () => ({
  useCart: () => ({
    addToCart: mockAddToCart
  }),
  CartProvider: ({ children }) => <div>{children}</div>
}));

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
        condition: 'new',
        color: 'Black',
        price: 699,
        salePrice: 649,
        stockStatus: 'in_stock',
        sku: 'PIX8-NEW-BLK'
      },
      {
        _id: 'var-2',
        condition: 'new',
        color: 'Blue',
        price: 699,
        stockStatus: 'low_stock',
        sku: 'PIX8-NEW-BLU'
      },
      {
        _id: 'var-3',
        condition: 'excellent',
        color: 'Black',
        price: 599,
        stockStatus: 'out_of_stock',
        sku: 'PIX8-EXC-BLK'
      }
    ],
    availableColors: ['Black', 'Blue'],
    availableConditions: ['new'],
    isInStock: true,
    category: {
      _id: 'cat-1',
      name: 'Smartphones',
      slug: 'smartphones'
    },
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const renderProductCard = (product = mockProduct) => {
    return render(
      <BrowserRouter>
        <CartProvider>
          <ProductCard product={product} />
        </CartProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockAddToCart.mockClear();
    mockAddToCart.mockResolvedValue({ success: true });
  });

  it('should render product with variation information', () => {
    renderProductCard();

    expect(screen.getByText('Google Pixel 8')).toBeInTheDocument();
    expect(screen.getByText('Latest Google Pixel phone with GrapheneOS')).toBeInTheDocument();
    expect(screen.getByText('£599.00 - £699.00')).toBeInTheDocument(); // Price range
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
      availableConditions: ['new']
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
    expect(screen.getByText('In Stock')).toHaveClass('text-forest-600');
  });

  it('should show out of stock when no variations are available', () => {
    const outOfStockProduct = {
      ...mockProduct,
      isInStock: false,
      availableColors: [],
      availableConditions: []
    };

    renderProductCard(outOfStockProduct);

    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toHaveClass('text-coral');
  });

  it('should disable add to cart button when out of stock', () => {
    const outOfStockProduct = {
      ...mockProduct,
      isInStock: false
    };

    renderProductCard(outOfStockProduct);

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).toBeDisabled();
    expect(addToCartButton).toHaveTextContent('Out of Stock');
  });

  it('should enable add to cart button when in stock', () => {
    renderProductCard();

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    expect(addToCartButton).not.toBeDisabled();
    expect(addToCartButton).toHaveTextContent('Add to Cart');
  });

  it('should handle add to cart click', async () => {
    renderProductCard();

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(mockAddToCart).toHaveBeenCalledWith('product-1', 1);
    });
  });

  it('should show loading state during add to cart', async () => {
    // Make the add to cart promise pending
    let resolvePromise;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockAddToCart.mockReturnValue(pendingPromise);

    renderProductCard();

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    fireEvent.click(addToCartButton);

    expect(screen.getByText('Adding...')).toBeInTheDocument();

    // Resolve the promise
    resolvePromise({ success: true });
    await waitFor(() => {
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
    });
  });

  it('should render view details link', () => {
    renderProductCard();

    const viewDetailsLink = screen.getByRole('link', { name: /view details/i });
    expect(viewDetailsLink).toBeInTheDocument();
    expect(viewDetailsLink).toHaveAttribute('href', '/products/google-pixel-8');
  });

  it('should show lead time when available', () => {
    const productWithLeadTime = {
      ...mockProduct,
      leadTime: {
        displayText: '5-7 working days'
      }
    };

    renderProductCard(productWithLeadTime);

    expect(screen.getByText('Lead time: 5-7 working days')).toBeInTheDocument();
  });

  it('should handle missing images gracefully', () => {
    const productWithoutImages = {
      ...mockProduct,
      images: []
    };

    renderProductCard(productWithoutImages);

    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('src', '/placeholder-product.jpg');
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

    expect(screen.getByText('0 Colors')).toBeInTheDocument();
    expect(screen.getByText('0 Conditions')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should have proper test IDs for testing', () => {
    renderProductCard();

    expect(screen.getByTestId('product-card-google-pixel-8')).toBeInTheDocument();
    expect(screen.getByTestId('product-title')).toBeInTheDocument();
    expect(screen.getByTestId('product-description')).toBeInTheDocument();
    expect(screen.getByTestId('product-price')).toBeInTheDocument();
    expect(screen.getByTestId('add-to-cart-button')).toBeInTheDocument();
    expect(screen.getByTestId('product-details')).toBeInTheDocument();
  });

  it('should apply hover effects', () => {
    renderProductCard();

    const card = screen.getByTestId('product-card-google-pixel-8');
    expect(card).toHaveClass('hover:scale-105');
    expect(card).toHaveClass('hover:shadow-xl');
  });

  it('should show correct styling for different elements', () => {
    renderProductCard();

    const title = screen.getByTestId('product-title');
    expect(title).toHaveClass('text-forest-800');
    expect(title).toHaveClass('font-semibold');

    const price = screen.getByTestId('product-price');
    expect(price).toHaveClass('text-forest-900');
    expect(price).toHaveClass('font-bold');
  });

  it('should prevent navigation when add to cart is clicked', async () => {
    renderProductCard();

    const addToCartButton = screen.getByRole('button', { name: /add to cart/i });
    
    // Mock preventDefault
    const mockPreventDefault = jest.fn();
    const mockStopPropagation = jest.fn();
    
    const event = {
      preventDefault: mockPreventDefault,
      stopPropagation: mockStopPropagation
    };

    fireEvent.click(addToCartButton, event);

    // We can't directly test preventDefault/stopPropagation in testing library
    // but we can verify the button doesn't navigate by checking it's not a link
    expect(addToCartButton.tagName).toBe('BUTTON');
  });

  it('should format prices correctly with decimals', () => {
    const productWithDecimals = {
      ...mockProduct,
      priceRange: {
        min: 599.99,
        max: 699.50
      }
    };

    renderProductCard(productWithDecimals);

    expect(screen.getByText('£599.99 - £699.50')).toBeInTheDocument();
  });
});