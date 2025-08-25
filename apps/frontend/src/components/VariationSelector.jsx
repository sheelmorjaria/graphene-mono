import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VariationSelector = ({ variations, onVariationSelect }) => {
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [selectedInterface, setSelectedInterface] = useState('');
  const [selectedVariation, setSelectedVariation] = useState(null);

  // Detect product type based on variation properties
  const detectProductType = () => {
    if (!variations || variations.length === 0) return 'unknown';
    const firstVariation = variations[0];
    
    // Check for USB drive properties
    if (firstVariation.capacity && firstVariation.interface) {
      return 'usb-drive';
    }
    // Check for phone properties
    if (firstVariation.condition || firstVariation.color || firstVariation.storage) {
      return 'phone';
    }
    return 'unknown';
  };

  const productType = detectProductType();

  // Extract unique values for each property
  const conditions = [...new Set(variations.filter(v => v.condition).map(v => v.condition))];
  const colors = [...new Set(variations.filter(v => v.color).map(v => v.color))];
  const storages = [...new Set(variations.filter(v => v.storage).map(v => v.storage))];
  const capacities = [...new Set(variations.filter(v => v.capacity).map(v => v.capacity))];
  const interfaces = [...new Set(variations.filter(v => v.interface).map(v => v.interface))];

  // Sort capacities by size (handling GB and TB units)
  const sortCapacities = (caps) => {
    return caps.sort((a, b) => {
      // Convert to bytes for accurate comparison
      const getSizeInBytes = (sizeStr) => {
        const numericValue = parseInt(sizeStr.replace(/[^0-9]/g, ''));
        if (sizeStr.toUpperCase().includes('TB')) {
          return numericValue * 1024; // Convert TB to GB equivalent
        } else if (sizeStr.toUpperCase().includes('GB')) {
          return numericValue;
        }
        return numericValue; // Fallback for unitless numbers
      };
      
      const sizeA = getSizeInBytes(a);
      const sizeB = getSizeInBytes(b);
      return sizeA - sizeB;
    });
  };

  const sortedCapacities = sortCapacities([...capacities]);
  const sortedStorages = sortCapacities([...storages]);

  // Get available options based on current selections
  const getAvailableOptions = (propertyName, currentSelections = {}) => {
    let filtered = variations.filter(v => v.stockStatus !== 'out_of_stock');
    
    Object.entries(currentSelections).forEach(([key, value]) => {
      if (value && key !== propertyName) {
        filtered = filtered.filter(v => v[key] === value);
      }
    });

    return [...new Set(filtered.map(v => v[propertyName]).filter(Boolean))];
  };

  // Auto-select single storage option
  useEffect(() => {
    if (storages.length === 1 && !selectedStorage) {
      setSelectedStorage(storages[0]);
    }
  }, [storages, selectedStorage]);

  // Update selection based on product type
  useEffect(() => {
    let variation = null;
    
    if (productType === 'phone') {
      // Find variation matching all selected options
      variation = variations.find(v => {
        const conditionMatch = !selectedCondition || v.condition === selectedCondition;
        const colorMatch = !selectedColor || v.color === selectedColor;
        const storageMatch = !selectedStorage || v.storage === selectedStorage;
        
        // If storage exists in variations, require all three to match
        if (storages.length > 0) {
          return selectedCondition && selectedColor && selectedStorage &&
                 v.condition === selectedCondition && 
                 v.color === selectedColor && 
                 v.storage === selectedStorage;
        }
        // Otherwise just match condition and color
        return selectedCondition && selectedColor &&
               v.condition === selectedCondition && 
               v.color === selectedColor;
      });
    } else if (productType === 'usb-drive' && selectedCapacity && selectedInterface) {
      variation = variations.find(
        v => v.capacity === selectedCapacity && v.interface === selectedInterface
      );
    }
    
    setSelectedVariation(variation);
    onVariationSelect(variation);
  }, [selectedCondition, selectedColor, selectedStorage, selectedCapacity, selectedInterface, variations, onVariationSelect, productType, storages.length]);

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

  // Render phone variations
  if (productType === 'phone') {
    return (
      <div className="space-y-6">
        {/* Condition Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Condition</h3>
          <div className="grid grid-cols-2 gap-3">
            {conditions.map((condition) => {
              const availableConditions = getAvailableOptions('condition', { 
                color: selectedColor,
                storage: selectedStorage 
              });
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

        {/* Storage Selector - Show if storages exist */}
        {storages.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">Storage</h3>
            <div className="grid grid-cols-2 gap-3">
              {sortedStorages.map((storage) => {
                const availableStorages = getAvailableOptions('storage', { 
                  condition: selectedCondition, 
                  color: selectedColor 
                });
                const isDisabled = !availableStorages.includes(storage);
                const isSelected = selectedStorage === storage;
                const isSingleOption = storages.length === 1;

                return (
                  <button
                    key={storage}
                    onClick={() => !isDisabled && !isSingleOption && setSelectedStorage(storage)}
                    disabled={isDisabled || isSingleOption}
                    className={`
                      relative flex items-center justify-center px-4 py-3 border rounded-lg
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${isSelected || isSingleOption
                        ? 'border-forest-600 bg-forest-50 text-forest-900 ring-2 ring-forest-600'
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 bg-white text-gray-900 hover:border-forest-400 hover:bg-forest-50'
                      }
                      ${isSingleOption ? 'cursor-default' : ''}
                    `}
                  >
                    <span className="font-medium">{storage}</span>
                    {(isSelected || isSingleOption) && (
                      <svg className="absolute top-2 right-2 w-4 h-4 text-forest-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
          <div className="grid grid-cols-2 gap-3">
            {colors.map((color) => {
              const availableColors = getAvailableOptions('color', { 
                condition: selectedCondition,
                storage: selectedStorage 
              });
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
                  {selectedVariation.storage && ` - ${selectedVariation.storage}`}
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
  }

  // Render USB drive variations
  if (productType === 'usb-drive') {
    return (
      <div className="space-y-6">
        {/* Capacity Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Capacity</h3>
          <div className="grid grid-cols-3 gap-3">
            {sortedCapacities.map((capacity) => {
              const availableCapacities = getAvailableOptions('capacity', { interface: selectedInterface });
              const isDisabled = !availableCapacities.includes(capacity);
              const isSelected = selectedCapacity === capacity;

              return (
                <button
                  key={capacity}
                  onClick={() => !isDisabled && setSelectedCapacity(capacity)}
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
                  <span className="font-medium">{capacity}</span>
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

        {/* Interface Selector */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Connector Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {interfaces.map((interfaceType) => {
              const availableInterfaces = getAvailableOptions('interface', { capacity: selectedCapacity });
              const isDisabled = !availableInterfaces.includes(interfaceType);
              const isSelected = selectedInterface === interfaceType;

              return (
                <button
                  key={interfaceType}
                  onClick={() => !isDisabled && setSelectedInterface(interfaceType)}
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
                  <span className="font-medium">{interfaceType}</span>
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
                  {selectedVariation.capacity} - {selectedVariation.interface}
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
  }

  // Fallback for unknown product types
  return (
    <div className="text-gray-500">
      No variations available for this product.
    </div>
  );
};

VariationSelector.propTypes = {
  variations: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    // Phone variation fields
    condition: PropTypes.string,
    color: PropTypes.string,
    storage: PropTypes.string,
    // USB drive variation fields
    capacity: PropTypes.string,
    interface: PropTypes.string,
    variantName: PropTypes.string,
    // Common fields
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