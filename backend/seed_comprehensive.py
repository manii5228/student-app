# =================================================================
#  VelTech University Super-App — Comprehensive Seeding Engine
# =================================================================
#  Seeding 40 Students (10/year, 4 depts), 40 Faculty (10/dept),
#  and all 14 database modules with realistic calculated values.
#  Generates 'student_login_credentials.csv' and 'faculty_login_credentials.csv'.
# =================================================================

import sys
import os
import random
import csv
from datetime import datetime, date, time, timedelta, timezone

# Ensure backend directory is in the import path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db
from app.models.user import User, UserRole, IDCardTemplate
from app.models.academic import Assignment, AssignmentSubmission, Result, Syllabus, ExamSchedule, CreditProgress, InternalMark, QuestionPaper
from app.models.career import TeamFinderProfile, SkillBadge, EarnedBadge, Project, Milestone, Portfolio, MockTest, MockTestQuestion, MockTestAttempt, JobPosting, JobApplication, SavedJob, InterviewSchedule, CompanyPrepQuestion, AlumniProfile, Internship
from app.models.campus import CanteenItem, CanteenOrder, Bus, LibraryBook, LibraryIssue, Event, EventRegistration, Notice, NoticeRead, Club, ClubMembership, ClubPost, ClubAttendance, Feedback, MarketListing, HostelPass, HealthAppointment, EmergencyAlert, Poll, PollVote
from app.models.timetable import Timetable, TimetableSlot

