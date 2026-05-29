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

    print("Seeding database (dropping first)...")
    db.drop_all()
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
        publications="1. R. Kumar et al., 'Optimized Graph Algorithms in Distributed Systems', IEEE Transactions 2024.\n2. R. Kumar, 'A Survey of Quantum Computing Paradigms', ACM Computing Surveys 2023.",
        research_interests="Distributed Systems, Algorithmic Graph Theory, Quantum Computing",
        office_hours="Monday & Wednesday, 2:00 PM - 4:00 PM",
        office_location="Cabin 104, 1st Floor, B-Block",
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

    # Seed attendance sessions and records
    from app.models.attendance import Attendance, AttendanceRecord, AttendanceStatus, AttendanceMethod
    import random
    from datetime import date, timedelta

    print("Seeding attendance sessions and records...")
    subjects = [
        {"code": "CS301", "name": "Data Structures"},
        {"code": "CS302", "name": "Digital Logic"},
        {"code": "MA301", "name": "Mathematics III"},
        {"code": "CS303", "name": "Operating Systems"},
        {"code": "HU301", "name": "English"}
    ]

    # Assign student1-5 to faculty as mentor
    student_users = User.query.filter_by(role=UserRole.STUDENT).all()
    faculty_user = User.query.filter_by(role=UserRole.FACULTY).first()
    for s in student_users:
        s.mentor_id = faculty_user.id
    db.session.commit()

    # We will seed 15 days of classes
    start_date = date.today() - timedelta(days=20)
    for day_offset in range(16):
        session_date = start_date + timedelta(days=day_offset)
        # Skip weekends
        if session_date.weekday() >= 5:
            continue

        for idx, sub in enumerate(subjects):
            # Create a session
            session = Attendance(
                subject_code=sub["code"],
                subject_name=sub["name"],
                faculty_id=faculty_user.id,
                department="CSE",
                semester=4,
                section="A",
                period_number=idx + 1,
                session_date=session_date,
                is_finalized=True
            )
            db.session.add(session)
            db.session.flush() # get session.id

            present_count = 0
            absent_count = 0

            for student in student_users:
                # Student 1 has specific percentages to create a low attendance warning:
                if student.roll_number == "22CSE001":
                    if sub["code"] == "CS301":
                        is_present = random.random() < 0.90
                    elif sub["code"] == "CS302":
                        is_present = random.random() < 0.60
                    elif sub["code"] == "MA301":
                        is_present = random.random() < 0.70
                    elif sub["code"] == "CS303":
                        is_present = random.random() < 0.80
                    else:
                        is_present = random.random() < 0.50
                else:
                    is_present = random.random() < 0.85 # 85% default for others

                status = AttendanceStatus.PRESENT if is_present else AttendanceStatus.ABSENT

                record = AttendanceRecord(
                    session_id=session.id,
                    student_id=student.id,
                    status=status,
                    method=AttendanceMethod.MANUAL,
                    marked_by=faculty_user.id
                )
                db.session.add(record)

                if status == AttendanceStatus.PRESENT:
                    present_count += 1
                else:
                    absent_count += 1

            session.total_present = present_count
            session.total_absent = absent_count
            session.total_students = len(student_users)

    db.session.commit()
    print("Attendance seeded successfully!")

    # Seed academic results and calculate credit progress
    from app.models.academic import Result
    from app.services.credit_service import CreditService
    
    print("Seeding academic results and credit progress...")
    results_to_seed = [
        # Semester 1
        {"sem": 1, "code": "MA101", "name": "Mathematics I", "credits": 4, "grade": "A", "gp": 8.0},
        {"sem": 1, "code": "PH101", "name": "Engineering Physics", "credits": 4, "grade": "B", "gp": 7.0},
        {"sem": 1, "code": "CS101", "name": "Intro to Programming", "credits": 3, "grade": "A+", "gp": 9.0},
        {"sem": 1, "code": "CS101L", "name": "Programming Lab", "credits": 2, "grade": "O", "gp": 10.0},
        {"sem": 1, "code": "ME101", "name": "Engineering Graphics", "credits": 3, "grade": "B+", "gp": 7.5},
        {"sem": 1, "code": "EN101", "name": "English Communication", "credits": 2, "grade": "A", "gp": 8.0},
        {"sem": 1, "code": "CS102", "name": "Problem Solving using C", "credits": 4, "grade": "A", "gp": 8.0},
        {"sem": 1, "code": "CS102L", "name": "C Lab", "credits": 2, "grade": "A+", "gp": 9.0},
        # Semester 2
        {"sem": 2, "code": "MA102", "name": "Mathematics II", "credits": 4, "grade": "B+", "gp": 7.5},
        {"sem": 2, "code": "CY101", "name": "Engineering Chemistry", "credits": 4, "grade": "B", "gp": 7.0},
        {"sem": 2, "code": "CS201", "name": "Object Oriented Programming", "credits": 3, "grade": "A", "gp": 8.0},
        {"sem": 2, "code": "CS201L", "name": "OOP Lab", "credits": 2, "grade": "O", "gp": 10.0},
        {"sem": 2, "code": "EE101", "name": "Basic Electrical Eng.", "credits": 3, "grade": "A", "gp": 8.0},
        {"sem": 2, "code": "HS101", "name": "Professional Ethics", "credits": 2, "grade": "B+", "gp": 7.5},
        {"sem": 2, "code": "CS202", "name": "Data Structures", "credits": 4, "grade": "A+", "gp": 9.0},
        {"sem": 2, "code": "CS202L", "name": "DS Lab", "credits": 2, "grade": "A+", "gp": 9.0},
        # Semester 3
        {"sem": 3, "code": "MA201", "name": "Discrete Mathematics", "credits": 4, "grade": "A", "gp": 8.0},
        {"sem": 3, "code": "CS302", "name": "Computer Organization", "credits": 4, "grade": "A+", "gp": 9.0},
        {"sem": 3, "code": "CS303", "name": "Database Management Systems", "credits": 3, "grade": "A", "gp": 8.0},
        {"sem": 3, "code": "CS303L", "name": "DBMS Lab", "credits": 2, "grade": "O", "gp": 10.0},
        {"sem": 3, "code": "CS304", "name": "Software Engineering", "credits": 3, "grade": "B+", "gp": 7.5},
        {"sem": 3, "code": "OE201", "name": "Environmental Sciences", "credits": 3, "grade": "A", "gp": 8.0},
        {"sem": 3, "code": "CS399", "name": "Mini Project I", "credits": 3, "grade": "O", "gp": 10.0},
        {"sem": 3, "code": "CS305", "name": "Theory of Computation", "credits": 4, "grade": "B", "gp": 7.0},
    ]

    credit_service = CreditService()
    for student in student_users:
        for r_data in results_to_seed:
            result = Result(
                student_id=student.id,
                semester=r_data["sem"],
                subject_code=r_data["code"],
                subject_name=r_data["name"],
                credits=r_data["credits"],
                grade=r_data["grade"],
                grade_points=r_data["gp"],
                published=True
            )
            db.session.add(result)
        db.session.flush()
        # Calculate and populate CreditProgress
        credit_service.calculate_credit_progress(student.id)
    
    # Seed syllabus
    from app.models.academic import Syllabus, ExamSchedule, InternalMark
    from datetime import date, time
    print("Seeding syllabus...")
    syllabus_data = [
        # CS301
        {"code": "CS301", "name": "Data Structures", "unit": 1, "title": "Unit 1: Linear Data Structures", "topics": "Arrays, stacks, queues, linked lists, and recursion. Applications of stacks and queues.", "hours": 12},
        {"code": "CS301", "name": "Data Structures", "unit": 2, "title": "Unit 2: Trees", "topics": "Binary trees, binary search trees, AVL trees, B-trees, tree traversal algorithms, heaps.", "hours": 10},
        {"code": "CS301", "name": "Data Structures", "unit": 3, "title": "Unit 3: Graphs", "topics": "Graph representations, BFS, DFS, MST algorithms (Kruskal, Prim), shortest path algorithms.", "hours": 12},
        {"code": "CS301", "name": "Data Structures", "unit": 4, "title": "Unit 4: Sorting and Searching", "topics": "Bubble, insertion, selection, quick, merge, heap sort, hash tables, hash functions, collision resolution.", "hours": 8},
        {"code": "CS301", "name": "Data Structures", "unit": 5, "title": "Unit 5: Advanced Structures", "topics": "Tries, suffix trees, segment trees, union-find, complexity analysis of algorithmic operations.", "hours": 8},
        # CS302
        {"code": "CS302", "name": "Digital Logic", "unit": 1, "title": "Unit 1: Number Systems and Codes", "topics": "Binary, octal, hexadecimal, BCD, excess-3, gray code, arithmetic operations, error detection/correction codes.", "hours": 10},
        {"code": "CS302", "name": "Digital Logic", "unit": 2, "title": "Unit 2: Boolean Algebra", "topics": "Laws and theorems, SOP/POS, K-maps up to 5 variables, Quine-McCluskey method, logic gates.", "hours": 10},
        {"code": "CS302", "name": "Digital Logic", "unit": 3, "title": "Unit 3: Combinational Logic", "topics": "Adders, subtractors, decoders, encoders, multiplexers, demultiplexers, magnitude comparators.", "hours": 12},
        {"code": "CS302", "name": "Digital Logic", "unit": 4, "title": "Unit 4: Sequential Logic", "topics": "Latches, flip-flops (SR, JK, D, T), registers, shift registers, synchronous and asynchronous counters.", "hours": 12},
        {"code": "CS302", "name": "Digital Logic", "unit": 5, "title": "Unit 5: Memory and Programmable Logic", "topics": "RAM, ROM, PLA, PAL, CPLD, FPGA, digital logic design modeling using HDL.", "hours": 6},
        # MA301
        {"code": "MA301", "name": "Mathematics III", "unit": 1, "title": "Unit 1: Fourier Series", "topics": "Dirichlet conditions, General Fourier series, Half range sine and cosine series, Parseval's identity.", "hours": 12},
        {"code": "MA301", "name": "Mathematics III", "unit": 2, "title": "Unit 2: Fourier Transforms", "topics": "Fourier transform pair, sine and cosine transforms, properties, transforms of simple functions, convolution.", "hours": 10},
        {"code": "MA301", "name": "Mathematics III", "unit": 3, "title": "Unit 3: Boundary Value Problems", "topics": "Classification of 2nd order PDE, Method of separation of variables, One dimensional wave and heat equations.", "hours": 12},
        {"code": "MA301", "name": "Mathematics III", "unit": 4, "title": "Unit 4: Z-Transforms", "topics": "Elementary properties, inverse Z-transform, convolution theorem, formation and solution of difference equations.", "hours": 8},
        {"code": "MA301", "name": "Mathematics III", "unit": 5, "title": "Unit 5: PDE", "topics": "Lagrange's linear equation, homogeneous linear equations with constant coefficients, boundary conditions.", "hours": 8},
        # CS303
        {"code": "CS303", "name": "Operating Systems", "unit": 1, "title": "Unit 1: Introduction to OS", "topics": "System calls, OS structures, boot process, virtualization, dual-mode execution.", "hours": 8},
        {"code": "CS303", "name": "Operating Systems", "unit": 2, "title": "Unit 2: Process Scheduling", "topics": "Threads, CPU scheduling, synchronization, semaphores, monitors, deadlock prevention.", "hours": 14},
        {"code": "CS303", "name": "Operating Systems", "unit": 3, "title": "Unit 3: Memory Management", "topics": "Paging, segmentation, virtual memory, page replacement algorithms, thrashing, allocation.", "hours": 12},
        {"code": "CS303", "name": "Operating Systems", "unit": 4, "title": "Unit 4: Storage & File Systems", "topics": "Disk scheduling, file system interface, directory structure, protection, access control.", "hours": 8},
        {"code": "CS303", "name": "Operating Systems", "unit": 5, "title": "Unit 5: Linux and Security", "topics": "Linux kernel architecture, access matrix, cryptography in OS, threat detection.", "hours": 8},
        # HU301
        {"code": "HU301", "name": "English", "unit": 1, "title": "Unit 1: Vocabulary & Grammar", "topics": "Synonyms, antonyms, phrasal verbs, tenses, active/passive voice, direct/indirect speech.", "hours": 8},
        {"code": "HU301", "name": "English", "unit": 2, "title": "Unit 2: Reading Comprehension", "topics": "Skimming, scanning, intensive reading, critical analysis of text, vocabulary from context.", "hours": 8},
        {"code": "HU301", "name": "English", "unit": 3, "title": "Unit 3: Technical Writing", "topics": "Report writing, email etiquette, resume preparation, cover letters, formal proposals.", "hours": 10},
        {"code": "HU301", "name": "English", "unit": 4, "title": "Unit 4: Listening & Speaking", "topics": "Effective presentation, group discussions, mock interviews, auditory comprehension.", "hours": 10},
        {"code": "HU301", "name": "English", "unit": 5, "title": "Unit 5: Presentation Skills", "topics": "Body language, slide design, public speaking strategies, handling questions.", "hours": 9},
    ]

    for sd in syllabus_data:
        unit = Syllabus(
            subject_code=sd["code"],
            subject_name=sd["name"],
            department="CSE",
            semester=4,
            unit_number=sd["unit"],
            unit_title=sd["title"],
            topics=sd["topics"],
            hours=sd["hours"],
            is_completed=(sd["unit"] < 4), # Mark first 3 units as completed
            completed_by=faculty_user.id if sd["unit"] < 4 else None,
            academic_year="2025-2026",
            version=1
        )
        db.session.add(unit)

    # Seed Exam Schedule
    print("Seeding exam schedules...")
    exams_data = [
        {"code": "CS301", "name": "Data Structures", "date": date(2026, 6, 15), "start": time(9, 30), "end": time(12, 30), "room": "LH-101"},
        {"code": "CS302", "name": "Digital Logic", "date": date(2026, 6, 16), "start": time(9, 30), "end": time(12, 30), "room": "LH-102"},
        {"code": "MA301", "name": "Mathematics III", "date": date(2026, 6, 17), "start": time(9, 30), "end": time(12, 30), "room": "LH-103"},
        {"code": "CS303", "name": "Operating Systems", "date": date(2026, 6, 18), "start": time(9, 30), "end": time(12, 30), "room": "LH-104"},
        {"code": "HU301", "name": "English", "date": date(2026, 6, 19), "start": time(9, 30), "end": time(12, 30), "room": "LH-105"},
    ]

    for ed in exams_data:
        exam = ExamSchedule(
            subject_code=ed["code"],
            subject_name=ed["name"],
            department="CSE",
            semester=4,
            exam_date=ed["date"],
            start_time=ed["start"],
            end_time=ed["end"],
            room_number=ed["room"],
            building="Main Block",
            exam_type="end_semester"
        )
        db.session.add(exam)

    # Seed Internal Marks
    print("Seeding internal marks...")
    for student in student_users:
        for idx, sub in enumerate(subjects):
            # For student1, let's create a low mark in English to test highlights
            if student.roll_number == "22CSE001" and sub["code"] == "HU301":
                cat1_marks = 15.0
                cat2_marks = 18.0
                model_marks = 22.0
            else:
                cat1_marks = random.uniform(30.0, 48.0)
                cat2_marks = random.uniform(30.0, 48.0)
                model_marks = random.uniform(35.0, 49.0)

            # Max marks are 50
            db.session.add(InternalMark(
                student_id=student.id, subject_code=sub["code"], subject_name=sub["name"],
                semester=4, test_type="cat1", max_marks=50.0, marks_obtained=round(cat1_marks, 1),
                faculty_id=faculty_user.id
            ))
            db.session.add(InternalMark(
                student_id=student.id, subject_code=sub["code"], subject_name=sub["name"],
                semester=4, test_type="cat2", max_marks=50.0, marks_obtained=round(cat2_marks, 1),
                faculty_id=faculty_user.id
            ))
            db.session.add(InternalMark(
                student_id=student.id, subject_code=sub["code"], subject_name=sub["name"],
                semester=4, test_type="model", max_marks=50.0, marks_obtained=round(model_marks, 1),
                faculty_id=faculty_user.id
            ))
            # Lab internal (only for CS301, CS302, CS303)
            if sub["code"] in ["CS301", "CS302", "CS303"]:
                db.session.add(InternalMark(
                    student_id=student.id, subject_code=sub["code"], subject_name=sub["name"],
                    semester=4, test_type="lab", max_marks=100.0, marks_obtained=round(random.uniform(70.0, 95.0), 1),
                    faculty_id=faculty_user.id
                ))

    db.session.commit()
    print("Academic results, credits, syllabus, exams, and internal marks seeded successfully!")

    # ── Team Finder Profiles ──────────────────────────────────────
    from app.models.career import (
        TeamFinderProfile, SkillBadge, EarnedBadge,
        Project, Milestone, Portfolio,
    )
    import json as json_lib

    # Fetch users for seeding
    students = User.query.filter_by(role=UserRole.STUDENT).order_by(User.id).all()
    faculty_user = User.query.filter_by(role=UserRole.FACULTY).first()

    tf_profiles = [
        {"user": students[0], "skills": "React,TypeScript,Node.js", "looking_for": "Backend Developer for Hackathon", "bio": "Fullstack enthusiast passionate about web development"},
        {"user": students[1], "skills": "Python,Django,PostgreSQL", "looking_for": "Frontend Dev for E-commerce Project", "bio": "Backend specialist, love building APIs and databases"},
        {"user": students[2], "skills": "Figma,Tailwind,React", "looking_for": "ML Engineer for Health-Tech Startup", "bio": "UI/UX designer who also codes in React"},
        {"user": students[3], "skills": "Java,Spring Boot,Kubernetes", "looking_for": "DevOps partner for Cloud Project", "bio": "Enterprise developer with cloud experience"},
        {"user": students[4], "skills": "Flutter,Dart,Firebase", "looking_for": "Backend Developer for Mobile App", "bio": "Mobile app developer with multiple published apps"},
    ]
    for tfp in tf_profiles:
        db.session.add(TeamFinderProfile(
            user_id=tfp["user"].id, skills=tfp["skills"],
            looking_for=tfp["looking_for"], bio=tfp["bio"],
        ))
    db.session.commit()
    print("Team Finder profiles seeded!")

    # ── Skill Badges ──────────────────────────────────────────────
    badge_templates = [
        {"name": "React Ninja", "desc": "Mastered React.js fundamentals", "cat": "technical", "icon": "code", "pts": 50, "criteria": "Complete React Workshop + Build 1 Project"},
        {"name": "Hackathon Hero", "desc": "Participated in a 24-hour hackathon", "cat": "hackathon", "icon": "trophy", "pts": 100, "criteria": "Complete any hackathon event"},
        {"name": "Team Leader", "desc": "Led a project team of 3+ members", "cat": "soft_skill", "icon": "users", "pts": 30, "criteria": "Successfully lead a team project to completion"},
        {"name": "Cloud Architect", "desc": "Deployed an app to AWS/GCP/Azure", "cat": "technical", "icon": "zap", "pts": 75, "criteria": "Deploy any production application to cloud"},
        {"name": "Open Source Star", "desc": "Contributed to an open-source project", "cat": "technical", "icon": "star", "pts": 60, "criteria": "Get 1+ PR merged in any open-source repo"},
        {"name": "Workshop Attendee", "desc": "Attended a technical workshop", "cat": "workshop", "icon": "book", "pts": 20, "criteria": "Attend any department-approved workshop"},
    ]
    badges = []
    for bt in badge_templates:
        b = SkillBadge(name=bt["name"], description=bt["desc"], category=bt["cat"],
                       icon=bt["icon"], points=bt["pts"], criteria=bt["criteria"])
        db.session.add(b)
        badges.append(b)
    db.session.commit()

    # Award some badges
    db.session.add(EarnedBadge(student_id=students[0].id, badge_id=badges[0].id, awarded_by=faculty_user.id, note="Completed React workshop"))
    db.session.add(EarnedBadge(student_id=students[0].id, badge_id=badges[1].id, awarded_by=faculty_user.id, note="Won VelHack 2026"))
    db.session.add(EarnedBadge(student_id=students[0].id, badge_id=badges[5].id, awarded_by=faculty_user.id, note="Docker Workshop"))
    db.session.add(EarnedBadge(student_id=students[1].id, badge_id=badges[3].id, awarded_by=faculty_user.id, note="Deployed Django app to AWS"))
    db.session.add(EarnedBadge(student_id=students[2].id, badge_id=badges[2].id, awarded_by=faculty_user.id, note="Led UI/UX team"))
    db.session.commit()
    print("Skill Badges seeded and awarded!")

    # ── Projects with Kanban Milestones ───────────────────────────
    from datetime import timedelta, date as dt_date
    p1 = Project(
        student_id=students[0].id, title="University Super-App",
        description="A comprehensive campus management system with React + Flask",
        team_members="Priya K.,Rahul S.", deadline=dt_date.today() + timedelta(days=30),
        status="in_progress", progress_pct=40,
    )
    db.session.add(p1)
    db.session.flush()
    milestones_data = [
        {"title": "Design Figma mockups", "col": "done", "assigned": "Priya K.", "completed": True},
        {"title": "Setup Flask backend", "col": "done", "assigned": "Mani M.", "completed": True},
        {"title": "Build React frontend", "col": "in_progress", "assigned": "Mani M.", "completed": False},
        {"title": "Integrate APIs", "col": "todo", "assigned": "Rahul S.", "completed": False},
        {"title": "Write unit tests", "col": "todo", "assigned": None, "completed": False},
    ]
    for md in milestones_data:
        db.session.add(Milestone(
            project_id=p1.id, title=md["title"], column=md["col"],
            assigned_to=md["assigned"], is_completed=md["completed"],
            completed_at=datetime.now(timezone.utc) if md["completed"] else None,
            due_date=dt_date.today() + timedelta(days=random.randint(5, 25)),
        ))

    p2 = Project(
        student_id=students[0].id, title="AI Portfolio Builder",
        description="Auto-generates CVs from student data using NLP",
        team_members="Karthik R.", deadline=dt_date.today() + timedelta(days=45),
        status="in_progress", progress_pct=20,
    )
    db.session.add(p2)
    db.session.flush()
    for md in [
        {"title": "Research NLP models", "col": "done", "assigned": "Mani M.", "completed": True},
        {"title": "Build data pipeline", "col": "in_progress", "assigned": "Karthik R.", "completed": False},
        {"title": "Train model", "col": "todo", "assigned": None, "completed": False},
    ]:
        db.session.add(Milestone(
            project_id=p2.id, title=md["title"], column=md["col"],
            assigned_to=md["assigned"], is_completed=md["completed"],
            completed_at=datetime.now(timezone.utc) if md["completed"] else None,
        ))
    db.session.commit()
    print("Projects with Kanban milestones seeded!")

    # ── Timetables and Slots Seeding ──────────────────────────────
    from app.models.timetable import Timetable, TimetableSlot, DayOfWeek, SlotType
    from datetime import time as dt_time
    print("Seeding Timetable and Slots...")
    
    tt = Timetable(
        name="CSE Semester-4 Section A",
        department="CSE",
        semester=4,
        section="A",
        academic_year="2025-2026",
        is_active=True,
        is_published=True
    )
    db.session.add(tt)
    db.session.flush()
    
    timetable_slots = [
        # Monday
        {"day": DayOfWeek.MONDAY, "period": 1, "start": dt_time(9, 0), "end": dt_time(9, 50), "type": SlotType.LECTURE, "sub": "CS301", "name": "Data Structures", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.MONDAY, "period": 2, "start": dt_time(10, 0), "end": dt_time(10, 50), "type": SlotType.LECTURE, "sub": "CS302", "name": "Digital Logic", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.MONDAY, "period": 3, "start": dt_time(11, 0), "end": dt_time(11, 50), "type": SlotType.LECTURE, "sub": "MA301", "name": "Mathematics III", "room": "LH-102", "bld": "Main Block"},
        {"day": DayOfWeek.MONDAY, "period": 4, "start": dt_time(12, 0), "end": dt_time(12, 50), "type": SlotType.BREAK, "sub": "", "name": "Lunch Break", "room": "Canteen", "bld": "Student Hub"},
        {"day": DayOfWeek.MONDAY, "period": 5, "start": dt_time(14, 0), "end": dt_time(14, 50), "type": SlotType.LECTURE, "sub": "CS303", "name": "Operating Systems", "room": "LH-101", "bld": "CSE Block"},
        
        # Tuesday
        {"day": DayOfWeek.TUESDAY, "period": 1, "start": dt_time(9, 0), "end": dt_time(9, 50), "type": SlotType.LECTURE, "sub": "CS303", "name": "Operating Systems", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.TUESDAY, "period": 2, "start": dt_time(10, 0), "end": dt_time(10, 50), "type": SlotType.LECTURE, "sub": "CS301", "name": "Data Structures", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.TUESDAY, "period": 3, "start": dt_time(11, 0), "end": dt_time(11, 50), "type": SlotType.LECTURE, "sub": "HU301", "name": "English", "room": "LH-103", "bld": "Main Block"},
        {"day": DayOfWeek.TUESDAY, "period": 4, "start": dt_time(12, 0), "end": dt_time(12, 50), "type": SlotType.BREAK, "sub": "", "name": "Lunch Break", "room": "Canteen", "bld": "Student Hub"},
        {"day": DayOfWeek.TUESDAY, "period": 5, "start": dt_time(14, 0), "end": dt_time(15, 40), "type": SlotType.LAB, "sub": "CS301", "name": "Data Structures Lab", "room": "Lab-201", "bld": "Lab Block"},
        
        # Wednesday
        {"day": DayOfWeek.WEDNESDAY, "period": 1, "start": dt_time(9, 0), "end": dt_time(9, 50), "type": SlotType.LECTURE, "sub": "CS302", "name": "Digital Logic", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.WEDNESDAY, "period": 2, "start": dt_time(10, 0), "end": dt_time(10, 50), "type": SlotType.LECTURE, "sub": "MA301", "name": "Mathematics III", "room": "LH-102", "bld": "Main Block"},
        {"day": DayOfWeek.WEDNESDAY, "period": 3, "start": dt_time(11, 0), "end": dt_time(11, 50), "type": SlotType.LECTURE, "sub": "CS303", "name": "Operating Systems", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.WEDNESDAY, "period": 4, "start": dt_time(12, 0), "end": dt_time(12, 50), "type": SlotType.BREAK, "sub": "", "name": "Lunch Break", "room": "Canteen", "bld": "Student Hub"},
        {"day": DayOfWeek.WEDNESDAY, "period": 5, "start": dt_time(14, 0), "end": dt_time(14, 50), "type": SlotType.LECTURE, "sub": "HU301", "name": "English", "room": "LH-103", "bld": "Main Block"},
        
        # Thursday
        {"day": DayOfWeek.THURSDAY, "period": 1, "start": dt_time(9, 0), "end": dt_time(9, 50), "type": SlotType.LECTURE, "sub": "MA301", "name": "Mathematics III", "room": "LH-102", "bld": "Main Block"},
        {"day": DayOfWeek.THURSDAY, "period": 2, "start": dt_time(10, 0), "end": dt_time(10, 50), "type": SlotType.LECTURE, "sub": "CS303", "name": "Operating Systems", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.THURSDAY, "period": 3, "start": dt_time(11, 0), "end": dt_time(11, 50), "type": SlotType.LECTURE, "sub": "CS301", "name": "Data Structures", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.THURSDAY, "period": 4, "start": dt_time(12, 0), "end": dt_time(12, 50), "type": SlotType.BREAK, "sub": "", "name": "Lunch Break", "room": "Canteen", "bld": "Student Hub"},
        {"day": DayOfWeek.THURSDAY, "period": 5, "start": dt_time(14, 0), "end": dt_time(15, 40), "type": SlotType.LAB, "sub": "CS302", "name": "Digital Logic Lab", "room": "Lab-202", "bld": "Lab Block"},
        
        # Friday
        {"day": DayOfWeek.FRIDAY, "period": 1, "start": dt_time(9, 0), "end": dt_time(9, 50), "type": SlotType.LECTURE, "sub": "HU301", "name": "English", "room": "LH-103", "bld": "Main Block"},
        {"day": DayOfWeek.FRIDAY, "period": 2, "start": dt_time(10, 0), "end": dt_time(10, 50), "type": SlotType.LECTURE, "sub": "CS302", "name": "Digital Logic", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.FRIDAY, "period": 3, "start": dt_time(11, 0), "end": dt_time(11, 50), "type": SlotType.LECTURE, "sub": "CS301", "name": "Data Structures", "room": "LH-101", "bld": "CSE Block"},
        {"day": DayOfWeek.FRIDAY, "period": 4, "start": dt_time(12, 0), "end": dt_time(12, 50), "type": SlotType.BREAK, "sub": "", "name": "Lunch Break", "room": "Canteen", "bld": "Student Hub"},
        {"day": DayOfWeek.FRIDAY, "period": 5, "start": dt_time(14, 0), "end": dt_time(14, 50), "type": SlotType.FREE, "sub": "", "name": "Library/Self Study", "room": "Library", "bld": "Student Hub"}
    ]
    
    for s_info in timetable_slots:
        slot = TimetableSlot(
            timetable_id=tt.id,
            day=s_info["day"],
            period_number=s_info["period"],
            start_time=s_info["start"],
            end_time=s_info["end"],
            slot_type=s_info["type"],
            subject_code=s_info["sub"],
            subject_name=s_info["name"],
            faculty_id=faculty_user.id if s_info["sub"] else None,
            faculty_name=faculty_user.full_name if s_info["sub"] else None,
            room_number=s_info["room"],
            building=s_info["bld"]
        )
        db.session.add(slot)
    
    db.session.commit()
    print("Timetable and Slots seeded!")

    # ── Portfolio for student1 ─────────────────────────────────────
    portfolio_data = {
        "name": students[0].full_name,
        "role": "Fullstack Developer",
        "bio": "A passionate developer building scalable apps with React and Node.js. Hackathon enthusiast and open-source contributor.",
        "education": f"B.Tech CSE - Veltech University ({students[0].batch_year})",
        "cgpa": str(students[0].cgpa or "8.5"),
        "skills": ["React", "TypeScript", "Node.js", "Python", "PostgreSQL", "Docker"],
        "projects": [
            {"title": "University Super-App", "desc": "A comprehensive campus management system."},
            {"title": "AI Portfolio Builder", "desc": "Auto-generates CVs from student data."},
        ],
        "experience": [
            {"company": "TechCorp", "role": "Frontend Intern", "duration": "Jun 2025 - Aug 2025"},
        ],
        "links": {"github": "https://github.com/mani", "linkedin": "https://linkedin.com/in/mani"},
    }
    db.session.add(Portfolio(
        user_id=students[0].id, template="modern",
        data_json=json_lib.dumps(portfolio_data),
        public_slug=f"{students[0].first_name.lower()}-{students[0].last_name.lower()}-{students[0].id[:6]}",
        is_public=True, view_count=12,
    ))
    db.session.commit()
    print("Portfolio seeded!")

    print("Database seeded successfully!")
    print("   Admin:   admin@veltech.edu.in / admin123!")
    print("   Faculty: faculty@veltech.edu.in / faculty123!")
    print("   Student: student1@veltech.edu.in / student123!")


