# Zinnia 2026 &mdash; Admin Portal

Dedicated Command Center & Management Portal for Zinnia 2026 Symposium Organizers.

## Project Structure
- **`src/`**: React 18 + Vite + Tailwind Admin Dashboard & Camera QR Scanner (Port `5174`).
- **`backend/`**: Python Flask API (Port `5050`) for checkpoints, attendance, and payment verification.

## Getting Started

### 1. Run Admin Frontend
```bash
npm install
npm run dev
```
*Access the portal at `http://localhost:5174`.*

### 2. Run Admin Backend
```bash
cd backend
python app.py
```
*API runs at `http://localhost:5050`.*
