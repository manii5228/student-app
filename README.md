# University Super-App 🎓

A modern, high-performance web application designed to unify academic management, campus operations, career placements, and faculty administration.

## 🚀 Quick Start Guide

Choose **one** of the two backend setup options below depending on your preference.

---

### Option A: Fully Dockerized Setup (Recommended)
This option runs the Flask API, PostgreSQL database, and Redis cache entirely inside Docker containers.

1. **Start all services** (run this from the **root** directory of the project):
   ```bash
   docker-compose up --build -d
   ```

2. **Seed the database** with test accounts:
   ```bash
   docker-compose exec api python run.py seed
   ```

---

### Option B: Local Development Setup (No Docker Required)
This option runs the Flask API locally on your host machine using a SQLite database and in-memory dummy caching, making it extremely easy to run and test without Docker.

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment**:
   * **Windows:**
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   * **macOS/Linux:**
     ```bash
     python -m venv venv
     source venv/bin/activate
     ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Seed the local SQLite database**:
   ```bash
   python run.py seed
   ```

5. **Start the backend development server**:
   ```bash
   python run.py
   ```

---

### 💻 Frontend Setup (Vite + React)
The frontend communicates with the backend on port `5000`.

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install node dependencies**:
   ```bash
   npm install
   ```

3. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Test Credentials
Once the database has been seeded, use the following credentials to explore the application:

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **Admin** | `admin@veltech.edu.in` | `admin123!` | System stats, timetable configuration, and user management. |
| **Faculty** | `faculty@veltech.edu.in` | `faculty123!` | Class session creation, bulk attendance, and marks entry. |
| **Student** | `student1@veltech.edu.in` | `student123!` | Smart timetable, Bunk-O-Meter, fee alerts, and placements. |

---

## 🏗️ Architecture Stack
- **Frontend:** React 19, TypeScript, TailwindCSS (Bento-Grid styling), Lucide Icons.
- **Backend:** Python 3.12, Flask, SQLAlchemy, JWT Extended.
- **Database:** PostgreSQL (Core Data), Redis (QR Caching & Ephemeral state).

