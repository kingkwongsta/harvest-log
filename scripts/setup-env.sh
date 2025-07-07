#!/bin/bash

# 🔒 Environment Setup Script for Harvest Log App
# This script helps you configure environment variables securely

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${CYAN}🔒 Harvest Log - Environment Setup${NC}"
    echo -e "${CYAN}=================================${NC}"
    echo ""
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f ".env.example" ]; then
    print_error "Must run from project root directory (where .env.example exists)"
    exit 1
fi

print_header

print_step "Setting up your environment variables securely..."
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    print_warning ".env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Setup cancelled. Existing .env file preserved."
        exit 0
    fi
fi

# Copy .env.example to .env
print_step "Creating .env file from template..."
cp .env.example .env
print_success ".env file created!"

echo ""
print_step "Please provide your backend configuration:"
echo ""

# Get backend URL
while true; do
    read -p "Enter your backend URL (e.g., https://your-service.run.app): " BACKEND_URL
    
    if [[ -z "$BACKEND_URL" ]]; then
        print_error "Backend URL cannot be empty!"
        continue
    fi
    
    if [[ ! "$BACKEND_URL" =~ ^https:// ]]; then
        print_error "Backend URL must start with https:// for security!"
        continue
    fi
    
    break
done

# Get Google Cloud Project ID
read -p "Enter your Google Cloud Project ID (optional): " PROJECT_ID

# Get Cloud Run service name
read -p "Enter your Cloud Run service name (default: plant-journey-backend): " SERVICE_NAME
SERVICE_NAME=${SERVICE_NAME:-plant-journey-backend}

# Get Cloud Run region
read -p "Enter your Cloud Run region (default: us-west2): " REGION
REGION=${REGION:-us-west2}

echo ""
print_step "Updating .env file with your configuration..."

# Update the .env file
sed -i.bak "s|BACKEND_API_URL=.*|BACKEND_API_URL=$BACKEND_URL|" .env
sed -i.bak "s|NEXT_PUBLIC_API_URL=.*|NEXT_PUBLIC_API_URL=$BACKEND_URL|" .env
sed -i.bak "s|GOOGLE_CLOUD_PROJECT_ID=.*|GOOGLE_CLOUD_PROJECT_ID=$PROJECT_ID|" .env
sed -i.bak "s|CLOUD_RUN_SERVICE_NAME=.*|CLOUD_RUN_SERVICE_NAME=$SERVICE_NAME|" .env
sed -i.bak "s|CLOUD_RUN_REGION=.*|CLOUD_RUN_REGION=$REGION|" .env

# Remove backup file
rm .env.bak 2>/dev/null || true

print_success "Environment configuration complete!"

echo ""
print_step "Setting up Vercel environment variables..."

# Check if vercel is installed
if command -v vercel >/dev/null 2>&1; then
    read -p "Set environment variables in Vercel now? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        vercel env add NEXT_PUBLIC_API_URL production --value="$BACKEND_URL" --force 2>/dev/null || true
        vercel env add NEXT_PUBLIC_API_URL preview --value="$BACKEND_URL" --force 2>/dev/null || true
        print_success "Vercel environment variables configured!"
    fi
else
    print_warning "Vercel CLI not found. Install it with: npm install -g vercel"
    print_warning "Then set NEXT_PUBLIC_API_URL in your Vercel dashboard"
fi

echo ""
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo -e "${CYAN}📋 What was configured:${NC}"
echo "  ✅ .env file created with your settings"
echo "  ✅ Backend URL: [HIDDEN FOR SECURITY]"
echo "  ✅ Vercel environment variables (if selected)"
echo ""
echo -e "${CYAN}🚀 Next Steps:${NC}"
echo "  1. Verify your .env file: cat .env"
echo "  2. Deploy your app: ./scripts/deploy-cloud.sh"
echo "  3. Test your deployment"
echo ""
echo -e "${YELLOW}⚠️  Security Reminder:${NC}"
echo "  • Never commit .env files to version control"
echo "  • Keep your backend URLs private"
echo "  • Use different URLs for dev/staging/production"
echo ""
