// API URL validation utility to prevent undefined URL construction

/**
 * Validates that all URL parameters are defined before constructing URLs
 * @param {string} baseUrl - The base API URL
 * @param {string} endpoint - The endpoint path
 * @param {Object} params - Object with URL parameters
 * @returns {string} - Validated complete URL
 * @throws {Error} - If any critical parameter is undefined
 */
export const validateApiUrl = (baseUrl, endpoint, params = {}) => {
  // Check base URL
  if (!baseUrl || baseUrl === 'undefined') {
    console.error('❌ API Base URL is undefined!', { baseUrl, endpoint, params });
    throw new Error('API configuration error: Base URL is not defined');
  }

  // Check for undefined parameters in the endpoint
  const paramMatches = endpoint.match(/\$\{([^}]+)\}/g);
  if (paramMatches) {
    for (const match of paramMatches) {
      const paramName = match.slice(2, -1); // Remove ${ and }
      const paramValue = params[paramName];
      
      if (paramValue === undefined || paramValue === null || paramValue === 'undefined') {
        console.error(`❌ URL parameter "${paramName}" is undefined!`, { 
          endpoint, 
          params, 
          paramValue 
        });
        throw new Error(`API URL error: Required parameter "${paramName}" is undefined`);
      }
    }
  }

  // Construct and return the URL
  let constructedEndpoint = endpoint;
  Object.entries(params).forEach(([key, value]) => {
    constructedEndpoint = constructedEndpoint.replace(`\${${key}}`, value);
  });

  const fullUrl = `${baseUrl}${constructedEndpoint}`;
  
  // Final check for any remaining undefined values
  if (fullUrl.includes('undefined')) {
    console.error('❌ Constructed URL contains "undefined"!', { 
      fullUrl, 
      baseUrl, 
      endpoint, 
      params 
    });
    throw new Error('API URL error: Constructed URL contains undefined values');
  }

  return fullUrl;
};

/**
 * Safe fetch wrapper that validates URLs before making requests
 * @param {string} baseUrl - The base API URL  
 * @param {string} endpoint - The endpoint path with ${param} placeholders
 * @param {Object} urlParams - Parameters for URL construction
 * @param {Object} fetchOptions - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Response>} - Fetch response
 */
export const safeFetch = async (baseUrl, endpoint, urlParams = {}, fetchOptions = {}) => {
  try {
    const validatedUrl = validateApiUrl(baseUrl, endpoint, urlParams);
    console.log('🌐 Making API request:', { url: validatedUrl, method: fetchOptions.method || 'GET' });
    
    return await fetch(validatedUrl, fetchOptions);
  } catch (error) {
    console.error('❌ API request failed during URL validation:', error);
    throw error;
  }
};

export default { validateApiUrl, safeFetch };