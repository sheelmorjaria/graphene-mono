import React, { useState } from 'react';
import { useCheckout } from '../../contexts/CheckoutContext';
import AddressForm from '../AddressForm';
import { createAddress } from '../../services/addressService';

const DeliveryAddressSection = () => {
  const {
    deliveryAddress,
    addresses,
    addressesLoading,
    setDeliveryAddress,
    refreshAddresses,
    shippingRates,
    shippingRatesLoading,
    shippingRatesError,
    shippingMethod,
    setShippingMethod
  } = useCheckout();

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: 'GB',
    phoneNumber: '',
    isDefault: false
  });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleAddressSelect = (address) => {
    setDeliveryAddress(address);
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      setCreateError('');
      
      const response = await createAddress(formData);
      
      if (response.success) {
        setDeliveryAddress(response.data.address);
        refreshAddresses();
        setShowAddressForm(false);
        setFormData({
          fullName: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          stateProvince: '',
          postalCode: '',
          country: 'GB',
          phoneNumber: '',
          isDefault: false
        });
      } else {
        setCreateError(response.error || 'Failed to create address');
      }
    } catch (error) {
      setCreateError(error.message || 'Failed to create address');
    } finally {
      setIsCreating(false);
    }
  };

  const handleShippingMethodSelect = (method) => {
    setShippingMethod(method);
  };

  return (
    <div className="space-y-6">
      {/* Delivery Address Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Delivery Address</h2>
        
        {addressesLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading addresses...</p>
          </div>
        ) : (
          <>
            {/* Existing Addresses */}
            {addresses.length > 0 && (
              <div className="space-y-3 mb-4">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      deliveryAddress?._id === address._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleAddressSelect(address)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{address.fullName}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>{address.addressLine1}</div>
                          {address.addressLine2 && <div>{address.addressLine2}</div>}
                          <div>
                            {address.city}, {address.stateProvince} {address.postalCode}
                          </div>
                          <div>{address.country}</div>
                          {address.phoneNumber && (
                            <div className="mt-1">Phone: {address.phoneNumber}</div>
                          )}
                        </div>
                        {address.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <input
                          type="radio"
                          checked={deliveryAddress?._id === address._id}
                          onChange={() => handleAddressSelect(address)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Address Button */}
            <button
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showAddressForm ? 'Cancel' : 'Add New Address'}
              </div>
            </button>

            {/* New Address Form */}
            {showAddressForm && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Address</h3>
                
                {createError && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{createError}</p>
                  </div>
                )}

                <form onSubmit={handleCreateAddress}>
                  <AddressForm
                    formData={formData}
                    setFormData={setFormData}
                    showDefaultCheckbox={true}
                  />
                  
                  <div className="flex justify-end space-x-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className={`px-4 py-2 rounded-lg text-white ${
                        isCreating
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {isCreating ? 'Creating...' : 'Save Address'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Shipping Methods Section */}
      {deliveryAddress && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Method</h2>
          
          {shippingRatesLoading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading shipping methods...</p>
            </div>
          ) : shippingRatesError ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{shippingRatesError}</p>
            </div>
          ) : shippingRates.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                No shipping methods available for the selected address.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shippingRates.map((rate) => (
                <div
                  key={rate.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    shippingMethod?.id === rate.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleShippingMethodSelect(rate)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={shippingMethod?.id === rate.id}
                        onChange={() => handleShippingMethodSelect(rate)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-900">{rate.name}</div>
                        <div className="text-sm text-gray-600">{rate.estimatedDelivery}</div>
                        {rate.description && (
                          <div className="text-sm text-gray-500 mt-1">{rate.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {rate.isFreeShipping ? (
                        <span className="text-lg font-semibold text-green-600">FREE</span>
                      ) : (
                        <span className="text-lg font-semibold text-gray-900">
                          £{rate.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryAddressSection;