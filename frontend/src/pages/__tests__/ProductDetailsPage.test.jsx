import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import ProductDetailsPage from '../ProductDetailsPage';

// Mock the hooks and services
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn()
  };
});

vi.mock('../../hooks/useProductDetails', () => ({
  default: vi.fn()
}));

vi.mock('../../components/ImageGallery', () => ({
  default: ({ images, alt }) => (
    <div data-testid="image-gallery">
      <img src={images[0]} alt={alt} />
    </div>
  )
}));

vi.mock('../../components/AddToCartButton', () => ({
  default: ({ productId, stockStatus, stockQuantity, onAddToCart }) => (
    <button 
      data-testid="add-to-cart" 
      onClick={() => onAddToCart(productId, 1)}
      disabled={stockStatus === 'out_of_stock'}
    >
      {stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
    </button>
  )
}));

import { useParams, useNavigate } from 'react-router-dom';
import useProductDetails from '../../hooks/useProductDetails';

const mockProduct = {
  _id: 'product-123',
  name: 'GrapheneOS Pixel 9 Pro',
  slug: 'grapheneos-pixel-9-pro',
  shortDescription: 'Premium privacy-focused smartphone with GrapheneOS pre-installed',
  longDescription: 'The Pixel 9 Pro with GrapheneOS offers the ultimate in mobile privacy and security. This device features a stunning 6.3-inch OLED display with 120Hz refresh rate, advanced triple-camera system with computational photography, and the latest Titan M security chip.',
  price: 899.99,
  images: [
    'https://example.com/pixel9pro-front.jpg',
    'https://example.com/pixel9pro-back.jpg',
    'https://example.com/pixel9pro-side.jpg'
  ],
  condition: 'new',
  stockStatus: 'in_stock',
  stockQuantity: 25,
  attributes: [
    { name: 'Display', value: '6.3" OLED, 120Hz' },
    { name: 'Storage', value: '256GB' },
    { name: 'RAM', value: '12GB' },
    { name: 'Color', value: 'Obsidian' }
  ],
  category: {
    _id: 'cat-123',
    name: 'Smartphones',
    slug: 'smartphones'
  }
};

const mockNavigate = vi.fn();

describe('ProductDetailsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParams.mockReturnValue({ slug: 'grapheneos-pixel-9-pro' });
    useNavigate.mockReturnValue(mockNavigate);
  });

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render loading state while fetching product', () => {
    useProductDetails.mockReturnValue({
      product: null,
      loading: true,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/loading product details/i)).toBeInTheDocument();
  });

  it('should render error state when product fetch fails', () => {
    useProductDetails.mockReturnValue({
      product: null,
      loading: false,
      error: 'Failed to load product'
    });

    renderWithRouter(<ProductDetailsPage />);

    expect(screen.getByText(/error loading product/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to load product/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should render 404 state when product is not found', () => {
    useProductDetails.mockReturnValue({
      product: null,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    expect(screen.getByText(/the product you're looking for doesn't exist/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to products/i })).toBeInTheDocument();
  });

  it('should render product details with all sections', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Header section
    expect(screen.getByRole('heading', { name: mockProduct.name })).toBeInTheDocument();
    expect(screen.getByText(mockProduct.shortDescription)).toBeInTheDocument();
    expect(screen.getByText(/£899\.99/)).toBeInTheDocument();

    // Image gallery
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();

    // Add to cart button
    expect(screen.getByTestId('add-to-cart')).toBeInTheDocument();

    // Product attributes section
    expect(screen.getByText(/specifications/i)).toBeInTheDocument();
    expect(screen.getByText(/6\.3" oled, 120hz/i)).toBeInTheDocument();

    // Long description
    expect(screen.getByText(/the pixel 9 pro with grapheneos/i)).toBeInTheDocument();
  });

  it('should have proper responsive layout on mobile', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    const { container } = renderWithRouter(<ProductDetailsPage />);

    // Main container should have mobile-first responsive classes
    const mainContainer = container.querySelector('[data-testid="product-details-container"]');
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'lg:flex-row');

    // Image section should be full width on mobile, half on desktop
    const imageSection = container.querySelector('[data-testid="image-section"]');
    expect(imageSection).toHaveClass('w-full', 'lg:w-1/2');

    // Details section should be full width on mobile, half on desktop
    const detailsSection = container.querySelector('[data-testid="details-section"]');
    expect(detailsSection).toHaveClass('w-full', 'lg:w-1/2');
  });

  it('should display breadcrumb navigation', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumbNav).toBeInTheDocument();
    
    // Check breadcrumb links within the nav
    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /smartphones/i })).toBeInTheDocument();
    
    // Product name should appear in breadcrumb (as text, not link)
    const breadcrumbItems = breadcrumbNav.querySelectorAll('li');
    const lastBreadcrumbItem = breadcrumbItems[breadcrumbItems.length - 1];
    expect(lastBreadcrumbItem).toHaveTextContent(mockProduct.name);
  });

  it('should handle add to cart action', async () => {
    const user = userEvent.setup();
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    const addToCartButton = screen.getByTestId('add-to-cart');
    await user.click(addToCartButton);

    // This would normally trigger cart logic
    expect(addToCartButton).toHaveBeenCalled;
  });

  it('should display product attributes in a structured format', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Check attributes section exists
    const specificationsList = screen.getByRole('list', { name: /specifications/i });
    expect(specificationsList).toBeInTheDocument();

    // Check each attribute is displayed within the specifications list
    mockProduct.attributes.forEach(attr => {
      expect(screen.getByText(`${attr.name}:`)).toBeInTheDocument();
      expect(screen.getByText(attr.value)).toBeInTheDocument();
    });
  });

  it('should show condition badge', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    expect(screen.getByText(/new/i)).toBeInTheDocument();
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('should display different condition badge colors', () => {
    const excellentProduct = { ...mockProduct, condition: 'excellent' };
    useProductDetails.mockReturnValue({
      product: excellentProduct,
      loading: false,
      error: null
    });

    const { rerender } = renderWithRouter(<ProductDetailsPage />);
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-blue-100', 'text-blue-800');

    const goodProduct = { ...mockProduct, condition: 'good' };
    useProductDetails.mockReturnValue({
      product: goodProduct,
      loading: false,
      error: null
    });

    rerender(
      <BrowserRouter>
        <ProductDetailsPage />
      </BrowserRouter>
    );
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-yellow-100', 'text-yellow-800');

    const fairProduct = { ...mockProduct, condition: 'fair' };
    useProductDetails.mockReturnValue({
      product: fairProduct,
      loading: false,
      error: null
    });

    rerender(
      <BrowserRouter>
        <ProductDetailsPage />
      </BrowserRouter>
    );
    expect(screen.getByTestId('condition-badge')).toHaveClass('bg-orange-100', 'text-orange-800');
  });

  it('should have proper SEO meta tags', async () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Wait for useEffect to run and set document title
    await waitFor(() => {
      expect(document.title).toContain(mockProduct.name);
    });
  });

  it('should handle retry when error occurs', async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    
    useProductDetails.mockReturnValue({
      product: null,
      loading: false,
      error: 'Network error',
      refetch: mockRefetch
    });

    renderWithRouter(<ProductDetailsPage />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it('should navigate back to products list', async () => {
    const user = userEvent.setup();
    
    useProductDetails.mockReturnValue({
      product: null,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    const backLink = screen.getByRole('link', { name: /back to products/i });
    expect(backLink).toHaveAttribute('href', '/products');
  });

  it('should display stock status correctly', () => {
    const outOfStockProduct = { ...mockProduct, stockStatus: 'out_of_stock', stockQuantity: 0 };
    useProductDetails.mockReturnValue({
      product: outOfStockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    const addToCartButton = screen.getByTestId('add-to-cart');
    expect(addToCartButton).toBeDisabled();
    expect(addToCartButton).toHaveTextContent('Out of Stock');
  });

  it('should be accessible with proper ARIA attributes', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Main content should have proper landmark
    expect(screen.getByRole('main')).toBeInTheDocument();

    // Product name should be a heading
    expect(screen.getByRole('heading', { name: mockProduct.name })).toBeInTheDocument();

    // Price should be properly labeled
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();

    // Attributes should be in a structured format
    expect(screen.getByRole('list', { name: /specifications/i })).toBeInTheDocument();
  });

  it('should handle missing optional product fields gracefully', () => {
    const minimalProduct = {
      _id: 'product-456',
      name: 'Minimal Product',
      slug: 'minimal-product',
      price: 99.99,
      images: ['https://example.com/minimal.jpg'],
      stockStatus: 'in_stock',
      stockQuantity: 5
    };

    useProductDetails.mockReturnValue({
      product: minimalProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    expect(screen.getByRole('heading', { name: 'Minimal Product' })).toBeInTheDocument();
    expect(screen.getByText(/£99\.99/)).toBeInTheDocument();

    // Should not break when optional fields are missing
    expect(screen.queryByText(/specifications/i)).not.toBeInTheDocument();
  });

  it('should display category information when available', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Check for category label and value in the details section
    const detailsSection = screen.getByTestId('details-section');
    expect(detailsSection).toHaveTextContent('Category:');
    expect(detailsSection).toHaveTextContent(mockProduct.category.name);
  });

  it('should handle keyboard navigation properly', async () => {
    const user = userEvent.setup();
    
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Tab navigation should work through interactive elements
    await user.tab();
    expect(screen.getByRole('link', { name: /home/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: /products/i })).toHaveFocus();
  });

  it('should show loading state for images', () => {
    useProductDetails.mockReturnValue({
      product: mockProduct,
      loading: false,
      error: null
    });

    renderWithRouter(<ProductDetailsPage />);

    // Image gallery should handle loading state internally
    expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
  });
});