import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, createProduct, updateProduct, deleteProduct } from '../services/adminService';
import { API_BASE_URL } from '../utils/apiConfig';
import LoadingSpinner from '../components/LoadingSpinner';
import VariationManager from '../components/admin/VariationManager';

function AdminProductFormPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(productId);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    baseModel: '',
    shortDescription: '',
    longDescription: '',
    category: '',
    tags: '',
    status: 'draft',
    leadTimeMinDays: '5',
    leadTimeMaxDays: '7',
    leadTimeDisplayText: '5-7 working days'
  });

  const [variations, setVariations] = useState([]);

  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode && productId) {
      loadProduct();
    }
  }, [isEditMode, productId]);

  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getProductById(productId);
      
      if (response.success) {
        const product = response.data;
        setFormData({
          name: product.name || '',
          sku: product.sku || '',
          baseModel: product.baseModel || '',
          shortDescription: product.shortDescription || '',
          longDescription: product.longDescription || '',
          category: product.category?._id || '',
          tags: Array.isArray(product.tags) ? product.tags.join(', ') : '',
          status: product.status || 'draft',
          leadTimeMinDays: product.leadTime?.minDays?.toString() || '5',
          leadTimeMaxDays: product.leadTime?.maxDays?.toString() || '7',
          leadTimeDisplayText: product.leadTime?.displayText || '5-7 working days'
        });

        // Set variations preserving all fields (phone or USB drive)
        if (product.variations && product.variations.length > 0) {
          setVariations(product.variations.map(v => ({
            _id: v._id,
            // Phone variation fields
            condition: v.condition || '',
            color: v.color || '',
            storage: v.storage || '',
            // USB drive variation fields  
            capacity: v.capacity || '',
            interface: v.interface || '',
            variantName: v.variantName || '',
            // Common fields
            price: v.price?.toString() || '',
            salePrice: v.salePrice?.toString() || '',
            stockQuantity: v.stockQuantity?.toString() || '0',
            stockStatus: v.stockStatus || 'in_stock',
            sku: v.sku || '',
            images: v.images || []
          })));
        }
        
        // Set existing images
        if (product.images && product.images.length > 0) {
          setExistingImages(product.images);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.sku.trim()) {
      newErrors.sku = 'SKU is required';
    }

    if (!formData.baseModel.trim()) {
      newErrors.baseModel = 'Base model is required';
    }

    // Validate variations
    if (variations.length === 0) {
      newErrors.variations = 'At least one variation is required';
    } else {
      variations.forEach((variation, index) => {
        // Validate common fields
        if (!variation.price || isNaN(parseFloat(variation.price)) || parseFloat(variation.price) <= 0) {
          newErrors[`variation_${index}_price`] = `Valid price is required for variation ${index + 1}`;
        }
        if (variation.salePrice && (isNaN(parseFloat(variation.salePrice)) || parseFloat(variation.salePrice) < 0)) {
          newErrors[`variation_${index}_salePrice`] = `Sale price must be valid for variation ${index + 1}`;
        }
        if (!variation.sku.trim()) {
          newErrors[`variation_${index}_sku`] = `SKU is required for variation ${index + 1}`;
        }
        
        // Validate based on product type
        const hasPhoneFields = variation.condition && variation.color;
        const hasUSBFields = variation.capacity && variation.interface;
        
        if (!hasPhoneFields && !hasUSBFields) {
          // Must have either phone or USB fields
          if (!variation.condition && !variation.capacity) {
            newErrors[`variation_${index}_type`] = `Variation ${index + 1} must have either condition/color (phone) or capacity/interface (USB) fields`;
          }
        }
        
        // Phone-specific validation
        if (variation.condition && !variation.color?.trim()) {
          newErrors[`variation_${index}_color`] = `Color is required for phone variation ${index + 1}`;
        }
        
        // USB-specific validation  
        if (variation.capacity && !variation.interface?.trim()) {
          newErrors[`variation_${index}_interface`] = `Interface is required for USB variation ${index + 1}`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleVariationsChange = (newVariations) => {
    setVariations(newVariations);
    
    // Clear variation-related errors
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('variation_')) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate file types and sizes
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        setError(`${file.name} is not a valid image type. Only JPEG, PNG, and WebP are allowed.`);
        return false;
      }
      if (file.size > maxSize) {
        setError(`${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedImages(validFiles);

    // Create preview URLs
    const previews = validFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    // Clean up previous previews
    imagePreviews.forEach(preview => {
      if (preview.url.startsWith('blob:')) {
        URL.revokeObjectURL(preview.url);
      }
    });

    setImagePreviews(previews);
    setError(null);
  };

  const removeImagePreview = (index) => {
    const newPreviews = [...imagePreviews];
    const removedPreview = newPreviews.splice(index, 1)[0];
    
    // Clean up the URL
    if (removedPreview.url.startsWith('blob:')) {
      URL.revokeObjectURL(removedPreview.url);
    }
    
    setImagePreviews(newPreviews);
    
    // Update selected images
    const newFiles = [...selectedImages];
    newFiles.splice(index, 1);
    setSelectedImages(newFiles);
  };

  const removeExistingImage = (index) => {
    const newImages = [...existingImages];
    newImages.splice(index, 1);
    setExistingImages(newImages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // Create FormData for file uploads
      const formDataToSubmit = new FormData();
      
      // Add text fields
      formDataToSubmit.append('name', formData.name.trim());
      formDataToSubmit.append('sku', formData.sku.trim());
      formDataToSubmit.append('baseModel', formData.baseModel.trim());
      formDataToSubmit.append('shortDescription', formData.shortDescription || '');
      formDataToSubmit.append('longDescription', formData.longDescription || '');
      formDataToSubmit.append('status', formData.status);
      formDataToSubmit.append('tags', formData.tags || '');
      
      if (formData.category) {
        formDataToSubmit.append('category', formData.category);
      }

      // Add variations as JSON - handle both phone and USB drive fields
      const processedVariations = variations.map(v => {
        const baseVariation = {
          _id: v._id,
          price: parseFloat(v.price),
          salePrice: v.salePrice ? parseFloat(v.salePrice) : undefined,
          stockQuantity: parseInt(v.stockQuantity) || 0,
          stockStatus: v.stockStatus,
          sku: v.sku.trim(),
          images: v.images || []
        };
        
        // Add phone-specific fields if present
        if (v.condition) baseVariation.condition = v.condition;
        if (v.color) baseVariation.color = v.color.trim();
        if (v.storage) baseVariation.storage = v.storage;
        
        // Add USB drive-specific fields if present
        if (v.capacity) baseVariation.capacity = v.capacity.trim();
        if (v.interface) baseVariation.interface = v.interface.trim();
        if (v.variantName) baseVariation.variantName = v.variantName.trim();
        
        return baseVariation;
      });
      formDataToSubmit.append('variations', JSON.stringify(processedVariations));

      // Add lead time information
      if (formData.leadTimeMinDays) {
        formDataToSubmit.append('leadTimeMinDays', parseInt(formData.leadTimeMinDays));
      }
      if (formData.leadTimeMaxDays) {
        formDataToSubmit.append('leadTimeMaxDays', parseInt(formData.leadTimeMaxDays));
      }
      if (formData.leadTimeDisplayText) {
        formDataToSubmit.append('leadTimeDisplayText', formData.leadTimeDisplayText.trim());
      }

      // Add main product image files
      selectedImages.forEach((file) => {
        formDataToSubmit.append('images', file);
      });

      // Add variation-specific image files
      variations.forEach((variation, index) => {
        if (variation.imageFiles && variation.imageFiles.length > 0) {
          variation.imageFiles.forEach((file) => {
            formDataToSubmit.append(`variation_${index}_images`, file);
          });
        }
      });

      let response;
      if (isEditMode) {
        response = await updateProduct(productId, formDataToSubmit);
      } else {
        response = await createProduct(formDataToSubmit);
      }

      if (response.success) {
        setSuccess(`Product ${isEditMode ? 'updated' : 'created'} successfully!`);
        setTimeout(() => {
          navigate('/admin/products');
        }, 2000);
      }
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} product`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/products');
  };

  const handleDeleteProduct = async () => {
    try {
      setDeleting(true);
      setError(null);
      
      await deleteProduct(productId);
      
      setSuccess('Product archived successfully');
      setDeleteConfirm(false);
      
      // Navigate back to products list after a short delay
      setTimeout(() => {
        navigate('/admin/products');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
      setDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    setDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow-sm rounded-lg p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                    Base SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.sku ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter base SKU"
                  />
                  {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                </div>

                <div>
                  <label htmlFor="baseModel" className="block text-sm font-medium text-gray-700 mb-2">
                    Base Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="baseModel"
                    name="baseModel"
                    value={formData.baseModel}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                      errors.baseModel ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Pixel 8"
                  />
                  {errors.baseModel && <p className="mt-1 text-sm text-red-600">{errors.baseModel}</p>}
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="shortDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                <textarea
                  id="shortDescription"
                  name="shortDescription"
                  rows={3}
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief product description"
                />
              </div>

              <div className="mt-6">
                <label htmlFor="longDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Long Description
                </label>
                <textarea
                  id="longDescription"
                  name="longDescription"
                  rows={6}
                  value={formData.longDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Detailed product description"
                />
              </div>
            </div>

            {/* Product Variations */}
            <div>
              <VariationManager
                variations={variations}
                onVariationsChange={handleVariationsChange}
              />
              {errors.variations && <p className="mt-2 text-sm text-red-600">{errors.variations}</p>}
              {/* Display validation errors for variations */}
              {Object.keys(errors).filter(key => key.startsWith('variation_')).map(key => (
                <p key={key} className="mt-1 text-sm text-red-600">{errors[key]}</p>
              ))}
            </div>

            {/* Lead Time Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Time Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="leadTimeMinDays" className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Days
                  </label>
                  <input
                    type="number"
                    id="leadTimeMinDays"
                    name="leadTimeMinDays"
                    min="0"
                    value={formData.leadTimeMinDays}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label htmlFor="leadTimeMaxDays" className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Days
                  </label>
                  <input
                    type="number"
                    id="leadTimeMaxDays"
                    name="leadTimeMaxDays"
                    min="0"
                    value={formData.leadTimeMaxDays}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="7"
                  />
                </div>

                <div>
                  <label htmlFor="leadTimeDisplayText" className="block text-sm font-medium text-gray-700 mb-2">
                    Display Text
                  </label>
                  <input
                    type="text"
                    id="leadTimeDisplayText"
                    name="leadTimeDisplayText"
                    value={formData.leadTimeDisplayText}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5-7 working days"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Lead time information for GrapheneOS phones (default: 5-7 working days for custom preparation)
              </p>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter tags separated by commas"
                  />
                  <p className="mt-1 text-sm text-gray-500">Separate tags with commas (e.g., smartphone, android, pixel)</p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Images</h3>
              
              {/* Existing Images (Edit Mode) */}
              {isEditMode && existingImages.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Images
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {existingImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`${API_BASE_URL.replace('/api', '')}${image.thumbnailUrl || image.url}`}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* New Image Upload */}
              <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                  {isEditMode ? 'Add New Images' : 'Product Images'}
                </label>
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload up to 10 images. Accepted formats: JPEG, PNG, WebP. Maximum size: 5MB per file.
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Images Preview
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImagePreview(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg truncate">
                          {preview.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              {/* Delete Button (Edit Mode Only) */}
              {isEditMode && (
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || deleting}
                >
                  {deleting ? 'Archiving...' : 'Archive Product'}
                </button>
              )}
              
              {/* Right Side Actions */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={submitting || deleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || deleting}
                >
                  {submitting ? 'Saving...' : (isEditMode ? 'Update Product' : 'Create Product')}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-2">Archive Product</h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500 mb-4">
                    Are you sure you want to archive "{formData.name}"?
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          <strong>Soft Delete:</strong> This will archive the product, removing it from the storefront but keeping it for historical order data. The product can be restored later if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center space-x-4 px-4 py-3">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={deleting}
                  >
                    {deleting ? 'Archiving...' : 'Archive Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminProductFormPage;