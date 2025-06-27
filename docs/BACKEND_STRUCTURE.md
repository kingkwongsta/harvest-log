# Backend Structure Guide

This document outlines the organized structure of the Harvest Log API backend.

## 📁 Directory Structure

```
backend/
├── app/                    # Core application code
│   ├── __init__.py
│   ├── main.py            # FastAPI application entry point
│   ├── config.py          # Application configuration
│   ├── database.py        # Database connection and setup
│   ├── dependencies.py    # Dependency injection
│   ├── logging_config.py  # Logging configuration
│   ├── middleware.py      # Custom middleware
│   ├── models.py          # Pydantic models
│   ├── storage.py         # File storage service
│   └── routers/           # API route handlers
│       ├── __init__.py
│       ├── harvest_logs.py
│       └── images.py
├── tests/                 # All test files organized by type
│   ├── __init__.py        # Test package documentation
│   ├── unit/              # Fast, isolated unit tests
│   │   ├── __init__.py
│   │   ├── test_harvest_logs.py
│   │   └── test_logging.py
│   ├── integration/       # Tests requiring external dependencies
│   │   ├── __init__.py
│   │   ├── test_api_endpoints.py
│   │   ├── test_image_upload.py
│   │   └── test_real_image_upload.py
│   └── manual/            # Manual testing tools
│       ├── __init__.py
│       └── test_frontend_integration.html
├── docs/                  # Documentation files
│   ├── README.md
│   └── API_LOGGING_SUMMARY.md
├── main.py               # Application entry point
├── requirements.txt      # Python dependencies
├── setup_supabase.sql   # Database setup script
└── README.md            # Main backend documentation
```

## 🎯 Organization Principles

### Core Application (`app/`)
- Contains all production code
- Modular structure with clear separation of concerns
- Each module has a specific responsibility

### Testing (`tests/`)
- **Unit Tests**: Fast, isolated tests for individual components
- **Integration Tests**: Tests that require external services (database, storage)
- **Manual Tests**: Interactive tools for manual testing and debugging

### Documentation (`docs/`)
- Technical documentation
- API guides and implementation details
- Separated from code for better organization

## 🚀 Running the Application

### Development
```bash
# Install dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload

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

# Run specific test files
python -m pytest tests/unit/test_harvest_logs.py

# Manual testing
python tests/integration/test_api_endpoints.py
```

### Manual Testing
- Open `tests/manual/test_frontend_integration.html` in a browser
- Ensure the API server is running first

## 📝 File Purposes

### Core Files
- `main.py`: Application entry point with uvicorn configuration
- `app/main.py`: FastAPI app configuration and middleware setup
- `requirements.txt`: Python package dependencies
- `setup_supabase.sql`: Database schema and setup

### Configuration
- `app/config.py`: Environment-based configuration
- `app/logging_config.py`: Structured logging setup
- `app/middleware.py`: Request/response middleware

### Data & Storage
- `app/models.py`: Pydantic data models
- `app/database.py`: Supabase client configuration
- `app/storage.py`: File storage service
- `app/dependencies.py`: Dependency injection patterns

### API Routes
- `app/routers/harvest_logs.py`: CRUD operations for harvest logs
- `app/routers/images.py`: Image upload and management

## 🔧 Benefits of This Structure

1. **Clear Separation**: Tests, docs, and core code are properly separated
2. **Scalable**: Easy to add new test types or documentation
3. **Maintainable**: Logical grouping makes finding files intuitive
4. **Professional**: Follows Python project best practices
5. **CI/CD Ready**: Structure supports automated testing and deployment

## 📋 Development Guidelines

- Add new tests to appropriate test directories
- Update documentation when adding features
- Keep the structure clean and organized
- Follow the established patterns for new files 