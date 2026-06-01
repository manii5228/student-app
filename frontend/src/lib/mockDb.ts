// Centralized Offline Database layer for standalone mobile operation
// Seeded with the exact same records as the Flask server

const INITIAL_ATTENDANCE_SUBJECTS = [
  { student_id: "std_1", subject_code: "CS301", subject_name: "Database Management Systems", total_classes: 25, present: 22, absent: 3, late: 0, on_duty: 0, leave: 0, percentage: 88.0 },
  { student_id: "std_1", subject_code: "CS302", subject_name: "Operating Systems", total_classes: 24, present: 18, absent: 6, late: 0, on_duty: 0, leave: 0, percentage: 75.0 },
  { student_id: "std_1", subject_code: "HU301", subject_name: "Professional Ethics", total_classes: 22, present: 19, absent: 3, late: 0, on_duty: 0, leave: 0, percentage: 86.4 }
];

const INITIAL_ATTENDANCE_RECORDS = [
  { id: "rec_1", session_id: "sess_1", student_id: "std_1", status: "absent", method: "bulk", marked_at: "2026-05-29T10:00:00Z", remarks: null, discrepancy_reported: false, discrepancy: null, session: { subject_code: "CS301", subject_name: "Database Management Systems", session_date: "2026-05-29", period_number: 1 } },
  { id: "rec_2", session_id: "sess_2", student_id: "std_1", status: "present", method: "qr_scan", marked_at: "2026-05-28T09:00:00Z", remarks: null, discrepancy_reported: false, discrepancy: null, session: { subject_code: "CS302", subject_name: "Operating Systems", session_date: "2026-05-28", period_number: 2 } }
];

