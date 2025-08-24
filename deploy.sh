#!/bin/bash

# Vercel deployment script for Judy's Cafe
# This script ensures the correct Node.js version is used during deployment

echo "Starting deployment for Judy's Cafe..."
echo "Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Verify Node.js version meets requirements
if ! node -p "process.version" | grep -E "^v(20\.|2[1-9]\.|[3-9][0-9]\.)" > /dev/null; then
    echo "Error: Node.js version 20.19+ or 22.12+ required"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run build
echo "Building application..."
npm run build

echo "Deployment build completed successfully!"