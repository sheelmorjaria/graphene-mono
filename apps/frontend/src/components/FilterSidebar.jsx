import { useState, useEffect } from 'react';
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
  // Local state for price inputs to prevent immediate API calls
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);
  
  // Update local state when external priceRange changes (e.g., from preset buttons)
  useEffect(() => {
    setLocalPriceRange(priceRange);
  }, [priceRange]);

  // Debounced effect to update parent state after user stops typing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (localPriceRange.min !== priceRange.min || localPriceRange.max !== priceRange.max) {
        onPriceRangeChange(localPriceRange);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [localPriceRange, priceRange, onPriceRangeChange]);

  const conditions = [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  const handlePriceChange = (field, value) => {
    setLocalPriceRange({
      ...localPriceRange,
      [field]: value
    });
  };

  // Predefined price ranges for easier selection
  const priceRanges = [
    { label: '£100 - £300', min: '100', max: '300' },
    { label: '£300 - £500', min: '300', max: '500' },
    { label: '£500 - £800', min: '500', max: '800' },
    { label: 'Over £800', min: '800', max: '' }
  ];

  const handlePresetPriceRange = (min, max) => {
    const newRange = { min, max };
    setLocalPriceRange(newRange);
    onPriceRangeChange(newRange);
  };

  const isPriceRangeActive = (min, max) => {
    return priceRange.min === min && priceRange.max === max;
  };


  const getConditionButtonClass = (conditionValue) => {
    const baseClass = "w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500";
    if (selectedCondition === conditionValue) {
      return `${baseClass} bg-forest-200 text-forest-800 font-medium border border-forest-300`;
    }
    return `${baseClass} text-forest-700 hover:bg-forest-50 hover:text-forest-800`;
  };

  return (
    <aside 
      className="bg-white p-6 rounded-lg border border-forest-200 h-fit shadow-md transition-all duration-300 hover:shadow-lg hover:border-forest-300"
      aria-label="Filter products"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-forest-900 mb-4">Filters</h2>
        
        {/* Clear Filters Button */}
        <button
          onClick={onClearFilters}
          className="w-full mb-6 px-4 py-2 text-sm text-forest-600 border border-forest-600 rounded-md hover:bg-forest-50 focus:outline-none focus:ring-2 focus:ring-forest-500 transition-all duration-200 transform hover:scale-105"
        >
          Clear All Filters
        </button>
      </div>


      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="font-medium text-forest-900 mb-3">Price Range</h3>
        
        {/* Clear Price Range Button */}
        <button
          onClick={() => handlePresetPriceRange('', '')}
          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 mb-3 ${
            isPriceRangeActive('', '')
              ? 'bg-forest-200 text-forest-800 font-medium border border-forest-300'
              : 'text-forest-700 hover:bg-forest-50 hover:text-forest-800 border border-forest-200'
          }`}
        >
          Any Price
        </button>

        {/* Preset Price Range Buttons */}
        <div className="space-y-2 mb-4">
          {priceRanges.map((range, index) => (
            <button
              key={index}
              onClick={() => handlePresetPriceRange(range.min, range.max)}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-500 ${
                isPriceRangeActive(range.min, range.max)
                  ? 'bg-forest-200 text-forest-800 font-medium border border-forest-300'
                  : 'text-forest-700 hover:bg-forest-50 hover:text-forest-800 border border-forest-200'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Custom Price Range Inputs */}
        <div className="border-t border-forest-200 pt-4">
          <p className="text-xs text-forest-600 mb-3">Or enter custom range:</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="min-price" className="sr-only">Minimum price</label>
              <input
                id="min-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Min price (£)"
                value={localPriceRange.min}
                onChange={(e) => handlePriceChange('min', e.target.value)}
                aria-label="Minimum price"
                className="w-full px-3 py-2 border border-forest-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors hover:border-forest-400 placeholder-forest-400"
              />
            </div>
            <div>
              <label htmlFor="max-price" className="sr-only">Maximum price</label>
              <input
                id="max-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Max price (£)"
                value={localPriceRange.max}
                onChange={(e) => handlePriceChange('max', e.target.value)}
                aria-label="Maximum price"
                className="w-full px-3 py-2 border border-forest-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-forest-600 transition-colors hover:border-forest-400 placeholder-forest-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Condition Filter */}
      <div className="mb-4">
        <h3 className="font-medium text-forest-900 mb-3">Condition</h3>
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
  })),
  selectedCategory: PropTypes.string,
  priceRange: PropTypes.shape({
    min: PropTypes.string.isRequired,
    max: PropTypes.string.isRequired
  }).isRequired,
  selectedCondition: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func,
  onPriceRangeChange: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired
};

export default FilterSidebar;