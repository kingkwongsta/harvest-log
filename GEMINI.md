# GEMINI.md

This file provides guidance to me, Gemini, when working with the code in this repository.

## Development Commands

### Frontend (Next.js Client)

To work on the frontend, I will navigate to the `client` directory and use the following commands:

-   **Start development server:** `npm run dev` (on localhost:3000)
-   **Build for production:** `npm run build`
-   **Run linter:** `npm run lint`
-   **Start production server:** `npm start`

### Backend (FastAPI Python)

To work on the backend, I will navigate to the `backend` directory and use the following commands:

-   **Start development server:** `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080` (on localhost:8080)
-   **Run all tests:** `python -m pytest tests/`
-   **Run unit tests:** `python -m pytest tests/unit/`
-   **Run integration tests:** `python -m pytest tests/integration/`

### Full Stack Development

To run the full stack, I can use the provided scripts:

-   **Start both frontend and backend:** `./scripts/start-dev.sh`
-   **Deploy locally with Docker:** `./scripts/deploy-local.sh`

### Common URLs

-   **Frontend:** http://localhost:3000
-   **Backend API:** http://localhost:8080
-   **API Documentation:** http://localhost:8080/docs

## Architecture Overview

This is a full-stack harvest logging application.

-   **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS in `client/`.
-   **Backend**: FastAPI, Python, Supabase PostgreSQL, Supabase Storage in `backend/`.
-   **Database**: Supabase PostgreSQL with Row Level Security.

## Key Files and Entry Points

### Backend

-   `backend/app/main.py`: FastAPI app entry point.
-   `backend/app/models.py`: Pydantic data models.
-   `backend/app/database.py`: Supabase client and DB operations.
-   `backend/app/routers/harvest_logs.py`: CRUD for harvest data.
-   `backend/app/routers/images.py`: Image upload endpoints.
-   `backend/app/config.py`: Configuration.
-   `backend/app/auth.py`: Authentication.
-   `backend/app/cache.py`: Caching system.
-   `backend/app/background_tasks.py`: Background task management.

### Frontend

-   `client/app/layout.tsx`: Root layout.
-   `client/app/page.tsx`: Homepage.
-   `client/app/gallery/page.tsx`: Gallery page.
-   `client/lib/api.ts`: API client.
-   `client/components/camera-capture.tsx`: Camera component.
-   `client/components/gallery/`: Gallery view components.

### Configuration

-   `backend/.env`: Backend environment variables.
-   `client/.env.local`: Frontend environment variables.
-   `docker-compose.yml`: Docker setup.

## Testing Strategy

-   **Backend tests** are in `backend/tests/`.
-   I will run them using `python -m pytest tests/` from the `backend` directory.
