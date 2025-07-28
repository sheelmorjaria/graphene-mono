import { useState, useEffect } from 'react';
import { getEmailPreferences, updateEmailPreferences } from '../../services/profileService';

const EmailPreferences = () => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await getEmailPreferences();
      setPreferences(data.preferences);
      setError(null);
    } catch (err) {
      setError('Failed to load email preferences');
      console.error('Error fetching preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (category, type) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [type]: !prev[category][type]
      }
    }));
  };

  const handleGlobalToggle = () => {
    setPreferences(prev => ({
      ...prev,
      globalUnsubscribe: !prev.globalUnsubscribe
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');
      
      await updateEmailPreferences(preferences);
      setSuccessMessage('Email preferences updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to update preferences. Please try again.');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-red-600">{error || 'Unable to load preferences'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-6 text-forest-900">Email Preferences</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {/* Global Unsubscribe */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={preferences.globalUnsubscribe}
            onChange={handleGlobalToggle}
            className="mr-3 h-5 w-5 text-forest-600 rounded focus:ring-forest-500"
          />
          <div>
            <span className="font-semibold text-gray-900">Unsubscribe from all emails</span>
            <p className="text-sm text-gray-600 mt-1">
              Stop all non-essential emails. You'll still receive important transactional emails about your orders.
            </p>
          </div>
        </label>
      </div>

      {/* Notification Preferences */}
      <div className={`mb-6 ${preferences.globalUnsubscribe ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-semibold mb-3 text-forest-800">Notifications</h3>
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.notifications.orderStatusUpdates}
              onChange={() => handleToggle('notifications', 'orderStatusUpdates')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Order Status Updates</span>
              <p className="text-sm text-gray-600">Get notified when your order status changes</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.notifications.deliveryUpdates}
              onChange={() => handleToggle('notifications', 'deliveryUpdates')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Delivery Updates</span>
              <p className="text-sm text-gray-600">Receive updates about your package delivery</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.notifications.priceDropAlerts}
              onChange={() => handleToggle('notifications', 'priceDropAlerts')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Price Drop Alerts</span>
              <p className="text-sm text-gray-600">Get notified when prices drop on items you've viewed</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.notifications.backInStockAlerts}
              onChange={() => handleToggle('notifications', 'backInStockAlerts')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Back in Stock Alerts</span>
              <p className="text-sm text-gray-600">Get notified when out-of-stock items become available</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.notifications.newProductAlerts}
              onChange={() => handleToggle('notifications', 'newProductAlerts')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">New Product Alerts</span>
              <p className="text-sm text-gray-600">Be the first to know about new GrapheneOS devices</p>
            </div>
          </label>
        </div>
      </div>

      {/* Marketing Preferences */}
      <div className={`mb-6 ${preferences.globalUnsubscribe ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-lg font-semibold mb-3 text-forest-800">Marketing</h3>
        <div className="space-y-3">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketing.promotions}
              onChange={() => handleToggle('marketing', 'promotions')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Promotions & Offers</span>
              <p className="text-sm text-gray-600">Receive exclusive deals and promotional offers</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketing.newsletter}
              onChange={() => handleToggle('marketing', 'newsletter')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Newsletter</span>
              <p className="text-sm text-gray-600">Monthly updates about privacy and security</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketing.productRecommendations}
              onChange={() => handleToggle('marketing', 'productRecommendations')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Product Recommendations</span>
              <p className="text-sm text-gray-600">Personalized product suggestions based on your interests</p>
            </div>
          </label>
          
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.marketing.surveyInvitations}
              onChange={() => handleToggle('marketing', 'surveyInvitations')}
              className="mr-3 h-4 w-4 text-forest-600 rounded focus:ring-forest-500"
            />
            <div>
              <span className="text-gray-900">Survey Invitations</span>
              <p className="text-sm text-gray-600">Help us improve by participating in surveys</p>
            </div>
          </label>
        </div>
      </div>

      {/* Email Status */}
      {preferences.emailStatus && !preferences.emailStatus.isValid && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <span className="font-semibold">⚠️ Email Issue:</span> There may be an issue with your email address. 
            Please ensure it's valid to continue receiving important updates.
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-6 py-2 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors
            ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {/* Info Note */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">Note:</span> You will always receive important transactional emails 
          such as order confirmations, shipping notifications, and security alerts regardless of these settings.
        </p>
      </div>
    </div>
  );
};

export default EmailPreferences;