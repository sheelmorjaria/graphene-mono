import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VariationManager = ({ variations = [], onVariationsChange }) => {
  const [localVariations, setLocalVariations] = useState(variations);
  const [productType, setProductType] = useState('phone'); // phone or usb-drive

  useEffect(() => {
    setLocalVariations(variations);
    // Detect product type from existing variations
    if (variations.length > 0) {
      const firstVariation = variations[0];
      if (firstVariation.capacity && firstVariation.interface) {
        setProductType('usb-drive');
      } else {
        setProductType('phone');
      }
    }
  }, [variations]);

  const addVariation = () => {
    let newVariation;
    
    if (productType === 'usb-drive') {
      newVariation = {
        id: Date.now().toString(),
        capacity: '',
        interface: 'USB-A',
        variantName: '',
        price: '',
        salePrice: '',
        stockQuantity: 0,
        stockStatus: 'in_stock',
        sku: '',
        images: []
      };
    } else {
      newVariation = {
        id: Date.now().toString(),
        condition: 'new',
        color: '',
        storage: '',
        price: '',
        salePrice: '',
        stockQuantity: 0,
        stockStatus: 'in_stock',
        sku: '',
        images: []
      };
    }
    
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

  const getInterfaceOptions = () => [
    { value: 'USB-A', label: 'USB-A' },
    { value: 'USB-C', label: 'USB-C' },
    { value: 'USB-A/USB-C', label: 'USB-A/USB-C' }
  ];

  const formatPrice = (price) => {
    if (!price) return '';
    return `£${parseFloat(price).toFixed(2)}`;
  };

  const getVariationDisplayText = (variation) => {
    if (productType === 'usb-drive') {
      return `${variation.capacity || ''} - ${variation.interface || ''}`;
    } else {
      return `${variation.condition || ''} - ${variation.color || ''} - ${variation.storage || ''}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Product Variations</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Product Type:</label>
            <select
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
              disabled={localVariations.length > 0}
            >
              <option value="phone">Phone</option>
              <option value="usb-drive">USB Drive</option>
            </select>
          </div>
          <button
            type="button"
            onClick={addVariation}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Variation
          </button>
        </div>
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
              {productType === 'phone' ? (
                <>
                  {/* Phone Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition *
                    </label>
                    <select
                      value={variation.condition || ''}
                      onChange={(e) => updateVariation(index, 'condition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Condition</option>
                      {getConditionOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color *
                    </label>
                    <input
                      type="text"
                      value={variation.color || ''}
                      onChange={(e) => updateVariation(index, 'color', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Black, Blue, White"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Storage *
                    </label>
                    <input
                      type="text"
                      value={variation.storage || ''}
                      onChange={(e) => updateVariation(index, 'storage', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 128GB, 256GB, 512GB"
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* USB Drive Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Capacity *
                    </label>
                    <input
                      type="text"
                      value={variation.capacity || ''}
                      onChange={(e) => updateVariation(index, 'capacity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 16GB, 32GB, 64GB"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Interface *
                    </label>
                    <select
                      value={variation.interface || ''}
                      onChange={(e) => updateVariation(index, 'interface', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Interface</option>
                      {getInterfaceOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Variant Name
                    </label>
                    <input
                      type="text"
                      value={variation.variantName || ''}
                      onChange={(e) => updateVariation(index, 'variantName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 64GB USB-A"
                    />
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU *
                </label>
                <input
                  type="text"
                  value={variation.sku || ''}
                  onChange={(e) => updateVariation(index, 'sku', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={productType === 'phone' ? 'e.g., PIX8-NEW-BLK' : 'e.g., USB-KIVP50-32A'}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (£) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={variation.price || ''}
                  onChange={(e) => updateVariation(index, 'price', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={variation.stockQuantity || 0}
                  onChange={(e) => updateVariation(index, 'stockQuantity', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Status
                </label>
                <select
                  value={variation.stockStatus || 'in_stock'}
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
                  {getVariationDisplayText(variation)}
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
    // Phone variation fields
    condition: PropTypes.string,
    color: PropTypes.string,
    storage: PropTypes.string,
    // USB drive variation fields
    capacity: PropTypes.string,
    interface: PropTypes.string,
    variantName: PropTypes.string,
    // Common fields
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