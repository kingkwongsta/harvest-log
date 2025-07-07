#!/bin/bash

# Update frontend environment variables for plant-journey backend
# This script helps update the Vercel environment variables

set -e

# Configuration
BACKEND_URL="https://plant-journey-backend-512013902761.us-west2.run.app"
VERCEL_PROJECT_NAME="plant-journey"

echo "🔧 Updating Plant Journey Frontend Environment Variables"
echo "Backend URL: ${BACKEND_URL}"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo "🚀 Install it with: npm install -g vercel"
    echo ""
    echo "📋 Manual steps to update environment variables:"
    echo "1. Go to https://vercel.com/dashboard"
    echo "2. Select your ${VERCEL_PROJECT_NAME} project"
    echo "3. Go to Settings → Environment Variables"
    echo "4. Add or update:"
    echo "   - Name: NEXT_PUBLIC_API_URL"
    echo "   - Value: ${BACKEND_URL}"
    echo "   - Environments: Production, Preview, Development"
    echo "5. Redeploy your application"
    exit 1
fi

# Navigate to client directory
cd client

echo "🔑 Updating Vercel environment variables..."

# Update environment variable for each environment
echo "📝 Adding environment variable for Production..."
echo "${BACKEND_URL}" | vercel env add NEXT_PUBLIC_API_URL production

echo "📝 Adding environment variable for Preview..."
echo "${BACKEND_URL}" | vercel env add NEXT_PUBLIC_API_URL preview

echo "📝 Adding environment variable for Development..."
echo "${BACKEND_URL}" | vercel env add NEXT_PUBLIC_API_URL development

echo "✅ Environment variables updated!"
echo ""
echo "🚀 To deploy the changes:"
echo "   cd client"
echo "   vercel --prod"
echo ""
echo "🧪 Test the deployment:"
echo "   Open https://plant-journey.vercel.app" 