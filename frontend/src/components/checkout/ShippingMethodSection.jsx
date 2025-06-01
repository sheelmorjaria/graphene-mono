import React from 'react';
import { useCheckout } from '../../contexts/CheckoutContext';
import { formatCurrency } from '../../services/shippingService';

const ShippingMethodCard = ({ shippingMethod, isSelected, onSelect }) => {
  const { name, description, estimatedDelivery, cost, isFreeShipping } = shippingMethod;

  return (
    <div 
      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={() => onSelect(shippingMethod)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <input
            type="radio"
            checked={isSelected}
            onChange={() => onSelect(shippingMethod)}
            className="mt-1 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{name}</h4>
              <div className="text-right">
                {isFreeShipping ? (
                  <span className="text-lg font-semibold text-green-600">FREE</span>
                ) : (
                  <span className="text-lg font-semibold text-gray-900">{formatCurrency(cost)}</span>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              <div className="font-medium">{estimatedDelivery}</div>
              {description && <div>{description}</div>}
            </div>

            {isFreeShipping && (
              <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Free Shipping
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ShippingMethodSection = () => {
  const {
    checkoutState,
    shippingRates,
    shippingRatesLoading,
    shippingRatesError,
    setShippingMethod,
    refreshShippingRates
  } = useCheckout();

  const handleSelectShippingMethod = (method) => {
    setShippingMethod(method);
  };

  // Don't show if no shipping address selected
  if (!checkoutState.shippingAddress) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Shipping Method</h3>
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📦</div>
          <h4 className="text-lg font-medium text-gray-700 mb-2">Select Shipping Address First</h4>
          <p className="text-gray-600">
            Please select a shipping address to see available shipping options.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Shipping Method</h3>

      {/* Error message */}
      {shippingRatesError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <div className="flex justify-between items-center">
            <span>{shippingRatesError}</span>
            <button
              onClick={refreshShippingRates}
              className="text-red-700 hover:text-red-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {shippingRatesLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Calculating shipping rates...</p>
        </div>
      ) : (
        <>
          {/* Shipping method selection */}
          {shippingRates.length > 0 ? (
            <div className="space-y-4 mb-6">
              <h4 className="text-md font-medium text-gray-800">Choose a shipping method:</h4>
              {shippingRates.map((method) => (
                <ShippingMethodCard
                  key={method.id}
                  shippingMethod={method}
                  isSelected={checkoutState.shippingMethod?.id === method.id}
                  onSelect={handleSelectShippingMethod}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🚫</div>
              <h4 className="text-lg font-medium text-gray-700 mb-2">No Shipping Options Available</h4>
              <p className="text-gray-600 mb-4">
                No shipping methods are available for your location and cart contents.
              </p>
              <button
                onClick={refreshShippingRates}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh Shipping Options
              </button>
            </div>
          )}

          {/* Selected shipping method summary */}
          {checkoutState.shippingMethod && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Selected Shipping Method:</h4>
              <div className="flex justify-between items-start">
                <div className="text-sm text-blue-700">
                  <div className="font-medium">{checkoutState.shippingMethod.name}</div>
                  <div>{checkoutState.shippingMethod.estimatedDelivery}</div>
                  {checkoutState.shippingMethod.description && (
                    <div className="mt-1">{checkoutState.shippingMethod.description}</div>
                  )}
                </div>
                <div className="text-right">
                  {checkoutState.shippingMethod.isFreeShipping ? (
                    <span className="text-lg font-semibold text-green-600">FREE</span>
                  ) : (
                    <span className="text-lg font-semibold text-blue-800">
                      {formatCurrency(checkoutState.shippingMethod.cost)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Shipping to address info */}
          <div className="mt-6 text-sm text-gray-600">
            <span className="font-medium">Shipping to:</span> {checkoutState.shippingAddress.city}, {checkoutState.shippingAddress.stateProvince}, {checkoutState.shippingAddress.country}
          </div>
        </>
      )}
    </div>
  );
};

export default ShippingMethodSection;