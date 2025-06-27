#!/bin/bash

# Deploy Harvest Log Backend to Google Cloud Run via Artifact Registry
# Make sure you have gcloud CLI installed and authenticated

set -e  # Exit on any error

# Configuration - Update these values for your project
PROJECT_ID="backend-services-437402"
REGION="us-west2"
SERVICE_NAME="harvest-log-backend"
REPOSITORY_NAME="harvest-log"
IMAGE_NAME="backend"

# Construct the full image path for Artifact Registry
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY_NAME}/${IMAGE_NAME}"

echo "🚀 Deploying Harvest Log Backend to Cloud Run"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Service: ${SERVICE_NAME}"
echo "Image: ${IMAGE_PATH}"
echo ""

# Check if we're in the backend directory
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile not found. Make sure you're running this script from the backend directory."
    exit 1
fi

# Check if Docker Desktop is running
if ! docker ps >/dev/null 2>&1; then
    echo "❌ Docker Desktop is not running or not accessible."
    echo "Please start Docker Desktop and wait for it to be ready, then try again."
    exit 1
fi

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📋 Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️ Warning: .env file not found. Make sure environment variables are set."
fi

# Step 1: Configure Docker authentication for Artifact Registry
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Step 2: Check Docker and set up build strategy
echo "🔧 Setting up Docker build strategy..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if buildx is available and working
USE_BUILDX=false
if docker buildx version >/dev/null 2>&1 && docker buildx ls >/dev/null 2>&1; then
    echo "✓ Docker Buildx is available"
    USE_BUILDX=true
    
    # Create a new buildx builder instance if it doesn't exist
    if ! docker buildx ls | grep -q "harvest-builder"; then
        echo "📦 Creating new buildx builder instance..."
        if docker buildx create --name harvest-builder --driver docker-container --bootstrap >/dev/null 2>&1; then
            echo "✓ Buildx builder created successfully"
        else
            echo "⚠️ Failed to create buildx builder, falling back to regular docker build"
            USE_BUILDX=false
        fi
    fi
    
    if [ "$USE_BUILDX" = true ]; then
        # Use the buildx builder
        echo "🔄 Using buildx builder..."
        docker buildx use harvest-builder
    fi
else
    echo "⚠️ Docker Buildx not available, using regular docker build + push"
fi

# Step 3: Build and push the Docker image
if [ "$USE_BUILDX" = true ]; then
    echo "🏗️ Building and pushing Docker image using Buildx (linux/amd64)..."
    docker buildx build \
      --platform linux/amd64 \
      --tag ${IMAGE_PATH}:latest \
      --push \
      --progress=plain \
      .
else
    echo "🏗️ Building Docker image using regular docker build..."
    docker build --platform linux/amd64 -t ${IMAGE_PATH}:latest .
    
    echo "📤 Pushing Docker image to registry..."
    docker push ${IMAGE_PATH}:latest
fi

# Step 4: Verify image was pushed successfully
echo "✅ Verifying image push..."
if [ "$USE_BUILDX" = true ]; then
    if docker buildx imagetools inspect ${IMAGE_PATH}:latest >/dev/null 2>&1; then
        echo "✓ Image successfully pushed to Artifact Registry"
    else
        echo "❌ Failed to verify image in registry"
        exit 1
    fi
else
    # For regular docker, we can try to pull the image to verify it exists
    if docker pull ${IMAGE_PATH}:latest >/dev/null 2>&1; then
        echo "✓ Image successfully pushed to Artifact Registry"
        # Clean up the pulled image locally
        docker rmi ${IMAGE_PATH}:latest >/dev/null 2>&1 || true
    else
        echo "❌ Failed to verify image in registry"
        exit 1
    fi
fi

# Step 5: Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_PATH}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars="PYTHONUNBUFFERED=1,SUPABASE_URL=${SUPABASE_URL},SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY},SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}" \
  --project ${PROJECT_ID}

echo ""
echo "✅ Deployment completed!"
echo "🌐 Your service should be available at:"
echo "   https://${SERVICE_NAME}-${PROJECT_ID//[^0-9]/}.${REGION}.run.app"
echo ""
echo "🔧 To check logs:"
echo "   gcloud logging read 'resource.type=cloud_run_revision AND resource.labels.service_name=${SERVICE_NAME}' --limit=50 --project=${PROJECT_ID}"
echo ""
echo "🧪 Test the deployment:"
echo "   curl https://${SERVICE_NAME}-${PROJECT_ID//[^0-9]/}.${REGION}.run.app/health" 