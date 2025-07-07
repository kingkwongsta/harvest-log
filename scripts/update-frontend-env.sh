#!/bin/bash

# Update frontend environment variables for plant-journey backend
# This script helps update the Vercel environment variables

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Updating Plant Journey Frontend Environment Variables${NC}"
echo ""

# Get backend URL from environment variable or prompt user
BACKEND_URL="${BACKEND_API_URL:-${NEXT_PUBLIC_API_URL}}"

if [ -z "$BACKEND_URL" ]; then
    echo -e "${YELLOW}📝 No backend URL found in environment variables.${NC}"
    echo "Please enter your backend URL:"
    echo "Example: https://plant-journey-backend-123456789.us-west2.run.app"
    echo ""
    read -p "Backend URL: " BACKEND_URL
    
    # Validate URL
    if [[ -z "$BACKEND_URL" ]]; then
        echo -e "${RED}❌ Backend URL cannot be empty!${NC}"
        exit 1
    fi
    
    if [[ ! "$BACKEND_URL" =~ ^https:// ]]; then
        echo -e "${RED}❌ Backend URL must start with https://!${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}Backend URL: ${BACKEND_URL}${NC}"
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