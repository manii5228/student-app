"""
Application entry point.
Run with: python run.py
"""

import os
from dotenv import load_dotenv
load_dotenv()

from app import create_app
from app.extensions import db

app = create_app()

with app.app_context():
    db.create_all()

@app.cli.command("seed")
def seed_db():
    """Seed the database with sample data for development."""
    from app.models.user import User, UserRole
    from datetime import datetime, timezone

    print("Seeding database...")
    db.create_all()

    # Admin
    admin = User(
        email="admin@veltech.edu.in",
        role=UserRole.ADMIN,
        first_name="Super",
        last_name="Admin",
        department="Administration",
        is_verified=True,
    )
    admin.set_password("admin123!")
    db.session.add(admin)

    # Faculty
    faculty = User(
        email="faculty@veltech.edu.in",
        role=UserRole.FACULTY,
        first_name="Dr. Ramesh",
        last_name="Kumar",
        department="CSE",
        employee_id="FAC001",
        designation="Associate Professor",
        specialization="Data Structures & Algorithms",
        is_verified=True,
    )
    faculty.set_password("faculty123!")
    db.session.add(faculty)

    # Students
    for i in range(1, 6):
        student = User(
            email=f"student{i}@veltech.edu.in",
            role=UserRole.STUDENT,
            first_name=f"Student",
            last_name=f"{i}",
            department="CSE",
            roll_number=f"22CSE{str(i).zfill(3)}",
            semester=4,
            section="A",
            batch_year=2022,
            is_verified=True,
        )
        student.set_password("student123!")
        db.session.add(student)

    db.session.commit()
    print("Database seeded successfully!")
    print("   Admin:   admin@veltech.edu.in / admin123!")
    print("   Faculty: faculty@veltech.edu.in / faculty123!")
    print("   Student: student1@veltech.edu.in / student123!")


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "seed":
        with app.app_context():
            seed_db()
    else:
        app.run(host="0.0.0.0", port=5000, debug=True)
