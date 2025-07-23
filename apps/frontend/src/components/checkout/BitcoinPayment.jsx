import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ClipboardIcon, CheckIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { 
  initializeBitcoinPayment, 
  getBitcoinPaymentStatus, 
  formatBitcoinAmount,
  getBitcoinQRData,
  formatCurrency 
} from '../../services/paymentService';

const BitcoinPayment = ({ orderId, orderTotal, onPaymentStatusChange }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  // Initialize Bitcoin payment when component mounts
  useEffect(() => {
    if (orderId && !paymentData) {
      initializePayment();
    }
  }, [orderId, paymentData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for payment status updates
  useEffect(() => {
    if (!paymentData) return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [paymentData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update countdown timer
  useEffect(() => {
    if (!paymentData?.paymentExpiry) return;

    const updateTimer = () => {
      const now = new Date();
      const expiry = new Date(paymentData.paymentExpiry);
      const remaining = expiry - now;

      if (remaining <= 0) {
        setTimeRemaining('Expired');
      } else {
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [paymentData]);

  const initializePayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await initializeBitcoinPayment(orderId);
      setPaymentData(response.data);
      
      if (onPaymentStatusChange) {
        onPaymentStatusChange('awaiting_confirmation');
      }

    } catch (err) {
      console.error('Error initializing Bitcoin payment:', err);
      setError(err.message || 'Failed to initialize Bitcoin payment');
    } finally {
      setLoading(false);
    }
  }, [orderId, onPaymentStatusChange]);

  const checkPaymentStatus = useCallback(async () => {
    try {
      const response = await getBitcoinPaymentStatus(orderId);
      const status = response.data;
      
      setPaymentStatus(status);
      
      if (onPaymentStatusChange) {
        onPaymentStatusChange(status.paymentStatus);
      }

    } catch (err) {
      console.error('Error checking Bitcoin payment status:', err);
    }
  }, [orderId, onPaymentStatusChange]);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getStatusMessage = () => {
    if (!paymentStatus) return null;

    switch (paymentStatus.paymentStatus) {
      case 'awaiting_confirmation':
        if (paymentStatus.bitcoinConfirmations === 0) {
          return {
            type: 'info',
            message: 'Waiting for payment...'
          };
        } else {
          return {
            type: 'warning',
            message: `Payment received! Confirmations: ${paymentStatus.bitcoinConfirmations}/2`
          };
        }
      case 'completed':
        return {
          type: 'success',
          message: 'Payment confirmed! Your order is being processed.'
        };
      case 'underpaid':
        return {
          type: 'error',
          message: `Insufficient payment received. Expected: ${formatBitcoinAmount(paymentData.bitcoinAmount)} BTC`
        };
      case 'expired':
        return {
          type: 'error',
          message: 'Payment window has expired. Please create a new order.'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusMessage();

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <span className="ml-3 text-gray-600">Generating Bitcoin payment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
          <span className="ml-2 text-red-700 font-medium">Payment Error</span>
        </div>
        <p className="text-red-600 text-sm mt-2">{error}</p>
        <button
          onClick={initializePayment}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!paymentData) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">₿</span>
          </div>
          <h3 className="ml-3 text-lg font-medium text-gray-900">Bitcoin Payment</h3>
        </div>
        
        {timeRemaining && (
          <div className="flex items-center text-sm text-gray-600">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>{timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Status Message */}
      {statusInfo && (
        <div className={`mb-6 p-4 rounded-lg ${
          statusInfo.type === 'success' ? 'bg-green-50 border border-green-200' :
          statusInfo.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
          statusInfo.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          <p className={`text-sm font-medium ${
            statusInfo.type === 'success' ? 'text-green-800' :
            statusInfo.type === 'warning' ? 'text-yellow-800' :
            statusInfo.type === 'error' ? 'text-red-800' :
            'text-blue-800'
          }`}>
            {statusInfo.message}
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="text-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
            <QRCodeSVG
              value={getBitcoinQRData(paymentData.bitcoinAddress, paymentData.bitcoinAmount)}
              size={200}
              level="M"
              includeMargin={true}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Scan with Bitcoin wallet</p>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          {/* Bitcoin Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitcoin Address
            </label>
            <div className="flex">
              <input
                type="text"
                value={paymentData.bitcoinAddress}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(paymentData.bitcoinAddress, 'address')}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50 transition-colors"
              >
                {copiedField === 'address' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Bitcoin Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (BTC)
            </label>
            <div className="flex">
              <input
                type="text"
                value={formatBitcoinAmount(paymentData.bitcoinAmount)}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(formatBitcoinAmount(paymentData.bitcoinAmount), 'amount')}
                className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-white hover:bg-gray-50 transition-colors"
              >
                {copiedField === 'amount' ? (
                  <CheckIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Exchange Rate Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <p>Order Total: {formatCurrency(orderTotal)}</p>
            <p>Exchange Rate: £{paymentData.exchangeRate?.toLocaleString()} per BTC</p>
            <p>Rate Valid Until: {new Date(paymentData.exchangeRateTimestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Payment Instructions</h4>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Send exactly <strong>{formatBitcoinAmount(paymentData.bitcoinAmount)} BTC</strong> to the address above</li>
          <li>Payment must be received within 24 hours</li>
          <li>Your order will be confirmed after 2 network confirmations (~30 minutes)</li>
          <li>Do not send any other cryptocurrency to this address</li>
        </ol>
      </div>

      {/* Auto-refresh info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Payment status updates automatically every 30 seconds
      </div>
    </div>
  );
};

export default BitcoinPayment;