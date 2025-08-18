#!/bin/bash

# Render build script for frontend

echo "🚀 Starting Render frontend build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build the application
echo "🔨 Building application..."
npm run build

# Ensure _redirects file is in dist
echo "📋 Copying _redirects file..."
if [ -f "_redirects" ]; then
    cp _redirects dist/_redirects
    echo "✅ _redirects file copied to dist/"
elif [ -f "public/_redirects" ]; then
    echo "✅ _redirects file already in public/, will be included in build"
else
    echo "⚠️  No _redirects file found, creating one..."
    echo "/*    /index.html   200" > dist/_redirects
fi

# List dist contents for verification
echo "📂 Build output contents:"
ls -la dist/

echo "✅ Build completed successfully!"