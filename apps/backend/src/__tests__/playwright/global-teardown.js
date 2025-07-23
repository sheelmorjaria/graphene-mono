export default async function globalTeardown() {
  console.log('🧹 Cleaning up MSW server...');
  
  try {
    // Get the server instance from global setup
    const server = globalThis.__MSW_SERVER__;
    
    if (server) {
      // Close MSW server
      server.close();
      console.log('✅ MSW server stopped successfully');
    }
  } catch (error) {
    console.error('❌ Error during MSW server cleanup:', error);
  }
}