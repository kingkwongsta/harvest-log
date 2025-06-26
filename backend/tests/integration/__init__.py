"""
Integration tests for the Harvest Log API backend.

Integration tests verify that multiple components work together correctly:
- API endpoints with database operations
- Image upload with storage services
- Full workflow testing
- External service integrations (Supabase)

These tests may be slower and require external dependencies to be available.

Running Integration Tests:
- Ensure the API server is running: uvicorn app.main:app --reload
- Run all integration tests: python -m pytest tests/integration/
- Run specific tests: python tests/integration/test_api_endpoints.py
""" 