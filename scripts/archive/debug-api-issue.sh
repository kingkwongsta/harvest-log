#!/bin/bash

# Debug Script for API HTTP/HTTPS Issue
# This script helps diagnose why production is making HTTP requests instead of HTTPS

set -e

echo "🔍 Debugging API HTTP/HTTPS Issue..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check current directory
if [ ! -f "client/package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root directory${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Environment Variable Check:${NC}"
echo "NODE_ENV: ${NODE_ENV:-'not set'}"
echo "NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL:-'not set'}"

echo ""
echo -e "${BLUE}📋 Vercel Environment Variables:${NC}"
if command -v vercel &> /dev/null; then
    vercel env ls 2>/dev/null || echo "Not logged into Vercel or no project linked"
else
    echo "Vercel CLI not installed"
fi

echo ""
echo -e "${BLUE}🔍 Checking Built Files for HTTP URLs:${NC}"
cd client

if [ -d ".next" ]; then
    echo "Searching for HTTP URLs in built files..."
    grep -r "http://.*weather" .next/ 2>/dev/null || echo "No HTTP weather URLs found in .next/"
    
    echo ""
    echo "Checking for localhost URLs..."
    grep -r "localhost:8080" .next/ 2>/dev/null | head -5 || echo "No localhost:8080 references found"
    
    echo ""
    echo "Checking API_BASE_URL references..."
    grep -r "API_BASE_URL" .next/ 2>/dev/null | head -3 || echo "No API_BASE_URL references found"
else
    echo "No .next directory found - app hasn't been built yet"
fi

echo ""
echo -e "${BLUE}🧹 Cache Clearing Options:${NC}"
echo "1. Clear Next.js build cache"
echo "2. Clear npm cache"
echo "3. Force clean rebuild"
echo "4. Clear browser cache (manual)"

echo ""
echo -e "${YELLOW}🔧 Recommended Fix Steps:${NC}"
echo "1. Clear build cache: rm -rf client/.next"
echo "2. Set env var: export BACKEND_API_URL='https://your-backend-service.run.app'"
echo "3. Clean rebuild: cd client && npm run build"
echo "4. Deploy: vercel --prod"

echo ""
echo -e "${GREEN}🚀 Quick Fix Command:${NC}"
echo "Run this to fix immediately:"
echo -e "${BLUE}cd client && rm -rf .next && NEXT_PUBLIC_API_URL='\$BACKEND_API_URL' npm run build && vercel --prod${NC}"

echo ""
echo -e "${YELLOW}⚠️  If issue persists:${NC}"
echo "1. Check browser developer tools Network tab"
echo "2. Look for the actual URL being requested"
echo "3. Clear browser cache completely"
echo "4. Try incognito/private browsing mode"

echo ""
read -p "Would you like to run the quick fix now? (y/N): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🔧 Running quick fix...${NC}"
    
    # Get the production API URL from environment variable
    PRODUCTION_API_URL="${BACKEND_API_URL:-${NEXT_PUBLIC_API_URL}}"
    
    if [ -z "$PRODUCTION_API_URL" ]; then
        echo -e "${RED}❌ Backend API URL not found in environment variables!${NC}"
        echo -e "${RED}Please set BACKEND_API_URL or NEXT_PUBLIC_API_URL environment variable.${NC}"
        echo -e "${RED}Example: export BACKEND_API_URL='https://your-backend-service.run.app'${NC}"
        echo -e "${RED}Or copy .env.example to .env and configure your URLs.${NC}"
        exit 1
    fi
    
    # Clear build cache
    echo "Clearing build cache..."
    rm -rf .next
    
    # Set environment variable and build
    echo "Building with correct environment variable..."
    NEXT_PUBLIC_API_URL="$PRODUCTION_API_URL" npm run build
    
    # Deploy
    echo "Deploying to Vercel..."
    vercel --prod
    
    echo -e "${GREEN}✅ Fix complete! Check your app now.${NC}"
else
    echo -e "${YELLOW}💡 Manual fix instructions provided above.${NC}"
fi 