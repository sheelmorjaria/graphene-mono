import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const FilterSidebar = ({
  priceRange,
  selectedCondition,
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
    const baseClass = "w-full text-left px-4 py-3 text-sm font-mono uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border";
    if (selectedCondition === conditionValue) {
      return `${baseClass} bg-cyan-subtle text-cyan-400 border-cyan-400 shadow-glow-cyan`;
    }
    return `${baseClass} bg-bg-elevated text-text-secondary border-border-subtle hover:border-border-cyan hover:text-cyan-400`;
  };

  return (
    <aside
      className="bg-bg-card p-6 rounded-lg border border-border-subtle h-fit"
      aria-label="Filter products"
    >
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg text-text-primary uppercase tracking-wider flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.707.293l-6.414-6.414A1 1 0 015 6.586V4z" />
            </svg>
            Filters
          </h2>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={onClearFilters}
          className="w-full px-4 py-2.5 text-sm font-mono uppercase tracking-wider text-text-secondary border border-border-subtle rounded-lg hover:text-cyan-400 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all duration-200 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5m-.582 0H9m11 11v-5m11 11v-5m0 0h2" />
          </svg>
          Clear All
        </button>
      </div>


      {/* Price Range Filter */}
      <div className="mb-6">
        <h3 className="font-heading font-semibold text-sm text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 3zm0 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 3zm0-8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 3z" />
          </svg>
          Price Range
        </h3>

        {/* Clear Price Range Button */}
        <button
          onClick={() => handlePresetPriceRange('', '')}
          className={`w-full text-left px-4 py-3 text-sm font-mono uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border mb-3 ${
            isPriceRangeActive('', '')
              ? 'bg-cyan-subtle text-cyan-400 border-cyan-400 shadow-glow-cyan'
              : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-cyan-400 hover:text-cyan-400'
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
              className={`w-full text-left px-4 py-3 text-sm font-mono uppercase tracking-wider rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 border ${
                isPriceRangeActive(range.min, range.max)
                  ? 'bg-cyan-subtle text-cyan-400 border-cyan-400 shadow-glow-cyan'
                  : 'bg-bg-elevated text-text-secondary border-border-subtle hover:border-cyan-400 hover:text-cyan-400'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Custom Price Range Inputs */}
        <div className="border-t border-border-subtle pt-4">
          <p className="font-mono text-xs text-text-muted mb-3 uppercase tracking-wider">Custom range:</p>
          <div className="space-y-3">
            <div>
              <label htmlFor="min-price" className="sr-only">Minimum price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-xs">£</span>
                <input
                  id="min-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Min"
                  value={localPriceRange.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  aria-label="Minimum price"
                  className="form-input !pl-7"
                />
              </div>
            </div>
            <div>
              <label htmlFor="max-price" className="sr-only">Maximum price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 font-mono text-xs">£</span>
                <input
                  id="max-price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Max"
                  value={localPriceRange.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  aria-label="Maximum price"
                  className="form-input !pl-7"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Condition Filter */}
      <div className="mb-4">
        <h3 className="font-heading font-semibold text-sm text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Condition
        </h3>
        <div className="space-y-2">
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
  priceRange: PropTypes.shape({
    min: PropTypes.string.isRequired,
    max: PropTypes.string.isRequired
  }).isRequired,
  selectedCondition: PropTypes.string.isRequired,
  onPriceRangeChange: PropTypes.func.isRequired,
  onConditionChange: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired
};

export default FilterSidebar;
