# Plant Journey API - Logging Implementation Summary

## 🚀 Overview
Comprehensive logging has been implemented across all Plant Journey API endpoints to provide detailed visibility into API operations, database interactions, and error tracking for the unified plant lifecycle management system.

## 📊 Logging Architecture

### 1. **Structured JSON Logging**
- **Configuration**: `app/logging_config.py`
- **Format**: JSON with structured fields for production, colored console for development
- **Loggers**: Separate loggers for API, Database, Middleware, and Application
- **Correlation**: Request ID tracking across all operations

### 2. **Middleware Logging**
- **File**: `app/middleware.py`
- **Features**:
  - Request/Response logging with timing
  - Performance monitoring (slow request detection)
  - Automatic request ID generation
  - Authentication context tracking
  - Error handling with stack traces

### 3. **Request Correlation**
- Every request gets a unique UUID (`request_id`)
- Passed through all layers: API → Database → Storage → Background Tasks
- Enables full tracing of requests across the entire plant journey system

## 🔍 API Endpoint Logging

### **Plant Events API** (`/api/v1/events`)

#### POST `/api/v1/events` - Create Plant Event
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Creating new plant event of type 'harvest'",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_type": "harvest",
  "plant_id": "plant_123",
  "user_id": "user_456"
}
```

#### GET `/api/v1/events` - List Plant Events
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO", 
  "logger": "plant_journey.api",
  "message": "API: Successfully retrieved 25 plant events",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_count": 25,
  "event_type_filter": "harvest",
  "plant_id_filter": "plant_123"
}
```

#### GET `/api/v1/events/{id}` - Get Specific Plant Event
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api", 
  "message": "API: Successfully retrieved plant event event_789",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": "event_789",
  "event_type": "bloom"
}
```

#### PUT `/api/v1/events/{id}` - Update Plant Event
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Successfully updated plant event event_789", 
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": "event_789",
  "event_type": "harvest",
  "fields_updated": ["quantity", "notes", "metrics"]
}
```

#### DELETE `/api/v1/events/{id}` - Delete Plant Event
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Successfully deleted plant event event_789",
  "request_id": "550e8400-e29b-41d4-a716-446655440000", 
  "event_id": "event_789",
  "event_type": "snapshot"
}
```

### **Plant Management API** (`/api/v1/plants`)

#### POST `/api/v1/plants` - Create Plant
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Created new plant 'Tomato Plant #1'",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "plant_id": "plant_123",
  "plant_name": "Tomato Plant #1",
  "variety_id": "variety_456"
}
```

#### GET `/api/v1/plants/{id}/events` - Get Plant Timeline
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Retrieved timeline for plant plant_123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "plant_id": "plant_123",
  "event_count": 12,
  "date_range": "2024-01-01 to 2024-01-15"
}
```

### **Plant Varieties API** (`/api/v1/plants/varieties`)

#### POST `/api/v1/plants/varieties` - Create Plant Variety
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Created new plant variety 'Cherry Tomato'",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "variety_id": "variety_789",
  "variety_name": "Cherry Tomato",
  "category": "vegetable"
}
```

### **Event Images API** (`/api/v1/events/{id}/images`)

#### POST `/api/v1/events/{event_id}/images` - Upload Event Images
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Image upload completed successfully",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": "event_123",
  "image_id": "img_456", 
  "filename": "harvest_photo.jpg",
  "file_size": 2048576,
  "compression_ratio": 0.75
}
```

#### GET `/api/v1/events/{event_id}/images` - Get Event Images
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Retrieved 3 images for event event_123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "event_id": "event_123",
  "image_count": 3
}
```

### **Weather API** (`/api/v1/weather`)

#### GET `/api/v1/weather` - Get Weather Data
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.api",
  "message": "API: Weather data retrieved successfully",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "date": "2024-01-15",
  "weather_code": 3
}
```

### **Health Check APIs**

#### GET `/health` - Health Check
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO", 
  "logger": "plant_journey.app",
  "message": "API: Health check completed successfully",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "database_status": "healthy",
  "cache_status": "healthy",
  "background_tasks_status": "healthy"
}
```

