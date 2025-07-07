# Backend Structure Guide

This document outlines the organized structure of the Plant Journey API backend.

## 📁 Directory Structure

```
backend/
├── app/                       # Core application code
│   ├── __init__.py
│   ├── main.py               # FastAPI application entry point
│   ├── config.py             # Application configuration
│   ├── database.py           # Database connection and setup
│   ├── dependencies.py       # Dependency injection
│   ├── logging_config.py     # Logging configuration
│   ├── middleware.py         # Custom middleware
│   ├── plant_models.py       # Plant journey Pydantic models
│   ├── storage.py            # File storage service
│   ├── auth.py               # JWT authentication
│   ├── cache.py              # In-memory caching
│   ├── background_tasks.py   # Background task management
│   ├── error_handlers.py     # Global error handling
│   ├── exceptions.py         # Custom exceptions
│   ├── geocoding.py          # Location services
│   ├── health.py             # Health check endpoints
│   ├── pagination.py         # API pagination utilities
│   ├── validators.py         # Custom validation logic
│   ├── versioning.py         # API versioning
│   ├── weather.py            # Weather API integration
│   └── routers/              # API route handlers
│       ├── __init__.py
│       ├── events.py         # Plant event CRUD (harvest, bloom, snapshot)
│       ├── plants.py         # Plant and variety management
│       ├── weather.py        # Weather data endpoints
│       └── event_images.py   # Event image management
├── tests/                    # Comprehensive test suite
│   ├── __init__.py
│   ├── unit/                 # Fast, isolated unit tests
│   │   ├── __init__.py
│   │   └── test_logging.py
│   ├── integration/          # Tests requiring external dependencies
│   │   ├── __init__.py
│   │   ├── test_api_endpoints.py
│   │   ├── test_image_upload.py
│   │   └── test_real_image_upload.py
│   └── manual/               # Manual testing tools
│       ├── __init__.py
│       └── test_frontend_integration.html
├── migrations/               # Database schema migrations
│   ├── setup_plant_journey.sql
│   ├── migrate_to_plant_journey.sql
│   └── *.sql                # Additional migration files
├── scripts/                  # Utility scripts
│   └── setup_migration.py   # Database setup script
├── main.py                   # Application entry point
├── requirements.txt          # Python dependencies
├── Dockerfile               # Container configuration
└── README.md               # Main backend documentation
```

## 🎯 Organization Principles

### Core Application (`app/`)
- **Models**: `plant_models.py` contains unified Pydantic models for the plant journey system
- **Routers**: API endpoints organized by domain (events, plants, weather, images)
- **Services**: Separate concerns for auth, caching, storage, and background tasks
- **Utilities**: Common functionality like pagination, validation, and error handling

### API Architecture
- **Unified Events**: Single endpoint handles harvest, bloom, and snapshot events
- **Plant Management**: Complete CRUD for plants and varieties
- **Weather Integration**: Automatic weather data collection using Open-Meteo API
- **Image Management**: Multi-image support for all event types

### Authentication & Security
- **JWT-based**: Bearer token authentication with role-based access
- **Middleware**: Request logging, authentication, and performance monitoring
- **Error Handling**: Comprehensive error responses with proper HTTP status codes

### Performance & Caching
- **In-memory Cache**: LRU cache for frequently accessed data
- **Background Tasks**: Async processing for image handling and cleanup
- **Pagination**: Cursor-based pagination for large datasets

## 🚀 Running the Application

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Or use the entry point
python main.py
```

### Testing
```bash
# Run all tests
python -m pytest tests/

# Run specific test categories
python -m pytest tests/unit/       # Unit tests only
python -m pytest tests/integration/ # Integration tests only

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Database Setup
```bash
# Execute migration files in Supabase dashboard
# 1. setup_plant_journey.sql
# 2. migrate_to_plant_journey.sql (if migrating from legacy system)
```

## 📝 Key Components

### Plant Journey System
- **Events**: Unified logging for harvest, bloom, and snapshot events
- **Plants**: Individual plant tracking with lifecycle management
- **Varieties**: Plant variety catalog with growing characteristics
- **Images**: Multi-image support with automatic compression

### API Endpoints
- `POST /api/v1/events` - Create plant events
- `GET /api/v1/events` - List events with filtering
- `GET /api/v1/plants` - Plant management
- `GET /api/v1/plants/varieties` - Variety catalog
- `GET /api/v1/weather` - Weather data integration

### Data Models
- **PlantEvent**: Unified event with type-specific validation
- **Plant**: Individual plant instances with variety reference
- **PlantVariety**: Plant types with growing information
- **EventImage**: Image metadata with compression details

## 🔧 Configuration

### Environment Variables
```env
# Application
APP_NAME="Plant Journey API"
APP_VERSION="1.0.0"
DEBUG=false

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key

# Authentication
JWT_SECRET_KEY=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Logging
LOG_LEVEL=INFO
JSON_LOGS=true
SLOW_REQUEST_THRESHOLD=1000

# CORS
CORS_ORIGINS=["https://your-frontend-url.com"]
```

## 🛠 Development Guidelines

### Code Organization
- Keep models in `plant_models.py`
- Organize routers by domain (events, plants, weather)
- Use dependency injection for database and authentication
- Implement proper error handling with custom exceptions

### Testing Strategy
- Unit tests for business logic
- Integration tests for database operations
- Manual tests for complex workflows
- Cover all API endpoints and edge cases

### Performance Considerations
- Use caching for frequently accessed data
- Implement pagination for large datasets
- Background tasks for heavy operations
- Monitor slow requests and optimize

## 📊 Monitoring & Logging

### Request Tracking
- Unique request IDs for tracing
- Comprehensive request/response logging
- Performance metrics and slow request alerts
- Error tracking with context information

### Health Checks
- `/health` endpoint with system status
- Database connection monitoring
- Background task health checks
- Cache performance metrics

This structure supports a production-ready plant journey management system with comprehensive features for tracking plant lifecycles, events, and analytics. 