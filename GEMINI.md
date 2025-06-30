# GEMINI.md

This file provides guidance to me, Gemini, when working with the code in this repository.

## Development Commands

### Frontend (Next.js Client)

To work on the frontend, I will navigate to the `client` directory and use the following commands:

-   **Start development server:** `npm run dev` (on localhost:3000)
-   **Build for production:** `npm run build`
-   **Run linter:** `npm run lint`
-   **Start production server:** `npm start`

### Backend (FastAPI Python)

To work on the backend, I will navigate to the `backend` directory and use the following commands:

-   **Start development server:** `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080` (on localhost:8080)
-   **Run all tests:** `python -m pytest tests/`
-   **Run unit tests:** `python -m pytest tests/unit/`
-   **Run integration tests:** `python -m pytest tests/integration/`

### Full Stack Development

To run the full stack, I can use the provided scripts:

-   **Start both frontend and backend:** `./scripts/start-dev.sh`
-   **Deploy locally with Docker:** `./scripts/deploy-local.sh`

### Common URLs

-   **Frontend:** http://localhost:3000
-   **Backend API:** http://localhost:8080
-   **API Documentation:** http://localhost:8080/docs

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
- JWT-based authentication with role-based access control
- In-memory caching layer for performance optimization
- Background task management for image processing and cleanup
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
- `backend/app/auth.py` - JWT authentication and authorization utilities
- `backend/app/cache.py` - In-memory caching system with LRU eviction
- `backend/app/background_tasks.py` - Background task management and scheduling
- `backend/app/middleware.py` - Custom middleware for logging and authentication
- `backend/app/dependencies.py` - FastAPI dependency injection utilities
- `backend/app/validators.py` - Custom validation logic and decorators
- `backend/app/pagination.py` - API pagination utilities
- `backend/app/error_handlers.py` - Global error handling and custom exceptions
- `backend/app/health.py` - Health check endpoints and system monitoring
- `backend/app/versioning.py` - API versioning utilities

### Frontend
- `client/app/layout.tsx` - Root layout component
- `client/app/page.tsx` - Homepage with quick harvest entry form
- `client/app/gallery/page.tsx` - Gallery page with 4 viewing modes
- `client/app/photos/page.tsx` - Dedicated photo management page
- `client/lib/api.ts` - Centralized API client for backend communication
- `client/components/camera-capture.tsx` - Custom camera integration component
- `client/components/gallery/` - Gallery view components (timeline, crop-garden, photo-wall, data-insights)

### Configuration
- `backend/.env` - Backend environment variables (Supabase credentials)
- `client/.env.local` - Frontend environment variables (API base URL)
- `docker-compose.yml` - Multi-service containerization setup

## Authentication System

The application uses JWT-based authentication with role-based access control:

**Authentication Features**:
- JWT token-based authentication with Bearer token format
- Role-based access control (admin, user roles)
- Token validation middleware for protected endpoints
- Configurable token expiration (default: 24 hours)

**Key Components**:
- `backend/app/auth.py` - JWT authentication manager and middleware
- `backend/app/dependencies.py` - Authentication dependency injection
- `backend/app/middleware.py` - Request authentication middleware

**Usage**:
- Protected endpoints require `Authorization: Bearer <token>` header
- Use `get_current_user()` dependency for optional authentication
- Use `require_auth()` dependency for required authentication
- Use `require_role("admin")` for role-specific access

## Caching Layer

In-memory caching system for improved performance:

**Cache Features**:
- LRU (Least Recently Used) eviction policy
- Configurable TTL (Time-To-Live) for cache entries
- Thread-safe async operations
- Automatic cleanup of expired entries
- Cache statistics and monitoring

**Key Components**:
- `backend/app/cache.py` - Core caching implementation
- Global cache instance with 1000 entry limit
- Cache manager for harvest-specific data
- Background task for periodic cleanup

**Usage**:
- `@cached(ttl=300)` decorator for function caching
- Manual cache operations via `get_cache()`
- Harvest-specific caching via `cache_manager`

## Background Tasks

Background task management for long-running operations:

**Task Features**:
- Periodic task scheduling
- Image processing workflows
- Automatic cleanup operations
- Task monitoring and health checks
- Graceful startup/shutdown

**Key Components**:
- `backend/app/background_tasks.py` - Task manager and utilities
- Periodic cache cleanup (every 5 minutes)
- Image metadata processing
- Temporary file cleanup

**Task Types**:
- Image processing and metadata extraction
- Daily harvest summary generation
- Temporary file cleanup
- Cache maintenance

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

## Gallery Feature

The application includes a comprehensive gallery system for viewing and managing harvest photos across multiple viewing modes:

**Main Gallery Page** (`client/app/gallery/page.tsx`):
- Four distinct viewing modes with seamless switching
- Real-time search across crop names and notes
- Crop-specific filtering and sorting options
- Mobile-responsive design with touch-friendly interactions

**Gallery Viewing Modes**:

1. **Timeline Journey** (`client/components/gallery/timeline-view.tsx`)
   - Chronological harvest story with seasonal theming
   - Visual timeline with month-based organization
   - Seasonal color schemes and decorative elements

2. **Crop Garden** (`client/components/gallery/crop-garden-view.tsx`)
   - Organized by crop type with productivity analytics
   - Crop-specific statistics and yield tracking
   - Visual harvest summaries per crop category

3. **Photo Wall** (`client/components/gallery/photo-wall-view.tsx`)
   - Image-focused masonry layout display
   - Pinterest-style responsive grid
   - Optimized for photo browsing and exploration

4. **Data Insights** (`client/components/gallery/data-insights-view.tsx`)
   - Charts and analytics dashboard using Recharts
   - Harvest trends and productivity analysis
   - Interactive data visualization components

**Additional Photo Management**:
- **Photos Page** (`client/app/photos/page.tsx`) - Dedicated photo management interface
- **Image Lightbox** - Full-screen viewing with keyboard navigation
- **Favorite System** - Mark and filter favorite harvest photos
- **Metadata Display** - Image details, harvest context, and technical info
- **Bulk Operations** - Delete, download, and organize multiple photos

**Gallery Integration**:
- Seamless integration with harvest logs system
- Consistent theming and styling across all views
- Search and filter functionality across all modes
- Navigation accessible from harvests page header

## Testing Strategy

**Backend Tests** (in `backend/tests/`):
- `unit/` - Fast, isolated component tests
- `integration/` - Tests requiring external services
- `manual/` - Interactive testing tools

**Test Command**: `python -m pytest tests/` from backend directory

## Development Notes

- The application uses comprehensive request logging with unique IDs for debugging
- JWT authentication is implemented with Bearer tokens and role-based access control
- In-memory caching provides performance optimization with automatic cleanup
- Background tasks handle image processing and maintenance operations
- Image uploads support drag-and-drop with progress indicators
- Mobile-friendly responsive design optimized for phones and tablets
- Gallery feature provides multiple viewing modes with advanced photo management
- CORS is properly configured for frontend-backend communication
- All API inputs are validated using Pydantic models
- RLS policies protect user data at the database level
- Middleware provides request authentication and logging
- API pagination is available for large datasets
- Health check endpoints monitor system status and background tasks