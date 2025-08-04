import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VariationManager = ({ variations = [], onVariationsChange }) => {
  const [localVariations, setLocalVariations] = useState(variations);

  useEffect(() => {
    setLocalVariations(variations);
  }, [variations]);

  const addVariation = () => {
    const newVariation = {
      id: Date.now().toString(), // temporary ID for new variations
      condition: 'new',
      color: '',
      price: '',
      salePrice: '',
      stockQuantity: 0,
      stockStatus: 'in_stock',
      sku: '',
      images: []
    };
    
    const updatedVariations = [...localVariations, newVariation];
    setLocalVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const removeVariation = (index) => {
    if (localVariations.length <= 1) {
      alert('Product must have at least one variation');
      return;
    }
    
    const updatedVariations = localVariations.filter((_, i) => i !== index);
    setLocalVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const updateVariation = (index, field, value) => {
    const updatedVariations = [...localVariations];
    updatedVariations[index] = {
      ...updatedVariations[index],
      [field]: value
    };
    
    setLocalVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const getConditionOptions = () => [
    { value: 'new', label: 'New' },
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }
  ];

  const getStockStatusOptions = () => [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'low_stock', label: 'Low Stock' },
    { value: 'out_of_stock', label: 'Out of Stock' }
  ];

  const formatPrice = (price) => {
    if (!price) return '';
    return `£${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Product Variations</h3>
        <button
          type="button"
          onClick={addVariation}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Add Variation
        </button>
      </div>

      <div className="space-y-4">
        {localVariations.map((variation, index) => (
          <div
            key={variation._id || variation.id || index}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-medium text-gray-800">
                Variation {index + 1}
              </h4>
              {localVariations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariation(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition *
                </label>
                <select
                  value={variation.condition}
                  onChange={(e) => updateVariation(index, 'condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {getConditionOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color *
                </label>
                <input
                  type="text"
                  value={variation.color}
                  onChange={(e) => updateVariation(index, 'color', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Black, Blue, White"
                  required
                />
              </div>

              {/* SKU */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={variation.sku}
                  onChange={(e) => updateVariation(index, 'sku', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., PIX8-NEW-BLK"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variation.price}
                  onChange={(e) => updateVariation(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              {/* Sale Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Price (£)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variation.salePrice || ''}
                  onChange={(e) => updateVariation(index, 'salePrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Stock Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={variation.stockQuantity}
                  onChange={(e) => updateVariation(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stock Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={variation.stockStatus}
                  onChange={(e) => updateVariation(index, 'stockStatus', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {getStockStatusOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Price Display */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {variation.condition} - {variation.color}
                </span>
                <div className="text-right">
                  {variation.salePrice && parseFloat(variation.salePrice) > 0 ? (
                    <div>
                      <span className="line-through text-gray-500 mr-2">
                        {formatPrice(variation.price)}
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(variation.salePrice)}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold">
                      {formatPrice(variation.price)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>SKU: {variation.sku}</span>
                <span>Stock: {variation.stockQuantity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {localVariations.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No variations added. Click "Add Variation" to create your first variation.
        </div>
      )}
    </div>
  );
};

VariationManager.propTypes = {
  variations: PropTypes.arrayOf(PropTypes.shape({
    _id: PropTypes.string,
    condition: PropTypes.string,
    color: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    salePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stockQuantity: PropTypes.number,
    stockStatus: PropTypes.string,
    sku: PropTypes.string,
    images: PropTypes.arrayOf(PropTypes.string)
  })),
  onVariationsChange: PropTypes.func.isRequired
};

export default VariationManager;