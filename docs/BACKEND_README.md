# Plant Journey Backend API

A FastAPI backend for managing complete plant journey lifecycles with unified event tracking, built following modern Python best practices.

## 🌱 Overview

The Plant Journey API provides comprehensive plant lifecycle management through:
- **Unified Event System**: Harvest, bloom, and snapshot events in a single, flexible system
- **Plant Management**: Individual plant tracking with variety catalog
- **Weather Integration**: Automatic weather data collection using Open-Meteo API
- **Image Management**: Multi-image support with automatic compression
- **Production Ready**: JWT authentication, caching, background tasks, and monitoring

## 🚀 Features

### Core Functionality
- **Plant Journey Events**: Unified logging for harvest, bloom, and snapshot events
- **Plant Lifecycle Management**: Track individual plants from planting to harvest
- **Variety Catalog**: Comprehensive plant variety database with growing characteristics
- **Weather Data**: Automatic weather collection based on location and date
- **Image Processing**: Multi-image support with compression and metadata

### Technical Features
- **RESTful API**: Well-structured endpoints following REST conventions
- **Interactive Documentation**: Automatic OpenAPI documentation with Swagger UI
- **JWT Authentication**: Bearer token authentication with role-based access
- **Comprehensive Caching**: In-memory LRU cache for performance optimization
- **Background Tasks**: Async processing for image handling and cleanup
- **Request Logging**: Unique request IDs and comprehensive monitoring
- **Error Handling**: Proper HTTP status codes and structured error responses

## 📊 API Endpoints

### Plant Events
- `POST /api/v1/events` - Create plant events (harvest, bloom, snapshot)
- `GET /api/v1/events` - List events with filtering and pagination
- `GET /api/v1/events/{id}` - Get specific event details
- `PUT /api/v1/events/{id}` - Update event information
- `DELETE /api/v1/events/{id}` - Delete event

### Plant Management
- `POST /api/v1/plants` - Create new plant
- `GET /api/v1/plants` - List all plants with filtering
- `GET /api/v1/plants/{id}` - Get plant details
- `GET /api/v1/plants/{id}/events` - Get plant's event timeline
- `PUT /api/v1/plants/{id}` - Update plant information

### Plant Varieties
- `POST /api/v1/plants/varieties` - Create plant variety
- `GET /api/v1/plants/varieties` - List varieties with filtering
- `GET /api/v1/plants/varieties/{id}` - Get variety details

### Weather Data
- `GET /api/v1/weather` - Fetch weather data for date and location

### Event Images
- `POST /api/v1/events/{id}/images` - Upload event images
- `GET /api/v1/events/{id}/images` - Get event images
- `DELETE /api/v1/events/{id}/images/{image_id}` - Delete image

## 🛠 Installation & Setup

### Prerequisites
- Python 3.9+ 
- Supabase account and project
- Environment variables configured

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd plant-journey/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Environment Configuration
Create `.env` file in the backend directory:

```env
# Application Settings
APP_NAME="Plant Journey API"
APP_VERSION="1.0.0"
DEBUG=false

# Database Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_KEY=your_supabase_service_key_here

# Authentication
JWT_SECRET_KEY=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# API Configuration
API_VERSION=v1
HOST=0.0.0.0
PORT=8080

# CORS Configuration
CORS_ORIGINS=["https://your-frontend-url.com","http://localhost:3000"]
CORS_CREDENTIALS=true
CORS_METHODS=["GET","POST","PUT","DELETE","OPTIONS"]
CORS_HEADERS=["*"]

# Logging Configuration
LOG_LEVEL=INFO
JSON_LOGS=true
LOG_FILE=logs/plant-journey.log
SLOW_REQUEST_THRESHOLD=1000

# Caching Configuration
CACHE_TTL=300
CACHE_MAX_SIZE=1000

# Background Tasks
TASK_CLEANUP_INTERVAL=300
```

