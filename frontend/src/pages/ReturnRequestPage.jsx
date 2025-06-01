import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUserOrderDetails } from '../services/orderService';
import { getEligibleReturnItems, submitReturnRequest } from '../services/returnService';
import LoadingSpinner from '../components/LoadingSpinner';

const ReturnRequestPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [eligibleItems, setEligibleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Form state
  const [selectedItems, setSelectedItems] = useState({});
  const [returnReasons, setReturnReasons] = useState({});
  const [reasonDescriptions, setReasonDescriptions] = useState({});
  const [images, setImages] = useState([]);

  const returnReasonOptions = [
    { value: 'damaged_received', label: 'Item arrived damaged' },
    { value: 'wrong_item_sent', label: 'Wrong item sent' },
    { value: 'not_as_described', label: 'Not as described' },
    { value: 'changed_mind', label: 'Changed my mind' },
    { value: 'wrong_size', label: 'Wrong size' },
    { value: 'quality_issues', label: 'Quality issues' },
    { value: 'defective_item', label: 'Defective item' },
    { value: 'other', label: 'Other reason' }
  ];

  useEffect(() => {
    loadOrderAndEligibleItems();
  }, [orderId]);

  useEffect(() => {
    if (order) {
      document.title = `Request Return - Order ${order.orderNumber} - GrapheneOS Store`;
    }
  }, [order]);

  const loadOrderAndEligibleItems = async () => {
    try {
      setLoading(true);
      setError('');

      // Load order details
      const orderResponse = await getUserOrderDetails(orderId);
      const orderData = orderResponse.data.order;
      setOrder(orderData);

      // Check if order is eligible for returns
      if (orderData.status !== 'delivered') {
        setError('Only delivered orders are eligible for returns.');
        return;
      }

      if (!orderData.deliveryDate) {
        setError('Unable to determine delivery date for this order.');
        return;
      }

      // Check return window
      const deliveryDate = new Date(orderData.deliveryDate);
      const returnWindowEnd = new Date(deliveryDate);
      returnWindowEnd.setDate(returnWindowEnd.getDate() + 30);
      
      if (new Date() > returnWindowEnd) {
        setError('The 30-day return window has expired for this order.');
        return;
      }

      if (orderData.hasReturnRequest) {
        setError('A return request has already been submitted for this order.');
        return;
      }

      // Load eligible items (for now, we'll use order items, but later this will be a separate API call)
      setEligibleItems(orderData.items);

    } catch (err) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (itemId, isSelected) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: isSelected ? 1 : 0 // Default to quantity 1 when selected
    }));

    // Reset reason when unselecting
    if (!isSelected) {
      setReturnReasons(prev => {
        const newReasons = { ...prev };
        delete newReasons[itemId];
        return newReasons;
      });
      setReasonDescriptions(prev => {
        const newDescriptions = { ...prev };
        delete newDescriptions[itemId];
        return newDescriptions;
      });
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    const item = eligibleItems.find(i => i.productId === itemId);
    const maxQuantity = item ? item.quantity : 1;
    const validQuantity = Math.min(Math.max(1, parseInt(quantity) || 1), maxQuantity);
    
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: validQuantity
    }));
  };

  const handleReasonChange = (itemId, reason) => {
    setReturnReasons(prev => ({
      ...prev,
      [itemId]: reason
    }));
  };

  const handleReasonDescriptionChange = (itemId, description) => {
    setReasonDescriptions(prev => ({
      ...prev,
      [itemId]: description
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id] > 0);
    
    if (selectedItemIds.length === 0) {
      return 'Please select at least one item to return.';
    }

    for (const itemId of selectedItemIds) {
      if (!returnReasons[itemId]) {
        return 'Please provide a reason for each selected item.';
      }
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError('');

      const selectedItemIds = Object.keys(selectedItems).filter(id => selectedItems[id] > 0);
      const returnItems = selectedItemIds.map(itemId => {
        const item = eligibleItems.find(i => i.productId === itemId);
        return {
          productId: itemId,
          productName: item.productName,
          productSlug: item.productSlug,
          quantity: selectedItems[itemId],
          unitPrice: item.unitPrice,
          reason: returnReasons[itemId],
          reasonDescription: reasonDescriptions[itemId] || ''
        };
      });

      const returnRequest = {
        orderId,
        items: returnItems,
        images: images // Note: In a real implementation, images would be uploaded to cloud storage first
      };

      await submitReturnRequest(returnRequest);
      
      // Redirect to order details with success message
      navigate(`/my-account/orders/${orderId}`, { 
        state: { message: 'Return request submitted successfully!' }
      });

    } catch (err) {
      setSubmitError(err.message || 'Failed to submit return request');
    } finally {
      setSubmitting(false);
    }
  };

  const getTotalRefundAmount = () => {
    return Object.keys(selectedItems).reduce((total, itemId) => {
      const quantity = selectedItems[itemId] || 0;
      const item = eligibleItems.find(i => i.productId === itemId);
      return total + (quantity * (item?.unitPrice || 0));
    }, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Process Return</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                to={`/my-account/orders/${orderId}`}
                className="btn btn-primary"
              >
                Back to Order Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <nav className="breadcrumb">
            <Link to="/my-account/orders" className="breadcrumb-link">My Orders</Link>
            <span className="breadcrumb-separator">›</span>
            <Link to={`/my-account/orders/${orderId}`} className="breadcrumb-link">
              Order {order?.orderNumber}
            </Link>
            <span className="breadcrumb-separator">›</span>
            <span>Request Return</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Request Return</h1>
          <p className="text-gray-600 mt-2">
            Select the items you'd like to return from order {order?.orderNumber}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Order Number:</span>
                <p className="text-gray-900">{order?.orderNumber}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Order Date:</span>
                <p className="text-gray-900">{new Date(order?.orderDate).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Delivery Date:</span>
                <p className="text-gray-900">{new Date(order?.deliveryDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Items Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Items to Return</h2>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              {eligibleItems.map((item) => {
                const isSelected = selectedItems[item.productId] > 0;
                const selectedQuantity = selectedItems[item.productId] || 1;
                
                return (
                  <div key={item.productId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        id={`item-${item.productId}`}
                        checked={isSelected}
                        onChange={(e) => handleItemSelection(item.productId, e.target.checked)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-gray-900">{item.productName}</h3>
                            <p className="text-sm text-gray-600">£{item.unitPrice.toFixed(2)} each</p>
                            <p className="text-sm text-gray-500">Originally ordered: {item.quantity}</p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-4 space-y-4">
                            {/* Quantity Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Return Quantity
                              </label>
                              <select
                                value={selectedQuantity}
                                onChange={(e) => handleQuantityChange(item.productId, e.target.value)}
                                className="form-input w-20"
                              >
                                {[...Array(item.quantity)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                              </select>
                            </div>

                            {/* Reason Selection */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reason for Return *
                              </label>
                              <select
                                value={returnReasons[item.productId] || ''}
                                onChange={(e) => handleReasonChange(item.productId, e.target.value)}
                                className="form-input w-full"
                                required
                              >
                                <option value="">Select a reason...</option>
                                {returnReasonOptions.map(option => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Additional Description */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Additional Details (Optional)
                              </label>
                              <textarea
                                value={reasonDescriptions[item.productId] || ''}
                                onChange={(e) => handleReasonDescriptionChange(item.productId, e.target.value)}
                                placeholder="Please provide any additional details about the return..."
                                className="form-input w-full"
                                rows={3}
                                maxLength={500}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporting Images (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Upload photos to support your return request (e.g., damage, wrong item received)
            </p>
            
            <div className="space-y-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="form-input"
              />
              
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Return evidence ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {Object.keys(selectedItems).some(id => selectedItems[id] > 0) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Return Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Items to return:</span>
                  <span>{Object.values(selectedItems).reduce((sum, qty) => sum + (qty || 0), 0)}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Estimated refund:</span>
                  <span>£{getTotalRefundAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link
              to={`/my-account/orders/${orderId}`}
              className="btn btn-secondary"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || Object.keys(selectedItems).every(id => selectedItems[id] === 0)}
              className="btn btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnRequestPage;