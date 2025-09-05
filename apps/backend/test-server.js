#!/usr/bin/env node

// Minimal test server to debug startup issues
console.log('🚀 Test server starting...');
console.log('Node version:', process.version);
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT || 5000);

try {
  // Test basic imports
  console.log('📦 Testing imports...');
  const express = await import('express');
  console.log('✅ Express imported successfully');
  
  const app = express.default();
  
  // Simple health endpoint
  app.get('/health/simple', (req, res) => {
    console.log('🩺 Health check requested');
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });
  
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Test server running on port ${PORT}`);
    console.log('🔗 Try: http://localhost:' + PORT + '/health/simple');
  });

  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    process.exit(1);
  });

} catch (error) {
  console.error('❌ Startup error:', error);
  process.exit(1);
}