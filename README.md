# University Super-App 🎓

A modern, high-performance web application designed to unify academic management, campus operations, career placements, and faculty administration.

## 🚀 Quick Start Guide

### 1. Backend (Flask + PostgreSQL + Redis)
The backend is fully dockerized for a seamless setup experience.
Ensure you have Docker Desktop installed and running.

```bash
cd backend
docker-compose up --build -d
```

**Seed the Database**
To log in, you must seed the database with the initial test users:
```bash
cd backend
docker-compose exec api flask seed
```

### 2. Frontend (Vite + React)
The frontend uses Node.js and npm.

```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

---

## 🔑 Test Credentials
Use the following accounts to explore the different Role-Based Access Control (RBAC) views:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@veltech.edu.in` | `admin123!` |
| **Faculty** | `faculty@veltech.edu.in` | `faculty123!` |
| **Student** | `student1@veltech.edu.in` | `student123!` |

---

## 🏗️ Architecture Stack
- **Frontend:** React 19, TypeScript, TailwindCSS (Bento-Grid styling), Lucide Icons.
- **Backend:** Python 3.12, Flask, SQLAlchemy, JWT Extended.
- **Database:** PostgreSQL (Core Data), Redis (QR Caching & Ephemeral state).
