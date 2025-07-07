#!/bin/bash

# 🔧 Docker Troubleshooting and Setup Script
# Helps diagnose and fix common Docker issues for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

print_step() {
    echo -e "${CYAN}[STEP]${NC} $1"
}

echo "🔧 Docker Troubleshooting and Setup"
echo "===================================="
echo ""

# Check if Docker is installed
print_step "Checking Docker installation..."
if command -v docker >/dev/null 2>&1; then
    print_success "Docker CLI is installed"
    docker --version
else
    print_error "Docker is not installed!"
    echo ""
    echo "Please install Docker Desktop:"
    echo "  • Visit: https://www.docker.com/products/docker-desktop/"
    echo "  • Or run: brew install --cask docker"
    exit 1
fi

echo ""

# Check if Docker Desktop is running
print_step "Checking Docker Desktop status..."
if docker info >/dev/null 2>&1; then
    print_success "Docker Desktop is running"
else
    print_error "Docker Desktop is not running or not accessible"
    echo ""
    echo "To fix this:"
    echo "  1. Start Docker Desktop application"
    echo "  2. Wait for it to show 'Docker Desktop is running' in the menu bar"
    echo "  3. Run this script again"
    exit 1
fi

echo ""

# Check Docker daemon accessibility
print_step "Testing Docker daemon..."
if docker ps >/dev/null 2>&1; then
    print_success "Docker daemon is accessible"
else
    print_error "Cannot access Docker daemon"
    echo ""
    echo "This might indicate a permission issue. Try:"
    echo "  • Restart Docker Desktop"
    echo "  • Check if your user is in the docker group (Linux)"
    exit 1
fi

echo ""

# Check Docker Buildx
print_step "Checking Docker Buildx..."
if docker buildx version >/dev/null 2>&1; then
    print_success "Docker Buildx is available"
    docker buildx version
    
    # List available builders
    echo ""
    print_status "Available Buildx builders:"
    docker buildx ls
else
    print_warning "Docker Buildx is not available"
    echo ""
    echo "This is usually included with modern Docker installations."
    echo "If you have an older Docker version, consider updating Docker Desktop."
fi

echo ""

# Check Google Cloud CLI
print_step "Checking Google Cloud CLI..."
if command -v gcloud >/dev/null 2>&1; then
    print_success "Google Cloud CLI is installed"
    gcloud version --quiet
    
    # Check authentication
    echo ""
    print_status "Checking Google Cloud authentication..."
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q @; then
        ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1)
        print_success "Authenticated as: $ACTIVE_ACCOUNT"
    else
        print_warning "Not authenticated with Google Cloud"
        echo ""
        echo "To authenticate, run:"
        echo "  gcloud auth login"
    fi
else
    print_error "Google Cloud CLI is not installed!"
    echo ""
    echo "To install Google Cloud CLI:"
    echo "  • Visit: https://cloud.google.com/sdk/docs/install"
    echo "  • Or run: brew install google-cloud-sdk"
    exit 1
fi

echo ""

# Test Docker authentication with Google Cloud
print_step "Testing Docker authentication with Google Cloud..."
if gcloud auth configure-docker us-west2-docker.pkg.dev --quiet >/dev/null 2>&1; then
    print_success "Docker authentication configured for Google Cloud"
else
    print_warning "Failed to configure Docker authentication"
    echo ""
    echo "This might need to be run manually:"
    echo "  gcloud auth configure-docker us-west2-docker.pkg.dev"
fi

echo ""
print_success "Docker setup looks good! ✨"
echo ""
echo "You should now be able to run the deployment script:"
echo "  ./scripts/deploy-cloud.sh" 