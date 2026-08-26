# Zinnia 2026 &mdash; Standalone Admin Portal

Dedicated Command Center and Backend for Zinnia 2026 Symposium Organizers.

## Project Structure
- **`backend/`**: Python Flask API (Port 5050) for verification, check-in, and stats.
- **`frontend/`**: React + Vite Admin Dashboard (Port 5174) with camera scanner and payment hub.

## Quick Start

### 1. Launch Backend:
```bash
cd backend
python app.py
```

### 2. Launch Frontend:
```bash
cd frontend
npm install
npm run dev
```
Access the Admin Portal at `http://localhost:5174`.
