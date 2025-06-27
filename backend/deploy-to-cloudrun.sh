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

# Step 2: Build the Docker image for the correct platform (linux/amd64)
echo "🏗️ Building Docker image for Cloud Run (linux/amd64)..."
docker build --platform linux/amd64 -t ${IMAGE_PATH}:latest .

# Step 3: Push the image to Artifact Registry
echo "📤 Pushing image to Artifact Registry..."
docker push ${IMAGE_PATH}:latest

# Step 4: Deploy to Cloud Run
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