import sqlite3
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db

# 1. Add last_password_change column if not present
db_path = 'instance/superapp.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN last_password_change DATETIME")
        conn.commit()
        print("Column last_password_change added successfully.")
    except sqlite3.OperationalError as e:
        print("Column last_password_change already exists or could not be added:", e)
    conn.close()
else:
    print("Database file does not exist yet.")

# 2. Create any missing tables (GuestActivityLog, BiometricAuditLog)
app = create_app()
with app.app_context():
    db.create_all()
    print("Missing tables created successfully.")
