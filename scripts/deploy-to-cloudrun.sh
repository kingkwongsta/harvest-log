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

# Step 2: Ensure Docker Buildx is available and set up
echo "🔧 Setting up Docker Buildx..."
# Check if buildx is available
if ! docker buildx version >/dev/null 2>&1; then
    echo "❌ Docker Buildx not found. Please install Docker Buildx."
    echo "Run: brew install docker-buildx"
    exit 1
fi

# Create a new buildx builder instance if it doesn't exist
if ! docker buildx ls | grep -q "harvest-builder"; then
    echo "📦 Creating new buildx builder instance..."
    docker buildx create --name harvest-builder --driver docker-container --bootstrap
fi

# Use the buildx builder
echo "🔄 Using buildx builder..."
docker buildx use harvest-builder

# Step 3: Build and push the Docker image using Buildx (replaces both build and push)
echo "🏗️ Building and pushing Docker image for Cloud Run (linux/amd64) using Buildx..."
docker buildx build \
  --platform linux/amd64 \
  --tag ${IMAGE_PATH}:latest \
  --push \
  --progress=plain \
  .

# Step 4: Verify image was pushed successfully
echo "✅ Verifying image push..."
if docker buildx imagetools inspect ${IMAGE_PATH}:latest >/dev/null 2>&1; then
    echo "✓ Image successfully pushed to Artifact Registry"
else
    echo "❌ Failed to verify image in registry"
    exit 1
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