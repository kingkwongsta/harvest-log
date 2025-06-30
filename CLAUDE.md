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
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080  # Start development server on localhost:8080
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
- Backend API: http://localhost:8080
- API Documentation: http://localhost:8080/docs

## Architecture Overview

This is a modern full-stack plant journey management application with separated frontend and backend:

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
- Plant journey system with events, plants, varieties, and images
- Weather data integration with Open-Meteo API
- Flexible JSONB storage for metrics and weather data
- RLS policies for data protection

## Key Files and Entry Points

### Backend
- `backend/app/main.py` - FastAPI application entry point with middleware and routes
- `backend/app/models.py` - Legacy Pydantic data models (deprecated)
- `backend/app/plant_models.py` - New unified plant journey models and validation
- `backend/app/database.py` - Supabase client and database operations
- `backend/app/routers/events.py` - Unified event management (harvest, bloom, snapshot)
- `backend/app/routers/plants.py` - Plant and variety management endpoints
- `backend/app/routers/weather.py` - Weather data integration with Open-Meteo API
- `backend/app/routers/harvest_logs.py` - Legacy harvest endpoints (deprecated)
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
- `client/app/page.tsx` - Homepage with plant journey overview and quick event entry
- `client/app/admin/page.tsx` - Comprehensive admin panel for data management
- `client/app/gallery/page.tsx` - Gallery page with 4 viewing modes for all event types
- `client/app/photos/page.tsx` - Dedicated photo management page
- `client/lib/api.ts` - Centralized API client for backend communication
- `client/components/camera-capture.tsx` - Custom camera integration component
- `client/components/event-logging-modal.tsx` - Unified event creation modal
- `client/components/event-forms/` - Modular event type forms:
  - `harvest-form.tsx` - Harvest event specific form
  - `bloom-form.tsx` - Bloom event specific form
  - `snapshot-form.tsx` - Snapshot event specific form
- `client/components/dialogs/event-confirmation-dialog.tsx` - Event confirmation dialog
- `client/components/gallery/` - Gallery view components (timeline, crop-garden, photo-wall, data-insights)

### Configuration
- `backend/.env` - Backend environment variables (Supabase credentials)
- `client/.env.local` - Frontend environment variables (API base URL)
- `docker-compose.yml` - Multi-service containerization setup

## Plant Journey System

The application has evolved from simple harvest logging to a comprehensive plant journey management system that tracks the complete lifecycle of plants from planting to harvest.

**Core Concepts**:

1. **Plants**: Individual plant instances with variety information and lifecycle tracking
   - Each plant belongs to a specific variety (e.g., "Cherry Tomato", "Basil Genovese")
   - Plants can have multiple events throughout their lifecycle
   - Geolocation support for tracking plant locations

2. **Plant Varieties**: Standardized plant types and cultivars
   - Hierarchical organization with plant types and specific varieties
   - Extensible system for adding new plant varieties
   - Variety-specific information and growing characteristics

3. **Events**: Three types of events that can be logged for plants
   - **Harvest Events**: Recording yields, quantities, and harvest conditions
   - **Bloom Events**: Tracking flowering stages and bloom characteristics
   - **Snapshot Events**: General observations, photos, and plant status updates

4. **Weather Integration**: Automatic weather data collection
   - Integration with Open-Meteo API for historical weather data
   - Automatic weather recording for all events based on date and location
   - Weather context for analyzing plant performance and conditions

**Event System Architecture**:

- **Unified Event Storage**: All event types stored in a single `plant_events` table
- **Type-Specific Fields**: Flexible JSONB storage for event-type specific data
- **Metrics Storage**: Extensible JSONB field for various measurements and observations
- **Image Association**: Multiple images can be attached to any event type
- **Geolocation**: GPS coordinates captured and stored for location context

**API Endpoints**:

- `/api/v1/plants/` - Plant CRUD operations and lifecycle management
- `/api/v1/events/` - Unified event creation, retrieval, and management
- `/api/v1/weather/` - Weather data fetching and historical lookup
- `/api/v1/varieties/` - Plant variety management and standardization

**Admin Panel Features**:

The application includes a comprehensive admin panel (`/admin`) for data management:
- Event statistics and analytics across all event types
- Plant and variety management
- Data export capabilities
- System health monitoring
- User management and role assignment

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

The application uses a unified event system with the following core models:

**Plant Models** (`backend/app/plant_models.py`):

1. **PlantVariety**: Standardized plant types and cultivars
   - `id`, `plant_type`, `variety_name`, `description`
   - Hierarchical organization for plant classification

2. **Plant**: Individual plant instances
   - `id`, `variety_id`, `nickname`, `planting_date`
   - `location` (GPS coordinates), `user_id`
   - Links to a specific plant variety

3. **PlantEvent**: Unified event storage for all event types
   - `id`, `plant_id`, `event_type` (harvest/bloom/snapshot)
   - `event_date`, `location`, `notes`, `user_id`
   - `metrics` (JSONB) - Flexible storage for measurements
   - `weather_data` (JSONB) - Automatic weather information
   - Type-specific fields for harvest, bloom, and snapshot data

4. **EventImage**: Image metadata and associations
   - `id`, `event_id`, `image_url`, `file_size`
   - `compression_ratio`, `original_filename`
   - Links images to specific events

**Event Types**:

