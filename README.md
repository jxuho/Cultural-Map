# 🏛️ Cultural Heritage Map

[![Frontend - Vercel](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://cultural-heritage-map.vercel.app/)
[![Backend - Render](https://img.shields.io/badge/Backend-Render-blue?style=flat-square&logo=render)](https://cultural-heritage-map.onrender.com/)
![TypeScript](https://img.shields.io/badge/Frontend-TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/Backend-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)

An interactive full-stack web application for discovering and exploring cultural heritage sites in Chemnitz. Built with a React + TypeScript frontend and a Node.js/Express backend following the MVC pattern, with real-time geospatial data from OpenStreetMap.

### 🔗 **[Live Demo](https://cultural-heritage-map.vercel.app/)** · **[API Docs (Swagger)](https://cultural-heritage-map.onrender.com/api-docs/)**

---

### Main Map View
<img width="960" height="540" alt="Main map view showing cultural heritage sites in Chemnitz" src="https://github.com/user-attachments/assets/c0940d74-3b77-4aca-adc2-e4e600b030be" />
<br/>
<br/>
<details>
<summary><b>📸 More Screenshots</b></summary>

**Admin Dashboard**
<img width="960" height="540" alt="Admin dashboard" src="https://github.com/user-attachments/assets/f3827a95-f97f-44f8-8a46-b5e98e4f492e" />

**User Management Panel**
<img width="960" height="540" alt="User management panel" src="https://github.com/user-attachments/assets/ad95fb98-3b79-4b38-a7ef-06033aa58650" />

**User Dashboard**
<img width="960" height="540" alt="User dashboard" src="https://github.com/user-attachments/assets/56fd43b2-ac40-40cc-b5a1-f2fc0c1cf25b" />

**Suggest New Place (User)**
<img width="960" height="540" alt="Suggest new place form" src="https://github.com/user-attachments/assets/dc83060b-02a3-4361-8d20-e8a3fde27294" />

**Manage Suggestions (Admin)**
<img width="1919" height="1079" alt="Admin suggestion management" src="https://github.com/user-attachments/assets/76b314c1-c88e-4d16-bd4d-55d5e4db3656" />

**Mobile View**
<img width="390" height="420" alt="Mobile responsive view" src="https://github.com/user-attachments/assets/42141d64-9d47-468c-8573-254adbafca14" />
</details>

---


## 🚀 Quick Start
```bash
git clone https://github.com/jxuho/cultural-heritage-map.git
cd cultural-heritage-map
cp backend/.env.example backend/.env   # please enter the values
docker-compose up --build
```

---


## ✨ Features

| Feature | Details |
|---|---|
| 🗺️ Interactive Map | 500+ cultural heritage sites rendered with Leaflet and clustered for performance |
| 🔐 RBAC | Role-based access control separating `user` and `admin` permissions |
| 👤 Auth | Google OAuth 2.0 + JWT via Passport.js with httpOnly cookies |
| 📡 Live Data Sync | Weekly cron job syncs data from OpenStreetMap via Overpass API |
| 🤖 CI/CD Pipeline	| Automated linting, formatting (Prettier), and testing via GitHub Actions for every push/PR |
| ✅ Testing | Unit/Integration with Vitest + RTL, and E2E with Playwright |
| 📱 Responsive | Mobile-first layout, tested across breakpoints |
| 📄 API Docs | Full OpenAPI/Swagger specification for all endpoints |

---

## 🛠️ Tech Stack & Architectural Decisions

### Frontend
- **React 19 + TypeScript** — Migrated from JavaScript to TypeScript to improve type safety and catch integration errors at compile time rather than runtime
- **TanStack Query** — Chosen over plain `useEffect` for server state to get caching, background refetch, and loading/error states for free
- **Zustand** — Lightweight alternative to Redux for UI state (map filters, auth); reduced boilerplate significantly for a single-developer project
- **Leaflet** — Open-source mapping library; allowed full control over tile sources and marker rendering without vendor lock-in
- **Vitest & React Testing Library** — Used for unit and integration testing of individual components and utility functions to ensure logic correctness in isolation.
- **Playwright** — Implemented for End-to-End (E2E) testing to verify critical user flows, such as authentication, map interactions, and marker filtering, across multiple browser engines.
- **Tailwind CSS**

### Backend
- **Express.js (MVC)** — Structured with Controllers, Services, and Models to separate routing logic from business logic and data access
- **MongoDB Atlas + Replica Sets** — Replica sets enabled multi-document transactions, which were necessary for atomic updates when an admin approves a user-submitted site (write to two collections)
- **Passport.js** — Handled both JWT and OAuth 2.0 strategies cleanly within a single middleware layer

### Infrastructure
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **CI/CD:** GitHub Actions (Automated Lint/Format/Test)
- **Containerization:** Docker Compose (local dev, 3-service stack)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│           React Frontend (Vercel)        │
│  TanStack Query · Zustand · Leaflet      │
└────────────────────┬────────────────────┘
                     │ REST API (JWT)
┌────────────────────▼────────────────────┐
│         Express.js Backend (Render)      │
│   Routes → Controllers → Services       │
│   Passport.js (JWT + OAuth 2.0)         │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐    ┌──────────▼──────────┐
│  MongoDB Atlas │    │   Overpass API (OSM) │
│  (Replica Set) │    │   Weekly cron sync   │
└────────────────┘    └─────────────────────┘
```

---

## 🔑 Key Implementation Details

### TypeScript Migration
The project was initially built in JavaScript and later migrated to TypeScript. This was a deliberate decision after the core features were stable, to add type safety incrementally without slowing down early iteration. The migration surfaced several implicit type assumptions in the Leaflet event handlers and API response shapes.

### Geospatial Data Pipeline
```
Overpass API → GeoJSON parsing → Reverse geocoding → MongoDB upsert
```
Batch processing with `Promise.allSettled` ensures a single failed geocode request doesn't abort the entire sync. Upsert logic uses OSM IDs as stable identifiers to avoid duplicates across weekly syncs.

### Auth Flow
```
Google OAuth callback → Passport.js verify → JWT issued (httpOnly cookie)
→ Subsequent requests use cookie-based JWT → Refresh handled server-side
```
httpOnly cookies were chosen over localStorage to mitigate XSS token theft.

### RBAC Middleware
```javascript
// Middleware chain: authenticate → authorize
router.delete('/users/:id', authenticate, authorize('admin'), deleteUser);
```
Role checks are enforced at the route level and re-validated in the service layer for defense in depth.

### Automated CI Pipeline & Quality Control
GitHub Actions → Linting & Formatting → Vitest/RTL → PR Validation. 


---

## 📊 Project Stats

- **500+** cultural heritage sites indexed
- **30** REST API endpoints (documented with Swagger)
- **2 roles** (user, admin) with distinct permission sets
- **Course grade: 1.0** (TU Chemnitz, Datenbanken und Web-Techniken)

---

## 🚧 Roadmap

- [ ] Extend geospatial support to additional German cities (Berlin next)
- [x] Add E2E tests with Playwright
- [ ] Improve Lighthouse performance score by code-splitting the JS bundle and adding `preconnect` hints for the backend origin

---


## 💻 Local Development

<details>
<summary>Setup instructions (Docker & Manual)</summary>

### 🐳 1. Running with Docker (Recommended)
The easiest way to get the entire stack (Frontend, Backend, Database) up and running is using Docker Compose.

**Step 1: Environment Variables**
Create a `.env` file in the `/backend` directory with your credentials:
```env
MONGO_URI=mongodb://mongodb:27017/cultural-heritage
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=dev
```

**Step 2: Launch the App**
```bash
docker-compose up --build
```
- Auto-Seeding: The backend is configured to automatically fetch 500+ cultural sites from the Overpass API and populate the database if it's empty on startup.
- Frontend: http://localhost:3000
- Backend & API Docs: http://localhost:5000/api-docs

### 🛠 2. Manual Setup (Alternative)
If you prefer to run the services individually without Docker:

**Step 1: Install Dependencies**
```bash
# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

**Step 2: Run Development Servers**
```bash
# Backend (http://localhost:5000)
cd backend && npm run dev

# Frontend (http://localhost:3000)
cd frontend && npm run dev
```
Note on Data: Even in manual mode, the server will perform Auto-Seeding on its first run if the connected database is empty. No manual script execution is required.

### 🧪 3. Running Tests
```bash
# Frontend Tests (Unit/Integration)
cd frontend && npm run test

# Frontend Tests (E2E with Playwright)
cd frontend && npx playwright test

# Backend Tests
cd backend && npm run test
```
</details>
