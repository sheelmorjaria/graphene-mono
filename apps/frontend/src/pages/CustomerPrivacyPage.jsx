import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { requestDataExport, requestAccountDeletion } from '../services/privacyService';

const CustomerPrivacyPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Set page title
  useEffect(() => {
    document.title = 'Data & Privacy - Graphene Security';
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [authLoading, user, navigate]);

  const handleDataExport = async () => {
    try {
      setIsExporting(true);
      setError('');
      setSuccessMessage('');

      await requestDataExport();
      
      setSuccessMessage('Data export request submitted successfully! You will receive an email with a download link when your data is ready (typically within 24 hours).');
    } catch (err) {
      setError(err.message || 'Failed to request data export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeletionRequest = () => {
    setShowDeleteModal(true);
    setDeletePassword('');
    setError('');
  };

  const handleConfirmDeletion = async () => {
    if (!deletePassword) {
      setError('Please enter your password to confirm account deletion.');
      return;
    }

    try {
      setIsDeletingAccount(true);
      setError('');

      await requestAccountDeletion(deletePassword);
      
      // Success - user will be logged out automatically by the backend
      alert('Account deletion request submitted successfully. You will receive a confirmation email and will be logged out.');
      // The logout will happen automatically via the API response
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to request account deletion. Please check your password and try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setError('');
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Data & Privacy</h1>
        
        <div className="mb-8">
          <p className="text-gray-600 mb-4">
            Manage your personal data and privacy settings. You can export your data or request account deletion 
            in compliance with privacy regulations such as GDPR and CCPA.
          </p>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Data Export Section */}
        <div className="mb-8 border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Export My Data</h2>
          <p className="text-gray-600 mb-4">
            Download a copy of all your personal data including profile information, order history, 
            addresses, and other account details in a machine-readable format.
          </p>
          <ul className="text-sm text-gray-600 mb-4 list-disc list-inside">
            <li>Profile information and account details</li>
            <li>Order history and transaction records</li>
            <li>Saved addresses and contact information</li>
            <li>Account preferences and settings</li>
          </ul>
          <p className="text-sm text-gray-500 mb-4">
            <strong>Note:</strong> An email will be sent with a download link when your data is ready. 
            Download links expire after 48 hours for security.
          </p>
          <button
            onClick={handleDataExport}
            disabled={isExporting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isExporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isExporting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Export My Data'
            )}
          </button>
        </div>

        {/* Account Deletion Section */}
        <div className="border border-red-200 rounded-lg p-6 bg-red-50">
          <h2 className="text-xl font-semibold text-red-800 mb-4">Delete My Account</h2>
          <div className="mb-4">
            <p className="text-red-700 mb-2">
              <strong>⚠️ Warning:</strong> Account deletion is permanent and cannot be undone.
            </p>
            <p className="text-gray-700 mb-2">When you delete your account:</p>
            <ul className="text-sm text-gray-700 mb-4 list-disc list-inside">
              <li>Your personal information will be permanently removed</li>
              <li>You will lose access to your order history and account</li>
              <li>Some data may be retained for legal/tax purposes (anonymized)</li>
              <li>This process typically takes 7-30 days to complete</li>
            </ul>
          </div>
          <button
            onClick={handleAccountDeletionRequest}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Request Account Deletion
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-800 mb-4">
              Confirm Account Deletion
            </h3>
            <p className="text-gray-700 mb-4">
              This action cannot be undone. All your personal data will be permanently deleted.
            </p>
            <p className="text-gray-700 mb-4">
              Please enter your password to confirm:
            </p>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={isDeletingAccount}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeletion}
                disabled={isDeletingAccount}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDeletingAccount
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isDeletingAccount ? 'Processing...' : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPrivacyPage;