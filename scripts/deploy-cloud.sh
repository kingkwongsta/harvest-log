#!/bin/bash

# 🚀 Comprehensive Cloud Deployment Script
# Deploys Backend (Google Cloud Run) and/or Frontend (Vercel)

set -e  # Exit on any error

# Find and change to project root directory
find_project_root() {
    local current_dir="$(pwd)"
    local search_dir="$current_dir"
    
    # Look for project markers (package.json in client dir, CLAUDE.md, etc.)
    while [ "$search_dir" != "/" ]; do
        if [ -f "$search_dir/CLAUDE.md" ] && [ -d "$search_dir/client" ] && [ -d "$search_dir/backend" ]; then
            echo "$search_dir"
            return 0
        fi
        search_dir="$(dirname "$search_dir")"
    done
    
    # If not found, check if we're already in project root
    if [ -f "CLAUDE.md" ] && [ -d "client" ] && [ -d "backend" ]; then
        echo "$(pwd)"
        return 0
    fi
    
    return 1
}

# Detect and change to project root
PROJECT_ROOT=$(find_project_root)
if [ $? -ne 0 ]; then
    echo "❌ Error: Could not find project root directory."
    echo "Please run this script from within the plant-journey project directory."
    exit 1
fi

if [ "$(pwd)" != "$PROJECT_ROOT" ]; then
    echo "📁 Changing to project root: $PROJECT_ROOT"
    cd "$PROJECT_ROOT"
fi

echo "🌱 Harvest Log App - Cloud Deployment"
echo "====================================="
echo "📁 Project root: $(pwd)"
echo ""

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="client"

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

# Function to load environment variables from .env file
load_env_file() {
    local env_file="$PROJECT_ROOT/.env"
    if [ -f "$env_file" ]; then
        print_status "Loading environment variables from .env file..."
        # Export variables from .env file, ignoring comments and empty lines
        set -a  # Automatically export all variables
        source "$env_file"
        set +a  # Stop auto-export
        print_status "✓ Environment variables loaded from .env"
    else
        print_status "No .env file found at project root"
    fi
}

# Show deployment menu
show_menu() {
    echo "🚀 Choose your deployment option:"
    echo ""
    echo "1) 🌐 Deploy Frontend only (Vercel)"
    echo "2) 📡 Deploy Backend only (Google Cloud Run)"
    echo "3) 🌍 Deploy Both (Frontend + Backend)"
    echo "4) ❌ Cancel"
    echo ""
}

# Get user choice
get_user_choice() {
    while true; do
        show_menu >&2  # Send menu to stderr so it displays properly
        read -p "Enter your choice (1-4): " choice
        echo "" >&2
        
        case $choice in
            1)
                echo "🌐 Selected: Frontend deployment only" >&2
                echo "1"  # This goes to stdout for capture
                return 0
                ;;
            2)
                echo "📡 Selected: Backend deployment only" >&2
                echo "2"  # This goes to stdout for capture
                return 0
                ;;
            3)
                echo "🌍 Selected: Both Frontend and Backend deployment" >&2
                echo "3"  # This goes to stdout for capture
                return 0
                ;;
            4)
                echo "❌ Deployment cancelled" >&2
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please select 1-4." >&2
                echo "" >&2
                ;;
        esac
    done
}

# Check prerequisites based on deployment choice
check_prerequisites() {
    local deploy_choice=$1
    print_step "Checking prerequisites for deployment option $deploy_choice..."
    
    # Check frontend prerequisites
    if [[ $deploy_choice -eq 1 || $deploy_choice -eq 3 ]]; then
        print_status "Checking frontend deployment prerequisites..."
        
        # Check if vercel is installed
        if ! command -v vercel >/dev/null 2>&1; then
            print_error "Vercel CLI not found. Please install it first."
            exit 1
        fi
        print_status "✓ Vercel CLI found"
        
        # Check if package.json exists
        if [ ! -f "${FRONTEND_DIR}/package.json" ]; then
            print_error "Frontend package.json not found at ${FRONTEND_DIR}/package.json"
            print_error "Current directory: $(pwd)"
            print_error "Looking for: $(pwd)/${FRONTEND_DIR}/package.json"
            exit 1
        fi
        print_status "✓ Frontend package.json found"
    fi
    
    # Check backend prerequisites
    if [[ $deploy_choice -eq 2 || $deploy_choice -eq 3 ]]; then
        print_status "Checking backend deployment prerequisites..."
        
        # Check if gcloud is installed
        if ! command -v gcloud >/dev/null 2>&1; then
            print_error "Google Cloud CLI not found. Please install it first."
            exit 1
        fi
        print_status "✓ Google Cloud CLI found"
        
        # Check if backend .env exists
        if [ ! -f "${BACKEND_DIR}/.env" ]; then
            print_error "Backend .env file not found at ${BACKEND_DIR}/.env"
            print_error "Current directory: $(pwd)"
            print_error "Looking for: $(pwd)/${BACKEND_DIR}/.env"
            exit 1
        fi
        print_status "✓ Backend .env file found"
        
        # Check gcloud authentication
        if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q @; then
            print_warning "You may not be authenticated with Google Cloud. Run 'gcloud auth login' if deployment fails."
        else
            print_status "✓ Google Cloud authentication active"
        fi
    fi
    
    print_success "All prerequisites check passed!"
    echo ""
}

