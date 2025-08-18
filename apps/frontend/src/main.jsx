import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initGlobalApiValidation, validateEnvironment } from './utils/globalApiCheck.js'

// Initialize global API validation and environment checks
console.log('🚀 Initializing GrapheneOS Store Frontend...');

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
