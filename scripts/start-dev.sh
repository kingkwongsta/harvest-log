#!/bin/bash

# Simple Development Server Startup Script
echo "🌱 Starting Harvest Log App in Development Mode..."

# Check if .env exists
if [ ! -f ../backend/.env ]; then
    echo "⚠️  No backend/.env file found. Please create one with your Supabase credentials."
    exit 1
fi

# Function to handle cleanup
cleanup() {
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "🏗️  Starting backend server..."
cd ../backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo "⏳ Waiting for backend to start..."
sleep 3

echo "🎨 Starting frontend server..."
cd client
npm run dev -- --port 3000 &
FRONTEND_PID=$!
cd ..

echo "⏳ Waiting for frontend to start..."
sleep 5

echo "✅ Services are running!"
echo ""
echo "🎉 Harvest Log App is now available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📱 On your home network, other devices can access it at:"
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I | cut -d' ' -f1)
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend: http://$LOCAL_IP:8000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait 