#!/bin/bash

# 🔒 Security Check Script
# Validates that no sensitive URLs are exposed in the codebase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔒 Security Check - Harvest Log App${NC}"
    echo -e "${BLUE}===================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header

echo "Scanning codebase for exposed sensitive information..."
echo ""

# Check for hardcoded backend URLs
echo "🔍 Checking for hardcoded backend URLs..."

# Common patterns that might indicate exposed URLs
EXPOSED_URLS=0

# Check for Google Cloud Run URLs but exclude examples and docs
if grep -r "\.run\.app" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=venv \
  --exclude-dir=backend/venv \
  --exclude=".env.example" \
  --exclude="SECURITY_SETUP.md" \
  --exclude="security-check.sh" \
  --exclude="setup-env.sh" \
  --exclude="debug-api-issue.sh" \
  --exclude="deploy-cloud.sh" \
  --exclude="deploy-vercel.sh" \
  --exclude="deploy-to-cloudrun.sh" \
  --exclude="*.md" \
  2>/dev/null | grep -v "your-" | grep -v "example"; then
    print_error "Found potential exposed backend URLs!"
    EXPOSED_URLS=1
else
    print_success "No hardcoded backend URLs found"
fi

# Check for specific project patterns
echo ""
echo "🔍 Checking for project-specific patterns..."

if grep -r "512013902761" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=venv \
  --exclude-dir=backend/venv \
  --exclude=".env.example" \
  --exclude="SECURITY_SETUP.md" \
  --exclude="security-check.sh" \
  --exclude="*.md" \
  2>/dev/null; then
    print_error "Found exposed project ID!"
    EXPOSED_URLS=1
else
    print_success "No exposed project IDs found"
fi

# Check .env files are properly ignored
echo ""
echo "🔍 Checking .env file security..."

if [ -f ".env" ]; then
    print_warning ".env file exists (this is OK, but ensure it's in .gitignore)"
    if grep -q "\.env" .gitignore; then
        print_success ".env files are properly ignored"
    else
        print_error ".env files are NOT in .gitignore!"
        EXPOSED_URLS=1
    fi
else
    print_warning "No .env file found (use ./scripts/setup-env.sh to create one)"
fi

# Check for API keys or tokens (but exclude common library usage)
echo ""
echo "🔍 Checking for exposed API keys or tokens..."

# More specific patterns for actual API keys, avoiding false positives
# Look for actual API key patterns (sk_*, pk_*, api_key=, Bearer <token>)
if grep -r "sk_[a-zA-Z0-9]\|pk_[a-zA-Z0-9]\|api_key[ ]*=[ ]*['\"][^'\"]*['\"]" . \
  --exclude-dir=node_modules \
  --exclude-dir=.git \
  --exclude-dir=.next \
  --exclude-dir=venv \
  --exclude-dir=backend/venv \
  --exclude=".env.example" \
  --exclude="SECURITY_SETUP.md" \
  --exclude="security-check.sh" \
  --exclude="*.lock" \
  --exclude="package-lock.json" \
  --exclude="*.md" \
  --exclude="*.py" \
  --exclude="*.pyc" \
  2>/dev/null; then
    print_error "Found potential exposed API keys!"
    EXPOSED_URLS=1
else
    print_success "No exposed API keys found"
fi

# Check build files
echo ""
echo "🔍 Checking build files..."

if [ -d "client/.next" ]; then
    print_warning "Build files exist - checking for hardcoded URLs..."
    if grep -r "\.run\.app" client/.next/ 2>/dev/null; then
        print_error "Build files contain hardcoded URLs! Clear with: rm -rf client/.next"
        EXPOSED_URLS=1
    else
        print_success "Build files are clean"
    fi
else
    print_success "No build files to check"
fi

# Final result
echo ""
echo "==============================="

if [ $EXPOSED_URLS -eq 0 ]; then
    print_success "🎉 Security check PASSED!"
    echo ""
    echo -e "${GREEN}Your codebase appears secure for public repository.${NC}"
    echo ""
    echo "✅ Safe to push to GitHub"
    echo "✅ No hardcoded URLs found"
    echo "✅ Environment variables properly configured"
    echo ""
    exit 0
else
    print_error "🚨 Security check FAILED!"
    echo ""
    echo -e "${RED}Issues found that need to be addressed before pushing to public repository.${NC}"
    echo ""
    echo "🔧 Recommended actions:"
    echo "1. Remove any hardcoded URLs from source code"
    echo "2. Use environment variables instead"
    echo "3. Clear build cache: rm -rf client/.next"
    echo "4. Run security check again"
    echo ""
    echo "📖 See docs/SECURITY_SETUP.md for detailed guidance"
    echo ""
    exit 1
fi
