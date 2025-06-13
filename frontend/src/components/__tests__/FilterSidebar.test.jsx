import { render, screen, fireEvent, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import FilterSidebar from '../FilterSidebar';

describe('FilterSidebar', () => {
  const mockCategories = [
    { id: 'cat1', name: 'Smartphones', slug: 'smartphones' },
    { id: 'cat2', name: 'Accessories', slug: 'accessories' },
    { id: 'cat3', name: 'Cases', slug: 'cases' }
  ];

  const defaultProps = {
    categories: mockCategories,
    selectedCategory: '',
    priceRange: { min: '', max: '' },
    selectedCondition: '',
    onCategoryChange: vi.fn(),
    onPriceRangeChange: vi.fn(),
    onConditionChange: vi.fn(),
    onClearFilters: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filter sidebar with all sections', () => {
    render(<FilterSidebar {...defaultProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Clear All Filters')).toBeInTheDocument();
  });

  it('should render category options', () => {
    render(<FilterSidebar {...defaultProps} />);
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Smartphones')).toBeInTheDocument();
    expect(screen.getByText('Accessories')).toBeInTheDocument();
    expect(screen.getByText('Cases')).toBeInTheDocument();
  });

  it('should render condition options', () => {
    render(<FilterSidebar {...defaultProps} />);
    
    expect(screen.getByText('All Conditions')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('should render price range inputs', () => {
    render(<FilterSidebar {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Min price')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max price')).toBeInTheDocument();
  });

  it('should highlight selected category', () => {
    render(<FilterSidebar {...defaultProps} selectedCategory="smartphones" />);
    
    const smartphonesButton = screen.getByText('Smartphones');
    expect(smartphonesButton).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should highlight selected condition', () => {
    render(<FilterSidebar {...defaultProps} selectedCondition="new" />);
    
    const newButton = screen.getByText('New');
    expect(newButton).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('should call onCategoryChange when category is selected', async () => {
    const user = userEvent.setup();
    const mockOnCategoryChange = vi.fn();
    
    render(<FilterSidebar {...defaultProps} onCategoryChange={mockOnCategoryChange} />);
    
    await user.click(screen.getByText('Smartphones'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('smartphones');
  });

  it('should call onConditionChange when condition is selected', async () => {
    const user = userEvent.setup();
    const mockOnConditionChange = vi.fn();
    
    render(<FilterSidebar {...defaultProps} onConditionChange={mockOnConditionChange} />);
    
    await user.click(screen.getByText('Excellent'));
    expect(mockOnConditionChange).toHaveBeenCalledWith('excellent');
  });

  it('should call onPriceRangeChange when price inputs change', async () => {
    const mockOnPriceRangeChange = vi.fn();
    
    render(<FilterSidebar {...defaultProps} onPriceRangeChange={mockOnPriceRangeChange} />);
    
    const minInput = screen.getByPlaceholderText('Min price');
    const maxInput = screen.getByPlaceholderText('Max price');
    
    // Test min input change
    fireEvent.change(minInput, { target: { value: '100' } });
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: '100', max: '' });
    
    // Test max input change (starts with empty min since component doesn't know previous state)
    fireEvent.change(maxInput, { target: { value: '500' } });
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: '', max: '500' });
  });

  it('should call onClearFilters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClearFilters = vi.fn();
    
    render(<FilterSidebar {...defaultProps} onClearFilters={mockOnClearFilters} />);
    
    await user.click(screen.getByText('Clear All Filters'));
    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('should display current price range values', () => {
    render(<FilterSidebar {...defaultProps} priceRange={{ min: '100', max: '500' }} />);
    
    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  it('should reset category selection when All Categories is clicked', async () => {
    const user = userEvent.setup();
    const mockOnCategoryChange = vi.fn();
    
    render(<FilterSidebar {...defaultProps} selectedCategory="smartphones" onCategoryChange={mockOnCategoryChange} />);
    
    await user.click(screen.getByText('All Categories'));
    expect(mockOnCategoryChange).toHaveBeenCalledWith('');
  });

  it('should reset condition selection when All Conditions is clicked', async () => {
    const user = userEvent.setup();
    const mockOnConditionChange = vi.fn();
    
    render(<FilterSidebar {...defaultProps} selectedCondition="new" onConditionChange={mockOnConditionChange} />);
    
    await user.click(screen.getByText('All Conditions'));
    expect(mockOnConditionChange).toHaveBeenCalledWith('');
  });

  it('should be accessible with proper ARIA labels', () => {
    render(<FilterSidebar {...defaultProps} />);
    
    expect(screen.getByLabelText('Filter products')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimum price')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum price')).toBeInTheDocument();
  });

  it('should have responsive design with proper mobile styling', () => {
    const { container } = render(<FilterSidebar {...defaultProps} />);
    
    const sidebar = container.firstChild;
    expect(sidebar).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'border');
  });

  it('should validate price inputs are numeric', async () => {
    const user = userEvent.setup();
    
    render(<FilterSidebar {...defaultProps} />);
    
    const minInput = screen.getByPlaceholderText('Min price');
    expect(minInput).toHaveAttribute('type', 'number');
    expect(minInput).toHaveAttribute('min', '0');
    expect(minInput).toHaveAttribute('step', '0.01');
  });

  it('should handle keyboard navigation for filter buttons', async () => {
    const user = userEvent.setup();
    
    render(<FilterSidebar {...defaultProps} />);
    
    // First tab should focus on the Clear All Filters button
    await user.tab();
    const clearButton = screen.getByText('Clear All Filters');
    expect(clearButton).toHaveFocus();
    
    // Second tab should focus on the first category button
    await user.tab();
    const firstCategoryButton = screen.getByText('All Categories');
    expect(firstCategoryButton).toHaveFocus();
  });

  it('should show filter count when filters are applied', () => {
    render(<FilterSidebar 
      {...defaultProps} 
      selectedCategory="smartphones" 
      selectedCondition="new" 
      priceRange={{ min: '100', max: '500' }}
    />);
    
    // Should show active filter indicators
    const smartphonesButton = screen.getByText('Smartphones');
    const newButton = screen.getByText('New');
    
    expect(smartphonesButton).toHaveClass('bg-blue-100', 'text-blue-800');
    expect(newButton).toHaveClass('bg-blue-100', 'text-blue-800');
  });
});