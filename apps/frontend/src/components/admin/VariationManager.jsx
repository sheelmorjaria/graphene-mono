import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const VariationManager = ({ variations = [], onVariationsChange }) => {
  const [localVariations, setLocalVariations] = useState(variations);

  useEffect(() => {
    setLocalVariations(variations);
  }, [variations]);

  const addVariation = () => {
    const newVariation = {
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

  const handleVariationImageUpload = (index, files) => {
    const updatedVariations = [...localVariations];
    const fileArray = Array.from(files);

    // Create file URLs for preview
    const imageUrls = fileArray.map(file => URL.createObjectURL(file));

    // Store both the files and preview URLs
    updatedVariations[index] = {
      ...updatedVariations[index],
      imageFiles: fileArray, // Store files for upload
      images: imageUrls // Store URLs for preview
    };

    setLocalVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const removeVariationImage = (variationIndex, imageIndex) => {
    const updatedVariations = [...localVariations];
    const variation = updatedVariations[variationIndex];

    if (variation.imageFiles) {
      // Remove both the file and its URL
      variation.imageFiles.splice(imageIndex, 1);
    }
    if (variation.images) {
      variation.images.splice(imageIndex, 1);
    }

    setLocalVariations(updatedVariations);
    onVariationsChange(updatedVariations);
  };

  const formatPrice = (price) => {
    if (!price) return '';
    return `£${parseFloat(price).toFixed(2)}`;
  };

  const getVariationDisplayText = (variation) => {
    return `${variation.condition || ''} - ${variation.color || ''} - ${variation.storage || ''}`;
  };

  return (
    <div className="space-y-4">
      {/* Add Variation Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Variations ({localVariations.length})</h3>
        <button
          type="button"
          onClick={addVariation}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add Variation
        </button>
      </div>

      {/* Variations List */}
      {localVariations.map((variation, index) => (
        <div
          key={variation.id || index}
          className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
        >
          {/* Variation Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <span className="text-sm font-medium text-gray-500">Variation {index + 1}</span>
              <p className="text-xs text-gray-400">{getVariationDisplayText(variation)}</p>
            </div>
            {localVariations.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariation(index)}
                className="text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <option value="">Select condition</option>
                <option value="new">New</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
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
                placeholder="e.g., Obsidian, Porcelain"
                required
              />
            </div>

            {/* Storage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Storage *
              </label>
              <input
                type="text"
                value={variation.storage}
                onChange={(e) => updateVariation(index, 'storage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 128GB, 256GB"
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
                value={variation.price}
                onChange={(e) => updateVariation(index, 'price', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
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
                value={variation.salePrice || ''}
                onChange={(e) => updateVariation(index, 'salePrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            {/* Stock Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={variation.stockQuantity}
                onChange={(e) => updateVariation(index, 'stockQuantity', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>

            {/* Stock Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Status *
              </label>
              <select
                value={variation.stockStatus}
                onChange={(e) => updateVariation(index, 'stockStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
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

            {/* Images */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Images
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleVariationImageUpload(index, e.target.files)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {variation.images && variation.images.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {variation.images.map((image, imgIndex) => (
                    <div key={imgIndex} className="relative">
                      <img
                        src={image}
                        alt={`Variation ${index + 1} - Image ${imgIndex + 1}`}
                        className="w-16 h-16 object-cover rounded border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeVariationImage(index, imgIndex)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

VariationManager.propTypes = {
  variations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      condition: PropTypes.string,
      color: PropTypes.string,
      storage: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      salePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      stockQuantity: PropTypes.number,
      stockStatus: PropTypes.string,
      sku: PropTypes.string,
      images: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  onVariationsChange: PropTypes.func.isRequired
};

export default VariationManager;
