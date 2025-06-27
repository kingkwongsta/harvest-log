#!/bin/bash

# Local Harvest Log Deployment Script
echo "🌱 Deploying Harvest Log App Locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "⚠️  No backend/.env file found. Please create one with your Supabase credentials."
    echo "Example:"
    echo "SUPABASE_URL=your_supabase_url"
    echo "SUPABASE_KEY=your_supabase_anon_key"
    exit 1
fi

# Build and start the services
echo "🏗️  Building and starting services..."
docker-compose down --remove-orphans
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are running!"
    echo ""
    echo "🎉 Harvest Log App is now available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend API: http://localhost:8000"
    echo "   API Docs: http://localhost:8000/docs"
    echo ""
    echo "📱 On your home network, other devices can access it at:"
    echo "   Frontend: http://$(hostname -I | cut -d' ' -f1):3000"
    echo "   Backend: http://$(hostname -I | cut -d' ' -f1):8000"
    echo ""
    echo "🔧 To stop the services, run: docker-compose down"
    echo "📊 To view logs, run: docker-compose logs -f"
else
    echo "❌ Something went wrong. Check the logs with: docker-compose logs"
fi 