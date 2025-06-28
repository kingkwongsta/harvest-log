import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from uuid import uuid4

from app.main import app
from app.models import HarvestLog

# Create test client
client = TestClient(app)

# Test data
sample_harvest_log = {
    "crop_name": "Tomatoes",
    "quantity": 5.5,
    "unit": "pounds",
    "harvest_date": "2024-01-15T10:30:00",
    "location": "Garden Bed A",
    "notes": "First harvest of the season"
}


def test_read_root():
    """Test the root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "status" in data
    assert data["status"] == "healthy"


def test_health_check():
    """Test the health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "version" in data


def test_create_harvest_log():
    """Test creating a new harvest log"""
    response = client.post("/api/harvest-logs/", json=sample_harvest_log)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Harvest log created successfully"
    assert data["data"]["crop_name"] == sample_harvest_log["crop_name"]
    assert data["data"]["quantity"] == sample_harvest_log["quantity"]
    return data["data"]["id"]  # Return ID for other tests


def test_create_harvest_log_validation_error():
    """Test creating harvest log with invalid data"""
    invalid_data = {
        "crop_name": "",  # Empty crop name should fail
        "quantity": -1,   # Negative quantity should fail
        "unit": "pounds",
        "harvest_date": "2024-01-15T10:30:00"
    }
    response = client.post("/api/harvest-logs/", json=invalid_data)
    assert response.status_code == 422  # Validation error


def test_get_harvest_logs():
    """Test getting all harvest logs"""
    # First create a harvest log
    client.post("/api/harvest-logs/", json=sample_harvest_log)
    
    response = client.get("/api/harvest-logs/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "data" in data
    assert "total" in data
    assert isinstance(data["data"], list)


def test_get_harvest_log_by_id():
    """Test getting a specific harvest log by ID"""
    # First create a harvest log
    create_response = client.post("/api/harvest-logs/", json=sample_harvest_log)
    created_log = create_response.json()["data"]
    log_id = created_log["id"]
    
    # Now get it by ID
    response = client.get(f"/api/harvest-logs/{log_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == log_id
    assert data["data"]["crop_name"] == sample_harvest_log["crop_name"]


def test_get_harvest_log_not_found():
    """Test getting a non-existent harvest log"""
    fake_id = str(uuid4())
    response = client.get(f"/api/harvest-logs/{fake_id}")
    assert response.status_code == 404


def test_update_harvest_log():
    """Test updating a harvest log"""
    # First create a harvest log
    create_response = client.post("/api/harvest-logs/", json=sample_harvest_log)
    created_log = create_response.json()["data"]
    log_id = created_log["id"]
    
    # Update data
    update_data = {
        "crop_name": "Cherry Tomatoes",
        "quantity": 3.2,
        "notes": "Updated harvest notes"
    }
    
    response = client.put(f"/api/harvest-logs/{log_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["crop_name"] == update_data["crop_name"]
    assert data["data"]["quantity"] == update_data["quantity"]
    assert data["data"]["notes"] == update_data["notes"]
    # Original fields should remain
    assert data["data"]["unit"] == sample_harvest_log["unit"]


def test_update_harvest_log_not_found():
    """Test updating a non-existent harvest log"""
    fake_id = str(uuid4())
    update_data = {"crop_name": "Test"}
    response = client.put(f"/api/harvest-logs/{fake_id}", json=update_data)
    assert response.status_code == 404


def test_delete_harvest_log():
    """Test deleting a harvest log"""
    # First create a harvest log
    create_response = client.post("/api/harvest-logs/", json=sample_harvest_log)
    created_log = create_response.json()["data"]
    log_id = created_log["id"]
    
    # Delete it
    response = client.delete(f"/api/harvest-logs/{log_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["message"] == "Harvest log deleted successfully"
    
    # Verify it's gone
    get_response = client.get(f"/api/harvest-logs/{log_id}")
    assert get_response.status_code == 404


def test_delete_harvest_log_not_found():
    """Test deleting a non-existent harvest log"""
    fake_id = str(uuid4())
    response = client.delete(f"/api/harvest-logs/{fake_id}")
    assert response.status_code == 404


# Note: Tests now run against actual Supabase database
# In a real-world scenario, you would use a test database
# or mock the database calls for unit tests 