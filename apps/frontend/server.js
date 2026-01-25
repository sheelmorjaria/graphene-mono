import { createServer } from 'http';
import { readFileSync, existsSync, statSync, readdirSync } from 'fs';
import { extname, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

console.log('📂 Starting server, checking dist directory...');

// Check if dist directory exists
console.log('📁 Current directory contents:', readdirSync(__dirname));
console.log('📂 Dist directory exists:', existsSync(join(__dirname, 'dist')));
if (existsSync(join(__dirname, 'dist'))) {
  console.log('📁 Dist directory contents:', readdirSync(join(__dirname, 'dist')));
} else {
  console.log('❌ Dist directory does not exist!');
}

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const getMimeType = (filePath) => {
  const ext = extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'text/plain';
};

// Check if file exists
const fileExists = (filePath) => {
  try {
    return existsSync(filePath) && statSync(filePath).isFile();
  } catch {
    return false;
  }
};

const server = createServer((req, res) => {
  const host = req.headers.host;
  console.log(`${req.method} ${req.url} - Host: ${host}`);

  // Redirect www to non-www
  if (host && host.startsWith('www.')) {
    const nonWwwHost = host.replace('www.', '');
    const redirectUrl = `https://${nonWwwHost}${req.url}`;
    res.writeHead(301, {
      'Location': redirectUrl,
      'Cache-Control': 'public, max-age=31536000' // 1 year
    });
    res.end();
    return;
  }

  try {
    let filePath;

    // Handle API routes - let them fail (they should go to backend)
    if (req.url.startsWith('/api/')) {
      res.writeHead(404);
      res.end('API not found on frontend server');
      return;
    }

    // Handle all routes with SPA - serve index.html for all non-static files
    if (req.url === '/' || !req.url.includes('.')) {
      // Serve React app for all clean URLs (SPA routing)
      filePath = join(__dirname, 'dist', 'index.html');
      console.log(`Serving SPA for route: ${req.url}`);
    } else {
      // Static file with extension
      filePath = join(__dirname, 'dist', req.url);
    }

    // If file doesn't exist, return 404
    if (!fileExists(filePath)) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Serve the file
    const content = readFileSync(filePath);
    const mimeType = getMimeType(filePath);

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600' // 1 hour cache
    });
    res.end(content);

  } catch (error) {
    console.error('Error serving file:', error);
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Frontend server running on port ${PORT}`);
  console.log(`📊 SPA routing enabled - all non-static routes serve index.html`);
  console.log(`🌐 Server ready to handle requests`);
});