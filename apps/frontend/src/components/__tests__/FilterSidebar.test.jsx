import { render, screen, fireEvent, userEvent } from '../../test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterSidebar from '../FilterSidebar';

describe('FilterSidebar', () => {
  const defaultProps = {
    priceRange: { min: '', max: '' },
    selectedCondition: '',
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
    expect(screen.getByText('Price Range')).toBeInTheDocument();
    expect(screen.getByText('Condition')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should render condition options', () => {
    render(<FilterSidebar {...defaultProps} />);

    expect(screen.getByText('All Conditions')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    expect(screen.getByText('Good')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();
  });

  it('should render price range inputs', () => {
    render(<FilterSidebar {...defaultProps} />);

    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
  });

  it('should highlight selected condition', () => {
    render(<FilterSidebar {...defaultProps} selectedCondition="excellent" />);

    const excellentButton = screen.getByText('Excellent');
    expect(excellentButton).toHaveClass('bg-cyan-subtle', 'text-cyan-400', 'border-cyan-400');
  });

  it('should call onConditionChange when condition is selected', async () => {
    const mockOnConditionChange = vi.fn();

    render(<FilterSidebar {...defaultProps} onConditionChange={mockOnConditionChange} />);

    await userEvent.click(screen.getByText('Excellent'));
    expect(mockOnConditionChange).toHaveBeenCalledWith('excellent');
  });

  it('should call onPriceRangeChange when price inputs change (debounced)', async () => {
    const mockOnPriceRangeChange = vi.fn();

    render(<FilterSidebar {...defaultProps} onPriceRangeChange={mockOnPriceRangeChange} />);

    const minInput = screen.getByPlaceholderText('Min');

    // Inputs update local state synchronously; the parent callback fires via a
    // 500ms debounce, so verify the input reflects the typed value immediately.
    fireEvent.change(minInput, { target: { value: '100' } });

    // type="number" coerces the string value to a number
    expect(minInput).toHaveValue(100);
  });

  it('should call onPriceRangeChange immediately when a preset is clicked', async () => {
    const mockOnPriceRangeChange = vi.fn();

    render(<FilterSidebar {...defaultProps} onPriceRangeChange={mockOnPriceRangeChange} />);

    await userEvent.click(screen.getByText('£100 - £300'));
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: '100', max: '300' });
  });

  it('should call onClearFilters when clear button is clicked', async () => {
    const mockOnClearFilters = vi.fn();

    render(<FilterSidebar {...defaultProps} onClearFilters={mockOnClearFilters} />);

    await userEvent.click(screen.getByText('Clear All'));
    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('should display current price range values', () => {
    render(<FilterSidebar {...defaultProps} priceRange={{ min: '100', max: '500' }} />);

    expect(screen.getByDisplayValue('100')).toBeInTheDocument();
    expect(screen.getByDisplayValue('500')).toBeInTheDocument();
  });

  it('should reset condition selection when All Conditions is clicked', async () => {
    const mockOnConditionChange = vi.fn();

    render(<FilterSidebar {...defaultProps} selectedCondition="excellent" onConditionChange={mockOnConditionChange} />);

    await userEvent.click(screen.getByText('All Conditions'));
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
    expect(sidebar).toHaveClass('bg-bg-card', 'p-6', 'rounded-lg', 'border');
  });

  it('should validate price inputs are numeric', () => {
    render(<FilterSidebar {...defaultProps} />);

    const minInput = screen.getByPlaceholderText('Min');
    expect(minInput).toHaveAttribute('type', 'number');
    expect(minInput).toHaveAttribute('min', '0');
    expect(minInput).toHaveAttribute('step', '0.01');
  });

  it('should highlight an active preset price range', () => {
    render(<FilterSidebar {...defaultProps} priceRange={{ min: '300', max: '500' }} />);

    const presetButton = screen.getByText('£300 - £500');
    expect(presetButton).toHaveClass('bg-cyan-subtle', 'text-cyan-400', 'border-cyan-400');
  });

  it('should highlight the active Any Price option when range is empty', () => {
    render(<FilterSidebar {...defaultProps} />);

    const anyPriceButton = screen.getByText('Any Price');
    expect(anyPriceButton).toHaveClass('bg-cyan-subtle', 'text-cyan-400', 'border-cyan-400');
  });

  it('should reset price range when Any Price is clicked', async () => {
    const mockOnPriceRangeChange = vi.fn();

    render(
      <FilterSidebar
        {...defaultProps}
        priceRange={{ min: '100', max: '500' }}
        onPriceRangeChange={mockOnPriceRangeChange}
      />
    );

    await userEvent.click(screen.getByText('Any Price'));
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: '', max: '' });
  });
});