def generate_seeds():
    app = create_app()
    with app.app_context():
        print("Initializing comprehensive seeding engine...")
        print("Dropping existing database structures...")
        db.drop_all()
        db.create_all()

        # ── 1. ADMIN USER ─────────────────────────────────────────────
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
        db.session.flush()

        # ── 2. DEPARTMENTS & SUBJECT MATRICES ─────────────────────────
        depts = ["CSE", "ECE", "Mech", "Biomed"]
        
        # Structure of academic semesters (Semester 1 to 8)
        sem_subjects = {
            1: [
                {"code": "MA101", "name": "Mathematics I", "credits": 4},
                {"code": "PH101", "name": "Engineering Physics", "credits": 4},
                {"code": "EE101", "name": "Basic Electrical Engineering", "credits": 3},
                {"code": "CS101", "name": "Problem Solving & Programming", "credits": 4},
                {"code": "CS101L", "name": "Programming Lab", "credits": 2}
            ],
            2: [
                {"code": "MA102", "name": "Mathematics II", "credits": 4},
                {"code": "CY101", "name": "Engineering Chemistry", "credits": 4},
                {"code": "ME101", "name": "Engineering Graphics", "credits": 3},
                {"code": "CS102", "name": "Data Structures", "credits": 4},
                {"code": "CS102L", "name": "Data Structures Lab", "credits": 2}
            ],
            3: [
                {"code": "MA201", "name": "Discrete Mathematics", "credits": 4},
                {"code": "CS201", "name": "Object Oriented Programming", "credits": 3},
                {"code": "CS201L", "name": "OOP Lab", "credits": 2},
                {"code": "CS202", "name": "Digital Logic & Design", "credits": 4},
                {"code": "CS203", "name": "Computer Architecture", "credits": 3}
            ],
            4: [
                {"code": "CS301", "name": "Database Management Systems", "credits": 4},
                {"code": "CS301L", "name": "DBMS Lab", "credits": 2},
                {"code": "CS302", "name": "Operating Systems", "credits": 4},
                {"code": "CS303", "name": "Design & Analysis of Algorithms", "credits": 4},
                {"code": "HU301", "name": "Professional Ethics", "credits": 2}
            ],
            5: [
                {"code": "CS401", "name": "Computer Networks", "credits": 4},
                {"code": "CS401L", "name": "Networks Lab", "credits": 2},
                {"code": "CS402", "name": "Software Engineering", "credits": 3},
                {"code": "CS403", "name": "Formal Languages & Automata", "credits": 4},
                {"code": "CS499", "name": "Mini Project I", "credits": 3}
            ],
            6: [
                {"code": "CS501", "name": "Compiler Design", "credits": 4},
                {"code": "CS502", "name": "Artificial Intelligence", "credits": 4},
                {"code": "CS503", "name": "Web Technologies", "credits": 3},
                {"code": "CS503L", "name": "Web Tech Lab", "credits": 2},
                {"code": "HU501", "name": "English & Communication", "credits": 2}
            ],
            7: [
                {"code": "CS601", "name": "Cloud Computing & Services", "credits": 4},
                {"code": "CS602", "name": "Cryptography & Network Security", "credits": 4},
                {"code": "CS603", "name": "Machine Learning", "credits": 4},
                {"code": "CS699", "name": "Capstone Project Phase I", "credits": 4}
            ],
            8: [
                {"code": "CS701", "name": "Cyber Security & Forensic Audits", "credits": 3},
                {"code": "CS702", "name": "Professional Elective IV", "credits": 3},
                {"code": "CS799", "name": "Capstone Project Phase II", "credits": 10}
            ]
        }

        # ── 3. FACULTY DATA (10 per dept, 40 total) ───────────────────
        print("Generating 40 faculty members (10 per department)...")
        fac_firsts = ["Amit", "Ramesh", "Suresh", "Sunita", "Anjali", "Vikram", "Preeti", "Sanjay", "Rajesh", "Pooja"]
        fac_lasts = ["Kumar", "Sharma", "Rao", "Patil", "Naidu", "Gill", "Mehta", "Sanon", "Verma", "Sen"]
        
        fac_list = []
        fac_credentials = []

        for d in depts:
            for i in range(1, 11):
                f_idx = i - 1
                email = f"faculty_{d.lower()}{i}@veltech.edu.in"
                emp_id = f"VT{d}FAC{100+i}"
                first_name = fac_firsts[f_idx]
                last_name = fac_lasts[f_idx]
                
                fac = User(
                    email=email,
                    role=UserRole.FACULTY,
                    first_name=first_name,
                    last_name=last_name,
                    department=d,
                    employee_id=emp_id,
                    designation="Associate Professor" if i % 3 == 0 else "Professor" if i % 4 == 0 else "Assistant Professor",
                    specialization=f"Advanced {d} Research & Methods",
                    research_interests=f"Distributed Systems, {d} Analytics, Applied Machine Learning",
                    office_location=f"{d}-Block Cabin {200+i}",
                    office_hours="Mon-Wed 2:00 PM - 4:00 PM",
                    is_verified=True,
                )
                fac.set_password("faculty123!")
                db.session.add(fac)
                fac_list.append(fac)
                fac_credentials.append({"Email": email, "Password": "faculty123!", "Role": "Faculty", "Name": fac.full_name, "Department": d})
        db.session.flush()

        # ── 4. STUDENT DATA (10 per year, 4 depts, 40 total) ──────────
        print("Generating 40 student profiles (10 per academic year)...")
        stud_firsts = ["Mani", "Arjun", "Neha", "Aditya", "Riya", "Vikram", "Karan", "Rohan", "Ananya", "Pooja", 
                       "Rahul", "Kabir", "Kriti", "Sneha", "Simran", "Varun", "Priya", "Kartik", "Deepak", "Shreya",
                       "Siddharth", "Gautam", "Alia", "Ranbir", "Katrina", "Vicky", "Kiara", "Sidharth", "Shraddha", "Raj",
                       "Rhea", "Ishaan", "Janhvi", "Sara", "Karthik", "Vijay", "Surya", "Ajith", "Dhanush", "Vikram"]
        stud_lasts = ["Manjunath", "Reddy", "Sharma", "Verma", "Sen", "Singh", "Johar", "Mehra", "Patel", "Hegde",
                      "Mehta", "Thapar", "Sanon", "Nair", "Gill", "Dhawan", "Kapoor", "Roy", "Joshi", "Bhatt",
                      "Malhotra", "Gambhir", "Bhatt", "Kapoor", "Kaif", "Kaushal", "Advani", "Malhotra", "Kapoor", "Kumar",
                      "Chakraborty", "Khatter", "Kapoor", "Ali Khan", "Aaryan", "Deverakonda", "Sivakumar", "Kumar", "Raja", "Prabhu"]
        
        student_list = []
        student_credentials = []

        # Create 10 students for Year 1, 2, 3, 4
        # Semesters: Year 1 = Sem 2, Year 2 = Sem 4, Year 3 = Sem 6, Year 4 = Sem 8
        year_mapping = {
            1: {"sem": 2, "batch": 2025},
            2: {"sem": 4, "batch": 2024},
            3: {"sem": 6, "batch": 2023},
            4: {"sem": 8, "batch": 2022}
        }

        # Distribute students across 4 departments (CSE, ECE, Mech, Biomed)
        for s_idx in range(40):
            # Academic Year (1 to 4)
            acad_year = (s_idx // 10) + 1
            sem = year_mapping[acad_year]["sem"]
            batch = year_mapping[acad_year]["batch"]
            
            # Department distribution
            d_idx = s_idx % 4
            d = depts[d_idx]
            
            email = f"student{s_idx+1}@veltech.edu.in"
            roll = f"22{d}{100+s_idx}"
            first_name = stud_firsts[s_idx]
            last_name = stud_lasts[s_idx]
            
            # Department-specific skills
            dept_skills = {
                "CSE": ["React", "TypeScript", "Node.js", "Python", "SQL", "Git"],
                "ECE": ["VHDL", "Verilog", "Embedded C", "MATLAB", "Arduino", "IoT"],
                "Mech": ["AutoCAD", "SolidWorks", "Ansys", "Thermodynamics", "Fusion 360"],
                "Biomed": ["Bio-sensors", "Medical Imaging", "LabVIEW", "Bio-signal Processing", "MATLAB"]
            }
            skills_list = dept_skills.get(d, ["Git", "Communication"])
            import json as json_lib

            student = User(
                email=email,
                role=UserRole.STUDENT,
                first_name=first_name,
                last_name=last_name,
                department=d,
                roll_number=roll,
                hostel_status="hosteler" if s_idx % 2 == 0 else "dayscholar",
                semester=sem,
                section="A" if s_idx % 2 == 0 else "B",
                batch_year=batch,
                cgpa=round(random.uniform(7.0, 9.8), 2),
                is_verified=True,
                skills=json_lib.dumps(skills_list)
            )
            student.set_password("student123!")
            
            # Assign mentor
            mentor = next((f for f in fac_list if f.department == d), fac_list[0])
            student.mentor_id = mentor.id
            
            db.session.add(student)
            student_list.append(student)
            student_credentials.append({"Email": email, "Password": "student123!", "Role": "Student", "Name": student.full_name, "Year": f"Year {acad_year}", "Department": d})
        db.session.flush()

        # ── 5. COMPREHENSIVE ACADEMIC RECORDS (SGPA/CGPA history) ─────
        print("Generating semester results history & calculations for all students...")
        grade_points = {"O": 10.0, "A+": 9.0, "A": 8.0, "B+": 7.5, "B": 7.0, "C": 6.0, "RA": 0.0}
        grades = list(grade_points.keys())[:-1] # Exclude RA for clean passing data

        for s_idx, student in enumerate(student_list):
            curr_sem = student.semester
            
            # Add results for all previous semesters!
            for prev_sem in range(1, curr_sem):
                subjects = sem_subjects.get(prev_sem, sem_subjects[1])
                total_credits = 0
                weighted_sum = 0.0
                
                for sub in subjects:
                    c = sub["credits"]
                    g = random.choice(grades)
                    gp = grade_points[g]
                    
                    res = Result(
                        student_id=student.id,
                        semester=prev_sem,
                        subject_code=sub["code"],
                        subject_name=sub["name"],
                        credits=c,
                        grade=g,
                        grade_points=gp,
                        exam_type="regular",
                        published=True
                    )
                    db.session.add(res)
                    total_credits += c
                    weighted_sum += gp * c
                
                # Register Credit Progress
                sgpa = round(weighted_sum / total_credits, 2) if total_credits else 0.0
                
            # Create core credit progress record
            db.session.add(CreditProgress(
                student_id=student.id,
                total_required=160,
                total_earned=min((curr_sem - 1) * 20, 160),
                core_earned=min((curr_sem - 1) * 12, 100),
                elective_earned=min((curr_sem - 1) * 4, 30),
                lab_earned=min((curr_sem - 1) * 4, 30)
            ))
            
            # ── Internal Marks Seeding ──
            curr_subs = sem_subjects.get(curr_sem, sem_subjects[1])
            for sub in curr_subs:
                for test in ["cat1", "cat2", "model"]:
                    db.session.add(InternalMark(
                        student_id=student.id,
                        subject_code=sub["code"],
                        subject_name=sub["name"],
                        semester=curr_sem,
                        test_type=test,
                        max_marks=50.0,
                        marks_obtained=round(random.uniform(28.0, 48.0), 1),
                        faculty_id=student.mentor_id
                    ))
        db.session.commit()

        # ── 6. TIMETABLE MANAGEMENT (Split Batch Schedules) ───────────
        print("Generating timetables & split-batch theory/lab slots...")
        for d in depts:
            for yr in range(1, 5):
                sem = year_mapping[yr]["sem"]
                batch = year_mapping[yr]["batch"]
                
                tt = Timetable(
                    name=f"{d} Year-{yr} Sem-{sem}",
                    department=d,
                    semester=sem,
                    section="A",
                    academic_year="2025-2026",
                    is_active=True,
                    is_published=True
                )
                db.session.add(tt)
                db.session.flush()
                
                # Fetch students of this year/dept and split into Group 1 and Group 2 (batches of 5)
                dept_yr_students = [s for s in student_list if s.department == d and s.semester == sem]
                g1 = dept_yr_students[:5]
                g2 = dept_yr_students[5:]
                
                subs = sem_subjects.get(sem, sem_subjects[1])
                days = ["monday", "tuesday", "wednesday", "thursday", "friday"]
                
                # Generate slots
                for slot_idx, sub in enumerate(subs):
                    day = days[slot_idx % len(days)]
                    # Split scheduling for labs vs theory
                    if "L" in sub["code"]:
                        # Group 1 has lab on Mon, Group 2 on Tue
                        db.session.add(TimetableSlot(
                            timetable_id=tt.id, day=day, period_number=5,
                            start_time=time(14, 0), end_time=time(15, 40),
                            slot_type="lab", subject_code=sub["code"],
                            subject_name=f"{sub['name']} (Group 1)",
                            room_number="Lab-101", building=f"{d} Block"
                        ))
                        db.session.add(TimetableSlot(
                            timetable_id=tt.id, day=days[(slot_idx + 1) % len(days)], period_number=5,
                            start_time=time(14, 0), end_time=time(15, 40),
                            slot_type="lab", subject_code=sub["code"],
                            subject_name=f"{sub['name']} (Group 2)",
                            room_number="Lab-102", building=f"{d} Block"
                        ))
                    else:
                        db.session.add(TimetableSlot(
                            timetable_id=tt.id, day=day, period_number=slot_idx + 1,
                            start_time=time(9 + slot_idx, 0), end_time=time(9 + slot_idx, 50),
                            slot_type="lecture", subject_code=sub["code"], subject_name=sub["name"],
                            room_number=f"LH-{100+yr}", building="Main Block"
                        ))
        db.session.commit()

        # ── 7. EXAMINATION SCHEDULES ──────────────────────────────────
        print("Generating multi-tier exam schedules...")
        exam_types = ["internal_exam", "mid_semester", "end_semester", "model_paper", "placement_aptitude"]
        for d in depts:
            for yr in range(1, 5):
                sem = year_mapping[yr]["sem"]
                subs = sem_subjects.get(sem, sem_subjects[1])
                
                for idx, sub in enumerate(subs):
                    for etype in exam_types:
                        offset = exam_types.index(etype)
                        db.session.add(ExamSchedule(
                            subject_code=sub["code"],
                            subject_name=sub["name"],
                            department=d,
                            semester=sem,
                            exam_date=date.today() + timedelta(days=20 + idx + offset * 5),
                            start_time=time(9, 30),
                            end_time=time(12, 30),
                            room_number=f"LH-{300+idx}",
                            building="Central Exam Hall",
                            exam_type=etype
                        ))
        db.session.commit()

        # ── 8. LIBRARY PORTAL DATA ────────────────────────────────────
        print("Seeding library collection & transactions...")
        categories = ['Engineering', 'Science', 'Mathematics', 'Computer Science', 'Literature', 'Reference']
        category_books = {
            'Engineering': [
                'Introduction to Civil Engineering',
                'Fundamentals of Thermodynamics',
                'Fluid Mechanics & Machinery',
                'Structural Analysis and Design',
                'Engineering Mechanics: Statics',
                'Principles of Electrical Engineering',
                'Mechanical Vibrations',
                'Control Systems Engineering',
                'Advanced Material Science',
                'Manufacturing Technology'
            ],
            'Science': [
                'University Chemistry: Principles & Applications',
                'Introduction to Solid State Physics',
                'Organic Chemistry: Structure and Function',
                'Modern Biophysics',
                'Quantum Mechanics for Scientists',
                'Electromagnetic Fields and Waves',
                'Genetics and Molecular Biology',
                'Environmental Science & Ecology',
                'Principles of Biochemistry',
                'Astronomy: A Physical Perspective'
            ],
            'Mathematics': [
                'Advanced Engineering Mathematics',
                'Linear Algebra and Its Applications',
                'Calculus: Early Transcendentals',
                'Probability & Statistics for Engineers',
                'Discrete Mathematics & Its Foundations',
                'Differential Equations & Boundary Value Problems',
                'Numerical Methods for Scientists',
                'Complex Variables & Applications',
                'Abstract Algebra: A First Course',
                'Mathematical Analysis'
            ],
            'Computer Science': [
                'Introduction to Algorithms',
                'Database System Concepts',
                'Operating System Concepts',
                'Computer Networks: A Systems Approach',
                'Artificial Intelligence: A Modern Approach',
                'Compilers: Principles, Techniques, and Tools',
                'Software Engineering: A Practitioner\'s Approach',
                'Design Patterns: Elements of Reusable Object-Oriented Software',
                'Computer Graphics: Principles and Practice',
                'Computer Organization and Architecture'
            ],
            'Literature': [
                'The Great Gatsby',
                'To Kill a Mockingbird',
                '1984',
                'Pride and Prejudice',
                'Hamlet: Shakespeare Classics',
                'The Odyssey of Homer',
                'Crime and Punishment',
                'One Hundred Years of Solitude',
                'The Catcher in the Rye',
                'Moby Dick'
            ],
            'Reference': [
                'Oxford English Dictionary',
                'Encyclopedia of Science & Technology',
                'CRC Handbook of Chemistry and Physics',
                'The Elements of Style',
                'IEEE Standards Association Handbook',
                'ACM Computing Classification System Guide',
                'Manual of Structural Design Standards',
                'Pocket Guide to Mathematical Formulas',
                'Medical Dictionary & Clinical Reference Handbook',
                'Wikipedia Selected Archives Collection'
            ]
        }
        book_counter = 0
        for d in depts:
            for i in range(1, 15):
                book_counter += 1
                cat_val = categories[book_counter % len(categories)]
                title_list = category_books[cat_val]
                title_idx = (book_counter + i) % len(title_list)
                title = f"{title_list[title_idx]} - Edition {1 + (book_counter % 3)}"
                author = f"Prof. {stud_firsts[book_counter % len(stud_firsts)]} {stud_lasts[book_counter % len(stud_lasts)]}"
                isbn = f"978-3-16-14{10000 + book_counter}"
                
                book = LibraryBook(
                    title=title, author=author, isbn=isbn,
                    category=cat_val,
                    total_copies=5, available_copies=4,
                    shelf_location=f"{d}-Rack {i}"
                )
                db.session.add(book)
                db.session.flush()
                
                # Active issue transaction
                db.session.add(LibraryIssue(
                    book_id=book.id,
                    student_id=student_list[i % len(student_list)].id,
                    issued_date=date.today() - timedelta(days=5),
                    due_date=date.today() + timedelta(days=10)
                ))
        db.session.commit()

        # ── 9. PLACEMENT AND JOB PORTAL ────────────────────────────────
        print("Generating job openings & recommendations for 4th years...")
        job_domains = ["Software Development", "Cloud Architect", "VLSI Design", "Embedded Systems", "Product Management"]
        tech_stacks = ["React/Node.js/PostgreSQL", "Python/Django/AWS", "Verilog/SystemVerilog", "C++/RTOS/Microcontrollers", "Python/PyTorch/Docker"]
        companies = ["Google", "Microsoft", "Intel", "Qualcomm", "Amazon", "Capgemini", "Tata Consultancy Services"]

        job_postings_list = []
        for idx, comp in enumerate(companies):
            domain = job_domains[idx % len(job_domains)]
            stack = tech_stacks[idx % len(tech_stacks)]
            
            job = JobPosting(
                company_name=comp,
                role_title=f"Graduate Engineer Trainee - {domain}",
                description=f"Join the core team at {comp}. Require expertise in {stack}. Minimum CGPA: 8.0.",
                package_lpa=round(random.uniform(8.0, 24.0), 1),
                min_cgpa=8.0,
                eligible_departments="CSE,ECE",
                eligible_batch_year=2022,
                drive_date=date.today() + timedelta(days=15),
                last_date_apply=date.today() + timedelta(days=10),
                job_type="placement" if idx % 2 == 0 else "internship",
                is_active=True
            )
            db.session.add(job)
            job_postings_list.append(job)
        db.session.commit()

        # ── 10. PREVIOUS YEAR QUESTION PAPERS (PYQs) ───────────────────
        print("Generating previous year question papers...")
        for d in depts:
            for yr in range(1, 5):
                sem = year_mapping[yr]["sem"]
                subs = sem_subjects.get(sem, sem_subjects[1])
                
                for sub in subs:
                    for etype in exam_types:
                        db.session.add(QuestionPaper(
                            subject_code=sub["code"],
                            subject_name=sub["name"],
                            department=d,
                            semester=sem,
                            year=2024,
                            exam_type=etype,
                            file_url=f"https://cdn.veltech.edu.in/pyqs/{sub['code']}_2024_{etype}.pdf",
                            file_size_kb=345,
                            download_count=12
                        ))
        db.session.commit()

        # ── 11. SYLLABUS MANAGEMENT ──────────────────────────────────
        print("Seeding active syllabus templates...")
        for d in depts:
            for yr in range(1, 5):
                sem = year_mapping[yr]["sem"]
                subs = sem_subjects.get(sem, sem_subjects[1])
                
                for sub in subs:
                    for unit_idx in range(1, 6):
                        db.session.add(Syllabus(
                            subject_code=sub["code"],
                            subject_name=sub["name"],
                            department=d,
                            semester=sem,
                            unit_number=unit_idx,
                            unit_title=f"Unit {unit_idx}: Core Concepts of {sub['name']}",
                            topics=f"Introduction to {sub['name']}, fundamentals, deep dives, practical exercises and advanced usecases.",
                            hours=10,
                            is_completed=(unit_idx < 4),
                            academic_year="2025-2026",
                            version=1
                        ))
        db.session.commit()

        # ── 12. REFERRAL SYSTEM ───────────────────────────────────────
        print("Generating alumni referral opportunities...")
        alumni_companies = ["Meta", "Netflix", "Google", "Oracle", "Nvidia", "TCS"]
        for idx, comp in enumerate(alumni_companies):
            db.session.add(AlumniProfile(
                name=f"Alumni {stud_firsts[idx]} {stud_lasts[idx]}",
                email=f"alumni{idx}@gmail.com",
                batch_year=2020 - idx,
                department=depts[idx % len(depts)],
                company=comp,
                designation="Senior Software Engineer" if idx % 2 == 0 else "Staff Hardware Engineer",
                linkedin_url=f"https://linkedin.com/in/alumni{idx}",
                is_open_to_referral=True
            ))
        db.session.commit()

        # ── 13. TEAM FINDER MODULE ────────────────────────────────────
        print("Generating profiles & collaboration swiping data...")
        student_skills = ["React,TypeScript,Tailwind", "Python,FastAPI,SQL", "Figma,UI/UX,React", "C++,Embedded,RTOS"]
        for i in range(15):
            db.session.add(TeamFinderProfile(
                user_id=student_list[i].id,
                skills=student_skills[i % len(student_skills)],
                looking_for="Looking for collaborators for research projects and hackathons",
                bio="Passionate engineer exploring cutting-edge web and system tech."
            ))
        db.session.commit()

        # ── 14. SKILL BADGE SYSTEM ────────────────────────────────────
        print("Creating skill badge reward system...")
        badges_data = [
            {"name": "Python Developer", "desc": "Mastered scripting, algorithms & OOP in Python", "icon": "terminal", "color": "#4f46e5"},
            {"name": "Web Development", "desc": "Built and deployed rich responsive frontends in React", "icon": "globe", "color": "#06b6d4"},
            {"name": "Machine Learning", "desc": "Trained and optimized deep neural network weights", "icon": "brain", "color": "#ec4899"},
            {"name": "Data Analytics", "desc": "Analyzed complex datasets using Pandas & Numpy", "icon": "bar-chart", "color": "#10b981"},
            {"name": "Cloud Computing", "desc": "Successfully configured pipelines on AWS or GCP", "icon": "cloud", "color": "#eab308"},
            {"name": "Problem Solving", "desc": "Solved 250+ technical logic algorithm tasks", "icon": "cpu", "color": "#f97316"},
            {"name": "Volunteer Excellence", "desc": "Earned by completing 30+ hours of verified volunteering and event coordination duty.", "icon": "award", "color": "#eab308", "category": "soft_skill"}
        ]
        
        badges = []
        for bd in badges_data:
            badge = SkillBadge(
                name=bd["name"], description=bd["desc"], 
                category=bd.get("category", "technical"),
                icon=bd["icon"], color=bd["color"], 
                points=100 if bd.get("category") == "soft_skill" else 50,
                criteria="Complete at least 30 hours of verified volunteering duty." if bd.get("category") == "soft_skill" else "Complete all course works and project submissions with O grades."
            )
            db.session.add(badge)
            badges.append(badge)
        db.session.flush()

        # Award badges to students
        for s in student_list[:15]:
            db.session.add(EarnedBadge(
                student_id=s.id,
                badge_id=random.choice(badges).id,
                awarded_by=admin.id,
                note="Awarded for academic excellence and top results."
            ))
        db.session.commit()

        # Seed Portfolio for student_list[0] (Mani)
        import json as json_lib
        portfolio_data = {
            "name": student_list[0].full_name,
            "role": "Fullstack Developer",
            "bio": "A passionate developer building scalable apps with React and Node.js. Hackathon enthusiast and open-source contributor.",
            "education": f"B.Tech CSE - Veltech University ({student_list[0].batch_year})",
            "cgpa": str(student_list[0].cgpa or "8.5"),
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
            user_id=student_list[0].id, template="modern",
            data_json=json_lib.dumps(portfolio_data),
            public_slug=f"{student_list[0].first_name.lower()}-{student_list[0].last_name.lower()}-{student_list[0].id[:6]}",
            is_public=True, view_count=12,
        ))
        db.session.commit()

        # Seed Projects and Milestones for student_list[0] (Mani)
        p1 = Project(
            student_id=student_list[0].id,
            title="University Super-App",
            description="A comprehensive campus management system built with React, Flask, and SQLite.",
            subject_code="CS699",
            team_members="Mani Manjunath, Arjun Reddy",
            deadline=date.today() + timedelta(days=15),
            status="in_progress",
            progress_pct=50,
            faculty_id=fac_list[0].id, # CSE faculty
            faculty_status="approved"
        )
        p2 = Project(
            student_id=student_list[0].id,
            title="AI Portfolio Builder",
            description="Auto-generates CVs from student profile data and allows templates rendering.",
            subject_code="CS503",
            team_members="Mani Manjunath",
            deadline=date.today() - timedelta(days=5),
            status="completed",
            progress_pct=100,
            faculty_id=fac_list[0].id, # CSE faculty
            faculty_status="completed"
        )
        db.session.add_all([p1, p2])
        db.session.flush()

        # Seed Milestones
        db.session.add(Milestone(
            project_id=p1.id,
            title="Database Schema Design",
            due_date=date.today() - timedelta(days=5),
            is_completed=True,
            column="done",
            assigned_to="Mani Manjunath"
        ))
        db.session.add(Milestone(
            project_id=p1.id,
            title="Frontend UI Implementation",
            due_date=date.today() + timedelta(days=2),
            is_completed=False,
            column="in_progress",
            assigned_to="Arjun Reddy"
        ))
        db.session.add(Milestone(
            project_id=p1.id,
            title="API Endpoints Testing",
            due_date=date.today() + timedelta(days=10),
            is_completed=False,
            column="todo",
            assigned_to="Mani Manjunath"
        ))
        
        db.session.add(Milestone(
            project_id=p2.id,
            title="Create ATS Template Parser",
            due_date=date.today() - timedelta(days=10),
            is_completed=True,
            column="done",
            assigned_to="Mani Manjunath"
        ))
        db.session.commit()

        # ── 15. COMPANY PREPARATION & MOCK TEST ───────────────────────
        print("Creating company prep & mock test modules...")
        prep_questions = [
            {"comp": "Google", "q": "Explain how a hash map resolves collisions using separate chaining vs linear probing. What is the time complexity in both cases?"},
            {"comp": "Microsoft", "q": "Given a binary tree, write a function to return its level order traversal. Explain spatial complexity of the queue-based implementation."},
            {"comp": "Qualcomm", "q": "What is the difference between a mutex and a semaphore? In what scenarios would you choose one over the other in RTOS?"}
        ]
        for pq in prep_questions:
            db.session.add(CompanyPrepQuestion(
                company_name=pq["comp"],
                question_text=pq["q"],
                category="technical",
                year=2024,
                upvotes=15
            ))
            
        # Create mock tests
        test1 = MockTest(
            title="Academic & Programming Mock Assessment I",
            description="Assess your logic, data structure, and technical aptitude. Consist of core programming questions.",
            category="aptitude",
            duration_minutes=30,
            total_questions=3,
            difficulty="medium",
            is_active=True
        )
        test2 = MockTest(
            title="Advanced Java & Core CS Fundamentals",
            description="Comprehensive mock evaluating OOP design, threading, JVM garbage collection, and database systems.",
            category="technical",
            duration_minutes=45,
            total_questions=5,
            difficulty="hard",
            is_active=True
        )
        test3 = MockTest(
            title="Quantitative & Analytical Reasoning",
            description="Speed test on permutations, combinations, work-time speed, probability, and logical deduction.",
            category="aptitude",
            duration_minutes=20,
            total_questions=5,
            difficulty="easy",
            is_active=True
        )
        test4 = MockTest(
            title="Full Stack Web & System Architecture",
            description="Assessments on system boundaries, load balancers, HTTP/2, REST API paradigms, and SQL optimization.",
            category="coding",
            duration_minutes=40,
            total_questions=4,
            difficulty="medium",
            is_active=True
        )
        db.session.add_all([test1, test2, test3, test4])
        db.session.flush()
        
        # Add questions to mock tests
        questions1 = [
            {"text": "What is the worst case complexity of Quick Sort?", "a": "O(N)", "b": "O(N log N)", "c": "O(N^2)", "d": "O(2^N)", "ans": "c"},
            {"text": "Which data structure operates on a Last In First Out (LIFO) basis?", "a": "Queue", "b": "Stack", "c": "Tree", "d": "Graph", "ans": "b"},
            {"text": "Which of the following is not an operating system?", "a": "Linux", "b": "Windows", "c": "Oracle", "d": "macOS", "ans": "c"}
        ]
        for idx, q in enumerate(questions1):
            db.session.add(MockTestQuestion(
                test_id=test1.id, question_text=q["text"],
                option_a=q["a"], option_b=q["b"], option_c=q["c"], option_d=q["d"],
                correct_option=q["ans"], explanation="Refer to basic programming notes.",
                order_num=idx + 1
            ))

        questions2 = [
            {"text": "Which collection in Java does not allow duplicate elements?", "a": "List", "b": "Set", "c": "Map", "d": "Vector", "ans": "b"},
            {"text": "Which of the following creates a thread in Java?", "a": "By implementing Runnable interface", "b": "By extending Thread class", "c": "Both A and B", "d": "None of these", "ans": "c"},
            {"text": "What is the main purpose of garbage collection in Java?", "a": "To free unreferenced memory", "b": "To clear memory buffer manually", "c": "To compile code faster", "d": "To restrict variable scopes", "ans": "a"},
            {"text": "What is isolation level in database transactions primarily resolving?", "a": "Concurrency interference issues", "b": "Disk write permanent failures", "c": "Incorrect syntax checks", "d": "Table column size constraints", "ans": "a"},
            {"text": "What is the time complexity to search an element in a balanced Binary Search Tree?", "a": "O(1)", "b": "O(log N)", "c": "O(N)", "d": "O(N log N)", "ans": "b"}
        ]
        for idx, q in enumerate(questions2):
            db.session.add(MockTestQuestion(
                test_id=test2.id, question_text=q["text"],
                option_a=q["a"], option_b=q["b"], option_c=q["c"], option_d=q["d"],
                correct_option=q["ans"], explanation="OOP and data structure foundations.",
                order_num=idx + 1
            ))
            
        db.session.commit()

        # Seed Mock Test Attempts for Mani
        mani_student = student_list[0]
        db.session.add(MockTestAttempt(
            test_id=test1.id,
            student_id=mani_student.id,
            answers_json='{}',
            score=2,
            total=3,
            time_taken_seconds=480,
            completed_at=datetime.now() - timedelta(days=3)
        ))
        db.session.add(MockTestAttempt(
            test_id=test3.id,
            student_id=mani_student.id,
            answers_json='{}',
            score=4,
            total=5,
            time_taken_seconds=320,
            completed_at=datetime.now() - timedelta(days=1)
        ))

        # Seed Internships for Mani
        db.session.add(Internship(
            student_id=mani_student.id,
            company_name="Google",
            role_title="Software Engineer Intern",
            description="Developing high-performance, real-time backend microservices in Go.",
            start_date=date.today() - timedelta(days=30),
            stipend=75000.0,
            mode="hybrid",
            status="ongoing",
            skills_learned="Go, Kubernetes, Protobuf",
            is_verified=True
        ))
        db.session.add(Internship(
            student_id=mani_student.id,
            company_name="Microsoft",
            role_title="Product Manager Intern",
            description="Leading client console analytics tool specifications and dashboard designs.",
            start_date=date.today() - timedelta(days=365),
            end_date=date.today() - timedelta(days=275),
            stipend=65000.0,
            mode="onsite",
            certificate_url="https://veltech.edu.in/certificates/ms_intern.pdf",
            status="completed",
            skills_learned="Product Specs, Azure, UI Design",
            is_verified=True
        ))

        # Seed Interview Schedules for Mani
        deloitte_job = next((j for j in job_postings_list if j.company_name == "Tata Consultancy Services"), job_postings_list[3])
        amazon_job = next((j for j in job_postings_list if j.company_name == "Amazon"), job_postings_list[4])
        google_job = next((j for j in job_postings_list if j.company_name == "Google"), job_postings_list[0])

        db.session.add(InterviewSchedule(
            posting_id=deloitte_job.id,
            student_id=mani_student.id,
            round_name="TCS Digital Interview - Technical Round 1",
            scheduled_at=datetime.now() + timedelta(days=2),
            venue="Main Block Cabin 104",
            status="scheduled"
        ))
        db.session.add(InterviewSchedule(
            posting_id=amazon_job.id,
            student_id=mani_student.id,
            round_name="Amazon SDE-1 Aptitude Screening",
            scheduled_at=datetime.now() - timedelta(days=5),
            venue="Online Test Center",
            status="completed"
        ))
        db.session.add(InterviewSchedule(
            posting_id=google_job.id,
            student_id=mani_student.id,
            round_name="Google SWE Intern Coding Assessment",
            scheduled_at=datetime.now() + timedelta(days=5),
            venue="Google Meet Room 4",
            status="scheduled"
        ))
        db.session.commit()

        # Seed default ID card templates
        db.session.add(IDCardTemplate(
            role_type='student',
            college_name='VelTech University',
            background_style='classic-navy',
            primary_color='#22346c',
            accent_color='#0080c7'
        ))
        db.session.add(IDCardTemplate(
            role_type='faculty',
            college_name='VelTech University Faculty',
            background_style='elegant-dark',
            primary_color='#0f172a',
            accent_color='#27bcd1'
        ))
        db.session.commit()

        # Seed default clubs
        print("Seeding technical and cultural clubs...")
        default_clubs = [
            {"id": "codechef", "name": "CodeChef Chapter", "description": "Weekly CP ladders, contest discussions, and ICPC prep.", "club_type": "technical", "website_url": "https://chat.whatsapp.com/mock-codechef", "instagram_url": "https://instagram.com/veltech_codechef"},
            {"id": "robotics", "name": "Robotics Society", "description": "Autonomous bots, drone builds, and embedded systems labs.", "club_type": "technical", "website_url": "https://chat.whatsapp.com/mock-robotics", "instagram_url": "https://instagram.com/veltech_robotics"},
            {"id": "gdsc", "name": "Developer Student Club", "description": "Cloud, Android, web workshops, and product build sprints.", "club_type": "technical", "website_url": "https://chat.whatsapp.com/mock-gdsc", "instagram_url": "https://instagram.com/veltech_gdsc"},
            {"id": "finearts", "name": "Fine Arts Forum", "description": "Poster design, stage props, murals, and event branding.", "club_type": "cultural", "website_url": "https://chat.whatsapp.com/mock-finearts", "instagram_url": "https://instagram.com/veltech_finearts"},
            {"id": "radio", "name": "Campus Radio", "description": "Host shows, record interviews, and handle event announcements.", "club_type": "media", "website_url": "https://chat.whatsapp.com/mock-radio", "instagram_url": "https://instagram.com/veltech_radio"}
        ]
        for c_data in default_clubs:
            club = Club(
                id=c_data["id"],
                name=c_data["name"],
                description=c_data["description"],
                club_type=c_data["club_type"],
                is_active=True,
                member_count=random.randint(40, 200),
                website_url=c_data["website_url"],
                instagram_url=c_data["instagram_url"]
            )
            db.session.add(club)
        db.session.commit()

        # Seed notices board
        print("Seeding Notice Board...")
        import json
        notices_data = [
            {
                "title": "End Semester Exams Schedule - June 2026",
                "content": "The timetable for final exams starting June 15, 2026 has been published. Please check the Exam Schedule section for detailed timings.",
                "priority": "high",
                "target_audience": "all",
                "is_pinned": True,
                "files": [{"name": "Exam_Timetable_June2026.pdf", "type": "pdf", "size": "450 KB"}]
            },
            {
                "title": "Academic Calendar 2026-27 Approved",
                "content": "The revised academic calendar for the next session is now available for download. All departments please note registration dates.",
                "priority": "normal",
                "target_audience": "all",
                "is_pinned": False,
                "files": [{"name": "Academic_Calendar_26_27.xlsx", "type": "excel", "size": "1.2 MB"}]
            },
            {
                "title": "Placement Drive - Oracle",
                "content": "Oracle recruiting drive for CSE and ECE 2026 batch. Registered students must attend the pre-placement talk tomorrow at 10 AM in the Seminar Hall.",
                "priority": "high",
                "target_audience": "all",
                "is_pinned": True,
                "files": [{"name": "Oracle_Eligibility_List.pdf", "type": "pdf", "size": "850 KB"}]
            }
        ]
        for n_data in notices_data:
            notice = Notice(
                title=n_data["title"],
                content=n_data["content"],
                author_id=admin.id,
                priority=n_data["priority"],
                target_audience=n_data["target_audience"],
                is_pinned=n_data["is_pinned"],
                files_json=json.dumps(n_data["files"])
            )
            db.session.add(notice)
        db.session.commit()

        # Seed default flashcards
        from app.models.career import Flashcard
        default_fcs = [
            # Company Prep
            {"front": "What is the time complexity of Quick Sort in the worst case?", "back": "O(N^2). This happens when the pivot chosen is always the extreme element.", "cat": "Algorithms", "type": "company_prep"},
            {"front": "Explain CAP Theorem in Distributed Databases.", "back": "Consistency, Availability, and Partition Tolerance. A distributed system can only provide 2 of these guarantees simultaneously.", "cat": "System Design", "type": "company_prep"},
            {"front": "What is polymorphism in Object Oriented Programming?", "back": "Polymorphism allows objects of different classes to be treated as objects of a common superclass. Primarily implemented via overriding and overloading.", "cat": "OOP Concepts", "type": "company_prep"},
            # Mock Test Revision
            {"front": "What is the primary difference between TCP and UDP?", "back": "TCP is connection-oriented, reliable, and guarantees packet delivery order. UDP is connectionless, faster, but does not guarantee delivery or packet order.", "cat": "Computer Networks", "type": "mock_test"},
            {"front": "Explain ACID properties of Database Management Systems.", "back": "Atomicity (all or nothing), Consistency (preserves database integrity), Isolation (concurrent transactions don't interfere), and Durability (permanent changes).", "cat": "DBMS", "type": "mock_test"},
            {"front": "What is dynamic programming?", "back": "An algorithmic technique that solves complex problems by breaking them down into simpler overlapping subproblems, solving each subproblem once, and caching their solutions (memoization).", "cat": "Algorithms", "type": "mock_test"},
            {"front": "What is a deadlock and what are its four necessary conditions?", "back": "A situation where set of processes are blocked because each holds a resource and waits for another. Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.", "cat": "Operating Systems", "type": "mock_test"}
        ]
        for fc in default_fcs:
            db.session.add(Flashcard(
                front=fc["front"],
                back=fc["back"],
                category=fc["cat"],
                type=fc["type"]
            ))
        db.session.commit()
        print("Flashcards seeded!")

        # ── 16. EXPORT CREDENTIALS TO EXCEL-COMPATIBLE CSV ────────────
        print("Writing credential spreadsheet files to root directory...")
        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Student CSV
        student_csv_path = os.path.join(root_dir, "student_login_credentials.csv")
        with open(student_csv_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["Email", "Password", "Role", "Name", "Year", "Department"])
            writer.writeheader()
            for row in student_credentials:
                writer.writerow(row)
                
        # Faculty CSV
        faculty_csv_path = os.path.join(root_dir, "faculty_login_credentials.csv")
        with open(faculty_csv_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=["Email", "Password", "Role", "Name", "Department"])
            writer.writeheader()
            for row in fac_credentials:
                writer.writerow(row)

        print("---------------------------------------------------------")
        print(" DATABASE COMPREHENSIVELY SEEDED SUCCESSFULLY!")
        print("---------------------------------------------------------")
        print(f" Student Credentials Spreadsheet: {student_csv_path}")
        print(f" Faculty Credentials Spreadsheet: {faculty_csv_path}")
        print("---------------------------------------------------------")

if __name__ == "__main__":
    generate_seeds()
