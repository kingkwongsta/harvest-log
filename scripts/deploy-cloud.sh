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

# Show deployment menu
show_menu() {
    echo "🚀 Choose your deployment option:"
    echo ""
    echo "1) 📡 Deploy Backend only (Google Cloud Run)"
    echo "2) 🌐 Deploy Frontend only (Vercel)"
    echo "3) 🌍 Deploy Both (Backend + Frontend)"
    echo "4) ❌ Cancel"
    echo ""
}

# Get user choice
get_user_choice() {
    while true; do
        show_menu
        read -p "Enter your choice (1-4): " choice
        echo ""
        
        case $choice in
            1)
                echo "📡 Selected: Backend deployment only"
                return 1
                ;;
            2)
                echo "🌐 Selected: Frontend deployment only"
                return 2
                ;;
            3)
                echo "🌍 Selected: Both Backend and Frontend deployment"
                return 3
                ;;
            4)
                echo "❌ Deployment cancelled"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please select 1-4."
                echo ""
                ;;
        esac
    done
}

# Check prerequisites based on deployment choice
check_prerequisites() {
    local deploy_choice=$1
    print_status "Checking prerequisites..."
    
    # Check backend prerequisites
    if [[ $deploy_choice -eq 1 || $deploy_choice -eq 3 ]]; then
        # Check if gcloud is installed
        if ! command -v gcloud >/dev/null 2>&1; then
            print_error "Google Cloud CLI not found. Please install it first."
            exit 1
        fi
        
        # Check if backend .env exists
        if [ ! -f "${BACKEND_DIR}/.env" ]; then
            print_error "Backend .env file not found at ${BACKEND_DIR}/.env"
            exit 1
        fi
        
        # Check gcloud authentication
        if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q @; then
            print_warning "You may not be authenticated with Google Cloud. Run 'gcloud auth login' if deployment fails."
        fi
    fi
    
    # Check frontend prerequisites
    if [[ $deploy_choice -eq 2 || $deploy_choice -eq 3 ]]; then
        # Check if vercel is installed
        if ! command -v vercel >/dev/null 2>&1; then
            print_error "Vercel CLI not found. Please install it first."
            exit 1
        fi
        
        # Check if package.json exists
        if [ ! -f "${FRONTEND_DIR}/package.json" ]; then
            print_error "Frontend package.json not found at ${FRONTEND_DIR}/package.json"
            exit 1
        fi
    fi
    
    print_success "Prerequisites check passed!"
    echo ""
}

# Deploy Backend to Google Cloud Run
deploy_backend() {
    print_status "🔧 Starting Backend Deployment to Google Cloud Run..."
    echo ""
    
    cd "${BACKEND_DIR}"
    
    # Make the script executable and run it
    chmod +x ../scripts/deploy-to-cloudrun.sh
    bash ../scripts/deploy-to-cloudrun.sh
    
    if [ $? -eq 0 ]; then
        print_success "Backend deployed successfully to Google Cloud Run!"
        echo "📡 Backend URL: https://harvest-log-backend-512013902761.us-west2.run.app"
    else
        print_error "Backend deployment failed!"
        exit 1
    fi
    
    cd ..
    echo ""
}

# Deploy Frontend to Vercel
deploy_frontend() {
    print_status "🎨 Starting Frontend Deployment to Vercel..."
    echo ""
    
    cd "${FRONTEND_DIR}"
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Deploy to Vercel
    print_status "Deploying to Vercel..."
    vercel --prod --yes
    
    if [ $? -eq 0 ]; then
        print_success "Frontend deployed successfully to Vercel!"
    else
        print_error "Frontend deployment failed!"
        exit 1
    fi
    
    cd ..
    echo ""
}

# Main deployment function
main() {
    # Get user's deployment choice
    get_user_choice
    local choice=$?
    
    echo ""
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo ""
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Deployment cancelled by user."
        exit 0
    fi
    
    # Check prerequisites based on choice
    check_prerequisites $choice
    
    # Execute deployment based on choice
    case $choice in
        1)
            deploy_backend
            print_success "🎉 Backend deployment complete!"
            echo "📡 Your backend API is live at: https://harvest-log-backend-512013902761.us-west2.run.app"
            ;;
        2)
            deploy_frontend
            print_success "🎉 Frontend deployment complete!"
            echo "🌐 Check the Vercel output above for your app URL"
            ;;
        3)
            deploy_backend
            deploy_frontend
            echo "🎉 FULL DEPLOYMENT COMPLETE! 🎉"
            echo "==============================="
            echo ""
            print_success "Your complete Harvest Log App is now live in the cloud!"
            echo ""
            echo "📡 Backend API: https://harvest-log-backend-512013902761.us-west2.run.app"
            echo "🌐 Frontend App: Check the Vercel output above for your app URL"
            ;;
    esac
    
    echo ""
    echo "🧪 Test your deployment:"
    echo "  curl https://harvest-log-backend-512013902761.us-west2.run.app/health"
    echo ""
    echo "📊 Monitor your deployments:"
    if [[ $choice -eq 1 || $choice -eq 3 ]]; then
        echo "  Backend: https://console.cloud.google.com/run"
    fi
    if [[ $choice -eq 2 || $choice -eq 3 ]]; then
        echo "  Frontend: https://vercel.com/dashboard"
    fi
}

# Run main function
main "$@" 