# Deploy Backend to Google Cloud Run
deploy_backend() {
    print_step "🔧 Starting Backend Deployment to Google Cloud Run..."
    echo "=============================================="
    
    print_status "Changing to backend directory..."
    cd "${BACKEND_DIR}"
    
    print_status "Making deployment script executable..."
    chmod +x "${PROJECT_ROOT}/scripts/deploy-to-cloudrun.sh"
    
    print_status "Executing Google Cloud Run deployment..."
    echo "--------------------------------------------"
    bash "${PROJECT_ROOT}/scripts/deploy-to-cloudrun.sh"
    local backend_exit_code=$?
    echo "--------------------------------------------"
    
    if [ $backend_exit_code -eq 0 ]; then
        print_success "Backend deployed successfully to Google Cloud Run!"
        
        # Get backend URL from environment or show generic message
        if [ -n "$BACKEND_API_URL" ]; then
            echo "📡 Backend URL: $BACKEND_API_URL"
        else
            echo "📡 Backend URL: Check Google Cloud Console for your service URL"
        fi
    else
        print_error "Backend deployment failed with exit code $backend_exit_code!"
        exit 1
    fi
    
    print_status "Returning to project root..."
    cd "${PROJECT_ROOT}"
    echo ""
}

# Deploy Frontend to Vercel
deploy_frontend() {
    print_step "🎨 Starting Frontend Deployment to Vercel..."
    echo "==========================================="
    
    print_status "Deploying from directory: $(pwd)/${FRONTEND_DIR}"
    
    # Verify we're in the project root
    if [ ! -d "${FRONTEND_DIR}" ]; then
        print_error "Frontend directory '${FRONTEND_DIR}' not found!"
        exit 1
    fi
    
    print_status "Changing to frontend directory..."
    cd "${FRONTEND_DIR}"
    print_status "Now in directory: $(pwd)"
    
    # Verify required files exist
    if [ ! -f "package.json" ]; then
        print_error "package.json not found in client directory!"
        exit 1
    fi
    
    if [ ! -f "next.config.ts" ]; then
        print_error "next.config.ts not found in client directory!"
        exit 1
    fi
    
    print_status "✓ Next.js project structure verified"
    
    # Get the production API URL from environment variable
    PRODUCTION_API_URL="${BACKEND_API_URL:-${NEXT_PUBLIC_API_URL}}"
    
    if [ -z "$PRODUCTION_API_URL" ]; then
        print_error "❌ Backend API URL not found in environment variables!"
        print_error "Please set BACKEND_API_URL or NEXT_PUBLIC_API_URL environment variable."
        print_error "Example: export BACKEND_API_URL='https://your-backend-service.run.app'"
        print_error "Or copy .env.example to .env and configure your URLs."
        exit 1
    fi
    
    print_status "Using production API URL: $PRODUCTION_API_URL"
    
    # Validate URL format
    if [[ ! "$PRODUCTION_API_URL" =~ ^https:// ]]; then
        print_error "❌ Backend API URL must use HTTPS for production deployment!"
        print_error "Current URL: $PRODUCTION_API_URL"
        exit 1
    fi
    
    # Set environment variables in Vercel (force update)
    print_status "Configuring Vercel environment variables..."
    vercel env add NEXT_PUBLIC_API_URL production --value="$PRODUCTION_API_URL" --force 2>/dev/null || true
    vercel env add NEXT_PUBLIC_API_URL preview --value="$PRODUCTION_API_URL" --force 2>/dev/null || true
    
    # Clear build cache to prevent HTTP/HTTPS issues
    print_status "Clearing build cache to prevent HTTPS issues..."
    rm -rf .next
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -rf .vercel 2>/dev/null || true
    rm -rf .swc 2>/dev/null || true
    
    # Handle .env.local file that may override production settings
    print_status "Handling local environment file..."
    if [ -f ".env.local" ]; then
        print_status "Backing up .env.local to .env.local.backup..."
        cp .env.local .env.local.backup
        print_status "Creating production .env.local..."
        echo "# Production environment variables" > .env.local
        echo "NEXT_PUBLIC_API_URL=$PRODUCTION_API_URL" >> .env.local
        print_status "✓ Production environment variables set in .env.local"
    else
        print_status "Creating production .env.local..."
        echo "# Production environment variables" > .env.local
        echo "NEXT_PUBLIC_API_URL=$PRODUCTION_API_URL" >> .env.local
    fi
    
    # Clear any cached environment variables
    print_status "Clearing cached environment variables..."
    unset NEXT_PUBLIC_API_URL 2>/dev/null || true
    export NEXT_PUBLIC_API_URL="$PRODUCTION_API_URL"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm ci
        if [ $? -ne 0 ]; then
            print_error "Failed to install dependencies!"
            exit 1
        fi
    else
        print_status "✓ Frontend dependencies already installed"
    fi
    
    # Check if vercel.json exists and show configuration
    if [ -f "vercel.json" ]; then
        print_status "✓ Vercel configuration found"
        # Don't show the actual URL in logs for security
        print_status "Backend API URL configured in vercel.json"
    else
        print_warning "No vercel.json found - using default Vercel settings"
    fi
    
    # Build with correct environment variable to prevent HTTP/HTTPS issues
    print_status "Building Next.js application with HTTPS environment..."
    NEXT_PUBLIC_API_URL="$PRODUCTION_API_URL" npm run build
    if [ $? -ne 0 ]; then
        print_error "Build failed! Please fix build errors before deploying."
        exit 1
    fi
    print_status "✓ Build successful with HTTPS configuration"
    
    # Verify HTTPS URLs in build output (check only JS files, not binary cache)
    print_status "Verifying HTTPS URLs in build output..."
    
    # Check only JavaScript files for HTTP weather URLs (excluding binary cache files)
    if find .next -name "*.js" -exec grep -l "http://.*weather" {} \; 2>/dev/null | head -3; then
        print_warning "⚠️  Found HTTP weather URLs in JavaScript files:"
        print_warning "This may cause mixed content errors in production."
        
        # Show specific files with HTTP weather URLs
        find .next -name "*.js" -exec grep -l "http://.*weather" {} \; 2>/dev/null | head -3 | while read file; do
            print_warning "  - $file"
        done
        
        # Check for actual API calls (not just string literals)
        if find .next -name "*.js" -exec grep -l "\"http://.*weather\"" {} \; 2>/dev/null | head -1; then
            print_error "❌ Found HTTP weather API calls in JavaScript files - this will cause mixed content errors!"
            print_error "Build may be using cached environment variables."
            echo ""
            read -p "Skip this validation and continue deployment? (y/N): " -n 1 -r
            echo ""
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                print_error "Deployment cancelled due to HTTP URLs in build output."
                exit 1
            else
                print_warning "⚠️  Skipping HTTP validation - deploying anyway"
            fi
        else
            print_status "✅ No critical HTTP weather API calls found - continuing deployment"
        fi
    else
        print_status "✅ No HTTP weather URLs found in JavaScript files"
    fi
    
    print_status "Executing Vercel deployment..."
    print_status "Deploying client folder to Vercel with production settings..."
    echo "--------------------------------------------"
    vercel --prod --yes --force
    local frontend_exit_code=$?
    echo "--------------------------------------------"
    
    if [ $frontend_exit_code -eq 0 ]; then
        print_success "Frontend (client folder) deployed successfully to Vercel!"
        print_status "Your Next.js app is now live!"
        
        # Verify environment variables were set correctly
        print_status "Verifying environment variables..."
        vercel env ls 2>/dev/null | grep -q "NEXT_PUBLIC_API_URL" && print_status "✅ Environment variables verified" || print_warning "⚠️ Could not verify environment variables"
        
        # Try to get deployment URL
        if command -v vercel >/dev/null 2>&1; then
            print_status "Fetching deployment URL..."
            VERCEL_URL=$(vercel ls --scope=personal 2>/dev/null | grep "plant-journey" | head -1 | awk '{print $2}' || echo "Check Vercel dashboard")
            if [ "$VERCEL_URL" != "Check Vercel dashboard" ] && [ -n "$VERCEL_URL" ]; then
                echo "🌐 Live URL: https://$VERCEL_URL"
            fi
        fi
        
        print_success "✅ Frontend deployment completed with HTTPS fixes applied!"
        print_status "🌤️ Weather API should now work without mixed content errors"
    else
        print_error "Frontend deployment failed with exit code $frontend_exit_code!"
        print_error "Please check the error messages above and try again."
        exit 1
    fi
    
    # Restore original .env.local file
    print_status "Restoring original .env.local file..."
    if [ -f ".env.local.backup" ]; then
        mv .env.local.backup .env.local
        print_status "✓ Original .env.local restored"
    else
        # If no backup exists, remove the production .env.local
        rm -f .env.local
        print_status "✓ Production .env.local removed"
    fi
    
    print_status "Returning to project root..."
    cd "${PROJECT_ROOT}"
    echo ""
}

# Main deployment function
main() {
    # Load environment variables from .env file if it exists
    load_env_file
    
    # Get user's deployment choice
    print_status "Getting deployment choice from user..."
    choice=$(get_user_choice)
    
    echo ""
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo ""
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user."
        exit 0
    fi
    
    print_step "Starting deployment process..."
    echo ""
    
    # Check prerequisites based on choice
    check_prerequisites $choice
    
    # Execute deployment based on choice
    case $choice in
        1)
            print_step "Executing Frontend-only deployment..."
            deploy_frontend
            echo ""
            print_success "🎉 Frontend deployment complete!"
            echo "🌐 Check the Vercel output above for your app URL"
            echo "🌤️ Weather API now properly uses HTTPS (mixed content issue resolved)"
            ;;
        2)
            print_step "Executing Backend-only deployment..."
            deploy_backend
            echo ""
            print_success "🎉 Backend deployment complete!"
            if [ -n "$BACKEND_API_URL" ]; then
                echo "📡 Your backend API is live at: $BACKEND_API_URL"
            else
                echo "📡 Your backend API is live - check Google Cloud Console for the URL"
            fi
            ;;
        3)
            print_step "Executing Full deployment (Frontend + Backend)..."
            echo ""
            deploy_frontend
            deploy_backend
            echo ""
            echo "🎉 FULL DEPLOYMENT COMPLETE! 🎉"
            echo "==============================="
            echo ""
            print_success "Your complete Harvest Log App is now live in the cloud!"
            echo ""
            echo "🌐 Frontend App: Check the Vercel output above for your app URL"
            if [ -n "$BACKEND_API_URL" ]; then
                echo "📡 Backend API: $BACKEND_API_URL"
            else
                echo "📡 Backend API: Check Google Cloud Console for your service URL"
            fi
            echo "🌤️ Weather API: HTTPS mixed content issue resolved - should work perfectly"
            ;;
    esac
    
    echo ""
    echo "🧪 Test your deployment:"
    if [ -n "$BACKEND_API_URL" ]; then
        echo "  Backend Health: curl $BACKEND_API_URL/health"
    else
        echo "  Backend Health: curl https://your-backend-url/health"
    fi
    if [[ $choice -eq 1 || $choice -eq 3 ]]; then
        echo "  Weather API: Check browser console - should show HTTPS requests only"
        echo "  Frontend: Try logging an event with location to test weather integration"
    fi
    echo ""
    echo "📊 Monitor your deployments:"
    if [[ $choice -eq 1 || $choice -eq 3 ]]; then
        echo "  Frontend: https://vercel.com/dashboard"
    fi
    if [[ $choice -eq 2 || $choice -eq 3 ]]; then
        echo "  Backend: https://console.cloud.google.com/run"
    fi
    
    echo ""
    print_success "Deployment script completed successfully! 🚀"
}

# Run main function
main "$@" 