@app.cli.command("attendance-alerts")
def run_attendance_alerts_cli():
    """Run the cron job to email students and mentors when attendance drops below 75%."""
    from app.services.attendance_service import AttendanceService
    print("Running attendance alerts check...")
    service = AttendanceService()
    result = service.run_attendance_alerts()
    print(f"Done! Alerts sent: {result['alerts_sent']}")


def start_attendance_scheduler(app_instance):
    """Start background scheduler for attendance warnings."""
    import threading
    import time
    import os

    # Avoid running twice in Flask debug mode (reloader parent process)
    if app_instance.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        return

    def run_scheduler():
        time.sleep(5)  # Wait for application startup
        with app_instance.app_context():
            from app.services.attendance_service import AttendanceService
            service = AttendanceService()
            app_instance.logger.info("[SCHEDULER] Background Attendance Alerts Scheduler Initialized.")
            while True:
                try:
                    app_instance.logger.info("[SCHEDULER] Running background check for low attendance...")
                    result = service.run_attendance_alerts()
                    app_instance.logger.info(f"[SCHEDULER] Background check complete. Warnings generated: {result['alerts_sent']}")
                except Exception as ex:
                    app_instance.logger.error(f"[SCHEDULER] Error in background attendance warning check: {str(ex)}")
                
                # Sleep for 12 hours
                time.sleep(43200)

    thread = threading.Thread(target=run_scheduler, daemon=True)
    thread.start()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "seed":
        with app.app_context():
            seed_db()
    else:
        start_attendance_scheduler(app)
        app.run(host="0.0.0.0", port=5000, debug=True)
