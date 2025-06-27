#!/bin/bash

# 🚀 Comprehensive Cloud Deployment Script
# Deploys Backend (Google Cloud Run) and/or Frontend (Vercel)

set -e  # Exit on any error

echo "🌱 Harvest Log App - Cloud Deployment"
echo "====================================="
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
    chmod +x ../scripts/deploy-to-cloudrun.sh
    
    print_status "Executing Google Cloud Run deployment..."
    echo "--------------------------------------------"
    bash ../scripts/deploy-to-cloudrun.sh
    local backend_exit_code=$?
    echo "--------------------------------------------"
    
    if [ $backend_exit_code -eq 0 ]; then
        print_success "Backend deployed successfully to Google Cloud Run!"
        echo "📡 Backend URL: https://harvest-log-backend-512013902761.us-west2.run.app"
    else
        print_error "Backend deployment failed with exit code $backend_exit_code!"
        exit 1
    fi
    
    print_status "Returning to project root..."
    cd ..
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
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
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
        print_status "Backend API URL configured: $(grep -o 'https://[^"]*' vercel.json | head -1)"
    else
        print_warning "No vercel.json found - using default Vercel settings"
    fi
    
    # Run build to ensure everything works
    print_status "Building Next.js application..."
    npm run build
    if [ $? -ne 0 ]; then
        print_error "Build failed! Please fix build errors before deploying."
        exit 1
    fi
    print_status "✓ Build successful"
    
    print_status "Executing Vercel deployment..."
    print_status "Deploying client folder to Vercel with production settings..."
    echo "--------------------------------------------"
    vercel --prod --yes --force
    local frontend_exit_code=$?
    echo "--------------------------------------------"
    
    if [ $frontend_exit_code -eq 0 ]; then
        print_success "Frontend (client folder) deployed successfully to Vercel!"
        print_status "Your Next.js app is now live!"
        
        # Try to get deployment URL
        if command -v vercel >/dev/null 2>&1; then
            print_status "Fetching deployment URL..."
            VERCEL_URL=$(vercel ls --scope=personal 2>/dev/null | grep "client" | head -1 | awk '{print $2}' || echo "Check Vercel dashboard")
            if [ "$VERCEL_URL" != "Check Vercel dashboard" ] && [ -n "$VERCEL_URL" ]; then
                echo "🌐 Live URL: https://$VERCEL_URL"
            fi
        fi
    else
        print_error "Frontend deployment failed with exit code $frontend_exit_code!"
        print_error "Please check the error messages above and try again."
        exit 1
    fi
    
    print_status "Returning to project root..."
    cd ..
    echo ""
}

# Main deployment function
main() {
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
            ;;
        2)
            print_step "Executing Backend-only deployment..."
            deploy_backend
            echo ""
            print_success "🎉 Backend deployment complete!"
            echo "📡 Your backend API is live at: https://harvest-log-backend-512013902761.us-west2.run.app"
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
            echo "📡 Backend API: https://harvest-log-backend-512013902761.us-west2.run.app"
            ;;
    esac
    
    echo ""
    echo "🧪 Test your deployment:"
    echo "  curl https://harvest-log-backend-512013902761.us-west2.run.app/health"
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