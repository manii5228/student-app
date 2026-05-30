# Database Concurrency & Production Scaling Guide

This document provides a detailed overview of the database concurrency architecture of the VelTech Student App, how we addressed SQLite's write locking limitation, and the transition path to PostgreSQL for production environments.

---

## 1. The SQLite Concurrency Challenge

By default, SQLite uses a rollback journal mechanism (DELETE mode) to manage ACID transactions. During write operations (such as check-ins or user profile saves):
- SQLite obtains an **exclusive write lock** on the entire database file.
- Any concurrent read queries (such as home feed requests) are blocked until the transaction is committed or aborted.
- Under peak loads (e.g., thousands of students checking in for attendance simultaneously), this causes substantial latency or database timeouts (`sqlite3.OperationalError: database is locked`).

---

## 2. The Solution: WAL (Write-Ahead Logging) Mode

To resolve read-write contention, we have configured SQLite to run in **WAL (Write-Ahead Logging)** mode.

### How WAL Mode Works
Instead of modifying the main database file directly during transactions, SQLite appends changes to a separate write-ahead log file (`superapp.db-wal`). 
- **Concurrent Reads:** Readers can query the main database file and the WAL file simultaneously. Read operations do not block write operations, and write operations do not block read operations.
- **Improved I/O Performance:** Writes are grouped and synced to disk sequentially, decreasing disk thrashing.
- **Sync Options:** Configured `PRAGMA synchronous = NORMAL;` to reduce disk sync overhead while preserving durability.

### Implementation in Flask
We implemented this dynamically in `app/extensions.py` via a SQLAlchemy connection event hook. This applies the pragmas automatically only if the active connection is SQLite:

```python
from sqlalchemy import event
from sqlalchemy.engine import Engine
import sqlite3

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
```

---

## 3. Production Migration Plan to PostgreSQL

While SQLite with WAL mode is excellent for development and local testing up to hundreds of concurrent users, a production environment supporting 15,000+ active students requires a dedicated database server like **PostgreSQL**.

### Step 1: Update Environment Configs
Update the database connection string in the environment file:
```env
DATABASE_URL=postgresql://veltech_user:securepassword@db-host:5432/superapp
```

### Step 2: Connection Pooling Configuration
Install `psycopg2-binary` and configure connection pooling in the Flask configurations (`app/config.py`):
```python
class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_size": 20,           # Max connections per app instance
        "max_overflow": 10,        # Temporary burst connections
        "pool_timeout": 30,        # Seconds to wait before timing out
        "pool_recycle": 1800       # Recycle connections every 30 mins
    }
```

### Step 3: Deployment Architecture
For high concurrent scale, deploy database replicas behind a load balancer with **pgBouncer** for connection multiplexing:

```mermaid
graph TD
    Client[Mobile/Web Client] --> Nginx[Nginx Load Balancer]
    Nginx --> App1[Flask App Instance 1]
    Nginx --> App2[Flask App Instance 2]
    App1 --> pgB[pgBouncer Connection Pooler]
    App2 --> pgB
    pgB --> PrimaryDB[(PostgreSQL Primary - Writes)]
    pgB --> ReplicaDB[(PostgreSQL Replica - Reads)]
```