## 🗄️ Database Operation Logging

### **Database Layer** (`app/dependencies.py`)

All database operations are logged with:
- Operation type (SELECT, INSERT, UPDATE, DELETE)
- Table name (plant_events, plants, plant_varieties, event_images)
- Record IDs and counts
- Query execution time

#### Example Database Logs
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.database",
  "message": "Database operation completed successfully",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "INSERT",
  "table": "plant_events",
  "record_id": "event_123",
  "duration_ms": 45.67,
  "event_type": "harvest"
}
```

## 🔐 Authentication Logging

### **JWT Authentication** (`app/auth.py`)

Authentication events are tracked:
- Login attempts and results
- Token validation
- Role-based access checks
- Authentication failures

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.auth",
  "message": "User authenticated successfully",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "user_123",
  "role": "admin",
  "token_expiry": "2024-01-16T10:30:00Z"
}
```

## 🚨 Error Logging

### **Comprehensive Error Tracking**

All errors include:
- Error type and message
- Stack traces for debugging
- Request context
- User and operation details

#### Validation Errors
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "logger": "plant_journey.api",
  "message": "Validation failed for event creation",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "error_type": "ValidationError",
  "validation_errors": [
    {
      "field": "quantity",
      "message": "must be greater than 0"
    }
  ]
}
```

#### Database Errors
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "logger": "plant_journey.database",
  "message": "Database operation failed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "operation": "INSERT",
  "table": "plant_events",
  "error_type": "DatabaseError",
  "error_message": "Foreign key constraint violation"
}
```

## ⚡ Performance Logging

### **Request Performance Monitoring**

Performance metrics tracked:
- Request duration
- Slow request alerts
- Database query performance
- Cache hit/miss ratios

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "WARNING",
  "logger": "plant_journey.middleware",
  "message": "Slow request detected",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "url": "/api/v1/events",
  "duration_ms": 1500,
  "threshold_ms": 1000
}
```

## 🔧 Background Task Logging

### **Background Task Operations**

Background tasks are logged:
- Image processing
- Cache cleanup
- Weather data updates
- System maintenance

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "plant_journey.background",
  "message": "Image compression completed",
  "task_id": "task_123",
  "image_id": "img_456",
  "original_size": 5242880,
  "compressed_size": 1572864,
  "compression_ratio": 0.7
}
```

## 📊 Cache Logging

### **Cache Operations**

Cache performance is monitored:
- Cache hits and misses
- Cache evictions
- Performance metrics

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "DEBUG",
  "logger": "plant_journey.cache",
  "message": "Cache operation completed",
  "operation": "GET",
  "key": "plants:user_123",
  "hit": true,
  "ttl_remaining": 180
}
```

## 🎯 Event Type Specific Logging

### **Harvest Events**
```json
{
  "event_type": "harvest",
  "produce": "Tomatoes",
  "quantity": 5.5,
  "unit": "pounds",
  "weather_data": {"temperature": 72, "humidity": 65}
}
```

### **Bloom Events**
```json
{
  "event_type": "bloom",
  "flower_type": "Sunflower",
  "bloom_stage": "full_bloom",
  "metrics": {"bloom_count": 3, "diameter_cm": 12}
}
```

### **Snapshot Events**
```json
{
  "event_type": "snapshot",
  "metrics": {
    "height_cm": 45,
    "health_score": 8,
    "leaf_count": 24,
    "new_growth": true
  }
}
```

## 🛠 Configuration & Setup

### **Environment Variables for Logging**
```env
LOG_LEVEL=INFO                    # DEBUG, INFO, WARNING, ERROR, CRITICAL
JSON_LOGS=true                   # true for production, false for development
LOG_FILE=logs/plant-journey.log  # Optional: file output
SLOW_REQUEST_THRESHOLD=1000      # Milliseconds
```

### **Log Rotation**
- Automatic log file rotation
- Configurable retention policies
- Compression of old logs
- Size-based rotation limits

This comprehensive logging system provides full visibility into the Plant Journey API operations, enabling effective monitoring, debugging, and performance optimization. 