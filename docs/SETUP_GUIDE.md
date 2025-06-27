# Frontend-Backend Connection Setup Guide

This guide will help you connect your Next.js frontend to your FastAPI backend for logging harvest data.

## Prerequisites

1. **Backend (FastAPI)** - Running on `http://localhost:8000`
2. **Frontend (Next.js)** - Running on `http://localhost:3000`
3. **Database** - Supabase configured with proper environment variables

## Setup Steps

### 1. Backend Setup

Navigate to the `backend` directory and ensure your backend is running:

```bash
cd backend
# Make sure you have your .env file with Supabase credentials
source venv/bin/activate  # or however you activate your Python environment
fastapi dev app/main.py
```

The backend should be accessible at `http://localhost:8000`. You can verify by visiting:
- `http://localhost:8000/docs` - API documentation
- `http://localhost:8000/health` - Health check

### 2. Frontend Environment Setup

In the `client` directory, create a `.env.local` file:

```bash
cd client
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
```

### 3. Install Dependencies and Start Frontend

```bash
cd client
npm install  # if not already done
npm run dev
```

The frontend should be accessible at `http://localhost:3000`.

## Testing the Connection

### 1. Test API Endpoints

First, verify your backend API is working by testing directly:

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test creating a harvest log
curl -X POST "http://localhost:8000/api/harvest-logs/" \
     -H "Content-Type: application/json" \
     -d '{
       "crop_name": "Test Tomatoes",
       "quantity": 5.0,
       "unit": "pounds",
       "harvest_date": "2024-01-15T10:30:00",
       "location": "Test Garden",
       "notes": "Test harvest entry"
     }'

# Test getting all harvest logs
curl http://localhost:8000/api/harvest-logs/
```

### 2. Test Frontend Form

1. Go to `http://localhost:3000/harvests/new`
2. Fill out the form with test data:
   - Fruit Type: Select any fruit
   - Quantity: Enter a number (e.g., 5)
   - Unit: Select a unit (defaults to "pieces")
   - Date: Should default to today
   - Location: Optional
   - Notes: Optional
3. Click "Save Harvest"

If successful, you should be redirected to the harvests page and see your entry.

### 3. Test Harvest List

1. Go to `http://localhost:3000/harvests`
2. You should see any harvest logs you've created
3. The page will show a loading state while fetching data from the API

## What Changed

### Frontend Changes:

1. **Created `client/lib/api.ts`** - API client with typed interfaces matching your backend
2. **Updated `client/app/harvests/new/page.tsx`** - Form now submits to real API instead of simulating
3. **Updated `client/app/harvests/page.tsx`** - Now fetches real data from API instead of using static data
4. **Added error handling** - Both forms show errors if API calls fail
5. **Added loading states** - Better UX while waiting for API responses

### API Integration Features:

- ✅ Form validation matching backend requirements
- ✅ Proper TypeScript interfaces
- ✅ Error handling with user-friendly messages
- ✅ Loading states and feedback
- ✅ CORS support (backend already configured for localhost:3000)

## Troubleshooting

### Common Issues:

1. **Connection refused**: Make sure backend is running on port 8000
2. **CORS errors**: Backend is already configured for localhost:3000
3. **422 validation errors**: Check that required fields (crop_name, quantity, unit, harvest_date) are provided
4. **Environment variables**: Make sure `.env.local` exists in client directory

### Backend Logs:
Check your FastAPI logs for any errors when submitting forms.

### Network Tab:
Open browser dev tools → Network tab to see if API calls are being made and what responses you're getting.

## Next Steps

Once the basic connection is working, you can:

1. Add photo upload functionality
2. Implement harvest log editing/deletion
3. Add user authentication
4. Deploy to production environments

The foundation is now in place for a fully functional harvest logging system! 