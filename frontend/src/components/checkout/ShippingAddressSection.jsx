import React, { useState } from 'react';
import { useCheckout } from '../../contexts/CheckoutContext';
import { addUserAddress, updateUserAddress } from '../../services/addressService';
import AddressForm from '../AddressForm';
import ShippingMethodSection from './ShippingMethodSection';

const AddressCard = ({ address, isSelected, onSelect, onEdit }) => {
  return (
    <div 
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSelect(address)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <input
            type="radio"
            checked={isSelected}
            onChange={() => onSelect(address)}
            className="mt-1 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{address.fullName}</span>
              {address.isDefault && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Default
                </span>
              )}
            </div>
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
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(address);
          }}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Edit
        </button>
      </div>
    </div>
  );
};

const ShippingAddressSection = () => {
  const {
    checkoutState,
    addresses,
    addressesLoading,
    addressesError,
    setShippingAddress,
    nextStep,
    canProceedToPayment,
    refreshAddresses
  } = useCheckout();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSelectAddress = (address) => {
    setShippingAddress(address);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setShowAddForm(true);
    setShowEditForm(false);
    setFormError('');
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowEditForm(true);
    setShowAddForm(false);
    setFormError('');
  };

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true);
      setFormError('');

      let savedAddress;
      if (editingAddress) {
        // Update existing address
        const response = await updateUserAddress(editingAddress._id, formData);
        savedAddress = response.data.address;
      } else {
        // Add new address
        const response = await addUserAddress(formData);
        savedAddress = response.data.address;
      }

      // Refresh addresses list
      await refreshAddresses();
      
      // Select the saved address
      setShippingAddress(savedAddress);
      
      // Close form
      setShowAddForm(false);
      setShowEditForm(false);
      setEditingAddress(null);
    } catch (err) {
      setFormError(err.message || 'Failed to save address');
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setEditingAddress(null);
    setFormError('');
  };

  const handleContinueToPayment = () => {
    if (canProceedToPayment) {
      nextStep();
    }
  };

  // Show add/edit form
  if (showAddForm || showEditForm) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">
          {showEditForm ? 'Edit Address' : 'Add New Address'}
        </h2>

        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            {formError}
          </div>
        )}

        <AddressForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          initialData={editingAddress}
          isEdit={showEditForm}
          isLoading={formLoading}
        />
      </div>
    );
  }

  return (
    <div 
      data-testid="shipping-form"
      className="bg-white rounded-lg shadow p-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Shipping Address</h2>

      {/* Error message */}
      {addressesError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <div className="flex justify-between items-center">
            <span>{addressesError}</span>
            <button
              onClick={refreshAddresses}
              className="text-red-700 hover:text-red-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {addressesLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading addresses...</p>
        </div>
      ) : (
        <>
          {/* Address selection */}
          {addresses.length > 0 ? (
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-medium text-gray-800">Choose a shipping address:</h3>
              {addresses.map((address) => (
                <AddressCard
                  key={address._id}
                  address={address}
                  isSelected={checkoutState.shippingAddress?._id === address._id}
                  onSelect={handleSelectAddress}
                  onEdit={handleEditAddress}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 mb-6">
              <div className="text-6xl mb-4">📍</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No Addresses Found</h3>
              <p className="text-gray-600 mb-4">
                You haven't added any shipping addresses yet.
              </p>
            </div>
          )}

          {/* Add new address button */}
          <div className="border-t pt-6">
            <button
              onClick={handleAddNewAddress}
              data-testid="add-address-button"
              className="w-full py-3 px-4 border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors rounded-lg font-medium"
            >
              + Add New Address
            </button>
          </div>

          {/* Selected address summary */}
          {checkoutState.shippingAddress && (
            <div 
              data-testid="shipping-address"
              className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Shipping Address:</h4>
              <div className="text-sm text-blue-700">
                <div className="font-medium">{checkoutState.shippingAddress.fullName}</div>
                <div>{checkoutState.shippingAddress.addressLine1}</div>
                {checkoutState.shippingAddress.addressLine2 && (
                  <div>{checkoutState.shippingAddress.addressLine2}</div>
                )}
                <div>
                  {checkoutState.shippingAddress.city}, {checkoutState.shippingAddress.stateProvince} {checkoutState.shippingAddress.postalCode}
                </div>
                <div>{checkoutState.shippingAddress.country}</div>
              </div>
            </div>
          )}

          {/* Shipping Method Section - shown after address is selected */}
          {checkoutState.shippingAddress && (
            <div className="mt-8">
              <ShippingMethodSection />
            </div>
          )}

          {/* Continue button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={handleContinueToPayment}
              disabled={!canProceedToPayment || !checkoutState.shippingMethod}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                canProceedToPayment && checkoutState.shippingMethod
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue to Payment
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShippingAddressSection;