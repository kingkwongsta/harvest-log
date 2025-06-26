# Harvest Log Backend

A FastAPI backend for managing harvest logs and garden data, built following official FastAPI best practices.

## Features

- **Harvest Log Management**: Complete CRUD operations for harvest logs
- **RESTful API**: Well-structured endpoints following REST conventions
- **Interactive Documentation**: Automatic API documentation with Swagger UI
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration
- **Data Validation**: Comprehensive Pydantic models with validation
- **Modular Architecture**: Organized codebase following FastAPI best practices
- **Testing**: Comprehensive test suite with pytest
- **Configuration Management**: Environment-based configuration
- **Error Handling**: Proper HTTP status codes and error responses

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application factory
│   ├── config.py            # Application configuration
│   ├── models.py            # Pydantic models
│   ├── dependencies.py      # Dependency injection
│   └── routers/
│       ├── __init__.py
│       └── harvest_logs.py  # Harvest logs endpoints
├── tests/
│   ├── __init__.py
│   └── test_harvest_logs.py # Test suite
├── main.py                  # Application entry point
├── requirements.txt         # Dependencies
└── README.md               # This file
```

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd harvest-log/backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Development Mode (Recommended)

```bash
fastapi dev app/main.py
```

### Alternative Development Mode

```bash
python main.py
```

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## Configuration

The application uses environment-based configuration. Create a `.env` file in the backend directory:

```env
# Application Settings
APP_NAME="Harvest Log API"
APP_VERSION="1.0.0"
DEBUG=true

# Server Configuration
HOST="0.0.0.0"
PORT=8000

# CORS Configuration
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]

# Database Configuration (for future use)
DATABASE_URL="sqlite:///./harvest_log.db"

# Security Configuration (for future use)
SECRET_KEY="your-secret-key-change-this-in-production"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## API Documentation

Once the server is running, you can access:

- **Interactive API Documentation (Swagger UI)**: `http://localhost:8000/docs`
- **Alternative API Documentation (ReDoc)**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

## API Endpoints

### Health Check

- `GET /` - Basic health check
- `GET /health` - Detailed health check

### Harvest Logs

- `GET /api/harvest-logs` - Get all harvest logs
- `POST /api/harvest-logs` - Create a new harvest log
- `GET /api/harvest-logs/{id}` - Get a specific harvest log
- `PUT /api/harvest-logs/{id}` - Update a harvest log
- `DELETE /api/harvest-logs/{id}` - Delete a harvest log

### Example Requests

#### Create a harvest log
```bash
curl -X POST "http://localhost:8000/api/harvest-logs/" \
     -H "Content-Type: application/json" \
     -d '{
       "crop_name": "Tomatoes",
       "quantity": 5.5,
       "unit": "pounds",
       "harvest_date": "2024-01-15T10:30:00",
       "location": "Garden Bed A",
       "notes": "First harvest of the season"
     }'
```

#### Get all harvest logs
```bash
curl -X GET "http://localhost:8000/api/harvest-logs/"
```

## Testing

Run the test suite with pytest:

```bash
# Run all tests
pytest

# Run tests with coverage
pytest --cov=app

# Run tests with verbose output
pytest -v
```

## Data Models

### HarvestLog (Complete Model)

- `id`: UUID - Unique identifier (auto-generated)
- `crop_name`: str - Name of the crop harvested (1-100 chars)
- `quantity`: float - Amount harvested (must be > 0)
- `unit`: str - Unit of measurement (1-50 chars)
- `harvest_date`: datetime - Date and time of harvest
- `location`: str (optional) - Location where crop was harvested (max 200 chars)
- `notes`: str (optional) - Additional notes (max 1000 chars)
- `created_at`: datetime - Timestamp when record was created (auto-generated)
- `updated_at`: datetime - Timestamp when record was last updated (auto-generated)

### HarvestLogCreate (Input Model)

Used for creating new harvest logs - includes all base fields without ID and timestamps.

### HarvestLogUpdate (Update Model)

Used for updating existing harvest logs - all fields are optional.

## Architecture Benefits

This improved architecture provides:

1. **Separation of Concerns**: Models, routing, configuration, and dependencies are separated
2. **Dependency Injection**: Proper use of FastAPI's dependency system
3. **Type Safety**: Full type hints and validation with Pydantic
4. **Testability**: Modular design enables comprehensive testing
5. **Scalability**: Easy to add new features and endpoints
6. **Maintainability**: Clear structure and documentation
7. **Configuration Management**: Environment-based settings
8. **Error Handling**: Proper HTTP status codes and error responses

## Future Enhancements

Planned improvements include:
- Database integration (SQLAlchemy with SQLite/PostgreSQL)
- User authentication and authorization (JWT tokens)
- Advanced querying and filtering
- Data export capabilities (CSV, Excel)
- Image upload for harvest photos
- Harvest analytics and reporting
- API rate limiting
- Logging and monitoring
- Docker containerization

## Technology Stack

- **FastAPI 0.115.0**: Modern, fast web framework for Python
- **Pydantic 2.9.2**: Data validation using Python type annotations
- **Uvicorn**: ASGI server for running the application
- **Pytest**: Testing framework
- **Python 3.8+**: Programming language

## Contributing

1. Follow the existing code structure and patterns
2. Add tests for new features
3. Update documentation as needed
4. Use type hints consistently
5. Follow FastAPI best practices 