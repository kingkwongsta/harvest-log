"""
Test package for the Harvest Log API backend.

This package contains all tests organized by category:
- unit/: Unit tests for individual components and functions
- integration/: Integration tests that test multiple components together
- manual/: Manual test files and scripts for manual testing

Test Structure:
├── tests/
│   ├── unit/           # Fast, isolated unit tests
│   ├── integration/    # Tests that require external dependencies
│   └── manual/         # Manual testing tools and scripts

Running Tests:
- All tests: python -m pytest tests/
- Unit tests only: python -m pytest tests/unit/
- Integration tests: python -m pytest tests/integration/
- Specific test: python -m pytest tests/unit/test_harvest_logs.py

Manual Testing:
- API endpoints: python tests/integration/test_api_endpoints.py
- Image upload: python tests/integration/test_real_image_upload.py
- Frontend integration: Open tests/manual/test_frontend_integration.html in browser
""" 