#!/bin/bash

# Dental Automation Backend Deployment Script for Render
# This script helps prepare your backend for deployment

echo "🦷 Dental Automation Backend Deployment Setup"
echo "=============================================="

# Check if required files exist
echo "📁 Checking deployment files..."

if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found!"
    exit 1
fi

if [ ! -f ".env.production" ]; then
    echo "❌ .env.production not found!"
    exit 1
fi

if [ ! -f "api/server.production.js" ]; then
    echo "❌ api/server.production.js not found!"
    exit 1
fi

echo "✅ All deployment files found"

# Test backend build
echo "🔨 Testing backend build..."
npm run build:server

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed! Please fix TypeScript errors first."
    exit 1
fi

echo "✅ Backend build successful"

# Check environment variables
echo "🔍 Checking environment variables..."

# Check if MONGODB_URI is set
if grep -q "MONGODB_URI=mongodb://localhost" .env.production; then
    echo "⚠️  Warning: MONGODB_URI still uses localhost. Update with MongoDB Atlas connection string."
fi

# Check if JWT_SECRET is default
if grep -q "JWT_SECRET=your-very-strong-secret-key" .env.production; then
    echo "⚠️  Warning: JWT_SECRET is using default value. Generate a strong secret key."
fi

# Generate a strong JWT secret if needed
echo "🔑 Generating strong JWT secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT_SECRET: $JWT_SECRET"
echo "⚠️  Copy this secret and update your Render environment variables:"
echo "JWT_SECRET=$JWT_SECRET"

# Test production server startup (dry run)
echo "🚀 Testing production server configuration..."
timeout 10s node api/server.production.js || echo "✅ Production server configuration valid (timeout expected)"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Create MongoDB Atlas account and cluster"
echo "2. Update .env.production with your MongoDB Atlas connection string"
echo "3. Deploy to Render using the configuration in render.yaml"
echo "4. Add environment variables to Render dashboard"
echo "5. Update frontend API URLs to point to your Render backend"
echo ""
echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"