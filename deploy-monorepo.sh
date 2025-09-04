#!/bin/bash

  echo "=== Monorepo Deployment ==="

  # Check for package-lock.json
  if [ ! -f "package-lock.json" ]; then
      echo "ERROR: package-lock.json not found!"
      echo "Running npm install to generate it..."
      npm install --legacy-peer-deps
  fi

  # Install dependencies
  echo "Installing dependencies..."
  npm ci --legacy-peer-deps

  # Build backend
  echo "Building backend..."
  npm run build --workspace=apps/backend

  # Build frontend
  echo "Building frontend..."
  npm run build --workspace=apps/frontend

  echo "=== Build Complete ==="

