# Plant Journey App – Feature Overview

A concise list of the core capabilities for a **visual plant-journey application** that documents and celebrates every plant's story.

---

## 🚀 Initial Implementation – Data Logging & Storage

Focus on **three core event types** to get the MVP running quickly.

### 1. Data Models (Supabase Table / Pydantic Schema)

| Table | Core Fields |
|-------|-------------|
| `plant_events` | `id` UUID PK · `user_id` FK · `plant_id` FK nullable · `event_type` (enum: `harvest` \| `bloom` \| `snapshot`) · `event_date` (timestamp) · `produce` (text) nullable · `quantity` (numeric) nullable · `unit` (text) nullable · `flower_type` (text) nullable · `description` (text) nullable · `metrics` (jsonb) nullable · `notes` (text) nullable · `photo_url` (text[]) · `created_at` · `updated_at` |

> A single table makes queries & maintenance simpler. Optional columns are only populated when relevant to the `event_type`.

#### How Different Event Fields are Handled
It's perfectly fine for event types to have different fields. Here's how we manage it in a single table:

1.  **Nullable Columns**: Fields specific to one event type (like `produce` for `harvest` or `flower_type` for `bloom`) are `NULLABLE`. They only store data when relevant and are efficiently handled by the database otherwise.
2.  **JSONB for Flexible Data**: The `metrics` column uses `jsonb`, which allows storing flexible, nested data (e.g., `{ "height": 15, "unit": "cm" }`) without needing to add more columns. This is ideal for snapshot data that might change over time.
3.  **Application-Level Validation**: The FastAPI backend will use different Pydantic models to validate incoming data based on the `event_type` in the request body, ensuring the correct fields are provided for each event.

This approach keeps the database schema simple and prioritizes the core feature—querying a unified timeline—while maintaining data flexibility.

### 2. API Endpoints (FastAPI)

| Method & Path | Purpose |
|---------------|---------|
| `POST /api/events` | Create a new event (`event_type` specified in body) |
| `GET /api/events` | List events; filter by `plant_id`, `event_type`, date range |
| `GET /api/events/{id}` | Retrieve single event |
| `PUT /api/events/{id}` | Update event |
| `DELETE /api/events/{id}` | Delete event |

> Router `events.py` contains CRUD operations; `event_type` drives validation logic (Pydantic dynamic model selection).

### 3. Front-End Logging Flow (Next.js)

A single, unified entry point on the main dashboard for all logging activities.

1.  **Initiate Log**: The user clicks a prominent "Log New Event" button.
2.  **Select Event Type**: A modal opens, prompting the user to select: "Harvest", "Bloom", or "Plant Snapshot".
3.  **Dynamic Form**: The modal then displays a form with fields relevant only to the chosen event type.
4.  **Submit Event**: The form submits to the single `POST /api/events` endpoint, simplifying both user experience and development.
