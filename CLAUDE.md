# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js Client)
```bash
cd client
npm run dev      # Start development server on localhost:3000
npm run build    # Build for production
npm run lint     # Run ESLint code quality checks
npm start        # Start production server
```

### Backend (FastAPI Python)
```bash
cd backend
python -m uvicorn app.main:app --reload  # Start development server on localhost:8000
python -m pytest tests/                  # Run all tests
python -m pytest tests/unit/             # Run unit tests only
python -m pytest tests/integration/      # Run integration tests only
```

### Full Stack Development
```bash
./scripts/start-dev.sh    # Start both frontend and backend concurrently
./scripts/deploy-local.sh # Local Docker deployment
```

### Common URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Architecture Overview

This is a modern full-stack harvest logging application with separated frontend and backend:

**Frontend**: Next.js 15 with App Router, React 19, TypeScript, and Tailwind CSS
- Located in `client/` directory
- Uses Radix UI for accessible components
- Recharts for data visualization
- Browser-image-compression for client-side image optimization

**Backend**: FastAPI with Python, Supabase PostgreSQL, and Supabase Storage
- Located in `backend/` directory  
- Uses Pydantic v2 for data validation
- Comprehensive logging with unique request IDs
- Image processing with Pillow

**Database**: Supabase PostgreSQL with Row Level Security (RLS)
- Schema defined in `backend/setup_supabase.sql`
- Harvest logs and image metadata tables
- RLS policies for data protection

## Key Files and Entry Points

### Backend
- `backend/app/main.py` - FastAPI application entry point with middleware and routes
- `backend/app/models.py` - Pydantic data models for API validation
- `backend/app/database.py` - Supabase client and database operations
- `backend/app/routers/harvest_logs.py` - CRUD operations for harvest data
- `backend/app/routers/images.py` - Image upload and management endpoints
- `backend/app/config.py` - Environment-based configuration

### Frontend
- `client/app/layout.tsx` - Root layout component
- `client/app/page.tsx` - Homepage with quick harvest entry form
- `client/lib/api.ts` - Centralized API client for backend communication
- `client/components/camera-capture.tsx` - Custom camera integration component

### Configuration
- `backend/.env` - Backend environment variables (Supabase credentials)
- `client/.env.local` - Frontend environment variables (API base URL)
- `docker-compose.yml` - Multi-service containerization setup

## Data Models

**Harvest Log**:
- Basic fields: crop_name, quantity, unit, harvest_date
- Location: GPS coordinates or text description  
- Conditions: weather, soil_conditions, notes
- Images: Multiple photos with automatic compression

**Image Management**:
- Automatic compression and optimization
- Supabase Storage with CDN delivery
- Metadata tracking (file size, dimensions, compression ratios)

## Testing Strategy

**Backend Tests** (in `backend/tests/`):
- `unit/` - Fast, isolated component tests
- `integration/` - Tests requiring external services
- `manual/` - Interactive testing tools

**Test Command**: `python -m pytest tests/` from backend directory

## Development Notes

- The application uses comprehensive request logging with unique IDs for debugging
- Image uploads support drag-and-drop with progress indicators
- Mobile-friendly responsive design optimized for phones and tablets
- CORS is properly configured for frontend-backend communication
- All API inputs are validated using Pydantic models
- RLS policies protect user data at the database level