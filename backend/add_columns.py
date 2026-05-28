import sqlite3
import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db

# 1. Add missing columns if not present
db_path = 'instance/superapp.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    for col in [("last_password_change", "DATETIME"), ("preferences", "TEXT"), ("achievements", "TEXT"), ("skills", "TEXT")]:
        try:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col[0]} {col[1]}")
            conn.commit()
            print(f"Column {col[0]} added successfully.")
        except sqlite3.OperationalError as e:
            print(f"Column {col[0]} already exists or could not be added: {e}")
    conn.close()
else:
    print("Database file does not exist yet.")

# 2. Create any missing tables (GuestActivityLog, BiometricAuditLog)
app = create_app()
with app.app_context():
    db.create_all()
    print("Missing tables created successfully.")
