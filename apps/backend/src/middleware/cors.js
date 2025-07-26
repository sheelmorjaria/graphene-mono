// CORS middleware for payment routes
export const paymentCorsHeaders = (req, res, next) => {
  // Get the origin from the request
  const origin = req.headers.origin;
  
  // List of allowed origins
  const allowedOrigins = [
    'https://graphene-frontend.onrender.com',
    'https://graphene-security.com',
    'https://www.graphene-security.com',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // If origin is in allowed list, set CORS headers
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
};

// Alternative: Simple CORS for public endpoints
export const publicCors = (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
  } else {
    next();
  }
};