const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Get authentication header
const getAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Get email preferences
export const getEmailPreferences = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/webhook/email-preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch email preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching email preferences:', error);
    throw error;
  }
};

// Update email preferences
export const updateEmailPreferences = async (preferences) => {
  try {
    const response = await fetch(`${API_BASE_URL}/webhook/email-preferences`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      credentials: 'include',
      body: JSON.stringify(preferences)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update email preferences');
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating email preferences:', error);
    throw error;
  }
};