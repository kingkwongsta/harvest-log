# API Logging Implementation Summary

## 🚀 Overview
Comprehensive logging has been implemented across all API endpoints in the FastAPI backend to provide detailed visibility into API operations, database interactions, and error tracking.

## 📊 Logging Architecture

### 1. **Structured JSON Logging**
- **Configuration**: `app/logging_config.py`
- **Format**: JSON with structured fields
- **Loggers**: Separate loggers for API, Database, Middleware, and Application
- **Correlation**: Request ID tracking across all operations

### 2. **Middleware Logging**
- **File**: `app/middleware.py`
- **Features**:
  - Request/Response logging with timing
  - Performance monitoring (slow request detection)
  - Automatic request ID generation
  - Error handling with context

### 3. **Request Correlation**
- Every request gets a unique UUID (`request_id`)
- Passed through all layers: API → Database → Storage
- Enables tracing of requests across the entire stack

## 🔍 API Endpoint Logging

### **Harvest Logs API** (`/api/harvest-logs`)

#### POST `/api/harvest-logs/` - Create Harvest Log
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Creating new harvest log for crop 'Tomatoes'",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "crop_name": "Tomatoes",
  "quantity": 5.0
}
```

#### GET `/api/harvest-logs/` - List All Harvest Logs
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO", 
  "logger": "harvest_log.api",
  "message": "API: Successfully retrieved 15 harvest logs",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "record_count": 15
}
```

#### GET `/api/harvest-logs/{id}` - Get Specific Harvest Log
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api", 
  "message": "API: Successfully retrieved harvest log 123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "record_id": "123"
}
```

#### PUT `/api/harvest-logs/{id}` - Update Harvest Log
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Successfully updated harvest log 123", 
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "record_id": "123",
  "fields_updated": ["quantity", "notes"]
}
```

#### DELETE `/api/harvest-logs/{id}` - Delete Harvest Log
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Successfully deleted harvest log 123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000", 
  "record_id": "123"
}
```

### **Images API** (`/api/images`)

#### POST `/api/images/upload/{harvest_log_id}` - Upload Image
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Image upload completed successfully - ID: img_123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "record_id": "img_123",
  "harvest_log_id": "log_456", 
  "filename": "tomato_harvest.jpg",
  "file_size": 2048576
}
```

#### POST `/api/images/upload-multiple/{harvest_log_id}` - Upload Multiple Images
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api", 
  "message": "API: Multiple upload completed - 3 success, 0 failed",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "harvest_log_id": "log_456",
  "total_uploaded": 3,
  "total_failed": 0
}
```

#### GET `/api/images/harvest/{harvest_log_id}` - Get Images for Harvest
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Retrieved 3 images for harvest log log_456",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "harvest_log_id": "log_456",
  "image_count": 3
}
```

#### DELETE `/api/images/{image_id}` - Delete Image
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Successfully deleted harvest image img_123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "record_id": "img_123",
  "file_path": "harvest_images/img_123.jpg"
}
```

### **Statistics API**

#### GET `/api/harvest-stats` - Get Harvest Statistics
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.api",
  "message": "API: Successfully retrieved harvest stats",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_harvests": 150,
  "this_month": 12,
  "this_week": 3
}
```

### **Health Check APIs**

#### GET `/` - Basic Health Check
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.app",
  "message": "API: Basic health check requested",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### GET `/health` - Detailed Health Check
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO", 
  "logger": "harvest_log.app",
  "message": "API: Detailed health check completed successfully",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "supabase_configured": true,
  "debug_mode": false
}
```

## 🗄️ Database Operation Logging

### **Database Layer** (`app/dependencies.py`)

All database operations are logged with:
- Operation type (SELECT, INSERT, UPDATE, DELETE)
- Table name
- Record IDs
- Row counts
- Execution timing
- Error details

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.database", 
  "message": "DB: ✓ Successfully created harvest log with ID: 123",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "record_id": "123",
  "table": "harvest_logs",
  "crop_name": "Tomatoes"
}
```

## 🔧 Middleware Logging

### **Request/Response Logging**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "INFO",
  "logger": "harvest_log.middleware",
  "message": "Request completed: POST /api/harvest-logs/ - 201",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "POST",
  "url": "/api/harvest-logs/",
  "status_code": 201,
  "duration_ms": 1250.45
}
```

### **Performance Monitoring**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "WARNING",
  "logger": "harvest_log.middleware",
  "message": "Slow request detected: GET /api/harvest-logs/ took 2500ms",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET", 
  "url": "/api/harvest-logs/",
  "duration_ms": 2500.0,
  "slow_request": true
}
```

## 🚨 Error Logging

### **API Errors**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "logger": "harvest_log.api",
  "message": "API: Failed to create harvest log: Invalid data format",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "crop_name": "Tomatoes",
  "exception": "ValidationError: Field 'quantity' must be positive"
}
```

### **Database Errors**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "logger": "harvest_log.database",
  "message": "DB: Database error creating harvest log: Connection timeout",
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "db_operation": "insert",
  "table": "harvest_logs",
  "crop_name": "Tomatoes",
  "exception": "psycopg2.OperationalError: Connection timeout"
}
```

## 📈 Log Levels Used

- **DEBUG**: Detailed execution flow, SQL queries, internal operations
- **INFO**: Successful operations, request completion, statistics
- **WARNING**: Slow requests, missing data, non-critical issues  
- **ERROR**: Failed operations, exceptions, validation errors
- **CRITICAL**: System failures, startup/shutdown issues

## 🔍 Searchable Fields

All logs include structured fields for easy searching and filtering:

- `request_id`: Unique identifier for request correlation
- `method`: HTTP method (GET, POST, PUT, DELETE)
- `url`: Request URL/endpoint
- `status_code`: HTTP response status
- `duration_ms`: Request processing time
- `table`: Database table being accessed
- `db_operation`: Type of database operation
- `record_id`: Specific record identifier
- `crop_name`: Harvest crop name (for harvest logs)
- `file_size`: Image file size (for uploads)
- `image_count`: Number of images (for bulk operations)

## 🛠️ Configuration

Logging is configured in `app/config.py` with environment variables:
- `LOG_LEVEL`: Controls verbosity (DEBUG, INFO, WARNING, ERROR)
- `JSON_LOGS`: Enable/disable JSON formatting
- `LOG_FILE`: Optional file output path
- `SLOW_REQUEST_THRESHOLD`: Milliseconds to flag slow requests

## 📊 Benefits

1. **Request Tracing**: Follow requests end-to-end with request IDs
2. **Performance Monitoring**: Identify slow endpoints and database queries
3. **Error Debugging**: Detailed error context with stack traces
4. **Usage Analytics**: Track API usage patterns and statistics
5. **Operational Visibility**: Monitor system health and performance
6. **Compliance**: Audit trail for all data operations

This comprehensive logging implementation provides full visibility into your FastAPI harvest log application, enabling effective monitoring, debugging, and optimization. 