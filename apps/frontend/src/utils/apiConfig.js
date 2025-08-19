// API Configuration utility
// This provides a runtime fallback for environment variables

const getApiBaseUrl = () => {
  // Try environment variable first
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envApiUrl && envApiUrl !== '/api') {
    return envApiUrl;
  }
  
  // Runtime detection based on current domain
  const currentHost = window.location.hostname;
  
  // Production domain detection
  if (currentHost === 'graphene-security.com' || currentHost === 'www.graphene-security.com') {
    return 'https://graphene-backend.onrender.com/api';
  }
  
  // Localhost development
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:5000/api';
  }
  
  // Vercel preview deployments or other hosting
  if (currentHost.includes('vercel.app') || currentHost.includes('netlify.app')) {
    return 'https://graphene-backend.onrender.com/api';
  }
  
  // Default fallback
  return '/api';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Export a function to get admin API URLs
export const getAdminApiUrl = (endpoint) => {
  return `${API_BASE_URL}/admin/${endpoint}`;
};

// Export a function to get general API URLs
export const getApiUrl = (endpoint) => {
  return `${API_BASE_URL}/${endpoint}`;
};

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('🔧 API Configuration:');
  console.log('  Environment variable VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('  Current hostname:', window.location.hostname);
  console.log('  Resolved API_BASE_URL:', API_BASE_URL);
}