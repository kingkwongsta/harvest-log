#!/bin/bash

# Vercel Deployment Script with Environment Variable Validation
# This script ensures proper environment variables are set for production deployment

set -e

echo "🚀 Starting Vercel Deployment Process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "client/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not installed. Installing...${NC}"
    npm install -g vercel
fi

# Get the production API URL from environment variable
PRODUCTION_API_URL="${BACKEND_API_URL:-${NEXT_PUBLIC_API_URL}}"

if [ -z "$PRODUCTION_API_URL" ]; then
    echo -e "${RED}❌ Backend API URL not found in environment variables!${NC}"
    echo -e "${RED}Please set BACKEND_API_URL or NEXT_PUBLIC_API_URL environment variable.${NC}"
    echo -e "${RED}Example: export BACKEND_API_URL='https://your-backend-service.run.app'${NC}"
    echo -e "${RED}Or copy .env.example to .env and configure your URLs.${NC}"
    exit 1
fi

# Validate URL format
if [[ ! "$PRODUCTION_API_URL" =~ ^https:// ]]; then
    echo -e "${RED}❌ Backend API URL must use HTTPS for production deployment!${NC}"
    echo -e "${RED}Current URL: $PRODUCTION_API_URL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Setting environment variables...${NC}"

# Set environment variables in Vercel
vercel env add NEXT_PUBLIC_API_URL production --value="$PRODUCTION_API_URL" --force 2>/dev/null || true
vercel env add NEXT_PUBLIC_API_URL preview --value="$PRODUCTION_API_URL" --force 2>/dev/null || true

echo -e "${GREEN}✅ Environment variables set${NC}"
echo "   NEXT_PUBLIC_API_URL: [CONFIGURED - URL HIDDEN FOR SECURITY]"

# Navigate to client directory
cd client

# Clean previous builds
echo -e "${YELLOW}🧹 Cleaning previous builds...${NC}"
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm ci

# Build the application locally to verify
echo -e "${YELLOW}🔨 Building application...${NC}"
NEXT_PUBLIC_API_URL="$PRODUCTION_API_URL" npm run build

# Deploy to Vercel
echo -e "${GREEN}🚀 Deploying to Vercel...${NC}"
vercel --prod

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your app should now be using HTTPS for API calls${NC}"

# Verify deployment
echo -e "${YELLOW}🔍 Verifying environment variables...${NC}"
vercel env ls

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
echo -e "${GREEN}Please check your application to verify the weather API is now working.${NC}" 