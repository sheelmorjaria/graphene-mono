import React, { useState, useEffect, useRef } from 'react';
import { QrCodeIcon, ClipboardDocumentIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { formatCurrency } from '../../services/paymentService';
import QRCode from 'qrcode';

const MoneroPayment = ({ paymentData, onPaymentUpdate, onError }) => {
  const [copySuccess, setCopySuccess] = useState('');
  const [timeRemaining, setTimeRemaining] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [confirmations, setConfirmations] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const qrCodeRef = useRef(null);

  // Format XMR amount for display
  const formatXmrAmount = (amount) => {
    return parseFloat(amount).toFixed(12).replace(/\.?0+$/, '');
  };

  // Generate QR code
  useEffect(() => {
    if (paymentData?.moneroAddress && paymentData?.xmrAmount) {
      const moneroUri = `monero:${paymentData.moneroAddress}?tx_amount=${formatXmrAmount(paymentData.xmrAmount)}`;
      
      QRCode.toDataURL(moneroUri, {
        width: 192,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      .then(url => {
        setQrCodeUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [paymentData?.moneroAddress, paymentData?.xmrAmount]);

  // Copy to clipboard functionality
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  // Calculate time remaining
  useEffect(() => {
    if (!paymentData?.expirationTime) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(paymentData.expirationTime);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [paymentData?.expirationTime]);

  // Poll payment status
  useEffect(() => {
    if (!paymentData?.orderId) return;

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/payments/monero/status/${paymentData.orderId}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            setPaymentStatus(data.data.paymentStatus);
            setConfirmations(data.data.confirmations || 0);

            // Update parent component
            if (onPaymentUpdate) {
              onPaymentUpdate({
                status: data.data.paymentStatus,
                confirmations: data.data.confirmations,
                isExpired: data.data.isExpired
              });
            }

            // Stop polling if payment is completed or failed
            if (data.data.paymentStatus === 'confirmed' || 
                data.data.paymentStatus === 'failed' || 
                data.data.isExpired) {
              if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        if (onError) {
          onError(error.message);
        }
      }
    };

    // Check immediately
    checkPaymentStatus();

    // Set up polling every 30 seconds
    const interval = setInterval(checkPaymentStatus, 30000);
    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [paymentData?.orderId, onPaymentUpdate, onError]); // eslint-disable-line react-hooks/exhaustive-deps

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'partially_confirmed':
        return <ClockIcon className="h-6 w-6 text-yellow-500" />;
      case 'underpaid':
        return <ClockIcon className="h-6 w-6 text-red-500" />;
      case 'failed':
        return <ClockIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ClockIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return 'Payment Confirmed!';
      case 'partially_confirmed':
        return `Awaiting Confirmations (${confirmations}/${paymentData?.requiredConfirmations || 10})`;
      case 'underpaid':
        return 'Payment Underpaid - Please send the full amount';
      case 'failed':
        return 'Payment Failed';
      default:
        return 'Waiting for Payment';
    }
  };

  const getStatusColor = () => {
    switch (paymentStatus) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'partially_confirmed':
        return 'text-yellow-600 bg-yellow-50';
      case 'underpaid':
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!paymentData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Setting up Monero payment...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Status */}
      <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-medium">{getStatusText()}</h3>
            {timeRemaining && timeRemaining !== 'Expired' && (
              <p className="text-sm opacity-75">Time remaining: {timeRemaining}</p>
            )}
          </div>
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Payment Instructions</h3>
        <ol className="text-sm text-blue-800 space-y-1">
          <li>1. Send exactly <strong>{formatXmrAmount(paymentData.xmrAmount)} XMR</strong> to the address below</li>
          <li>2. Payment will be confirmed after {paymentData.requiredConfirmations || 10} network confirmations (~20 minutes)</li>
          <li>3. Do not close this page until payment is confirmed</li>
        </ol>
      </div>

      {/* QR Code and Address */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code */}
        <div className="text-center">
          <h4 className="font-medium text-gray-900 mb-3">Scan QR Code</h4>
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="Monero Payment QR Code"
                className="w-48 h-48 rounded"
                ref={qrCodeRef}
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center rounded">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Scan with your Monero wallet
          </p>
        </div>

        {/* Payment Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monero Address
            </label>
            <div className="flex">
              <input
                type="text"
                value={paymentData.moneroAddress || ''}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(paymentData.moneroAddress, 'address')}
                className="px-3 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
            {copySuccess === 'address' && (
              <p className="text-xs text-green-600 mt-1">Address copied!</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (XMR)
            </label>
            <div className="flex">
              <input
                type="text"
                value={formatXmrAmount(paymentData.xmrAmount)}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(formatXmrAmount(paymentData.xmrAmount), 'amount')}
                className="px-3 py-2 bg-gray-600 text-white rounded-r-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <ClipboardDocumentIcon className="h-4 w-4" />
              </button>
            </div>
            {copySuccess === 'amount' && (
              <p className="text-xs text-green-600 mt-1">Amount copied!</p>
            )}
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Order Total:</strong> {formatCurrency(paymentData.orderTotal)}</p>
            <p><strong>Exchange Rate:</strong> 1 GBP = {formatXmrAmount(paymentData.exchangeRate)} XMR</p>
            {paymentData.validUntil && (
              <p><strong>Rate Valid Until:</strong> {new Date(paymentData.validUntil).toLocaleTimeString()}</p>
            )}
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-900 mb-2">Important Notes</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Send the exact amount shown above. Underpayments may not be processed.</li>
          <li>• Do not send from an exchange - use a personal Monero wallet.</li>
          <li>• Payment expires in {paymentData.paymentWindowHours || 24} hours.</li>
          <li>• Network fees are not included in the amount above.</li>
        </ul>
      </div>
    </div>
  );
};

export default MoneroPayment;