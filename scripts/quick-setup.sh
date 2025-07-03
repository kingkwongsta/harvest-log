#!/bin/bash

# 🚀 Quick Setup Script for Harvest Log App
# This script helps you quickly get started with environment variables

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}�� Quick Setup - Harvest Log App${NC}"
echo ""

# Check if .env exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists!${NC}"
    read -p "Do you want to update it with your backend URL? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get backend URL
echo "Please enter your backend URL:"
echo "Example: https://your-service-name-123456789.us-west2.run.app"
echo ""
read -p "Backend URL: " BACKEND_URL

# Validate URL
if [[ -z "$BACKEND_URL" ]]; then
    echo "❌ Backend URL cannot be empty!"
    exit 1
fi

if [[ ! "$BACKEND_URL" =~ ^https:// ]]; then
    echo "❌ Backend URL must start with https://!"
    exit 1
fi

# Create or update .env file
echo "BACKEND_API_URL=$BACKEND_URL" > .env
echo "NEXT_PUBLIC_API_URL=$BACKEND_URL" >> .env
echo "GOOGLE_CLOUD_PROJECT_ID=your-project-id" >> .env
echo "CLOUD_RUN_SERVICE_NAME=harvest-log-backend" >> .env
echo "CLOUD_RUN_REGION=us-west2" >> .env

echo ""
echo -e "${GREEN}✅ .env file configured!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Set environment variables in Vercel dashboard:"
echo "   - Go to your project → Settings → Environment Variables"
echo "   - Add NEXT_PUBLIC_API_URL with value: $BACKEND_URL"
echo ""
echo "2. Deploy your app:"
echo "   ./scripts/deploy-cloud.sh"
echo ""
echo "3. Verify security before pushing to GitHub:"
echo "   ./scripts/security-check.sh"
echo ""
echo -e "${GREEN}🎉 You're all set!${NC}"