- **Harvest Events**: `quantity`, `unit`, `quality_rating`, harvest-specific metrics
- **Bloom Events**: `bloom_stage`, `flower_count`, bloom characteristics
- **Snapshot Events**: General observations, growth measurements, status updates

**Legacy Models** (`backend/app/models.py` - deprecated):
- Original harvest-only data models maintained for backward compatibility

**Image Management**:
- Automatic compression and optimization
- Supabase Storage with CDN delivery
- Metadata tracking (file size, dimensions, compression ratios)
- Multi-image support for all event types

## Weather Integration

The application automatically fetches and stores weather data for all events using the Open-Meteo API:

**Weather Features**:
- **Automatic Fetching**: Weather data automatically retrieved based on event date and location
- **Historical Data**: Access to historical weather information for past events
- **Comprehensive Metrics**: Temperature, humidity, precipitation, wind, and atmospheric pressure
- **Location-Based**: Weather data specific to the GPS coordinates of each event
- **JSONB Storage**: Flexible storage format for weather data in the database

**Weather Data Structure**:
```json
{
  "temperature_2m": 22.5,
  "relative_humidity_2m": 65,
  "precipitation": 0.0,
  "wind_speed_10m": 8.2,
  "surface_pressure": 1013.2,
  "weather_description": "Partly cloudy"
}
```

**API Integration** (`backend/app/routers/weather.py`):
- `GET /api/v1/weather/` - Fetch weather data for specific date and coordinates
- Automatic integration with event creation workflows
- Caching layer for improved performance
- Error handling for weather service unavailability

**Usage in Events**:
- Weather data automatically attached to all new events
- Stored in the `weather_data` JSONB field of `PlantEvent`
- Used for analytics and environmental correlation analysis
- Helps track plant performance under different weather conditions

## Gallery Feature

The application includes a comprehensive gallery system for viewing and managing photos from all event types (harvest, bloom, snapshot) across multiple viewing modes:

**Main Gallery Page** (`client/app/gallery/page.tsx`):
- Four distinct viewing modes with seamless switching
- Support for all event types (harvest, bloom, snapshot)
- Real-time search across plant varieties, event types, and notes
- Plant and event-specific filtering and sorting options
- Mobile-responsive design with touch-friendly interactions

**Gallery Viewing Modes**:

1. **Timeline Journey** (`client/components/gallery/timeline-view.tsx`)
   - Chronological harvest story with seasonal theming
   - Visual timeline with month-based organization
   - Seasonal color schemes and decorative elements

2. **Plant Garden** (`client/components/gallery/crop-garden-view.tsx`)
   - Organized by plant variety with lifecycle analytics
   - Plant-specific statistics across all event types
   - Visual event summaries per plant variety and lifecycle stage

3. **Photo Wall** (`client/components/gallery/photo-wall-view.tsx`)
   - Image-focused masonry layout display
   - Pinterest-style responsive grid
   - Optimized for photo browsing and exploration

4. **Data Insights** (`client/components/gallery/data-insights-view.tsx`)
   - Charts and analytics dashboard using Recharts
   - Multi-event type trends and plant lifecycle analysis
   - Weather correlation analytics and environmental insights
   - Interactive data visualization components with event filtering

**Additional Photo Management**:
- **Photos Page** (`client/app/photos/page.tsx`) - Dedicated photo management interface
- **Image Lightbox** - Full-screen viewing with keyboard navigation
- **Favorite System** - Mark and filter favorite photos from any event type
- **Metadata Display** - Image details, event context, weather data, and technical info
- **Bulk Operations** - Delete, download, and organize multiple photos
- **Event Context** - View photos with associated event data and plant information

**Gallery Integration**:
- Seamless integration with unified plant journey system
- Support for all event types with consistent theming
- Advanced search and filter functionality across all modes
- Navigation accessible from main dashboard and event pages
- Weather data integration in photo context and analytics

## Testing Strategy

**Backend Tests** (in `backend/tests/`):
- `unit/` - Fast, isolated component tests
- `integration/` - Tests requiring external services
- `manual/` - Interactive testing tools

**Test Command**: `python -m pytest tests/` from backend directory

## Development Notes

- **Plant Journey System**: Comprehensive lifecycle tracking from planting to harvest
- **Unified Event Architecture**: Single table storage for harvest, bloom, and snapshot events
- **Weather Integration**: Automatic weather data collection using Open-Meteo API
- **Flexible Data Storage**: JSONB fields for extensible metrics and weather data
- **Geolocation Support**: GPS coordinate capture and storage for all events
- **Admin Panel**: Comprehensive data management and analytics dashboard
- **Legacy Compatibility**: Backward compatibility maintained for original harvest system
- **Multi-Event Gallery**: Gallery system supports all event types with advanced filtering
- **Plant Variety Management**: Standardized plant classification and variety tracking
- **Request Logging**: Comprehensive logging with unique IDs for debugging
- **JWT Authentication**: Bearer tokens with role-based access control
- **Performance Optimization**: In-memory caching with automatic cleanup
- **Background Tasks**: Image processing, weather data, and maintenance operations
- **Mobile-Responsive**: Optimized design for phones and tablets
- **CORS Configuration**: Proper frontend-backend communication setup
- **Data Validation**: Pydantic models for all API inputs
- **Database Security**: RLS policies protect user data at database level
- **API Pagination**: Available for large datasets
- **Health Monitoring**: System status and background task monitoring