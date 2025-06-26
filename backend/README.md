# Harvest Log Backend

FastAPI backend server for the Harvest Log application.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Server

### Development Mode
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
python main.py
```

The server will be available at:
- API: http://localhost:8000
- Interactive API docs: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### POST /api/harvest-logs
Create a new harvest log entry.

**Request Body:**
```json
{
  "crop_name": "Tomatoes",
  "quantity": 5.5,
  "unit": "pounds",
  "harvest_date": "2024-01-15T10:30:00",
  "location": "Garden Bed A",
  "notes": "Great harvest today!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Harvest log created successfully",
  "data": {
    "id": "harvest_1",
    "crop_name": "Tomatoes",
    "quantity": 5.5,
    "unit": "pounds",
    "harvest_date": "2024-01-15T10:30:00",
    "location": "Garden Bed A",
    "notes": "Great harvest today!",
    "created_at": "2024-01-15T10:31:25.123456"
  }
}
```

### GET /api/harvest-logs
Get all harvest logs.

### GET /api/harvest-logs/{log_id}
Get a specific harvest log by ID. 