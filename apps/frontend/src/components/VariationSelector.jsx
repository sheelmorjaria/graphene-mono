import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VariationSelector = ({ variations, onVariationSelect }) => {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariation, setSelectedVariation] = useState(null);

  // Extract unique conditions and colors
  const conditions = [...new Set(variations.map(v => v.condition))];
  const colors = [...new Set(variations.map(v => v.color))];

  // Get available colors for selected condition
  const getAvailableColors = () => {
    if (!selectedCondition) return colors;
    return [...new Set(
      variations
        .filter(v => v.condition === selectedCondition && v.stockStatus !== 'out_of_stock')
        .map(v => v.color)
    )];
  };

  // Get available conditions for selected color
  const getAvailableConditions = () => {
    if (!selectedColor) return conditions;
    return [...new Set(
      variations
        .filter(v => v.color === selectedColor && v.stockStatus !== 'out_of_stock')
        .map(v => v.condition)
    )];
  };

  // Check if a combination is available
  const isAvailable = (condition, color) => {
    const variation = variations.find(
      v => v.condition === condition && v.color === color
    );
    return variation && variation.stockStatus !== 'out_of_stock';
  };

  // Update selection when condition or color changes
  useEffect(() => {
    if (selectedCondition && selectedColor) {
      const variation = variations.find(
        v => v.condition === selectedCondition && v.color === selectedColor
      );
      setSelectedVariation(variation);
      onVariationSelect(variation);
    } else {
      setSelectedVariation(null);
      onVariationSelect(null);
    }
  }, [selectedCondition, selectedColor, variations, onVariationSelect]);

  // Format price
  const formatPrice = (price) => {
    return `£${price.toFixed(2)}`;
  };

  // Get condition label
  const getConditionLabel = (condition) => {
    if (!condition || typeof condition !== 'string') {
      return 'Unknown';
    }
    return condition.charAt(0).toUpperCase() + condition.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Condition Selector */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Condition</h3>
        <div className="grid grid-cols-2 gap-3">
          {conditions.map((condition) => {
            const availableConditions = getAvailableConditions();
            const isDisabled = !availableConditions.includes(condition);
            const isSelected = selectedCondition === condition;

            return (
              <button
                key={condition}
                onClick={() => !isDisabled && setSelectedCondition(condition)}
                disabled={isDisabled}
                className={`
                  relative flex items-center justify-center px-4 py-3 border rounded-lg
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isSelected
                    ? 'border-forest-600 bg-forest-50 text-forest-900 ring-2 ring-forest-600'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-forest-400 hover:bg-forest-50'
                  }
                `}
              >
                <span className="font-medium">{getConditionLabel(condition)}</span>
                {isSelected && (
                  <svg className="absolute top-2 right-2 w-4 h-4 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Selector */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
        <div className="grid grid-cols-2 gap-3">
          {colors.map((color) => {
            const availableColors = getAvailableColors();
            const isDisabled = !availableColors.includes(color);
            const isSelected = selectedColor === color;

            return (
              <button
                key={color}
                onClick={() => !isDisabled && setSelectedColor(color)}
                disabled={isDisabled}
                className={`
                  relative flex items-center justify-center px-4 py-3 border rounded-lg
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isSelected
                    ? 'border-forest-600 bg-forest-50 text-forest-900 ring-2 ring-forest-600'
                    : isDisabled
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-300 bg-white text-gray-900 hover:border-forest-400 hover:bg-forest-50'
                  }
                `}
              >
                <span className="font-medium">{color}</span>
                {isSelected && (
                  <svg className="absolute top-2 right-2 w-4 h-4 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Variation Details */}
      {selectedVariation && (
        <div className="mt-6 p-4 bg-forest-50 border border-forest-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-forest-600">Selected variant:</p>
              <p className="font-medium text-forest-900">
                {getConditionLabel(selectedVariation.condition)} - {selectedVariation.color}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-forest-900">
                {selectedVariation.salePrice 
                  ? (
                    <>
                      <span className="line-through text-gray-500 text-lg mr-2">
                        {formatPrice(selectedVariation.price)}
                      </span>
                      {formatPrice(selectedVariation.salePrice)}
                    </>
                  )
                  : formatPrice(selectedVariation.price)
                }
              </p>
              <p className="text-sm text-forest-600">
                SKU: {selectedVariation.sku}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

VariationSelector.propTypes = {
  variations: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    condition: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    salePrice: PropTypes.number,
    stockStatus: PropTypes.string.isRequired,
    stockQuantity: PropTypes.number,
    sku: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string)
  })).isRequired,
  onVariationSelect: PropTypes.func.isRequired
};

export default VariationSelector;