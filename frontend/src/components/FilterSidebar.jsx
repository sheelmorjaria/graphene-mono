import PropTypes from 'prop-types';

const FilterSidebar = ({
  categories,
  selectedCategory,
  priceRange,
  selectedCondition,
  onCategoryChange,
  onPriceRangeChange,
  onConditionChange,
  onClearFilters
}) => {
  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  const handlePriceChange = (field, value) => {
    onPriceRangeChange({
      ...priceRange,
      [field]: value
    });
  };

  const getCategoryButtonClass = (categorySlug) => {
    const baseClass = "w-full text-left px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
    if (selectedCategory === categorySlug) {
      return `${baseClass} bg-blue-100 text-blue-800 font-medium`;
    }
    return `${baseClass} text-gray-700 hover:bg-gray-100`;
  };

  const getConditionButtonClass = (conditionValue) => {
    const baseClass = "w-full text-left px-3 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500";
    if (selectedCondition === conditionValue) {
      return `${baseClass} bg-blue-100 text-blue-800 font-medium`;
    }
    return `${baseClass} text-gray-700 hover:bg-gray-100`;
  };

  return (
    <aside 
      className="bg-white p-6 rounded-lg border border-gray-200 h-fit"
      aria-label="Filter products"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
        
        {/* Clear Filters Button */}
        <button
          onClick={onClearFilters}
          className="w-full mb-6 px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          Clear All Filters
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Category</h3>
        <div className="space-y-1">
          <button
            onClick={() => onCategoryChange('')}
            className={getCategoryButtonClass('')}
          >
            All Categories
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.slug)}
              className={getCategoryButtonClass(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div>
            <label htmlFor="min-price" className="sr-only">Minimum price</label>
            <input
              id="min-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Min price"
              value={priceRange.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              aria-label="Minimum price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="sr-only">Maximum price</label>
            <input
              id="max-price"
              type="number"
              min="0"
              step="0.01"
              placeholder="Max price"
              value={priceRange.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              aria-label="Maximum price"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Condition Filter */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-900 mb-3">Condition</h3>
        <div className="space-y-1">
          <button
            onClick={() => onConditionChange('')}
            className={getConditionButtonClass('')}
          >
            All Conditions
          </button>
          {conditions.map((condition) => (
            <button
              key={condition.value}
              onClick={() => onConditionChange(condition.value)}
              className={getConditionButtonClass(condition.value)}
            >
              {condition.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

FilterSidebar.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired
  })).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  priceRange: PropTypes.shape({
    min: PropTypes.string.isRequired,
    max: PropTypes.string.isRequired
  }).isRequired,
  selectedCondition: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  onPriceRangeChange: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired
};

export default FilterSidebar;