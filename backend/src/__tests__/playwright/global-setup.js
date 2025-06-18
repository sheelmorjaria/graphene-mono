import { setupServer } from 'msw/node';
import { handlers } from './mocks/handlers.js';

// Setup MSW server for API mocking
const server = setupServer(...handlers);

export default async function globalSetup() {
  console.log('🚀 Starting MSW server for Playwright tests...');
  
  try {
    // Start MSW server
    server.listen({
      onUnhandledRequest: 'warn',
    });
    
    console.log('✅ MSW server started successfully');
    
    // Store server instance globally so it can be accessed in teardown
    globalThis.__MSW_SERVER__ = server;
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start MSW server:', error);
    throw error;
  }
}