### Database Setup
Execute the migration files in your Supabase dashboard:

1. **Create Tables**: Run `migrations/setup_plant_journey.sql`
2. **Migrate Data** (if needed): Run `migrations/migrate_to_plant_journey.sql`

## 🏃 Running the Application

### Development Mode
```bash
# Start with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080

# Or use the entry point
python main.py
```

### Production Mode
```bash
# Start production server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --workers 4

# Or use Docker
docker build -t plant-journey-backend .
docker run -p 8080:8080 plant-journey-backend
```

### API Documentation
- **Swagger UI**: `http://localhost:8080/docs`
- **ReDoc**: `http://localhost:8080/redoc`
- **OpenAPI Schema**: `http://localhost:8080/openapi.json`

## 🧪 Testing

### Run Tests
```bash
# All tests
python -m pytest tests/

# Unit tests only
python -m pytest tests/unit/

# Integration tests only
python -m pytest tests/integration/

# With coverage
python -m pytest tests/ --cov=app --cov-report=html
```

### Test Structure
- **Unit Tests**: Fast, isolated component tests
- **Integration Tests**: Database and external service tests
- **Manual Tests**: Interactive testing tools

## 📈 Monitoring & Logging

### Request Tracking
Every request includes:
- Unique request ID for tracing
- Request/response logging with timing
- User context and operation details
- Error tracking with stack traces

### Performance Monitoring
- Slow request detection (configurable threshold)
- Cache hit/miss ratios
- Database query performance
- Background task monitoring

### Health Checks
- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- Database connectivity status
- Cache performance metrics
- Background task health

## 🔐 Authentication & Security

### JWT Authentication
- Bearer token authentication
- Role-based access control
- Configurable token expiration
- Secure password hashing

### Security Features
- CORS configuration
- Request rate limiting
- Input validation with Pydantic
- SQL injection prevention
- Secure error handling

## 🎯 Data Models

### Plant Events
Unified event model supporting:
- **Harvest Events**: Produce, quantity, quality metrics
- **Bloom Events**: Flower types, bloom stages, timing
- **Snapshot Events**: Growth measurements, health observations

### Plant Management
- **Plants**: Individual plant instances with lifecycle tracking
- **Varieties**: Plant variety catalog with growing characteristics
- **Images**: Multi-image support with compression and metadata

### Weather Integration
- Automatic weather data collection
- Historical weather lookup
- Location-based weather information
- Integration with Open-Meteo API

## 🔧 Configuration Options

### Logging Levels
- **DEBUG**: Detailed diagnostic information
- **INFO**: General operational messages
- **WARNING**: Important events requiring attention
- **ERROR**: Error conditions
- **CRITICAL**: Serious errors

### Cache Configuration
- **TTL**: Time-to-live for cache entries
- **Max Size**: Maximum number of cached items
- **Cleanup**: Automatic expired entry removal

### Background Tasks
- Image processing and compression
- Temporary file cleanup
- Cache maintenance
- Weather data updates

## 📦 Deployment

### Docker Deployment
```bash
# Build container
docker build -t plant-journey-backend .

# Run container
docker run -p 8080:8080 --env-file .env plant-journey-backend
```

### Cloud Deployment
- **Google Cloud Run**: Containerized deployment
- **Vercel**: Serverless deployment
- **AWS Lambda**: Serverless with Mangum adapter

### Environment Variables
Ensure all required environment variables are set:
- Database credentials
- Authentication secrets
- API configuration
- External service keys

## 🤝 Contributing

### Development Guidelines
- Follow Python PEP 8 style guide
- Use type hints for all functions
- Write comprehensive tests
- Update documentation for new features
- Use meaningful commit messages

### Code Organization
- Models in `plant_models.py`
- Routers organized by domain
- Utilities in dedicated modules
- Comprehensive error handling
- Proper logging throughout

This backend provides a robust foundation for plant journey management with production-ready features and comprehensive functionality. 