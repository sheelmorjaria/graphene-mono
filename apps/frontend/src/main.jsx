import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initGlobalApiValidation, validateEnvironment } from './utils/globalApiCheck.js'

// Initialize global API validation and environment checks
console.log('🚀 Initializing GrapheneOS Store Frontend...');

// Legacy HashRouter URLs: fragments never reach the server, so bookmarks like
// /#/products/slug can only be rescued client-side. Replace to clean paths.
if (window.location.hash.startsWith('#/')) {
  const { pathname, hash, search } = window.location;
  const legacyPath = hash.slice(1); // "/products/slug" (+ any ?query inside the fragment)
  const [cleanPath, cleanSearch] = legacyPath.split('?');
  window.location.replace(
    (cleanPath.startsWith('/') ? cleanPath : pathname) + (cleanSearch ? `?${cleanSearch}` : search)
  );
}

// Validate environment variables
const envCheck = validateEnvironment();
if (!envCheck.isValid) {
  console.warn('⚠️ Environment validation issues detected');
}

// Initialize global API request validation
initGlobalApiValidation();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
