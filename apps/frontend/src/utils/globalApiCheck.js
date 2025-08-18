// Global API URL validation to catch /apiundefined errors

/**
 * Initialize global fetch interceptor to catch malformed URLs
 */
export const initGlobalApiValidation = () => {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to validate URLs
  window.fetch = function(url, options = {}) {
    // Check if URL contains 'undefined'
    if (typeof url === 'string' && url.includes('undefined')) {
      console.error('🚨 BLOCKED: Fetch request contains "undefined" in URL:', {
        url,
        options,
        stack: new Error().stack
      });
      
      // Return a rejected promise to prevent the request
      return Promise.reject(new Error(`Invalid API URL: ${url} - contains undefined values`));
    }
    
    // Check for other malformed patterns
    if (typeof url === 'string') {
      if (url.includes('/api/')) {
        console.log('🌐 API Request:', { url, method: options.method || 'GET' });
      }
      
      // Check for empty parameters
      if (url.includes('//') && !url.includes('://')) {
        console.warn('⚠️ Potential malformed URL (double slashes):', url);
      }
    }
    
    // Call original fetch
    return originalFetch(url, options);
  };
  
  console.log('✅ Global API validation initialized');
};

/**
 * Environment validation - check if all required environment variables are set
 */
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_API_BASE_URL'
  ];
  
  const missingVars = [];
  const invalidVars = [];
  
  for (const varName of requiredEnvVars) {
    const value = import.meta.env[varName];
    
    if (!value) {
      missingVars.push(varName);
    } else if (value === 'undefined' || value.includes('undefined')) {
      invalidVars.push({ name: varName, value });
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars);
  }
  
  if (invalidVars.length > 0) {
    console.error('❌ Invalid environment variables (contain "undefined"):', invalidVars);
  }
  
  // Log current environment for debugging
  console.log('🔧 Environment Check:', {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE
  });
  
  return {
    isValid: missingVars.length === 0 && invalidVars.length === 0,
    missingVars,
    invalidVars
  };
};

export default { initGlobalApiValidation, validateEnvironment };