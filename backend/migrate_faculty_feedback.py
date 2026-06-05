import sqlite3
import os

db_path = 'instance/superapp.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. Add results & badge_id to events table
    try:
        cursor.execute("ALTER TABLE events ADD COLUMN results TEXT")
        print("Column 'results' added to events.")
    except sqlite3.OperationalError as e:
        print("Column 'results' already exists or failed:", e)
        
    try:
        cursor.execute("ALTER TABLE events ADD COLUMN badge_id VARCHAR(36)")
        print("Column 'badge_id' added to events.")
    except sqlite3.OperationalError as e:
        print("Column 'badge_id' already exists or failed:", e)

    # 2. Add status to event_registrations table
    try:
        cursor.execute("ALTER TABLE event_registrations ADD COLUMN status VARCHAR(20) DEFAULT 'pending'")
        print("Column 'status' added to event_registrations.")
    except sqlite3.OperationalError as e:
        print("Column 'status' already exists or failed:", e)

    # 3. Add status to earned_badges table
    try:
        cursor.execute("ALTER TABLE earned_badges ADD COLUMN status VARCHAR(20) DEFAULT 'approved'")
        print("Column 'status' added to earned_badges.")
    except sqlite3.OperationalError as e:
        print("Column 'status' already exists or failed:", e)

    # 4. Add proposed_column to milestones table
    try:
        cursor.execute("ALTER TABLE milestones ADD COLUMN proposed_column VARCHAR(20)")
        print("Column 'proposed_column' added to milestones.")
    except sqlite3.OperationalError as e:
        print("Column 'proposed_column' already exists or failed:", e)

    conn.commit()
    conn.close()
    print("Migration completed.")
else:
    print("Database file superapp.db not found!")