const seedComprehensiveMockDb = () => {
  // 1. Users Generation
  const users = [
    {
      id: "std_1",
      email: "student1@veltech.edu.in",
      password: "student123!",
      role: "student",
      first_name: "Mani",
      last_name: "Manjunath",
      department: "CSE",
      roll_number: "22CSE101",
      hostel_status: "dayscholar",
      semester: 4,
      section: "A",
      batch_year: 2024,
      is_verified: true,
      cgpa: 8.42
    },
    {
      id: "fac_1",
      email: "faculty@veltech.edu.in",
      password: "faculty123!",
      role: "faculty",
      first_name: "Dr. Ramesh",
      last_name: "Kumar",
      department: "CSE",
      employee_id: "FAC001",
      designation: "Associate Professor",
      specialization: "Data Structures & Algorithms",
      research_interests: "Distributed Systems, Algorithmic Graph Theory",
      office_location: "A-Block Cabin 204",
      is_verified: true,
    },
    {
      id: "adm_1",
      email: "admin@veltech.edu.in",
      password: "admin123!",
      role: "admin",
      first_name: "Super",
      last_name: "Admin",
      department: "Administration",
      is_verified: true,
    }
  ];

  // Generate students student2 to student40
  const stud_firsts = ["Mani", "Arjun", "Neha", "Aditya", "Riya", "Vikram", "Karan", "Rohan", "Ananya", "Pooja", 
                       "Rahul", "Kabir", "Kriti", "Sneha", "Simran", "Varun", "Priya", "Kartik", "Deepak", "Shreya",
                       "Siddharth", "Gautam", "Alia", "Ranbir", "Katrina", "Vicky", "Kiara", "Sidharth", "Shraddha", "Raj",
                       "Rhea", "Ishaan", "Janhvi", "Sara", "Karthik", "Vijay", "Surya", "Ajith", "Dhanush", "Vikram"];
  const stud_lasts = ["Manjunath", "Reddy", "Sharma", "Verma", "Sen", "Singh", "Johar", "Mehra", "Patel", "Hegde",
                      "Mehta", "Thapar", "Sanon", "Nair", "Gill", "Dhawan", "Kapoor", "Roy", "Joshi", "Bhatt",
                      "Malhotra", "Gambhir", "Bhatt", "Kapoor", "Kaif", "Kaushal", "Advani", "Malhotra", "Kapoor", "Kumar",
                      "Chakraborty", "Khatter", "Kapoor", "Ali Khan", "Aaryan", "Deverakonda", "Sivakumar", "Kumar", "Raja", "Prabhu"];
  
  const depts = ["CSE", "ECE", "Mech", "Biomed"];
  const year_mapping: Record<number, { sem: number; batch: number }> = {
    1: { sem: 2, batch: 2025 },
    2: { sem: 4, batch: 2024 },
    3: { sem: 6, batch: 2023 },
    4: { sem: 8, batch: 2022 }
  };

  for (let s_idx = 1; s_idx < 40; s_idx++) {
    const acad_year = Math.floor(s_idx / 10) + 1;
    const sem = year_mapping[acad_year].sem;
    const batch = year_mapping[acad_year].batch;
    const d = depts[s_idx % 4];
    
    users.push({
      id: `std_${s_idx + 1}`,
      email: `student${s_idx + 1}@veltech.edu.in`,
      password: "student123!",
      role: "student",
      first_name: stud_firsts[s_idx],
      last_name: stud_lasts[s_idx],
      department: d,
      roll_number: `22${d}${100 + s_idx}`,
      hostel_status: s_idx % 2 === 0 ? "hosteler" : "dayscholar",
      semester: sem,
      section: s_idx % 2 === 0 ? "A" : "B",
      batch_year: batch,
      is_verified: true,
      cgpa: parseFloat((7.0 + (s_idx % 3) * 0.9 + (s_idx % 5) * 0.1).toFixed(2))
    });
  }

  // Generate Faculty members (10 per department, 40 total)
  const fac_firsts = ["Amit", "Ramesh", "Suresh", "Sunita", "Anjali", "Vikram", "Preeti", "Sanjay", "Rajesh", "Pooja"];
  const fac_lasts = ["Kumar", "Sharma", "Rao", "Patil", "Naidu", "Gill", "Mehta", "Sanon", "Verma", "Sen"];
  for (const d of depts) {
    for (let i = 1; i <= 10; i++) {
      const email = `faculty_${d.toLowerCase()}${i}@veltech.edu.in`;
      const emp_id = `VT${d}FAC${100 + i}`;
      if (d === "CSE" && i === 1) continue; // Skip since fac_1 is faculty@veltech.edu.in
      users.push({
        id: `fac_${d.toLowerCase()}${i}`,
        email: email,
        password: "faculty123!",
        role: "faculty",
        first_name: fac_firsts[i - 1],
        last_name: fac_lasts[i - 1],
        department: d,
        employee_id: emp_id,
        designation: i % 3 === 0 ? "Associate Professor" : i % 4 === 0 ? "Professor" : "Assistant Professor",
        specialization: `Advanced ${d} Research`,
        research_interests: `Distributed Systems, ${d} Analytics`,
        office_location: `${d}-Block Cabin ${200 + i}`,
        is_verified: true
      });
    }
  }

  // Subject Matrices
  const sem_subjects: Record<number, Array<{ code: string; name: string; credits: number }>> = {
    1: [
      { code: "MA101", name: "Mathematics I", credits: 4 },
      { code: "PH101", name: "Engineering Physics", credits: 4 },
      { code: "EE101", name: "Basic Electrical Engineering", credits: 3 },
      { code: "CS101", name: "Problem Solving & Programming", credits: 4 },
      { code: "CS101L", name: "Programming Lab", credits: 2 }
    ],
    2: [
      { code: "MA102", name: "Mathematics II", credits: 4 },
      { code: "CY101", name: "Engineering Chemistry", credits: 4 },
      { code: "ME101", name: "Engineering Graphics", credits: 3 },
      { code: "CS102", name: "Data Structures", credits: 4 },
      { code: "CS102L", name: "Data Structures Lab", credits: 2 }
    ],
    3: [
      { code: "MA201", name: "Discrete Mathematics", credits: 4 },
      { code: "CS201", name: "Object Oriented Programming", credits: 3 },
      { code: "CS201L", name: "OOP Lab", credits: 2 },
      { code: "CS202", name: "Digital Logic & Design", credits: 4 },
      { code: "CS203", name: "Computer Architecture", credits: 3 }
    ],
    4: [
      { code: "CS301", name: "Database Management Systems", credits: 4 },
      { code: "CS301L", name: "DBMS Lab", credits: 2 },
      { code: "CS302", name: "Operating Systems", credits: 4 },
      { code: "CS303", name: "Design & Analysis of Algorithms", credits: 4 },
      { code: "HU301", name: "Professional Ethics", credits: 2 }
    ],
    5: [
      { code: "CS401", name: "Computer Networks", credits: 4 },
      { code: "CS401L", name: "Networks Lab", credits: 2 },
      { code: "CS402", name: "Software Engineering", credits: 3 },
      { code: "CS403", name: "Formal Languages & Automata", credits: 4 },
      { code: "CS499", name: "Mini Project I", credits: 3 }
    ],
    6: [
      { code: "CS501", name: "Compiler Design", credits: 4 },
      { code: "CS502", name: "Artificial Intelligence", credits: 4 },
      { code: "CS503", name: "Web Technologies", credits: 3 },
      { code: "CS503L", name: "Web Tech Lab", credits: 2 },
      { code: "HU501", name: "English & Communication", credits: 2 }
    ],
    7: [
      { code: "CS601", name: "Cloud Computing & Services", credits: 4 },
      { code: "CS602", name: "Cryptography & Network Security", credits: 4 },
      { code: "CS603", name: "Machine Learning", credits: 4 },
      { code: "CS699", name: "Capstone Project Phase I", credits: 4 }
    ],
    8: [
      { code: "CS701", name: "Cyber Security & Forensic Audits", credits: 3 },
      { code: "CS702", name: "Professional Elective IV", credits: 3 },
      { code: "CS799", name: "Capstone Project Phase II", credits: 10 }
    ]
  };

  // 2. Timetable Generation (Split Batch Schedules)
  const timetable: any[] = [];
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  depts.forEach((d) => {
    for (let yr = 1; yr <= 4; yr++) {
      const sem = year_mapping[yr].sem;
      const subs = sem_subjects[sem] || sem_subjects[2];
      
      subs.forEach((sub, slot_idx) => {
        const day = days[slot_idx % 5];
        if (sub.code.endsWith("L")) {
          // Division into split laboratory batches of 5 students
          timetable.push({
            id: `slot_${d}_${yr}_${sub.code}_g1`,
            department: d, semester: sem, day: day, period_number: 5,
            start_time: "14:00", end_time: "15:40", slot_type: "lab",
            subject_code: sub.code, subject_name: `${sub.name} (Group 1)`,
            room_number: "Lab-101", building: `${d} Block`, faculty_name: `Dr. Ramesh Kumar`
          });
          timetable.push({
            id: `slot_${d}_${yr}_${sub.code}_g2`,
            department: d, semester: sem, day: days[(slot_idx + 1) % 5], period_number: 5,
            start_time: "14:00", end_time: "15:40", slot_type: "lab",
            subject_code: sub.code, subject_name: `${sub.name} (Group 2)`,
            room_number: "Lab-102", building: `${d} Block`, faculty_name: `Dr. Ramesh Kumar`
          });
        } else {
          timetable.push({
            id: `slot_${d}_${yr}_${sub.code}`,
            department: d, semester: sem, day: day, period_number: slot_idx + 1,
            start_time: `09:00`, end_time: `09:50`, slot_type: "lecture",
            subject_code: sub.code, subject_name: sub.name,
            room_number: `LH-${100 + yr}`, building: "Main Block", faculty_name: `Dr. Ramesh Kumar`
          });
        }
      });
    }
  });

  // 3. Results History & GPA Calculations
  const results: any[] = [];
  const creditProgresses: any[] = [];
  const internalMarks: any[] = [];
  const grade_points: Record<string, number> = { "O": 10.0, "A+": 9.0, "A": 8.0, "B+": 7.5, "B": 7.0, "C": 6.0 };
  const grades = Object.keys(grade_points);

  users.forEach((student) => {
    if (student.role !== "student") return;
    const curr_sem = student.semester || 4;
    
    // Previous semester results for higher years
    for (let prev_sem = 1; prev_sem < curr_sem; prev_sem++) {
      const subs = sem_subjects[prev_sem] || sem_subjects[1];
      subs.forEach((sub, sidx) => {
        const grade = grades[(sidx + student.email.length) % grades.length];
        const gp = grade_points[grade];
        
        results.push({
          id: `res_${student.id}_s${prev_sem}_${sub.code}`,
          student_id: student.id,
          semester: prev_sem,
          subject_code: sub.code,
          subject_name: sub.name,
          credits: sub.credits,
          grade: grade,
          grade_points: gp,
          exam_type: "regular",
          published: true
        });
      });
    }

    creditProgresses.push({
      student_id: student.id,
      total_required: 160,
      total_earned: Math.min((curr_sem - 1) * 20, 160),
      core_earned: Math.min((curr_sem - 1) * 12, 100),
      elective_earned: Math.min((curr_sem - 1) * 4, 30),
      lab_earned: Math.min((curr_sem - 1) * 4, 30)
    });

    const curr_subs = sem_subjects[curr_sem] || sem_subjects[2];
    curr_subs.forEach((sub) => {
      ["cat1", "cat2", "model"].forEach((test) => {
        internalMarks.push({
          id: `int_${student.id}_${sub.code}_${test}`,
          student_id: student.id,
          subject_code: sub.code,
          subject_name: sub.name,
          semester: curr_sem,
          test_type: test,
          max_marks: 50.0,
          marks_obtained: parseFloat((30.0 + (student.email.length % 5) * 3 + (test === "cat1" ? 4 : test === "cat2" ? 2 : 5)).toFixed(1))
        });
      });
    });
  });

  // 4. Syllabus Generation
  const syllabus: any[] = [];
  depts.forEach((d) => {
    for (let sem = 1; sem <= 8; sem++) {
      const subs = sem_subjects[sem] || sem_subjects[1];
      subs.forEach((sub) => {
        for (let unit = 1; unit <= 5; unit++) {
          syllabus.push({
            id: `syl_${d}_s${sem}_${sub.code}_u${unit}`,
            subject_code: sub.code,
            subject_name: sub.name,
            department: d,
            semester: sem,
            unit_number: unit,
            unit_title: `Unit ${unit}: Core Concepts of ${sub.name}`,
            topics: `Core structures of ${sub.name}, focusing on foundational engineering concepts, practical lab exercises, design patterns, and case studies.`,
            hours: 10,
            is_completed: unit < 4,
            academic_year: "2025-2026",
            version: 1
          });
        }
      });
    }
  });

  // 5. Exam Schedules (Multi-tier)
  const exams: any[] = [];
  const exam_types = ["internal_exam", "mid_semester", "end_semester", "model_paper", "placement_aptitude"];
  depts.forEach((d) => {
    for (let yr = 1; yr <= 4; yr++) {
      const sem = year_mapping[yr].sem;
      const subs = sem_subjects[sem] || sem_subjects[2];
      subs.forEach((sub, sidx) => {
        exam_types.forEach((etype, oidx) => {
          const dateVal = new Date();
          dateVal.setDate(dateVal.getDate() + 15 + sidx + oidx * 5);
          exams.push({
            id: `exam_${d}_y${yr}_${sub.code}_${etype}`,
            subject_code: sub.code,
            subject_name: sub.name,
            department: d,
            semester: sem,
            exam_date: dateVal.toISOString().split("T")[0],
            start_time: "09:30",
            end_time: "12:30",
            room_number: `LH-${300 + sidx}`,
            building: "Central Exam Hall",
            exam_type: etype
          });
        });
      });
    }
  });

  // 6. Library Collections & Renewals
  const libraryBooks: any[] = [];
  const libraryIssues: any[] = [];
  const lib_types = ["Textbook", "Reference Book", "Journal", "Research Material"];
  let b_counter = 0;
  depts.forEach((d) => {
    for (let i = 1; i <= 15; i++) {
      b_counter++;
      const category = lib_types[i % lib_types.length];
      const title = `${d} Core Engineering ${category} - Vol ${i}`;
      const author = `Prof. ${stud_firsts[i % 40]} ${stud_lasts[i % 40]}`;
      const isbn = `978-3-16-148${1000 + b_counter}`;
      
      libraryBooks.push({
        id: `lib_${b_counter}`,
        title: title,
        author: author,
        isbn: isbn,
        category: `${d} ${category}`,
        total_copies: 5,
        available_copies: 4,
        shelf_location: `${d}-Rack ${i}`
      });

      libraryIssues.push({
        id: `issue_${b_counter}`,
        book_id: `lib_${b_counter}`,
        student_id: `std_${(i % 39) + 1}`,
        issued_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0],
        due_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split("T")[0],
        status: "active",
        renewed_count: 0,
        fine_amount: 0,
        returned_date: null
      });
    }
  });

  // Additional library issues for std_1 (logged-in student) for testing
  libraryIssues.push(
    {
      id: 'issue_std1_a',
      book_id: 'lib_1',
      student_id: 'std_1',
      issued_date: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString().split("T")[0],
      due_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
      status: 'active',
      renewed_count: 1,
      fine_amount: 10,
      returned_date: null
    },
    {
      id: 'issue_std1_b',
      book_id: 'lib_5',
      student_id: 'std_1',
      issued_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split("T")[0],
      due_date: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split("T")[0],
      status: 'active',
      renewed_count: 0,
      fine_amount: 0,
      returned_date: null
    },
    {
      id: 'issue_std1_c',
      book_id: 'lib_10',
      student_id: 'std_1',
      issued_date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
      due_date: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString().split("T")[0],
      status: 'active',
      renewed_count: 0,
      fine_amount: 0,
      returned_date: null
    },
    {
      id: 'issue_std1_d',
      book_id: 'lib_20',
      student_id: 'std_1',
      issued_date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
      due_date: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split("T")[0],
      status: 'active',
      renewed_count: 0,
      fine_amount: 0,
      returned_date: null
    }
  );

  // 7. Placements & Job Openings
  const jobs = [
    { id: "job_1", company_name: "Google", role_title: "Graduate Engineer Trainee - Software Development", description: "Software Trainee at Google. Expertise in React/Node/PostgreSQL. Min CGPA: 8.0.", package_lpa: 24.5, min_cgpa: 8.0, eligible_departments: "CSE,ECE", eligible_batch_year: 2022, job_type: "placement", is_active: true, last_date_apply: "2026-06-15", drive_date: "2026-06-25" },
    { id: "job_2", company_name: "Microsoft", role_title: "Cloud Support Engineer - AWS/Azure", description: "Cloud Engineer Trainee. Python & scripting. Min CGPA: 7.5.", package_lpa: 18.0, min_cgpa: 7.5, eligible_departments: "CSE,ECE", eligible_batch_year: 2022, job_type: "placement", is_active: true, last_date_apply: "2026-06-18", drive_date: "2026-06-28" },
    { id: "job_3", company_name: "Qualcomm", role_title: "Silicon Verification Engineer", description: "Qualcomm chips testing and VLSI. Min CGPA: 8.0.", package_lpa: 22.0, min_cgpa: 8.0, eligible_departments: "ECE", eligible_batch_year: 2022, job_type: "placement", is_active: true, last_date_apply: "2026-06-12", drive_date: "2026-06-22" },
    { id: "job_4", company_name: "Intel", role_title: "Embedded Systems Intern", description: "Firmware and microcontrollers development. Min CGPA: 7.0.", package_lpa: 8.0, min_cgpa: 7.0, eligible_departments: "ECE,Mech", eligible_batch_year: 2022, job_type: "internship", is_active: true, last_date_apply: "2026-06-10", drive_date: "2026-06-20" }
  ];

  // 8. PYQs
  const questionPapers: any[] = [];
  depts.forEach((d) => {
    for (let yr = 1; yr <= 4; yr++) {
      const sem = year_mapping[yr].sem;
      const subs = sem_subjects[sem] || sem_subjects[1];
      subs.forEach((sub) => {
        exam_types.forEach((etype) => {
          questionPapers.push({
            id: `pyq_${d}_s${sem}_${sub.code}_${etype}`,
            subject_code: sub.code,
            subject_name: sub.name,
            department: d,
            semester: sem,
            year: 2025,
            exam_type: etype,
            download_count: Math.floor(Math.random() * 800) + 100
          });
        });
      });
    }
  });

  // 9. Referral Hub Alumni
  const alumni = [
    { id: "alum_1", name: "Alumni Priya Sen", email: "alumnipriya@gmail.com", batch_year: 2021, department: "CSE", company: "Meta", designation: "Senior Software Engineer", linkedin_url: "https://linkedin.com/in/alumnipriya", is_open_to_referral: true },
    { id: "alum_2", name: "Alumni Kartik Roy", email: "alumnikartik@gmail.com", batch_year: 2020, department: "ECE", company: "Qualcomm", designation: "Staff Verification Engineer", linkedin_url: "https://linkedin.com/in/alumnikartik", is_open_to_referral: true },
    { id: "alum_3", name: "Alumni Vikram Gill", email: "alumnivikram@gmail.com", batch_year: 2022, department: "Mech", company: "Tesla", designation: "Mechanical Design Engineer", linkedin_url: "https://linkedin.com/in/alumnivikram", is_open_to_referral: true },
    { id: "alum_4", name: "Alumni Pooja Hegde", email: "alumnipooja@gmail.com", batch_year: 2019, department: "Biomed", company: "Johnson & Johnson", designation: "Biomedical Systems Architect", linkedin_url: "https://linkedin.com/in/alumnipooja", is_open_to_referral: true }
  ];

  // Internships
  const internships = [
    {
      id: "int_1",
      student_id: "std_1",
      company_name: "Google",
      role_title: "Software Engineer Intern",
      description: "Working on performance critical core microservices in Go.",
      start_date: "2026-05-01",
      end_date: "2026-08-01",
      stipend: 75000,
      mode: "hybrid",
      certificate_url: "",
      status: "ongoing",
      skills_learned: "Go, Kubernetes, Protobuf",
      is_verified: true
    },
    {
      id: "int_2",
      student_id: "std_1",
      company_name: "Microsoft",
      role_title: "Product Manager Intern",
      description: "Leading research and specification for cloud database console tools.",
      start_date: "2025-05-01",
      end_date: "2025-08-01",
      stipend: 65000,
      mode: "onsite",
      certificate_url: "https://veltech.edu.in/certificates/ms_intern.pdf",
      status: "completed",
      skills_learned: "Product Specs, Azure, UI Design",
      is_verified: true
    }
  ];

  // 10. Team Finder Profiles
  const teamProfiles: any[] = [];
  const skills_list = ["React,TypeScript,Tailwind", "Python,FastAPI,SQL", "Figma,UI/UX,React", "C++,Embedded,RTOS", "Machine Learning,PyTorch", "Data Science,Pandas"];
  for (let i = 0; i < 15; i++) {
    const s = users[i];
    const sem = s.semester || 4;
    teamProfiles.push({
      id: `team_${s.id}`,
      user_id: s.id,
      name: s.first_name + " " + s.last_name,
      department: s.department,
      year: sem <= 2 ? "1st Year" : sem <= 4 ? "2nd Year" : sem <= 6 ? "3rd Year" : "4th Year",
      skills: skills_list[i % skills_list.length].split(","),
      looking_for: `Collaborating on a project inside ${s.department} department`,
      bio: `Enthusiastic developer looking for teammates to win hackathons.`,
      match_pct: 75 + (i * 3) % 25
    });
  }

  // 11. Skill Badge System
  const badges = [
    { id: "b1", name: "Python Developer", description: "Mastered scripting, algorithms & OOP in Python", category: "technical", icon: "terminal", color: "#4f46e5", points: 50, criteria: "Complete Python Workshop" },
    { id: "b2", name: "Web Development", description: "Built and deployed rich responsive frontends in React", category: "technical", icon: "globe", color: "#06b6d4", points: 50, criteria: "Build a full stack React project" },
    { id: "b3", name: "Machine Learning", description: "Trained and optimized deep neural network weights", category: "technical", icon: "brain", color: "#ec4899", points: 50, criteria: "Implement MLP/CNN layers offline" },
    { id: "b4", name: "Data Analytics", description: "Analyzed complex datasets using Pandas & Numpy", category: "technical", icon: "bar-chart", color: "#10b981", points: 30, criteria: "Data Cleaning + Wrangling pipelines" },
    { id: "b5", name: "Cloud Computing", description: "Successfully configured pipelines on AWS or GCP", category: "technical", icon: "cloud", color: "#eab308", points: 50, criteria: "Setup fully functional Docker CI pipelines" },
    { id: "b6", name: "Problem Solving", description: "Solved 250+ technical logic algorithm tasks", category: "technical", icon: "cpu", color: "#f97316", points: 100, criteria: "Clear advanced aptitude coding tests" }
  ];

  // Earned Badges
  const earnedBadges = [
    {
      id: "eb1",
      student_id: "std_1",
      badge: badges[0],
      note: "Excellent completion of Python workshop",
      status: "approved",
      earned_at: new Date(Date.now() - 5 * 864e5).toISOString()
    },
    {
      id: "eb2",
      student_id: "std_1",
      badge: badges[1],
      note: "Successfully built the university project frontend",
      status: "approved",
      earned_at: new Date(Date.now() - 2 * 864e5).toISOString()
    }
  ];

  // 12. Company Prep Module Questions
  const companyPrep = [
    { id: "pq_1", company_name: "Google", question_text: "Explain how a hash map resolves collisions using separate chaining vs linear probing. What is the time complexity in both cases?", category: "technical", year: 2025, upvotes: 142 },
    { id: "pq_2", company_name: "Microsoft", question_text: "Given a binary tree, write a function to return its level order traversal. Explain spatial complexity of the queue-based implementation.", category: "technical", year: 2025, upvotes: 98 },
    { id: "pq_3", company_name: "Qualcomm", question_text: "What is the difference between a mutex and a semaphore? In what scenarios would you choose one over the other in RTOS?", category: "technical", year: 2024, upvotes: 75 },
    { id: "pq_4", company_name: "Amazon", question_text: "Explain the process of designing a URL Shortener system with horizontal database scaling. Detail memory caching strategies.", category: "technical", year: 2025, upvotes: 110 }
  ];

  // 13. Mock Test Platform
  const mockTests = [
    {
      id: "test_1",
      title: "Academic & Programming Mock Assessment I",
      description: "Assess your logic, data structure, and technical aptitude. Consist of core programming questions.",
      category: "aptitude",
      duration_minutes: 30,
      total_questions: 3,
      difficulty: "medium",
      is_active: true
    }
  ];

  const mockTestQuestions = [
    { id: "q1", test_id: "test_1", question_text: "What is the worst case complexity of Quick Sort?", option_a: "O(N)", option_b: "O(N log N)", option_c: "O(N^2)", option_d: "O(2^N)", correct_option: "c", explanation: "Pivot choice could lead to O(N^2) complexity in worst sorted sequences.", order_num: 1 },
    { id: "q2", test_id: "test_1", question_text: "Which data structure operates on a Last In First Out (LIFO) basis?", option_a: "Queue", option_b: "Stack", option_c: "Tree", option_d: "Graph", correct_option: "b", explanation: "A stack is a LIFO linear data structure.", order_num: 2 },
    { id: "q3", test_id: "test_1", question_text: "Which of the following is not an operating system?", option_a: "Linux", option_b: "Windows", option_c: "Oracle", option_d: "macOS", correct_option: "c", explanation: "Oracle is a database engine company, not an OS.", order_num: 3 }
  ];

  const completeDb = {
    is_comprehensive: true,
    users,
    timetable,
    results,
    syllabus,
    badges,
    notices: [
      { id: "n1", title: "End Semester Exams Schedule Published", content: "The end-semester examinations UG classes commence on June 15, 2026. Dates and halls are visible inside the Exam tab.", category: "academic", date: "2026-05-28" },
      { id: "n2", title: "Split-Batch Laboratory Classes Formed", content: "To manage equipment availability, students are split into Group 1 and Group 2 inside your smart timetable schedules.", category: "general", date: "2026-05-29" }
    ],
    projects: [
      {
        id: "p1",
        title: "University Super-App",
        description: "A comprehensive campus management system with React + Flask",
        team_members: "Priya K., Rahul S.",
        deadline: "2026-06-30",
        status: "in_progress",
        progress_pct: 40,
        milestones: [
          { id: "m1", title: "Design Figma mockups", column: "done", assigned_to: "Priya K.", is_completed: true },
          { id: "m2", title: "Setup Flask backend", column: "done", assigned_to: "Mani M.", is_completed: true },
          { id: "m3", title: "Build React frontend", column: "in_progress", assigned_to: "Mani M.", is_completed: false },
          { id: "m4", title: "Integrate APIs", column: "todo", assigned_to: "Rahul S.", is_completed: false }
        ]
      }
    ],
    hostelPasses: [
      { id: 'hp_1', reason: 'Going home for weekend', destination: 'Chennai Central', from_date: new Date(Date.now() + 86400000).toISOString(), to_date: new Date(Date.now() + 3*86400000).toISOString(), status: 'approved', mentor_status: 'approved', parent_status: 'approved', student_id: 'std_1', student_name: 'Mani Manjunath', student_reg: '22CSE101', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 'hp_2', reason: 'Medical appointment at hospital', destination: 'Apollo Hospital, Chennai', from_date: new Date(Date.now() + 2*86400000).toISOString(), to_date: new Date(Date.now() + 2*86400000 + 18000000).toISOString(), status: 'pending', mentor_status: 'approved', parent_status: 'pending', student_id: 'std_1', student_name: 'Mani Manjunath', student_reg: '22CSE101', created_at: new Date().toISOString() },
      { id: 'hp_3', reason: 'Family function - Brother wedding', destination: 'Coimbatore', from_date: new Date(Date.now() + 5*86400000).toISOString(), to_date: new Date(Date.now() + 8*86400000).toISOString(), status: 'pending', mentor_status: 'pending', parent_status: 'pending', student_id: 'std_1', student_name: 'Mani Manjunath', student_reg: '22CSE101', created_at: new Date().toISOString() },
      { id: 'hp_4', reason: 'Visiting home for Diwali break', destination: 'Madurai', from_date: new Date(Date.now() + 86400000).toISOString(), to_date: new Date(Date.now() + 4*86400000).toISOString(), status: 'pending', mentor_status: 'pending', parent_status: 'pending', student_id: 'std_2', student_name: 'Arjun Reddy', student_reg: '22CSE102', created_at: new Date().toISOString() },
      { id: 'hp_5', reason: 'Medical emergency - dental surgery', destination: 'MIOT Hospital', from_date: new Date(Date.now()).toISOString(), to_date: new Date(Date.now() + 2*86400000).toISOString(), status: 'pending', mentor_status: 'pending', parent_status: 'pending', student_id: 'std_3', student_name: 'Neha Sharma', student_reg: '22CSE103', created_at: new Date().toISOString() },
      { id: 'hp_6', reason: 'Sister engagement ceremony', destination: 'Bangalore', from_date: new Date(Date.now() + 3*86400000).toISOString(), to_date: new Date(Date.now() + 6*86400000).toISOString(), status: 'pending', mentor_status: 'pending', parent_status: 'pending', student_id: 'std_4', student_name: 'Aditya Verma', student_reg: '22CSE104', created_at: new Date().toISOString() },
      { id: 'hp_7', reason: 'Passport collection from regional office', destination: 'Passport Office Chennai', from_date: new Date(Date.now() + 86400000).toISOString(), to_date: new Date(Date.now() + 86400000 + 28800000).toISOString(), status: 'rejected', mentor_status: 'approved', parent_status: 'approved', student_id: 'std_5', student_name: 'Riya Sen', student_reg: '22CSE105', created_at: new Date(Date.now() - 2*86400000).toISOString() }
    ],
    canteenOrders: [],
    notifications: [],
    attendanceSubjects: [
      { student_id: "std_1", subject_code: "CS301", subject_name: "Database Management Systems", total_classes: 25, present: 22, absent: 3, late: 0, on_duty: 0, leave: 0, percentage: 88.0 },
      { student_id: "std_1", subject_code: "CS302", subject_name: "Operating Systems", total_classes: 24, present: 18, absent: 6, late: 0, on_duty: 0, leave: 0, percentage: 75.0 },
      { student_id: "std_1", subject_code: "HU301", subject_name: "Professional Ethics", total_classes: 22, present: 19, absent: 3, late: 0, on_duty: 0, leave: 0, percentage: 86.4 }
    ],
    attendanceRecords: [
      { id: "rec_1", session_id: "sess_1", student_id: "std_1", status: "absent", method: "bulk", marked_at: "2026-05-29T10:00:00Z", remarks: null, discrepancy_reported: false, discrepancy: null, session: { subject_code: "CS301", subject_name: "Database Management Systems", session_date: "2026-05-29", period_number: 1 } },
      { id: "rec_2", session_id: "sess_2", student_id: "std_1", status: "present", method: "qr_scan", marked_at: "2026-05-28T09:00:00Z", remarks: null, discrepancy_reported: false, discrepancy: null, session: { subject_code: "CS302", subject_name: "Operating Systems", session_date: "2026-05-28", period_number: 2 } }
    ],
    attendanceDiscrepancies: [],
    // Database collections
    internalMarks,
    creditProgresses,
    exams,
    libraryBooks,
    libraryIssues,
    jobs,
    savedJobs: [],
    jobApplications: [],
    questionPapers,
    alumni,
    teamProfiles,
    swipes: [],
    matches: [],
    messages: [],
    companyPrep,
    mockTests,
    mockTestQuestions,
    mockTestAttempts: [],
    internships,
    earnedBadges
  };

  localStorage.setItem('mock_db', JSON.stringify(completeDb));
  return completeDb;
};

