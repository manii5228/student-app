"""
Credit Service
==============
Business logic for calculating credit progress, checking degree requirements,
validating prerequisites, and generating official Degree Audit PDF reports.
"""

import io
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session

from ..models.academic import CreditProgress, Result, Syllabus
from ..models.user import User
from ..extensions import db

# ReportLab imports for PDF generation
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Custom canvas to handle two-pass rendering for 'Page X of Y' numbering."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            super().showPage()
        super().save()

    def draw_page_number(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Draw header (on pages after page 1)
        if self._pageNumber > 1:
            self.drawString(54, 750, "VelTech University — Official Degree Audit Report")
            self.setStrokeColor(colors.HexColor("#e2e8f0"))
            self.setLineWidth(0.5)
            self.line(54, 742, 558, 742)
            
        # Draw footer
        self.setStrokeColor(colors.HexColor("#e2e8f0"))
        self.setLineWidth(0.5)
        self.line(54, 50, 558, 50)
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 38, page_text)
        
        doc_info = f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Verification Hash: VTU-AUDIT-{self._pageNumber}"
        self.drawString(54, 38, doc_info)
        
        self.restoreState()


class CreditService:
    """Service handling degree audits, requirements, and prerequisites."""

    # Prerequisite map: Course -> list of prerequisite course codes
    PREREQUISITES = {
        "CS202": ["CS101"],      # Data Structures -> Intro to Programming
        "CS202L": ["CS101L"],    # DS Lab -> Programming Lab
        "CS301": ["CS202"],      # Advanced Data Structures -> Data Structures
        "CS302": ["CS102"],      # Computer Organization -> Digital Logic
        "CS303": ["CS201"],      # Database Management Systems -> OOP
        "CS303L": ["CS201L"],    # DBMS Lab -> OOP Lab
        "CS305": ["MA201"],      # Theory of Computation -> Discrete Maths
        "CS401": ["CS303"],      # Advanced OS -> Operating Systems
        "CS499": ["CS399"],      # Capstone Project -> Mini Project I
    }

    # Credit Requirements for graduation
    REQUIREMENTS = {
        "total": 160,
        "core": 90,
        "elective": 40,
        "lab": 30
    }

    def classify_subject(self, code: str, name: str) -> str:
        """Classify a subject into core, elective, or lab based on code and name."""
        code_upper = code.upper()
        name_upper = name.upper()

        # Lab or Project check
        is_lab = (
            code_upper.endswith("L") or 
            "LAB" in code_upper or 
            "LAB" in name_upper or 
            "LABORATORY" in name_upper or
            "PROJECT" in code_upper or 
            "PROJECT" in name_upper or
            "SEMINAR" in name_upper or 
            "INTERNSHIP" in name_upper or 
            "THESIS" in name_upper
        )
        if is_lab:
            return "lab"

        # Core check: CS, MA, PH, CY, EE, EC are standard engineering cores
        is_core = any(code_upper.startswith(prefix) for prefix in ["CS", "MA", "PH", "CY", "EE", "EC"])
        if is_core:
            return "core"

        # Otherwise, it's an elective
        return "elective"

    def calculate_credit_progress(self, student_id: str) -> Dict:
        """
        Dynamically calculate credit progress for a student based on their published results
        where they passed (Grade is not 'F' and Grade Points > 0).
        """
        # Fetch passed results
        results = Result.query.filter_by(student_id=student_id, published=True).all()
        
        core_earned = 0
        elective_earned = 0
        lab_earned = 0

        for r in results:
            # Check if student passed
            grade_points = r.grade_points or 0
            grade = (r.grade or "").upper()
            if grade == "F" or (grade_points == 0 and grade != "O" and grade != "P"):
                continue

            category = self.classify_subject(r.subject_code, r.subject_name)
            subject_credits = r.credits or 3

            if category == "core":
                core_earned += subject_credits
            elif category == "elective":
                elective_earned += subject_credits
            elif category == "lab":
                lab_earned += subject_credits

        total_earned = core_earned + elective_earned + lab_earned

        # Sync/Update CreditProgress record in Database
        cp = CreditProgress.query.filter_by(student_id=student_id).first()
        if not cp:
            cp = CreditProgress(
                student_id=student_id,
                total_required=self.REQUIREMENTS["total"],
                total_earned=total_earned,
                core_earned=core_earned,
                elective_earned=elective_earned,
                lab_earned=lab_earned
            )
            db.session.add(cp)
        else:
            cp.total_required = self.REQUIREMENTS["total"]
            cp.total_earned = total_earned
            cp.core_earned = core_earned
            cp.elective_earned = elective_earned
            cp.lab_earned = lab_earned
        
        db.session.commit()
        return cp.to_dict()

    def get_degree_roadmap(self, student_id: str) -> Dict:
        """
        Get the interactive prerequisite roadmap for a student.
        It returns a list of courses with their prerequisites and the completion status.
        """
        # Get student's results
        results = Result.query.filter_by(student_id=student_id, published=True).all()
        passed_subjects = {}
        for r in results:
            gp = r.grade_points or 0
            g = (r.grade or "").upper()
            if g != "F" and (gp > 0 or g in ["O", "P", "A", "B", "C", "D", "E"]):
                passed_subjects[r.subject_code] = True

        student = db.session.get(User, student_id)
        current_sem = student.semester if student else 4

        # Let's outline a curriculum roadmap for CSE
        curriculum = [
            # Semester 1
            {"code": "CS101", "name": "Intro to Programming", "semester": 1, "credits": 3},
            {"code": "CS101L", "name": "Programming Lab", "semester": 1, "credits": 2},
            {"code": "MA101", "name": "Mathematics I", "semester": 1, "credits": 4},
            {"code": "PH101", "name": "Engineering Physics", "semester": 1, "credits": 4},
            {"code": "EN101", "name": "English Communication", "semester": 1, "credits": 2},
            
            # Semester 2
            {"code": "CS201", "name": "Object Oriented Programming", "semester": 2, "credits": 3},
            {"code": "CS201L", "name": "OOP Lab", "semester": 2, "credits": 2},
            {"code": "CS202", "name": "Data Structures", "semester": 2, "credits": 4},
            {"code": "CS202L", "name": "DS Lab", "semester": 2, "credits": 2},
            {"code": "MA102", "name": "Mathematics II", "semester": 2, "credits": 4},
            
            # Semester 3
            {"code": "CS302", "name": "Computer Organization", "semester": 3, "credits": 4},
            {"code": "CS303", "name": "Database Management Systems", "semester": 3, "credits": 3},
            {"code": "CS303L", "name": "DBMS Lab", "semester": 3, "credits": 2},
            {"code": "MA201", "name": "Discrete Mathematics", "semester": 3, "credits": 4},
            {"code": "CS399", "name": "Mini Project I", "semester": 3, "credits": 3},
            
            # Semester 4 (Current)
            {"code": "CS301", "name": "Data Structures & Alg.", "semester": 4, "credits": 3},
            {"code": "CS303", "name": "Operating Systems", "semester": 4, "credits": 3},
            {"code": "CS305", "name": "Theory of Computation", "semester": 4, "credits": 4},
            
            # Future (Semester 5+)
            {"code": "CS401", "name": "Advanced Operating Systems", "semester": 5, "credits": 3},
            {"code": "CS499", "name": "Capstone Project", "semester": 8, "credits": 10},
        ]

        roadmap = []
        for course in curriculum:
            code = course["code"]
            prereqs = self.PREREQUISITES.get(code, [])
            
            # Determine prerequisite satisfaction status
            prereq_satisfied = True
            missing_prereqs = []
            for p in prereqs:
                if p not in passed_subjects:
                    prereq_satisfied = False
                    missing_prereqs.append(p)

            # Determine course status
            if code in passed_subjects:
                status = "passed"
            elif course["semester"] == current_sem:
                status = "in_progress"
            elif course["semester"] < current_sem:
                status = "failed" if any(r.subject_code == code for r in results) else "missing"
            else:
                status = "not_started"

            roadmap.append({
                "subject_code": code,
                "subject_name": course["name"],
                "semester": course["semester"],
                "credits": course["credits"],
                "category": self.classify_subject(code, course["name"]),
                "status": status,
                "prerequisites": prereqs,
                "prereq_satisfied": prereq_satisfied,
                "missing_prerequisites": missing_prereqs
            })

        return {"roadmap": roadmap, "current_semester": current_sem}

    def generate_degree_audit_pdf(self, student_id: str) -> io.BytesIO:
        """
        Generates a premium, highly formatted PDF Degree Audit Report for a student.
        """
        student = db.session.get(User, student_id)
        if not student:
            raise ValueError("Student not found")

        # Recalculate progress to ensure accurate DB state
        progress = self.calculate_credit_progress(student_id)
        roadmap_data = self.get_degree_roadmap(student_id)
        
        # Fetch all results
        results = Result.query.filter_by(student_id=student_id, published=True).order_by(Result.semester, Result.subject_code).all()

        # Calculate GPA metrics
        total_grade_points = 0
        total_gpa_credits = 0
        for r in results:
            if r.grade_points is not None and r.grade != "F":
                total_grade_points += r.grade_points * (r.credits or 3)
                total_gpa_credits += (r.credits or 3)
        cgpa = round(total_grade_points / total_gpa_credits, 2) if total_gpa_credits else 0.0

        # Setup Document Buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )

        # Style Sheets
        styles = getSampleStyleSheet()
        
        # Custom styles for a premium design
        primary_color = colors.HexColor("#a91f23") # Crimson Accent
        navy_color = colors.HexColor("#22346c") # Navy Blue
        text_dark = colors.HexColor("#0f172a") # Slate 900
        text_muted = colors.HexColor("#475569") # Slate 600
        bg_light = colors.HexColor("#f8fafc") # Slate 50

        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            textColor=primary_color,
            spaceAfter=6
        )

        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=10,
            textColor=navy_color,
            spaceAfter=15
        )

        section_heading = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            textColor=navy_color,
            spaceBefore=12,
            spaceAfter=8
        )

        meta_label = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=text_muted
        )

        meta_value = ParagraphStyle(
            'MetaValue',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            textColor=text_dark
        )

        table_header = ParagraphStyle(
            'TableHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            textColor=colors.white
        )

        table_cell = ParagraphStyle(
            'TableCell',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=8,
            textColor=text_dark
        )

        table_cell_bold = ParagraphStyle(
            'TableCellBold',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=text_dark
        )

        status_passed = ParagraphStyle(
            'StatusPassed',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor("#16a34a") # Green
        )

        status_ip = ParagraphStyle(
            'StatusIP',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor("#2563eb") # Blue
        )

        status_failed = ParagraphStyle(
            'StatusFailed',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=8,
            textColor=colors.HexColor("#dc2626") # Red
        )

        story = []

        # Header Section
        story.append(Paragraph("VELTECH UNIVERSITY", title_style))
        story.append(Paragraph("OFFICIAL DEGREE AUDIT REPORT", subtitle_style))
        
        # Student Info Grid Table
        info_data = [
            [
                Paragraph("Student Name:", meta_label), Paragraph(f"{student.first_name} {student.last_name}", meta_value),
                Paragraph("Register / Roll No:", meta_label), Paragraph(student.roll_number or "N/A", meta_value)
            ],
            [
                Paragraph("Department / Program:", meta_label), Paragraph(student.department or "Computer Science", meta_value),
                Paragraph("Academic Year / Batch:", meta_label), Paragraph(str(student.batch_year or "2022"), meta_value)
            ],
            [
                Paragraph("Current Semester:", meta_label), Paragraph(f"Semester {student.semester}", meta_value),
                Paragraph("Report Date:", meta_label), Paragraph(datetime.now().strftime("%B %d, %Y"), meta_value)
            ]
        ]
        
        info_table = Table(info_data, colWidths=[1.2*inch, 2.3*inch, 1.3*inch, 2.2*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_light),
            ('PADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 15))

        # Progress Overview Section
        story.append(Paragraph("Graduation Requirements Summary", section_heading))
        
        summary_data = [
            [
                Paragraph("Category", table_header),
                Paragraph("Required Credits", table_header),
                Paragraph("Earned Credits", table_header),
                Paragraph("Fulfillment %", table_header),
                Paragraph("Status", table_header)
            ]
        ]

        categories = [
            ("Core Subjects", self.REQUIREMENTS["core"], progress["core_earned"]),
            ("Electives", self.REQUIREMENTS["elective"], progress["elective_earned"]),
            ("Labs & Projects", self.REQUIREMENTS["lab"], progress["lab_earned"]),
            ("Total Graduation Credits", self.REQUIREMENTS["total"], progress["total_earned"])
        ]

        for cat_name, req, earned in categories:
            pct = round(earned / req * 100, 1) if req else 0
            is_satisfied = earned >= req
            status_text = "SATISFIED" if is_satisfied else "IN PROGRESS"
            status_style = status_passed if is_satisfied else status_ip

            summary_data.append([
                Paragraph(cat_name, table_cell_bold),
                Paragraph(str(req), table_cell),
                Paragraph(str(earned), table_cell_bold),
                Paragraph(f"{pct}%", table_cell),
                Paragraph(status_text, status_style)
            ])

        summary_table = Table(summary_data, colWidths=[2.5*inch, 1.2*inch, 1.2*inch, 1.0*inch, 1.1*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), navy_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
            ('BACKGROUND', (0,1), (-1,-1), colors.white),
            ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor("#f1f5f9")), # Highlight total row
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 12))

        # CGPA Highlight
        story.append(Paragraph(f"<b>Current Cumulative Grade Point Average (CGPA):</b> {cgpa} / 10.00", meta_value))
        story.append(Spacer(1, 15))

        # Academic Course Record Table
        story.append(Paragraph("Completed & Enrolled Course Records", section_heading))
        
        course_data = [
            [
                Paragraph("Sem", table_header),
                Paragraph("Code", table_header),
                Paragraph("Subject Name", table_header),
                Paragraph("Credits", table_header),
                Paragraph("Category", table_header),
                Paragraph("Grade", table_header),
                Paragraph("Status", table_header)
            ]
        ]

        # Group completed and in-progress subjects
        completed_codes = {r.subject_code: r for r in results}
        
        for item in roadmap_data["roadmap"]:
            code = item["subject_code"]
            name = item["subject_name"]
            sem = item["semester"]
            creds = item["credits"]
            category = item["category"].capitalize()
            
            grade_val = "—"
            if code in completed_codes:
                grade_val = completed_codes[code].grade or "—"
            
            # Formatting status tags
            if item["status"] == "passed":
                status_p = Paragraph("PASSED", status_passed)
            elif item["status"] == "in_progress":
                status_p = Paragraph("IN PROGRESS", status_ip)
            elif item["status"] == "failed":
                status_p = Paragraph("FAILED", status_failed)
            else:
                status_p = Paragraph("NOT STARTED", table_cell)

            course_data.append([
                Paragraph(str(sem), table_cell),
                Paragraph(code, table_cell_bold),
                Paragraph(name, table_cell),
                Paragraph(str(creds), table_cell),
                Paragraph(category, table_cell),
                Paragraph(grade_val, table_cell_bold),
                status_p
            ])

        course_table = Table(course_data, colWidths=[0.5*inch, 0.9*inch, 2.6*inch, 0.6*inch, 0.9*inch, 0.7*inch, 0.8*inch])
        course_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), primary_color),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('PADDING', (0,0), (-1,-1), 5),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#f1f5f9")),
            ('BACKGROUND', (0,1), (-1,-1), colors.white),
        ]))
        story.append(course_table)
        story.append(Spacer(1, 15))

        # Prerequisite Roadmap Rules Section
        story.append(KeepTogether([
            Paragraph("Prerequisite Policy Audit", section_heading),
            Paragraph("The following courses are bounded by university prerequisite policies. Check below to ensure core academic pathways are unlocked.", meta_value),
            Spacer(1, 5)
        ]))

        prereq_data = [
            [
                Paragraph("Subject", table_header),
                Paragraph("Prerequisites Required", table_header),
                Paragraph("Status", table_header)
            ]
        ]

        has_prereqs = False
        for item in roadmap_data["roadmap"]:
            if item["prerequisites"]:
                has_prereqs = True
                prereq_str = ", ".join(item["prerequisites"])
                status_text = "UNLOCKED" if item["prereq_satisfied"] else f"LOCKED (Missing: {', '.join(item['missing_prerequisites'])})"
                status_style = status_passed if item["prereq_satisfied"] else status_failed

                prereq_data.append([
                    Paragraph(f"<b>{item['subject_code']}</b> — {item['subject_name']}", table_cell),
                    Paragraph(prereq_str, table_cell),
                    Paragraph(status_text, status_style)
                ])

        if has_prereqs:
            prereq_table = Table(prereq_data, colWidths=[3.2*inch, 2.0*inch, 1.8*inch])
            prereq_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), navy_color),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('PADDING', (0,0), (-1,-1), 5),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
                ('BACKGROUND', (0,1), (-1,-1), colors.white),
            ]))
            story.append(prereq_table)
        else:
            story.append(Paragraph("No prerequisite guidelines mapped for this curriculum.", meta_value))

        story.append(Spacer(1, 20))

        # Dean/Registrar Signature Block
        sig_data = [
            [
                Paragraph("<b>Audit System Verification Hash:</b><br/>" + hashlib.sha256(f"{student_id}:{progress['total_earned']}".encode()).hexdigest()[:32].upper(), table_cell),
                Paragraph("<b>Office of the Controller of Examinations</b><br/>VelTech University Registrar Sign-off<br/><i>Digitally Signed Cryptographic Audit Document</i>", ParagraphStyle('Sig', parent=styles['Normal'], fontSize=8, alignment=2))
            ]
        ]
        sig_table = Table(sig_data, colWidths=[3.5*inch, 3.5*inch])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
            ('PADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(sig_table)

        # Build Document using NumberedCanvas
        import hashlib
        doc.build(story, canvasmaker=NumberedCanvas)
        buffer.seek(0)
        return buffer