const getMockDb = () => {
  const data = localStorage.getItem('mock_db');
  if (data) {
    try {
      const parsedDb = JSON.parse(data);
      if (parsedDb.is_comprehensive) {
        return parsedDb;
      }
    } catch { /* fallback */ }
  }
  return seedComprehensiveMockDb();
};

const saveMockDb = (db: any) => {
  localStorage.setItem('mock_db', JSON.stringify(db));
};

export const handleMockRequest = async (config: any): Promise<any> => {
  const getPayload = (data: any) => {
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data;
  };

  const db = getMockDb();
  const method = config.method?.toLowerCase() || 'get';
  const rawUrl = config.url || '';
  
  const activeUserStr = localStorage.getItem('user');
  let activeUserId = "std_1";
  if (activeUserStr) {
    try {
      activeUserId = JSON.parse(activeUserStr).id || "std_1";
    } catch {}
  }
  
  // Strip query parameters
  let cleanUrl = rawUrl.split('?')[0];
  
  // Strip protocol and hostname/domain if absolute URL
  cleanUrl = cleanUrl.replace(/^https?:\/\/[^\/]+/, '');
  
  // Normalize multiple consecutive slashes into a single slash
  cleanUrl = cleanUrl.replace(/\/+/g, '/');
  
  // Strip the API prefix if present (/api/v1 or api/v1)
  cleanUrl = cleanUrl.replace(/^\/api\/v1/, '').replace(/^api\/v1/, '');
  
  // Ensure leading slash
  if (!cleanUrl.startsWith('/')) {
    cleanUrl = '/' + cleanUrl;
  }
  
  // Strip trailing slash if present (except if it's just '/')
  if (cleanUrl.endsWith('/') && cleanUrl.length > 1) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  
  const urlParams = new URLSearchParams((rawUrl.split('?')[1] || ''));
  
  console.log(`[Offline Standalone Mock DB] ${method.toUpperCase()} ${cleanUrl}`, config.data);

  // Authentication Routes
  if (cleanUrl === '/auth/login' && method === 'post') {
    const payload = getPayload(config.data);
    const user = db.users.find((u: any) => u.email === payload.email && u.password === payload.password);
    
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'mock-jwt-token-active');
      return {
        status: 200,
        data: {
          access_token: 'mock-jwt-token-active',
          user: user
        }
      };
    }
    return {
      status: 401,
      data: { error: "Login failed. Please check your credentials." }
    };
  }

  if (cleanUrl === '/auth/sso' && method === 'post') {
    const payload = getPayload(config.data);
    if (!payload.email) {
      return {
        status: 400,
        data: { error: "Email is required for SSO authentication." }
      };
    }

    const allowedDomains = ["veltech.edu.in", "vel-tech.org", "veltech.ac.in"];
    const domain = payload.email.split('@').pop()?.toLowerCase();
    if (!domain || !allowedDomains.includes(domain)) {
      return {
        status: 400,
        data: { error: "SSO is only available for college email addresses." }
      };
    }

    const user = db.users.find((u: any) => u.email?.toLowerCase() === payload.email.toLowerCase());
    if (!user) {
      return {
        status: 401,
        data: { error: "No account found for this email. Please register first." }
      };
    }
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'mock-jwt-token-sso');
    return {
      status: 200,
      data: {
        access_token: 'mock-jwt-token-sso',
        user: user
      }
    };
  }

  if (cleanUrl === '/auth/guest' && method === 'post') {
    const guestUser = {
      id: "guest_user",
      email: "guest@veltech.edu.in",
      role: "guest",
      first_name: "Guest",
      last_name: "User",
      is_guest: true
    };
    localStorage.setItem('user', JSON.stringify(guestUser));
    localStorage.setItem('token', 'mock-jwt-token-guest');
    return {
      status: 200,
      data: {
        access_token: 'mock-jwt-token-guest',
        user: guestUser
      }
    };
  }

  if (cleanUrl === '/auth/register' && method === 'post') {
    const payload = getPayload(config.data);
    const newUser = {
      id: `std_${Date.now()}`,
      ...payload,
      role: payload.role || 'student',
      is_verified: true
    };
    db.users.push(newUser);
    saveMockDb(db);
    return {
      status: 201,
      data: {
        message: "Registration successful!",
        user: newUser
      }
    };
  }

  if (cleanUrl === '/auth/me' && method === 'get') {
    const activeUserStr = localStorage.getItem('user');
    if (activeUserStr) {
      return { status: 200, data: JSON.parse(activeUserStr) };
    }
    return { status: 401, data: { error: "Unauthorized" } };
  }

  if (cleanUrl === '/auth/me/avatar' && method === 'post') {
    const payload = getPayload(config.data);
    const activeUserStr = localStorage.getItem('user');
    if (activeUserStr) {
      const activeUser = JSON.parse(activeUserStr);
      const userIdx = db.users.findIndex((u: any) => u.id === activeUser.id);
      if (userIdx !== -1) {
        db.users[userIdx].avatar_url = payload.avatar_url || payload.avatar_base64;
        localStorage.setItem('user', JSON.stringify(db.users[userIdx]));
        saveMockDb(db);
        return {
          status: 200,
          data: {
            message: "Avatar updated successfully",
            avatar_url: db.users[userIdx].avatar_url,
            user: db.users[userIdx]
          }
        };
      }
    }
    return { status: 401, data: { error: "Unauthorized" } };
  }

  if (cleanUrl === '/auth/me/preferences' && method === 'put') {
    const payload = getPayload(config.data);
    const activeUserStr = localStorage.getItem('user');
    if (activeUserStr) {
      const activeUser = JSON.parse(activeUserStr);
      const userIdx = db.users.findIndex((u: any) => u.id === activeUser.id);
      if (userIdx !== -1) {
        const currentPrefs = db.users[userIdx].preferences || {};
        db.users[userIdx].preferences = { ...currentPrefs, ...payload };
        localStorage.setItem('user', JSON.stringify(db.users[userIdx]));
        saveMockDb(db);
        return {
          status: 200,
          data: {
            message: "Preferences updated successfully",
            preferences: db.users[userIdx].preferences
          }
        };
      }
    }
    return { status: 401, data: { error: "Unauthorized" } };
  }

  // Timetable Routes
  if (cleanUrl === '/timetable/my-timetable' && method === 'get') {
    // Construct the standard grid response expected by SmartTimetable.tsx
    const grid: Record<string, any[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
    };
    
    db.timetable.forEach((slot: any) => {
      if (grid[slot.day]) {
        grid[slot.day].push(slot);
      }
    });

    return {
      status: 200,
      data: { grid }
    };
  }

  // Academic results
  if (cleanUrl === '/academic/results' && method === 'get') {
    return {
      status: 200,
      data: db.results
    };
  }

  if (cleanUrl.startsWith('/academic/results/analytics') && method === 'get') {
    return {
      status: 200,
      data: {
        gpa: 8.42,
        class_average: 7.85,
        highest_gpa: 9.8,
        total_credits: 28,
        backlogs: 0
      }
    };
  }

  // Syllabus
  if (cleanUrl === '/academic/syllabus' && method === 'get') {
    return {
      status: 200,
      data: db.syllabus
    };
  }

  // Badges
  if (cleanUrl === '/career/badges' && method === 'get') {
    return {
      status: 200,
      data: { badges: db.badges }
    };
  }

  if (cleanUrl === '/career/badges/my-badges' && method === 'get') {
    const myEarned = db.earnedBadges.filter((eb: any) => eb.student_id === activeUserId);
    return {
      status: 200,
      data: { earned_badges: myEarned }
    };
  }

  if (cleanUrl.startsWith('/career/badges/') && cleanUrl.endsWith('/award') && method === 'post') {
    const bid = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    const badge = db.badges.find((b: any) => b.id === bid);
    if (badge) {
      const newEarned = {
        id: `eb_${Date.now()}`,
        student_id: payload.student_id,
        badge: badge,
        note: payload.note || "",
        status: "approved",
        earned_at: new Date().toISOString()
      };
      if (!db.earnedBadges) db.earnedBadges = [];
      db.earnedBadges.push(newEarned);
      saveMockDb(db);
      return { status: 201, data: newEarned };
    }
  }

  // Notices
  if (cleanUrl === '/campus/notices' && method === 'get') {
    return {
      status: 200,
      data: db.notices
    };
  }

  // Career Projects (Kanban Board CRUD)
  if (cleanUrl === '/career/projects' && method === 'get') {
    return {
      status: 200,
      data: { projects: db.projects }
    };
  }

  if (cleanUrl === '/career/projects' && method === 'post') {
    const payload = getPayload(config.data);
    const newProject = {
      id: `p_${Date.now()}`,
      title: payload.title,
      description: payload.description || "",
      team_members: payload.team_members || "",
      deadline: payload.deadline || "",
      status: "todo",
      progress_pct: 0,
      milestones: (payload.milestones || []).map((m: any, idx: number) => ({
        id: `m_${Date.now()}_${idx}`,
        title: m.title,
        column: m.column || "todo",
        assigned_to: m.assigned_to || null,
        is_completed: m.column === "done"
      }))
    };
    db.projects.push(newProject);
    saveMockDb(db);
    return {
      status: 201,
      data: { message: "Project created", project: newProject }
    };
  }

  if (cleanUrl.startsWith('/career/projects/') && method === 'put') {
    const id = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    const projIdx = db.projects.findIndex((p: any) => p.id === id);
    if (projIdx !== -1) {
      db.projects[projIdx] = { ...db.projects[projIdx], ...payload };
      saveMockDb(db);
      return { status: 200, data: db.projects[projIdx] };
    }
  }

  if (cleanUrl.startsWith('/career/projects/') && method === 'delete') {
    const id = cleanUrl.split('/').pop();
    db.projects = db.projects.filter((p: any) => p.id !== id);
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }

  if (cleanUrl.startsWith('/career/projects/') && cleanUrl.endsWith('/milestones') && method === 'post') {
    const splitParts = cleanUrl.split('/');
    const projId = splitParts[splitParts.length - 2];
    const payload = getPayload(config.data);
    
    const proj = db.projects.find((p: any) => p.id === projId);
    if (proj) {
      const newMilestone = {
        id: `m_${Date.now()}`,
        title: payload.title,
        column: payload.column || "todo",
        assigned_to: payload.assigned_to || null,
        is_completed: false
      };
      proj.milestones.push(newMilestone);
      saveMockDb(db);
      return { status: 201, data: newMilestone };
    }
  }

  if (cleanUrl.startsWith('/career/milestones/') && method === 'put') {
    const id = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    
    let updatedMilestone = null;
    let updatedProject = null;
    db.projects.forEach((proj: any) => {
      const ms = proj.milestones.find((m: any) => m.id === id);
      if (ms) {
        Object.assign(ms, payload);
        if (payload.column === 'done') ms.is_completed = true;
        else if (payload.column === 'todo' || payload.column === 'in_progress') ms.is_completed = false;
        
        // Recalculate project progress %
        const doneCount = proj.milestones.filter((m: any) => m.column === 'done').length;
        proj.progress_pct = proj.milestones.length > 0 ? Math.round((doneCount / proj.milestones.length) * 100) : 0;
        
        updatedMilestone = ms;
        updatedProject = proj;
      }
    });
    
    saveMockDb(db);
    if (updatedMilestone && updatedProject) {
      return { status: 200, data: { milestone: updatedMilestone, project: updatedProject } };
    }
  }

  // Hostel Passes
  if (cleanUrl === '/campus/hostel-pass' && method === 'post') {
    const payload = getPayload(config.data);
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    const newPass = {
      id: `hp_${Date.now()}`,
      reason: payload.reason,
      destination: payload.destination || 'Home',
      from_date: payload.from_date,
      to_date: payload.to_date,
      status: 'pending',
      mentor_status: 'pending',
      parent_status: 'pending',
      student_id: activeUserId,
      student_name: activeUser ? `${activeUser.first_name} ${activeUser.last_name}` : 'Student',
      student_reg: activeUser?.roll_number || 'N/A',
      created_at: new Date().toISOString()
    };
    if (!db.hostelPasses) db.hostelPasses = [];
    db.hostelPasses.push(newPass);
    saveMockDb(db);
    return { status: 201, data: newPass };
  }

  if (cleanUrl === '/campus/hostel-pass' && method === 'get') {
    const passes = (db.hostelPasses || []).filter((p: any) => p.student_id === activeUserId);
    return { status: 200, data: { passes } };
  }

  // Mentor hostel passes (faculty view of mentee passes)
  if (cleanUrl === '/campus/hostel-pass/mentees' && method === 'get') {
    const allPasses = db.hostelPasses || [];
    return { status: 200, data: { passes: allPasses } };
  }

  // Bulk hostel pass status update (mentor approval)
  if (cleanUrl === '/campus/hostel-pass/bulk-status' && method === 'put') {
    const payload = getPayload(config.data);
    const ids: string[] = payload.ids || [];
    const status = payload.status;
    ids.forEach((id: string) => {
      const pass = (db.hostelPasses || []).find((p: any) => p.id === id);
      if (pass) {
        pass.mentor_status = status;
        // If mentor approved and parent approved, set main status
        if (status === 'approved' && pass.parent_status === 'approved') {
          pass.status = 'approved';
        }
        if (status === 'rejected') {
          pass.status = 'rejected';
        }
      }
    });
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }

  // Resend parent SMS
  if (cleanUrl.match(/\/campus\/hostel-pass\/[^/]+\/resend-parent/) && method === 'post') {
    return { status: 200, data: { success: true, message: 'SMS sent to parent successfully' } };
  }

  // Digital Canteen
  if (cleanUrl === '/campus/canteen/menu' && method === 'get') {
    const menu = [
      { id: "c1", name: "Samosa", price: 15, category: "snacks", available: true, image: "https://images.unsplash.com/photo-1601050690597-df056fb4ce78" },
      { id: "c2", name: "Masala Dosa", price: 40, category: "south_indian", available: true, image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976" },
      { id: "c3", name: "Veg Fried Rice", price: 55, category: "chinese", available: true, image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b" },
      { id: "c4", name: "Cold Coffee", price: 30, category: "beverages", available: true, image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c" }
    ];
    return { status: 200, data: menu };
  }

  if (cleanUrl === '/campus/canteen/order' && method === 'post') {
    const payload = getPayload(config.data);
    const newOrder = {
      id: `order_${Date.now()}`,
      ...payload,
      status: "preparing",
      order_time: new Date().toISOString()
    };
    db.canteenOrders.push(newOrder);
    saveMockDb(db);
    return { status: 201, data: newOrder };
  }

  if (cleanUrl === '/campus/canteen/orders' && method === 'get') {
    return { status: 200, data: db.canteenOrders };
  }

  // Bunk-O-Meter Attendance
  if (cleanUrl === '/attendance/bunk-o-meter' && method === 'get') {
    const userSubjects = db.attendanceSubjects.filter((s: any) => s.student_id === activeUserId);
    if (userSubjects.length === 0) {
      const userSeed = INITIAL_ATTENDANCE_SUBJECTS.map((s: any) => ({ ...s, student_id: activeUserId }));
      db.attendanceSubjects.push(...userSeed);
      saveMockDb(db);
      return { status: 200, data: { subjects: userSeed } };
    }
    return { status: 200, data: { subjects: userSubjects } };
  }

  if (cleanUrl === '/attendance/my-records' && method === 'get') {
    const userRecords = db.attendanceRecords.filter((r: any) => r.student_id === activeUserId);
    if (userRecords.length === 0 && activeUserId === "std_1") {
      const seededRecords = INITIAL_ATTENDANCE_RECORDS.map((r: any) => ({ ...r, student_id: activeUserId }));
      db.attendanceRecords.push(...seededRecords);
      saveMockDb(db);
      return { status: 200, data: { records: seededRecords } };
    }
    return { status: 200, data: { records: userRecords } };
  }

  if (cleanUrl === '/attendance/discrepancies' && method === 'get') {
    const userDiscrepancies = db.attendanceDiscrepancies.filter((d: any) => d.student_id === activeUserId);
    return { status: 200, data: { discrepancies: userDiscrepancies } };
  }

  if (cleanUrl === '/attendance/discrepancy' && method === 'post') {
    const payload = getPayload(config.data);
    const recordId = payload.record_id;
    const reason = payload.reason;
    
    const record = db.attendanceRecords.find((r: any) => r.id === recordId);
    if (!record) {
      return { status: 404, data: { error: "Record not found" } };
    }
    
    record.discrepancy_reported = true;
    const newDiscrepancy = {
      id: `disc_${Date.now()}`,
      record_id: recordId,
      student_id: activeUserId,
      reason: reason,
      status: "pending",
      resolution_remarks: null,
      created_at: new Date().toISOString(),
      resolved_at: null,
      session: record.session,
      current_status: record.status
    };
    record.discrepancy = newDiscrepancy;
    db.attendanceDiscrepancies.push(newDiscrepancy);
    saveMockDb(db);
    
    return { status: 201, data: { discrepancy: newDiscrepancy } };
  }

  if (cleanUrl.startsWith('/attendance/discrepancy/') && cleanUrl.endsWith('/resolve') && method === 'post') {
    const parts = cleanUrl.split('/');
    const discrepancyId = parts[parts.length - 2];
    const payload = getPayload(config.data);
    
    const discrepancy = db.attendanceDiscrepancies.find((d: any) => d.id === discrepancyId);
    if (!discrepancy) {
      return { status: 404, data: { error: "Discrepancy not found" } };
    }
    
    discrepancy.status = payload.status;
    discrepancy.resolution_remarks = payload.resolution_remarks;
    discrepancy.resolved_at = new Date().toISOString();
    
    const record = db.attendanceRecords.find((r: any) => r.id === discrepancy.record_id);
    if (record) {
      record.discrepancy_reported = false;
      if (payload.status === 'resolved' && payload.updated_status) {
        const oldStatus = record.status;
        const newStatus = payload.updated_status;
        record.status = newStatus;
        
        // Update statistics
        const sub = db.attendanceSubjects.find((s: any) => s.student_id === record.student_id && s.subject_code === record.session?.subject_code);
        if (sub) {
          if (oldStatus === 'absent') sub.absent = Math.max(0, sub.absent - 1);
          else if (oldStatus === 'present') sub.present = Math.max(0, sub.present - 1);
          else if (oldStatus === 'late') sub.late = Math.max(0, sub.late - 1);
          
          if (newStatus === 'present') sub.present += 1;
          else if (newStatus === 'absent') sub.absent += 1;
          else if (newStatus === 'late') sub.late += 1;
          
          sub.percentage = parseFloat(((sub.present / sub.total_classes) * 100).toFixed(1));
        }
      }
      record.discrepancy = { ...discrepancy };
    }
    saveMockDb(db);
    return { status: 200, data: { success: true, discrepancy } };
  }

  if (cleanUrl === '/attendance/stats' && method === 'get') {
    const userSubjects = db.attendanceSubjects.filter((s: any) => s.student_id === activeUserId);
    const overall_attendance = userSubjects.length > 0
      ? parseFloat((userSubjects.reduce((acc: number, s: any) => acc + s.percentage, 0) / userSubjects.length).toFixed(1))
      : 82.5;
    const total_conducted = userSubjects.reduce((acc: number, s: any) => acc + s.total_classes, 0);
    const total_present = userSubjects.reduce((acc: number, s: any) => acc + s.present, 0);
    
    return {
      status: 200,
      data: {
        overall_attendance,
        total_conducted,
        total_present,
        subjects: userSubjects
      }
    };
  }

  if (cleanUrl === '/attendance/scan-qr' && method === 'post') {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Check if record already exists for CS301, period 1, today
    const existingRecIdx = db.attendanceRecords.findIndex((r: any) => 
      r.student_id === activeUserId &&
      r.session?.subject_code === "CS301" &&
      r.session?.session_date === todayStr &&
      r.session?.period_number === 1
    );
    
    let isStatusChanged = false;
    let isNewRecord = false;
    
    if (existingRecIdx !== -1) {
      const rec = db.attendanceRecords[existingRecIdx];
      if (rec.status !== 'present') {
        rec.status = 'present';
        rec.method = 'qr_scan';
        rec.marked_at = new Date().toISOString();
        isStatusChanged = true;
      }
    } else {
      const newRec = {
        id: `rec_${Date.now()}`,
        session_id: `sess_cs301_today`,
        student_id: activeUserId,
        status: "present",
        method: "qr_scan",
        marked_at: new Date().toISOString(),
        remarks: null,
        discrepancy_reported: false,
        discrepancy: null,
        session: {
          subject_code: "CS301",
          subject_name: "Data Structures",
          session_date: todayStr,
          period_number: 1
        }
      };
      db.attendanceRecords.unshift(newRec);
      isNewRecord = true;
    }
    
    // Update db.attendanceSubjects
    const sub = db.attendanceSubjects.find((s: any) => s.student_id === activeUserId && s.subject_code === "CS301");
    if (sub) {
      if (isNewRecord) {
        sub.total_classes += 1;
        sub.present += 1;
      } else if (isStatusChanged) {
        if (sub.absent > 0) sub.absent -= 1;
        sub.present += 1;
      }
      sub.percentage = parseFloat(((sub.present / sub.total_classes) * 100).toFixed(1));
    } else {
      const seededSubjects = INITIAL_ATTENDANCE_SUBJECTS.map((s: any) => ({ ...s, student_id: activeUserId }));
      const currentSub = seededSubjects.find((s: any) => s.subject_code === "CS301");
      if (currentSub) {
        currentSub.total_classes += 1;
        currentSub.present += 1;
        currentSub.percentage = parseFloat(((currentSub.present / currentSub.total_classes) * 100).toFixed(1));
      }
      db.attendanceSubjects.push(...seededSubjects);
    }
    
    saveMockDb(db);
    return {
      status: 200,
      data: {
        success: true,
        message: "Attendance marked successfully via QR Code!"
      }
    };
  }

  // Live Bus Tracking
  if (cleanUrl === '/campus/bus/locations' && method === 'get') {
    const buses = [
      { id: "b1", route: "Route 1 - Avadi Direct", driver: "Rajesh", coords: [13.1145, 80.1121], speed: 35, status: "on_time", eta: "10 mins" },
      { id: "b2", route: "Route 5 - Koyambedu Express", driver: "Senthil", coords: [13.0694, 80.1948], speed: 45, status: "delayed", eta: "25 mins" }
    ];
    return { status: 200, data: buses };
  }

  // Indoor map directions
  if (cleanUrl === '/campus/map/directions' && method === 'get') {
    return {
      status: 200,
      data: {
        route: ["Entrance Gate", "Main Block Lobby", "A-Block Stairs", "2nd Floor Corridor", "Room LH-101"],
        distance_meters: 180,
        est_seconds: 120
      }
    };
  }

  // AI Assistant Chatbot
  if (cleanUrl === '/ai/chat' && method === 'post') {
    const payload = getPayload(config.data);
    const query = payload.message?.toLowerCase() || '';
    
    let reply = "I'm the VelTech AI Assistant! Ask me about your grades, attendance, or building navigations.";
    if (query.includes('grade') || query.includes('result') || query.includes('marks')) {
      reply = "According to your results history, you are doing great! Your average CGPA across completed semesters is 8.42, with top scores in DBMS and Computer Organization.";
    } else if (query.includes('attendance') || query.includes('bunk')) {
      reply = "Your current overall attendance is 82.5%. You are safe in all subjects. You can safely bunk 3 more classes of English and still stay above 75%!";
    } else if (query.includes('canteen') || query.includes('hungry')) {
      reply = "Today's hot specials in the digital canteen are Masala Dosa (Rs.40) and Veg Fried Rice (Rs.55). You can order directly inside the Canteen tab!";
    } else if (query.includes('exam')) {
      reply = "Your end-semester exams will begin on June 15, 2026. The first paper is Data Structures (CS301) in room LH-101 at 09:30 AM.";
    }

    return {
      status: 200,
      data: { reply }
    };
  }

  // GPA Predictor
  if (cleanUrl === '/ai/gpa-predictor' && method === 'post') {
    const payload = getPayload(config.data);
    const sgpa = payload.target_sgpa || 8.0;
    return {
      status: 200,
      data: {
        predicted_cgpa: 8.52,
        required_scores: [
          { subject: "Data Structures", min_grade: "A", weight: "High" },
          { subject: "Digital Logic", min_grade: "B+", weight: "Medium" },
          { subject: "Operating Systems", min_grade: "A", weight: "High" }
        ]
      }
    };
  }

  // ==========================================
  // Job & Placement Portal Routes
  // ==========================================
  if (cleanUrl === '/career/jobs' && method === 'get') {
    return { status: 200, data: db.jobs };
  }
  if (cleanUrl === '/career/jobs/saved' && method === 'get') {
    const saved = db.savedJobs || [];
    const savedList = db.jobs.filter((j: any) => saved.includes(j.id));
    return { status: 200, data: savedList };
  }
  if (cleanUrl === '/career/jobs/my-applications' && method === 'get') {
    const apps = db.jobApplications || [];
    const myApps = apps.filter((a: any) => a.student_id === activeUserId);
    return { status: 200, data: myApps };
  }
  if (cleanUrl.startsWith('/career/jobs/') && cleanUrl.endsWith('/save') && method === 'post') {
    const jid = cleanUrl.split('/')[3];
    if (!db.savedJobs) db.savedJobs = [];
    const idx = db.savedJobs.indexOf(jid);
    if (idx !== -1) {
      db.savedJobs.splice(idx, 1);
    } else {
      db.savedJobs.push(jid);
    }
    saveMockDb(db);
    return { status: 200, data: { success: true, saved: db.savedJobs.includes(jid) } };
  }
  if (cleanUrl.startsWith('/career/jobs/') && cleanUrl.endsWith('/apply') && method === 'post') {
    const jid = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    if (!db.jobApplications) db.jobApplications = [];
    const job = db.jobs.find((j: any) => j.id === jid);
    if (job) {
      const newApp = {
        id: `app_${Date.now()}`,
        job_id: jid,
        student_id: activeUserId,
        status: "applied",
        applied_at: new Date().toISOString(),
        resume_url: payload.resume_url || "https://cdn.veltech.edu.in/resumes/std_resume.pdf",
        job: job
      };
      db.jobApplications.push(newApp);
      saveMockDb(db);
      return { status: 201, data: newApp };
    }
    return { status: 404, data: { error: "Job not found" } };
  }

  // ==========================================
  // Library Portal Routes
  // ==========================================
  if (cleanUrl === '/campus/library/books' && method === 'get') {
    const q = urlParams.get('q')?.toLowerCase() || '';
    const cat = urlParams.get('category')?.toLowerCase() || '';
    const books = db.libraryBooks || [];
    const filtered = books.filter((b: any) => {
      const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      const matchCat = !cat || (b.category || '').toLowerCase().includes(cat);
      return matchQ && matchCat;
    });
    return { status: 200, data: { books: filtered } };
  }
  if (cleanUrl === '/campus/library/my-issues' && method === 'get') {
    const issues = db.libraryIssues || [];
    const myIssues = issues.filter((i: any) => i.student_id === activeUserId).map((iss: any) => ({
      ...iss,
      renewed_count: iss.renewed_count || 0,
      fine_amount: iss.fine_amount || 0,
      returned_date: iss.returned_date || null
    }));
    return { status: 200, data: { issues: myIssues } };
  }
  if (cleanUrl.startsWith('/campus/library/renew/') && method === 'post') {
    const issueId = cleanUrl.split('/').pop();
    const issue = db.libraryIssues.find((i: any) => i.id === issueId);
    if (issue) {
      const oldDue = new Date(issue.due_date);
      oldDue.setDate(oldDue.getDate() + 14);
      issue.due_date = oldDue.toISOString().split("T")[0];
      issue.renewed_count = (issue.renewed_count || 0) + 1;
      saveMockDb(db);
      return { status: 200, data: { success: true, message: "Book renewed successfully!", issue: { due_date: issue.due_date, renewed_count: issue.renewed_count } } };
    }
    return { status: 404, data: { error: "Transaction not found" } };
  }

  // ==========================================
  // Company Prep Routes
  // ==========================================
  if (cleanUrl.startsWith('/career/prep/') && method === 'get') {
    const compStr = cleanUrl.split('/').pop() || '';
    const q = decodeURIComponent(compStr).toLowerCase();
    const list = db.companyPrep || [];
    const filtered = list.filter((p: any) => p.company_name.toLowerCase().includes(q) || p.question_text.toLowerCase().includes(q));
    return { status: 200, data: filtered };
  }
  if (cleanUrl.startsWith('/career/prep/') && cleanUrl.endsWith('/question') && method === 'post') {
    const compStr = cleanUrl.split('/')[3] || '';
    const company = decodeURIComponent(compStr);
    const payload = getPayload(config.data);
    const newQ = {
      id: `prep_${Date.now()}`,
      company_name: company,
      question_text: payload.question_text,
      category: payload.category || "technical",
      year: parseInt(payload.year) || 2026,
      upvotes: 0
    };
    db.companyPrep.push(newQ);
    saveMockDb(db);
    return { status: 201, data: newQ };
  }
  if (cleanUrl.startsWith('/career/prep/question/') && method === 'put') {
    const qid = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    const qIdx = db.companyPrep.findIndex((p: any) => p.id === qid);
    if (qIdx !== -1) {
      db.companyPrep[qIdx] = { ...db.companyPrep[qIdx], ...payload };
      saveMockDb(db);
      return { status: 200, data: db.companyPrep[qIdx] };
    }
  }
  if (cleanUrl.startsWith('/career/prep/question/') && method === 'delete') {
    const qid = cleanUrl.split('/').pop();
    db.companyPrep = db.companyPrep.filter((p: any) => p.id !== qid);
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }
  if (cleanUrl.startsWith('/career/prep/question/') && cleanUrl.endsWith('/upvote') && method === 'post') {
    const qid = cleanUrl.split('/')[4];
    const q = db.companyPrep.find((p: any) => p.id === qid);
    if (q) {
      q.upvotes = (q.upvotes || 0) + 1;
      saveMockDb(db);
      return { status: 200, data: q };
    }
  }

  // ==========================================
  // Alumni & Referral Hub Routes
  // ==========================================
  if (cleanUrl === '/career/alumni/referral-hub' && method === 'get') {
    return { status: 200, data: { referral_alumni: db.alumni } };
  }
  if (cleanUrl === '/career/alumni' && method === 'get') {
    const compFilter = urlParams.get('company')?.toLowerCase() || '';
    const filtered = db.alumni.filter((a: any) => !compFilter || a.company.toLowerCase().includes(compFilter));
    return { status: 200, data: filtered };
  }

  // ==========================================
  // Team Finder Routes
  // ==========================================
  if (cleanUrl === '/career/team-finder/profile' && method === 'get') {
    const profile = db.teamProfiles.find((t: any) => t.user_id === activeUserId);
    return { status: 200, data: { profile: profile || null } };
  }
  if (cleanUrl === '/career/team-finder/profile' && method === 'post') {
    const payload = getPayload(config.data);
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    let profile = db.teamProfiles.find((t: any) => t.user_id === activeUserId);
    if (!profile) {
      profile = {
        id: `team_${activeUserId}`,
        user_id: activeUserId,
        name: activeUser ? `${activeUser.first_name} ${activeUser.last_name}` : "Student",
        department: activeUser?.department || "CSE",
        year: "3rd Year",
        skills: payload.skills || [],
        looking_for: payload.looking_for || "",
        bio: payload.bio || "",
        match_pct: 100
      };
      db.teamProfiles.push(profile);
    } else {
      profile.skills = payload.skills || [];
      profile.looking_for = payload.looking_for || "";
      profile.bio = payload.bio || "";
    }
    saveMockDb(db);
    return { status: 200, data: { profile } };
  }
  if (cleanUrl === '/career/team-finder/profiles' && method === 'get') {
    const swipedTargets = (db.swipes || [])
      .filter((s: any) => s.user_id === activeUserId)
      .map((s: any) => s.target_id);
    
    let list = db.teamProfiles.filter((t: any) => t.user_id !== activeUserId && !swipedTargets.includes(t.user_id));
    return { status: 200, data: { profiles: list } };
  }
  if (cleanUrl === '/career/team-finder/swipe' && method === 'post') {
    const payload = getPayload(config.data);
    const { target_id, direction } = payload;
    if (!db.swipes) db.swipes = [];
    db.swipes.push({ user_id: activeUserId, target_id, direction });
    
    let is_match = false;
    if (direction === 'right') {
      is_match = Math.random() < 0.7;
      if (is_match) {
        if (!db.matches) db.matches = [];
        const matchId = `match_${Date.now()}`;
        db.matches.push({
          id: matchId,
          user1_id: activeUserId,
          user2_id: target_id,
          matched_at: new Date().toISOString()
        });
      }
    }
    saveMockDb(db);
    return { status: 200, data: { success: true, is_match } };
  }
  if (cleanUrl === '/career/team-finder/matches' && method === 'get') {
    const myMatches = (db.matches || []).filter((m: any) => m.user1_id === activeUserId || m.user2_id === activeUserId);
    const matchesMapped = myMatches.map((m: any) => {
      const otherId = m.user1_id === activeUserId ? m.user2_id : m.user1_id;
      const otherUser = db.teamProfiles.find((t: any) => t.user_id === otherId);
      return {
        id: m.id,
        matched_at: m.matched_at,
        other_user: otherUser ? {
          id: otherUser.user_id,
          name: otherUser.name,
          department: otherUser.department,
          skills: otherUser.skills
        } : null
      };
    });
    return { status: 200, data: { matches: matchesMapped } };
  }
  if (cleanUrl.startsWith('/career/team-finder/messages/') && method === 'get') {
    const matchId = cleanUrl.split('/').pop();
    const chatMsgs = (db.messages || []).filter((msg: any) => msg.match_id === matchId);
    return { status: 200, data: { messages: chatMsgs } };
  }
  if (cleanUrl.startsWith('/career/team-finder/messages/') && method === 'post') {
    const matchId = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    if (!db.messages) db.messages = [];
    const newMsg = {
      id: `msg_${Date.now()}`,
      match_id: matchId,
      sender_id: activeUserId,
      sender_name: activeUser ? `${activeUser.first_name} ${activeUser.last_name}` : "Teammate",
      content: payload.content,
      sent_at: new Date().toISOString()
    };
    db.messages.push(newMsg);
    saveMockDb(db);
    return { status: 201, data: { message: newMsg } };
  }
  if (cleanUrl === '/career/team-finder/report' && method === 'post') {
    const payload = getPayload(config.data);
    if (!db.swipes) db.swipes = [];
    db.swipes.push({ user_id: activeUserId, target_id: payload.reported_id, direction: 'left' });
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }

  // ==========================================
  // Mock Test Routes
  // ==========================================
  if (cleanUrl === '/career/mock-tests' && method === 'get') {
    return { status: 200, data: { tests: db.mockTests } };
  }
  if (cleanUrl.startsWith('/career/mock-tests/') && cleanUrl.endsWith('/questions') && method === 'get') {
    const tid = cleanUrl.split('/')[3];
    const questions = db.mockTestQuestions.filter((q: any) => q.test_id === tid);
    return { status: 200, data: { questions: questions } };
  }

  // ==========================================
  // Internship Tracker Routes
  // ==========================================
  if (cleanUrl === '/career/internships' && method === 'get') {
    const studentInts = db.internships.filter((i: any) => i.student_id === activeUserId);
    return { status: 200, data: { internships: studentInts } };
  }
  if (cleanUrl === '/career/internships' && method === 'post') {
    const payload = getPayload(config.data);
    const newInt = {
      id: `int_${Date.now()}`,
      student_id: activeUserId,
      company_name: payload.company_name,
      role_title: payload.role_title,
      description: payload.description || "",
      start_date: payload.start_date || new Date().toISOString().split('T')[0],
      end_date: payload.end_date || null,
      stipend: parseFloat(payload.stipend) || 0,
      mode: payload.mode || "onsite",
      certificate_url: payload.certificate_url || "",
      status: payload.status || "ongoing",
      skills_learned: payload.skills_learned || "",
      is_verified: false
    };
    db.internships.push(newInt);
    saveMockDb(db);
    return { status: 201, data: { success: true, internship: newInt } };
  }
  if (cleanUrl.startsWith('/career/internships/') && method === 'put') {
    const id = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    const idx = db.internships.findIndex((i: any) => i.id === id);
    if (idx !== -1) {
      db.internships[idx] = { ...db.internships[idx], ...payload };
      saveMockDb(db);
      return { status: 200, data: { success: true, internship: db.internships[idx] } };
    }
  }
  if (cleanUrl.startsWith('/career/internships/') && method === 'delete') {
    const id = cleanUrl.split('/').pop();
    db.internships = db.internships.filter((i: any) => i.id !== id);
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }
  if (cleanUrl === '/career/internships/export' && method === 'get') {
    const csvContent = "company_name,role_title,start_date,end_date,stipend,mode,status,is_verified\n" +
      db.internships.map((i: any) => `"${i.company_name}","${i.role_title}","${i.start_date}","${i.end_date}",${i.stipend},"${i.mode}","${i.status}",${i.is_verified}`).join('\n');
    return { status: 200, data: new Blob([csvContent], { type: 'text/csv' }) };
  }
  if (cleanUrl.startsWith('/career/mock-tests/') && cleanUrl.endsWith('/submit') && method === 'post') {
    const tid = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    const questions = db.mockTestQuestions.filter((q: any) => q.test_id === tid);
    
    let score = 0;
    const details = questions.map((q: any) => {
      const selected = payload.answers?.[q.id] || '';
      const isCorrect = selected.toLowerCase() === q.correct_option.toLowerCase();
      if (isCorrect) score += 1;
      return {
        question_id: q.id,
        selected_option: selected,
        correct_option: q.correct_option,
        is_correct: isCorrect
      };
    });

    const attempt = {
      id: `att_${Date.now()}`,
      test_id: tid,
      student_id: activeUserId,
      score,
      total_questions: questions.length,
      percentage: parseFloat(((score / questions.length) * 100).toFixed(1)),
      attempted_at: new Date().toISOString(),
      details
    };
    if (!db.mockTestAttempts) db.mockTestAttempts = [];
    db.mockTestAttempts.push(attempt);
    saveMockDb(db);
    return { status: 200, data: attempt };
  }
  if (cleanUrl === '/career/mock-tests' && method === 'post') {
    const payload = getPayload(config.data);
    const newTest = {
      id: `test_${Date.now()}`,
      title: payload.title,
      description: payload.description || "",
      category: payload.category || "aptitude",
      duration_minutes: parseInt(payload.duration_minutes) || 30,
      total_questions: parseInt(payload.total_questions) || 0,
      difficulty: payload.difficulty || "medium",
      is_active: true
    };
    db.mockTests.push(newTest);
    saveMockDb(db);
    return { status: 201, data: newTest };
  }
  if (cleanUrl.startsWith('/career/mock-tests/') && method === 'put') {
    const tid = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    const idx = db.mockTests.findIndex((t: any) => t.id === tid);
    if (idx !== -1) {
      db.mockTests[idx] = { ...db.mockTests[idx], ...payload };
      saveMockDb(db);
      return { status: 200, data: db.mockTests[idx] };
    }
  }
  if (cleanUrl.startsWith('/career/mock-tests/') && method === 'delete') {
    const tid = cleanUrl.split('/').pop();
    db.mockTests = db.mockTests.filter((t: any) => t.id !== tid);
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }

  // ==========================================
  // Exam Schedules Routes
  // ==========================================
  if (cleanUrl === '/academic/exams' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    if (activeUser && activeUser.role === 'student') {
      const studentExams = db.exams.filter((e: any) => e.department === activeUser.department && e.semester === activeUser.semester);
      return { status: 200, data: studentExams };
    }
    return { status: 200, data: db.exams };
  }

  // ==========================================
  // Previous Year Question Papers (PYQs)
  // ==========================================
  if (cleanUrl === '/academic/question-papers' && method === 'get') {
    const papers = db.questionPapers || [];
    return { status: 200, data: papers };
  }

  // Default fallback for any unmocked GET request
  if (method === 'get') {
    return {
      status: 200,
      data: []
    };
  }

  // Default fallback for any unmocked POST/PUT/DELETE
  return {
    status: 200,
    data: { success: true }
  };
};
