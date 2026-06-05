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
          const p = slot_idx + 1;
          const startHour = p >= 5 ? 9 + p : 9 + (p - 1);
          const startStr = startHour < 10 ? `0${startHour}:00` : `${startHour}:00`;
          const endStr = startHour < 10 ? `0${startHour}:50` : `${startHour}:50`;
          timetable.push({
            id: `slot_${d}_${yr}_${sub.code}`,
            department: d, semester: sem, day: day, period_number: p,
            start_time: startStr, end_time: endStr, slot_type: "lecture",
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
  const categories = ['Engineering', 'Science', 'Mathematics', 'Computer Science', 'Literature', 'Reference'];
  const categoryBooks: Record<string, string[]> = {
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
  };
  let b_counter = 0;
  depts.forEach((d) => {
    for (let i = 1; i <= 15; i++) {
      b_counter++;
      const category = categories[b_counter % categories.length];
      const titleList = categoryBooks[category];
      const titleIndex = (b_counter + i) % titleList.length;
      const title = `${titleList[titleIndex]} - Edition ${1 + (b_counter % 3)}`;
      const author = `Prof. ${stud_firsts[b_counter % 40]} ${stud_lasts[b_counter % 40]}`;
      const isbn = `978-3-16-148${1000 + b_counter}`;
      
      libraryBooks.push({
        id: `lib_${b_counter}`,
        title: title,
        author: author,
        isbn: isbn,
        category: category,
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
    { id: "job_1", company_name: "Google", role_title: "Graduate Engineer Trainee - Software Development", description: "Software Trainee at Google. Expertise in React/Node/PostgreSQL. Strong problem-solving and DSA fundamentals required.", package_lpa: 24.5, salary: "24.5 LPA", min_cgpa: 8.0, eligible_departments: "CSE,IT,ECE", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Bangalore", last_date_apply: "2026-06-15", drive_date: "2026-06-25" },
    { id: "job_2", company_name: "Microsoft", role_title: "Cloud Support Engineer - Azure", description: "Cloud Engineer Trainee. Python & scripting skills, Azure/AWS experience is a plus.", package_lpa: 18.0, salary: "18 LPA", min_cgpa: 7.5, eligible_departments: "CSE,IT,ECE", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Hyderabad", last_date_apply: "2026-06-18", drive_date: "2026-06-28" },
    { id: "job_3", company_name: "Amazon", role_title: "SDE-1 (Software Development Engineer)", description: "Build scalable distributed systems. Strong CS fundamentals, data structures, algorithms required. Work on real Amazon-scale services.", package_lpa: 21.0, salary: "21 LPA", min_cgpa: 8.0, eligible_departments: "CSE,IT", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Chennai", last_date_apply: "2026-06-20", drive_date: "2026-07-01" },
    { id: "job_4", company_name: "TCS", role_title: "Digital Profile - Full Stack Developer", description: "Focuses on full stack development, cloud architectures, and DevOps pipelines. Training provided for fresh graduates.", package_lpa: 7.0, salary: "7 LPA", min_cgpa: 6.5, eligible_departments: "CSE,IT,ECE,EEE,MECH", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Pan India", last_date_apply: "2026-06-12", drive_date: "2026-06-22" },
    { id: "job_5", company_name: "Deloitte", role_title: "Business Technology Analyst", description: "SQL, analytics, and consulting skills desired. Work with Fortune 500 clients on digital transformation projects.", package_lpa: 8.5, salary: "8.5 LPA", min_cgpa: 7.5, eligible_departments: "CSE,IT,ECE,EEE,MECH", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Bangalore", last_date_apply: "2026-06-14", drive_date: "2026-06-24" },
    { id: "job_6", company_name: "Infosys", role_title: "Power Programmer - Specialist Engineer", description: "Infosys Power Programmer role for top-performing engineering graduates. Competitive coding, system design skills required.", package_lpa: 9.5, salary: "9.5 LPA", min_cgpa: 8.0, eligible_departments: "CSE,IT", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Mysuru", last_date_apply: "2026-06-16", drive_date: "2026-06-26" },
    { id: "job_7", company_name: "Qualcomm", role_title: "Silicon Verification Engineer", description: "VLSI design and verification. SystemVerilog, UVM methodologies. Work on cutting-edge mobile SoC chips.", package_lpa: 22.0, salary: "22 LPA", min_cgpa: 8.0, eligible_departments: "ECE,EEE", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Hyderabad", last_date_apply: "2026-06-12", drive_date: "2026-06-22" },
    { id: "job_8", company_name: "Zoho", role_title: "Software Developer - Product Engineering", description: "Build enterprise SaaS products used by millions. Java, JavaScript, problem-solving mindset required. No CGPA cutoff!", package_lpa: 6.5, salary: "6.5 LPA", min_cgpa: 0, eligible_departments: "all", eligible_batch_year: 2026, job_type: "placement", is_active: true, location: "Chennai", last_date_apply: "2026-06-25", drive_date: "2026-07-05" }
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
    { id: "b6", name: "Problem Solving", description: "Solved 250+ technical logic algorithm tasks", category: "technical", icon: "cpu", color: "#f97316", points: 100, criteria: "Clear advanced aptitude coding tests" },
    { id: "b7", name: "Volunteer Excellence", description: "Earned by completing 30+ hours of verified volunteering and event coordination duty.", category: "soft_skill", icon: "award", color: "#eab308", points: 100, criteria: "Complete at least 30 hours of verified volunteering duty." }
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
    },
    {
      id: "test_2",
      title: "Advanced Java & Core CS Fundamentals",
      description: "Comprehensive mock evaluating OOP design, threading, JVM garbage collection, and database systems.",
      category: "technical",
      duration_minutes: 45,
      total_questions: 5,
      difficulty: "hard",
      is_active: true
    },
    {
      id: "test_3",
      title: "Quantitative & Analytical Reasoning",
      description: "Speed test on permutations, combinations, work-time speed, probability, and logical deduction.",
      category: "aptitude",
      duration_minutes: 20,
      total_questions: 5,
      difficulty: "easy",
      is_active: true
    },
    {
      id: "test_4",
      title: "Full Stack Web & System Architecture",
      description: "Assessments on system boundaries, load balancers, HTTP/2, REST API paradigms, and SQL optimization.",
      category: "coding",
      duration_minutes: 40,
      total_questions: 4,
      difficulty: "medium",
      is_active: true
    }
  ];

  const mockTestQuestions = [
    { id: "q1", test_id: "test_1", question_text: "What is the worst case complexity of Quick Sort?", option_a: "O(N)", option_b: "O(N log N)", option_c: "O(N^2)", option_d: "O(2^N)", correct_option: "c", explanation: "Pivot choice could lead to O(N^2) complexity in worst sorted sequences.", order_num: 1 },
    { id: "q2", test_id: "test_1", question_text: "Which data structure operates on a Last In First Out (LIFO) basis?", option_a: "Queue", option_b: "Stack", option_c: "Tree", option_d: "Graph", correct_option: "b", explanation: "A stack is a LIFO linear data structure.", order_num: 2 },
    { id: "q3", test_id: "test_1", question_text: "Which of the following is not an operating system?", option_a: "Linux", option_b: "Windows", option_c: "Oracle", option_d: "macOS", correct_option: "c", explanation: "Oracle is a database engine company, not an OS.", order_num: 3 },
    
    // Test 2 Questions (Java & Core CS)
    { id: "q2_1", test_id: "test_2", question_text: "Which collection in Java does not allow duplicate elements?", option_a: "List", option_b: "Set", option_c: "Map", option_d: "Vector", correct_option: "b", explanation: "Set interface guarantees no duplicate elements.", order_num: 1 },
    { id: "q2_2", test_id: "test_2", question_text: "Which of the following creates a thread in Java?", option_a: "By implementing Runnable interface", option_b: "By extending Thread class", option_c: "Both A and B", option_d: "None of these", correct_option: "c", explanation: "Thread creation is supported by both extending Thread and implementing Runnable.", order_num: 2 },
    { id: "q2_3", test_id: "test_2", question_text: "What is the main purpose of garbage collection in Java?", option_a: "To free unreferenced memory", option_b: "To clear memory buffer manually", option_c: "To compile code faster", option_d: "To restrict variable scopes", correct_option: "a", explanation: "Garbage collection automatically reclaims unreferenced heap memory.", order_num: 3 },
    { id: "q2_4", test_id: "test_2", question_text: "What is isolation level in database transactions primarily resolving?", option_a: "Concurrency interference issues", option_b: "Disk write permanent failures", option_c: "Incorrect syntax checks", option_d: "Table column size constraints", correct_option: "a", explanation: "Isolation levels define transaction visibility rules during concurrent operations.", order_num: 4 },
    { id: "q2_5", test_id: "test_2", question_text: "What is the time complexity to search an element in a balanced Binary Search Tree?", option_a: "O(1)", option_b: "O(log N)", option_c: "O(N)", option_d: "O(N log N)", correct_option: "b", explanation: "Balanced BST halves the search space at each level, leading to logarithmic complexity.", order_num: 5 },

    // Test 3 Questions (Reasoning)
    { id: "q3_1", test_id: "test_3", question_text: "If A is twice as fast as B, and B is thrice as fast as C. If C covers a distance in 42 mins, B will cover it in:", option_a: "14 mins", option_b: "7 mins", option_c: "21 mins", option_d: "28 mins", correct_option: "a", explanation: "Ratio of speeds A:B:C is 6:3:1. Speed B is 3x speed C, so B takes 1/3 of C's time (42/3 = 14).", order_num: 1 },
    { id: "q3_2", test_id: "test_3", question_text: "Find the missing number in the series: 3, 5, 9, 17, 33, ...", option_a: "65", option_b: "48", option_c: "52", option_d: "60", correct_option: "a", explanation: "The difference doubles each time: +2, +4, +8, +16, next is +32, so 33 + 32 = 65.", order_num: 2 },
    { id: "q3_3", test_id: "test_3", question_text: "What is the probability of drawing an Ace from a standard deck of 52 cards?", option_a: "1/13", option_b: "1/52", option_c: "4/13", option_d: "1/26", correct_option: "a", explanation: "There are 4 Aces in 52 cards. 4/52 = 1/13.", order_num: 3 },
    { id: "q3_4", test_id: "test_3", question_text: "A train 120m long passes a pole in 6 seconds. What is its speed in km/h?", option_a: "72 km/h", option_b: "60 km/h", option_c: "80 km/h", option_d: "90 km/h", correct_option: "a", explanation: "Speed = Distance / Time = 120 / 6 = 20 m/s. 20 * (18/5) = 72 km/h.", order_num: 4 },
    { id: "q3_5", test_id: "test_3", question_text: "A can do a piece of work in 10 days, B in 15 days. How many days will they take working together?", option_a: "6 days", option_b: "5 days", option_c: "7 days", option_d: "8 days", correct_option: "a", explanation: "Combined rate = 1/10 + 1/15 = 5/30 = 1/6. So 6 days total.", order_num: 5 },

    // Test 4 Questions (System Arch)
    { id: "q4_1", test_id: "test_4", question_text: "Which HTTP status code represents a successful resource creation?", option_a: "200 OK", option_b: "201 Created", option_c: "202 Accepted", option_d: "204 No Content", correct_option: "b", explanation: "201 Created represents successful asynchronous/synchronous resource creation.", order_num: 1 },
    { id: "q4_2", test_id: "test_4", question_text: "What is the primary benefit of a reverse proxy like Nginx?", option_a: "Load balancing & SSL termination", option_b: "Compiling JavaScript bundles", option_c: "Encrypting database backups", option_d: "Managing local disk partitions", correct_option: "a", explanation: "Nginx excels at load balancing, SSL termination, and caching static resources.", order_num: 2 },
    { id: "q4_3", test_id: "test_4", question_text: "What does horizontal scaling of a database involve?", option_a: "Adding more database server nodes", option_b: "Upgrading CPU/RAM of a single node", option_c: "Adding more columns to tables", option_d: "Creating indexes for search", correct_option: "a", explanation: "Horizontal scaling involves distributing database read/writes across multiple cluster nodes.", order_num: 3 },
    { id: "q4_4", test_id: "test_4", question_text: "What is index coverage (covering index) in SQL?", option_a: "An index containing all fields needed in query select", option_b: "An index built over primary key exclusively", option_c: "An index that compresses data automatically", option_d: "An index that auto-deletes unused tables", correct_option: "a", explanation: "A covering index contains all query columns, bypassing the need to look up table rows entirely.", order_num: 4 }
  ];

  // 14. Mock Test Attempts
  const mockTestAttempts = [
    {
      id: "attempt_1",
      test_id: "test_1",
      student_id: "std_1",
      score: 2,
      total: 3,
      time_taken_seconds: 480,
      completed_at: new Date(Date.now() - 3 * 864e5).toISOString()
    },
    {
      id: "attempt_2",
      test_id: "test_3",
      student_id: "std_1",
      score: 4,
      total: 5,
      time_taken_seconds: 320,
      completed_at: new Date(Date.now() - 1 * 864e5).toISOString()
    }
  ];

  // 15. Interviews
  const interviews = [
    { id: "iv_1", posting_id: "job_3", student_id: "std_1", round_name: "Deloitte Analyst Technical Round 1", scheduled_at: new Date(Date.now() + 172800000).toISOString(), venue: "Main Block Cabin 104", status: "scheduled" },
    { id: "iv_2", posting_id: "job_2", student_id: "std_1", round_name: "Amazon SDE-1 Aptitude Screening", scheduled_at: new Date(Date.now() - 432000000).toISOString(), venue: "Online Test Center", status: "completed" }
  ];

  const completeDb = {
    is_comprehensive: true,
    version: 4,
    users,
    timetable,
    results,
    syllabus,
    badges,
    // notices moved to comprehensive block below
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
      { id: 'hp_1', reason: 'Going home for weekend', destination: 'Chennai Central', from_date: new Date(Date.now() + 86400000).toISOString(), to_date: new Date(Date.now() + 3*86400000).toISOString(), status: 'approved', mentor_status: 'approved', student_id: 'std_1', student_name: 'Mani Manjunath', student_reg: '22CSE101', created_at: new Date(Date.now() - 86400000).toISOString(), qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-hp_1' },
      { id: 'hp_2', reason: 'Medical appointment at hospital', destination: 'Apollo Hospital, Chennai', from_date: new Date(Date.now() + 2*86400000).toISOString(), to_date: new Date(Date.now() + 2*86400000 + 18000000).toISOString(), status: 'approved', mentor_status: 'approved', student_id: 'std_1', student_name: 'Mani Manjunath', student_reg: '22CSE101', created_at: new Date().toISOString(), qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-hp_2' },
      { id: 'hp_3', reason: 'Family function - Brother wedding', destination: 'Coimbatore', from_date: new Date(Date.now() + 5*86400000).toISOString(), to_date: new Date(Date.now() + 8*86400000).toISOString(), status: 'pending', mentor_status: 'pending', student_id: 'std_1', student_name: 'Mani Manjunath', student_reg: '22CSE101', created_at: new Date().toISOString() },
      { id: 'hp_4', reason: 'Visiting home for Diwali break', destination: 'Madurai', from_date: new Date(Date.now() + 86400000).toISOString(), to_date: new Date(Date.now() + 4*86400000).toISOString(), status: 'pending', mentor_status: 'pending', student_id: 'std_2', student_name: 'Arjun Reddy', student_reg: '22CSE102', created_at: new Date().toISOString() },
      { id: 'hp_5', reason: 'Medical emergency - dental surgery', destination: 'MIOT Hospital', from_date: new Date(Date.now()).toISOString(), to_date: new Date(Date.now() + 2*86400000).toISOString(), status: 'pending', mentor_status: 'pending', student_id: 'std_3', student_name: 'Neha Sharma', student_reg: '22CSE103', created_at: new Date().toISOString() },
      { id: 'hp_6', reason: 'Sister engagement ceremony', destination: 'Bangalore', from_date: new Date(Date.now() + 3*86400000).toISOString(), to_date: new Date(Date.now() + 6*86400000).toISOString(), status: 'pending', mentor_status: 'pending', student_id: 'std_4', student_name: 'Aditya Verma', student_reg: '22CSE104', created_at: new Date().toISOString() },
      { id: 'hp_7', reason: 'Passport collection from regional office', destination: 'Passport Office Chennai', from_date: new Date(Date.now() + 86400000).toISOString(), to_date: new Date(Date.now() + 86400000 + 28800000).toISOString(), status: 'rejected', mentor_status: 'rejected', student_id: 'std_5', student_name: 'Riya Sen', student_reg: '22CSE105', created_at: new Date(Date.now() - 2*86400000).toISOString() }
    ],
    canteenOrders: [],
    attendanceSessions: [],
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
    mockTestAttempts,
    interviews,
    internships,
    earnedBadges,
    notices: [
      { id: 'n_1', title: 'Mid-Semester Examination Schedule Released', content: 'The mid-semester examination schedule for all departments has been finalized. Students are advised to download the timetable and prepare accordingly. Exams begin from June 15, 2026.', priority: 'high', target_audience: 'all', is_pinned: true, branch: null, year: null, section: null, files: [{ name: 'Mid_Sem_Timetable_June2026.pdf', type: 'pdf', size: '1.4 MB' }], reads: [], author_id: 'admin_1', created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: 'n_2', title: 'Oracle Campus Recruitment Drive', content: 'Oracle is conducting an on-campus recruitment drive for CSE and ECE final year students. Eligible students must register before June 10. Pre-placement talk is scheduled for June 12 at 10 AM in Seminar Hall.', priority: 'high', target_audience: 'all', is_pinned: true, branch: null, year: null, section: null, files: [{ name: 'Oracle_Eligibility_Criteria.pdf', type: 'pdf', size: '850 KB' }, { name: 'Registration_Form.docx', type: 'word', size: '120 KB' }], reads: [], author_id: 'admin_1', created_at: new Date(Date.now() - 2*86400000).toISOString() },
      { id: 'n_3', title: 'Academic Calendar 2026-27 Published', content: 'The academic calendar for the year 2026-27 has been published. All faculty and students are requested to note the important dates including semester start, holidays, and examination periods.', priority: 'normal', target_audience: 'all', is_pinned: false, branch: null, year: null, section: null, files: [{ name: 'Academic_Calendar_2026_27.xlsx', type: 'excel', size: '1.2 MB' }], reads: [], author_id: 'admin_1', created_at: new Date(Date.now() - 3*86400000).toISOString() },
      { id: 'n_4', title: 'Library Book Return Deadline Extended', content: 'Due to the ongoing fest season, the library book return deadline has been extended by one week. All pending returns must be completed by June 20, 2026. Late fees will apply after this date.', priority: 'normal', target_audience: 'all', is_pinned: false, branch: null, year: null, section: null, files: [], reads: [], author_id: 'admin_1', created_at: new Date(Date.now() - 4*86400000).toISOString() },
      { id: 'n_5', title: 'CSE Department Lab Maintenance Notice', content: 'Lab 4 and Lab 6 in the CSE block will be closed for hardware upgrades from June 8-12. Students are requested to use Labs 2 and 3 during this period.', priority: 'urgent', target_audience: 'class', is_pinned: true, branch: 'CSE', year: null, section: null, files: [{ name: 'Lab_Maintenance_Schedule.pdf', type: 'pdf', size: '340 KB' }], reads: [], author_id: 'fac_1', created_at: new Date(Date.now() - 5*86400000).toISOString() },
      { id: 'n_6', title: 'LAVAZA 2026 Cultural Fest Volunteers Required', content: 'Volunteers are needed for the upcoming LAVAZA cultural fest. Interested students can register through the Event Hub. Volunteers completing 30+ hours will earn the Volunteer Excellence badge.', priority: 'normal', target_audience: 'all', is_pinned: false, branch: null, year: null, section: null, files: [{ name: 'Volunteer_Guidelines.pdf', type: 'pdf', size: '560 KB' }], reads: [], author_id: 'admin_1', created_at: new Date(Date.now() - 7*86400000).toISOString() }
    ],
    clubs: [
      { id: 'lavaza', name: 'Lavaza Cultural Club', description: 'The flagship cultural club organizing LAVAZA fest, cultural nights, dance-offs, and inter-college competitions.', club_type: 'cultural', member_count: 520, faculty_advisor_id: 'fac_1', president_id: 'std_2', website_url: 'https://chat.whatsapp.com/mock-lavaza', instagram_url: 'https://instagram.com/veltech_lavaza', is_active: true },
      { id: 'codechef', name: 'CodeChef Chapter', description: 'Weekly CP ladders, contest discussions, and ICPC prep.', club_type: 'technical', member_count: 248, faculty_advisor_id: 'fac_1', president_id: 'std_2', website_url: 'https://chat.whatsapp.com/mock-codechef', instagram_url: 'https://instagram.com/veltech_codechef', is_active: true },
      { id: 'robotics', name: 'Robotics Society', description: 'Autonomous bots, drone builds, and embedded systems labs.', club_type: 'technical', member_count: 142, faculty_advisor_id: 'fac_1', president_id: null, website_url: 'https://chat.whatsapp.com/mock-robotics', instagram_url: 'https://instagram.com/veltech_robotics', is_active: true },
      { id: 'gdsc', name: 'Developer Student Club', description: 'Cloud, Android, web workshops, and product build sprints.', club_type: 'technical', member_count: 311, faculty_advisor_id: 'fac_1', president_id: null, website_url: 'https://chat.whatsapp.com/mock-gdsc', instagram_url: 'https://instagram.com/veltech_gdsc', is_active: true },
      { id: 'finearts', name: 'Fine Arts Forum', description: 'Poster design, stage props, murals, and event branding.', club_type: 'cultural', member_count: 96, faculty_advisor_id: 'fac_1', president_id: null, website_url: 'https://chat.whatsapp.com/mock-finearts', instagram_url: 'https://instagram.com/veltech_finearts', is_active: true },
      { id: 'radio', name: 'Campus Radio', description: 'Host shows, record interviews, and handle event announcements.', club_type: 'media', member_count: 54, faculty_advisor_id: 'fac_1', president_id: null, website_url: 'https://chat.whatsapp.com/mock-radio', instagram_url: 'https://instagram.com/veltech_radio', is_active: true }
    ],
    portfolios: [
      {
        id: 'port_std_1',
        user_id: 'std_1',
        template: 'modern',
        is_public: true,
        public_slug: 'mani-manjunath-std_1',
        view_count: 12,
        data: {
          name: 'Mani Manjunath',
          role: 'Fullstack Developer',
          bio: 'B.Tech student at VelTech University, specializing in Computer Science.',
          skills: ['React', 'Node.js', 'Python', 'SQL', 'Git', 'TailwindCSS'],
          projects: [
            { title: 'University Super-App', desc: 'A comprehensive campus management system with React + Flask' },
            { title: 'AI Portfolio Builder', desc: 'Auto-generates CVs from student data using NLP' }
          ],
          links: { github: 'https://github.com/mani', linkedin: 'https://linkedin.com/in/mani' }
        }
      }
    ],
    flashcards: [
      { id: 'fc_1', front: 'What is the time complexity of Quick Sort in the worst case?', back: 'O(N^2). This happens when the pivot chosen is always the extreme element.', category: 'Algorithms', type: 'company_prep', created_by: 'fac_1', created_at: new Date().toISOString() },
      { id: 'fc_2', front: 'Explain CAP Theorem in Distributed Databases.', back: 'Consistency, Availability, and Partition Tolerance. A distributed system can only provide 2 of these guarantees simultaneously.', category: 'System Design', type: 'company_prep', created_by: 'fac_1', created_at: new Date().toISOString() },
      { id: 'fc_3', front: 'What is polymorphism in Object Oriented Programming?', back: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass. Primarily implemented via overriding and overloading.', category: 'OOP Concepts', type: 'company_prep', created_by: 'fac_1', created_at: new Date().toISOString() },
      { id: "mc_1", front: "What is the primary difference between TCP and UDP?", back: "TCP is connection-oriented, reliable, and guarantees packet delivery order. UDP is connectionless, faster, but does not guarantee delivery or packet order.", category: "Computer Networks", type: 'mock_test', created_by: 'fac_1', created_at: new Date().toISOString() },
      { id: "mc_2", front: "Explain ACID properties of Database Management Systems.", back: "Atomicity (all or nothing), Consistency (preserves database integrity), Isolation (concurrent transactions don't interfere), and Durability (permanent changes).", category: "DBMS", type: 'mock_test', created_by: 'fac_1', created_at: new Date().toISOString() },
      { id: "mc_3", front: "What is dynamic programming?", back: "An algorithmic technique that solves complex problems by breaking them down into simpler overlapping subproblems, solving each subproblem once, and caching their solutions (memoization).", category: "Algorithms", type: 'mock_test', created_by: 'fac_1', created_at: new Date().toISOString() },
      { id: "mc_4", front: "What is a deadlock and what are its four necessary conditions?", back: "A situation where set of processes are blocked because each holds a resource and waits for another. Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.", category: "Operating Systems", type: 'mock_test', created_by: 'fac_1', created_at: new Date().toISOString() }
    ],
    scanned_documents: [],
    assignmentSubmissions: [
      { id: '1', student: 'Arun Kumar', roll: '21CSE101', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'pending', plagiarism: 12 },
      { id: '2', student: 'Priya Sharma', roll: '21CSE102', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'pending', plagiarism: 78, matchWith: 'VTU26012' },
      { id: '3', student: 'Rahul Verma', roll: '21CSE103', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-14', status: 'graded', marks: 8, comment: 'Good work!', plagiarism: 6 },
      { id: '4', student: 'Sneha Patel', roll: '21CSE104', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-16', status: 'pending', plagiarism: 15 },
      { id: '5', student: 'Vikram Singh', roll: '21CSE105', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'graded', marks: 9, comment: 'Excellent implementation.', plagiarism: 22 }
    ]
  };

  localStorage.setItem('mock_db', JSON.stringify(completeDb));
  return completeDb;
};

const getMockDb = () => {
  const data = localStorage.getItem('mock_db');
  if (data) {
    try {
      const parsedDb = JSON.parse(data);
      if (parsedDb.is_comprehensive && parsedDb.version === 4) {
        if (!parsedDb.attendanceSessions) {
          parsedDb.attendanceSessions = [];
        }
        if (!parsedDb.assignmentSubmissions) {
          parsedDb.assignmentSubmissions = [
            { id: '1', student: 'Arun Kumar', roll: '21CSE101', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'pending', plagiarism: 12 },
            { id: '2', student: 'Priya Sharma', roll: '21CSE102', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'pending', plagiarism: 78, matchWith: 'VTU26012' },
            { id: '3', student: 'Rahul Verma', roll: '21CSE103', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-14', status: 'graded', marks: 8, comment: 'Good work!', plagiarism: 6 },
            { id: '4', student: 'Sneha Patel', roll: '21CSE104', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-16', status: 'pending', plagiarism: 15 },
            { id: '5', student: 'Vikram Singh', roll: '21CSE105', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'graded', marks: 9, comment: 'Excellent implementation.', plagiarism: 22 }
          ];
          localStorage.setItem('mock_db', JSON.stringify(parsedDb));
        }
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
  const getQueryParam = (key: string): string => {
    if (config.params && config.params[key] !== undefined && config.params[key] !== null) {
      return String(config.params[key]);
    }
    return urlParams.get(key) || '';
  };
  
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

  // Password Change Mock Endpoint
  if (cleanUrl === '/auth/change-password' && method === 'post') {
    const payload = getPayload(config.data);
    const activeUserStr = localStorage.getItem('user');
    if (!activeUserStr) return { status: 401, data: { error: "Unauthorized" } };
    
    const activeUser = JSON.parse(activeUserStr);
    const user = db.users.find((u: any) => u.id === activeUser.id);
    if (!user) return { status: 404, data: { error: "User not found" } };
    
    if (payload.old_password !== user.password) {
      return { status: 400, data: { error: "Current password is incorrect" } };
    }
    
    // Update password
    user.password = payload.new_password;
    localStorage.setItem('user', JSON.stringify(user));
    saveMockDb(db);
    
    // Revoke all sessions on password change
    db.sessions = [];
    saveMockDb(db);
    
    return {
      status: 200,
      data: { message: "Password changed successfully" }
    };
  }

  // Active Sessions Mock Endpoints
  if (cleanUrl === '/auth/sessions' && method === 'get') {
    if (!db.sessions || db.sessions.length === 0) {
      db.sessions = [
        {
          id: "sess_curr",
          device_info: navigator.userAgent || "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
          device_type: /iPhone|iPad|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
          ip_address: "192.168.1.42",
          is_active: true,
          is_current: true,
          location: "Chennai, Tamil Nadu (VelTech Campus)",
          created_at: new Date(Date.now() - 3600 * 1000).toISOString()
        },
        {
          id: "sess_mac",
          device_info: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0",
          device_type: "desktop",
          ip_address: "10.0.2.15",
          is_active: true,
          is_current: false,
          location: "Bengaluru, Karnataka",
          created_at: new Date(Date.now() - 86400 * 3 * 1000).toISOString()
        }
      ];
      saveMockDb(db);
    }
    return {
      status: 200,
      data: { sessions: db.sessions }
    };
  }

  if (cleanUrl.startsWith('/auth/sessions/') && method === 'delete') {
    const sessId = cleanUrl.split('/').pop();
    if (db.sessions) {
      db.sessions = db.sessions.filter((s: any) => s.id !== sessId);
      saveMockDb(db);
    }
    return {
      status: 200,
      data: { success: true, message: "Session revoked successfully." }
    };
  }

  if (cleanUrl === '/auth/sessions/revoke-all' && method === 'post') {
    db.sessions = [];
    saveMockDb(db);
    return {
      status: 200,
      data: { success: true, message: "All sessions revoked." }
    };
  }

  // Biometrics Mock Endpoints
  if (cleanUrl === '/auth/biometric/register' && method === 'post') {
    const payload = getPayload(config.data);
    if (!db.biometrics) db.biometrics = [];
    
    const newCred = {
      id: `bio_${Date.now()}`,
      credential_id: payload.credential_id,
      public_key: payload.public_key,
      device_name: payload.device_name || "TouchID/FaceID Device",
      user_id: activeUserId,
      created_at: new Date().toISOString()
    };
    
    db.biometrics.push(newCred);
    saveMockDb(db);
    return {
      status: 201,
      data: { message: "Biometric registered successfully", credential: newCred }
    };
  }

  if (cleanUrl === '/auth/biometric/credentials' && method === 'get') {
    const list = (db.biometrics || []).filter((c: any) => c.user_id === activeUserId);
    return {
      status: 200,
      data: { credentials: list }
    };
  }

  if (cleanUrl.startsWith('/auth/biometric/credentials/') && method === 'delete') {
    const credId = cleanUrl.split('/').pop();
    if (db.biometrics) {
      db.biometrics = db.biometrics.filter((c: any) => c.id !== credId);
      saveMockDb(db);
    }
    return {
      status: 200,
      data: { success: true, message: "Credential revoked." }
    };
  }

  if (cleanUrl === '/auth/biometric/authenticate' && method === 'post') {
    const payload = getPayload(config.data);
    const credId = payload.credential_id;
    
    const cred = (db.biometrics || []).find((c: any) => c.credential_id === credId);
    if (!cred) {
      return {
        status: 401,
        data: { error: "Biometric credential not found in standalone database." }
      };
    }
    
    const user = db.users.find((u: any) => u.id === cred.user_id);
    if (!user) {
      return {
        status: 401,
        data: { error: "Associated user not found in standalone database." }
      };
    }
    
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', 'mock-jwt-token-biometric');
    return {
      status: 200,
      data: {
        access_token: 'mock-jwt-token-biometric',
        user: user
      }
    };
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

  if (cleanUrl === '/timetable/faculty' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    if (!activeUser || (activeUser.role !== 'faculty' && activeUser.role !== 'admin')) {
      return {
        status: 403,
        data: { error: "Access denied. Faculty only." }
      };
    }
    
    const facultyName = `${activeUser.first_name} ${activeUser.last_name}`;
    const slots = db.timetable.filter((slot: any) => 
      slot.faculty_id === activeUserId ||
      (slot.faculty_name && slot.faculty_name.toLowerCase() === facultyName.toLowerCase()) ||
      (activeUserId === 'fac_1' && slot.faculty_name === 'Dr. Ramesh Kumar')
    );
    
    const grid: Record<string, any[]> = {
      monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: []
    };
    slots.forEach((slot: any) => {
      if (grid[slot.day]) {
        grid[slot.day].push(slot);
      }
    });

    return {
      status: 200,
      data: { grid }
    };
  }

  if (cleanUrl.startsWith('/timetable/slot/') && cleanUrl.endsWith('/cancel') && method === 'post') {
    const slotId = cleanUrl.split('/')[3];
    const slotIdx = db.timetable.findIndex((s: any) => s.id === slotId);
    if (slotIdx === -1) {
      return {
        status: 404,
        data: { error: "Slot not found" }
      };
    }
    
    const payload = getPayload(config.data);
    const reason = payload?.reason || "";
    
    db.timetable[slotIdx].is_cancelled = true;
    if (reason) {
      db.timetable[slotIdx].remarks = `Cancelled: ${reason}`;
    }
    
    // Create notice for students of the class
    const slot = db.timetable[slotIdx];
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    const facultyName = activeUser ? `Prof. ${activeUser.last_name || activeUser.first_name}` : slot.faculty_name || "Faculty";
    
    const dayName = slot.day.charAt(0).toUpperCase() + slot.day.slice(1);
    const noticeContent = `The class for ${slot.subject_name} (${slot.subject_code}) scheduled for ${dayName} (Period ${slot.period_number}, ${slot.start_time} - ${slot.end_time}) has been CANCELLED by ${facultyName}.${reason ? `\nReason: ${reason}` : ''}`;
    
    const newNotice = {
      id: `notice_cancel_${slotId}_${Date.now()}`,
      title: `CLASS CANCELLED: ${slot.subject_code} - ${slot.subject_name}`,
      content: noticeContent,
      author_id: activeUserId,
      priority: "high",
      target_audience: "class",
      is_pinned: true,
      branch: slot.department || "CSE",
      year: slot.semester || 4,
      section: slot.section || "A",
      media_json: "[]",
      files_json: "[]",
      created_at: new Date().toISOString(),
      reads: []
    };
    
    if (!db.notices) db.notices = [];
    db.notices.push(newNotice);
    
    saveMockDb(db);
    
    return {
      status: 200,
      data: { message: "Slot cancelled", slot: db.timetable[slotIdx] }
    };
  }

  // Academic results
  if (cleanUrl === '/academic/results' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    const semFilter = urlParams.get('semester');
    let userResults = db.results.filter((r: any) => r.student_id === activeUserId);
    if (semFilter) {
      const semNum = parseInt(semFilter);
      userResults = userResults.filter((r: any) => r.semester === semNum);
    }
    return {
      status: 200,
      data: { results: userResults }
    };
  }

  if (cleanUrl.startsWith('/academic/results/analytics') && method === 'get') {
    return {
      status: 200,
      data: {
        class_averages: { "CS301": 78.5, "CS302": 82.0, "CS303": 75.0, "HU301": 85.0, "MA301": 72.0 },
        percentiles: { "CS301": 92, "CS302": 88, "CS303": 95, "HU301": 90, "MA301": 85 },
        overall_percentile: 91.5,
        overall_average: 78.5,
        signature_receipt: "vtu-sec-rec-9a8b7c6d5e4f3g2h1i0j"
      }
    };
  }

  // Syllabus
  if (cleanUrl === '/academic/syllabus' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    const dept = urlParams.get('department') || activeUser?.department || 'CSE';
    const sem = urlParams.get('semester') ? parseInt(urlParams.get('semester')!) : (activeUser?.semester || 4);
    
    const filteredSyllabus = db.syllabus.filter((s: any) => s.department === dept && s.semester === sem);
    return {
      status: 200,
      data: { syllabus: filteredSyllabus }
    };
  }

  // Credits progress breakdown
  if (cleanUrl === '/academic/credits' && method === 'get') {
    const progress = db.creditProgresses.find((c: any) => c.student_id === activeUserId) || {
      student_id: activeUserId,
      total_required: 160,
      total_earned: 62,
      core_earned: 38,
      elective_earned: 12,
      lab_earned: 12
    };
    const pct = parseFloat(((progress.total_earned / progress.total_required) * 100).toFixed(1));
    return {
      status: 200,
      data: {
        credits: {
          ...progress,
          percentage: pct
        }
      }
    };
  }

  // Credits Curriculum Roadmap
  if (cleanUrl === '/academic/credits/roadmap' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    const currSem = activeUser?.semester || 4;
    const roadmap = [
      { subject_code: "MA101", subject_name: "Mathematics I", semester: 1, credits: 4, category: "core", status: "passed", prerequisites: [], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS101", subject_name: "Problem Solving & Programming", semester: 1, credits: 4, category: "core", status: "passed", prerequisites: [], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS102", subject_name: "Data Structures", semester: 2, credits: 4, category: "core", status: "passed", prerequisites: ["CS101"], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "MA201", subject_name: "Discrete Mathematics", semester: 3, credits: 4, category: "core", status: "passed", prerequisites: ["MA101"], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS201", subject_name: "Object Oriented Programming", semester: 3, credits: 3, category: "core", status: "passed", prerequisites: ["CS101"], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS301", subject_name: "Database Management Systems", semester: 4, credits: 4, category: "core", status: "in_progress", prerequisites: ["CS102"], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS302", subject_name: "Operating Systems", semester: 4, credits: 4, category: "core", status: "in_progress", prerequisites: ["CS102"], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS401", subject_name: "Computer Networks", semester: 5, credits: 4, category: "core", status: "not_started", prerequisites: ["CS302"], prereq_satisfied: false, missing_prerequisites: ["CS302"] },
      { subject_code: "CS402", subject_name: "Software Engineering", semester: 5, credits: 3, category: "core", status: "not_started", prerequisites: [], prereq_satisfied: true, missing_prerequisites: [] },
      { subject_code: "CS501", subject_name: "Compiler Design", semester: 6, credits: 4, category: "core", status: "not_started", prerequisites: ["CS302", "CS401"], prereq_satisfied: false, missing_prerequisites: ["CS302", "CS401"] }
    ];
    return {
      status: 200,
      data: {
        roadmap,
        current_semester: currSem
      }
    };
  }

  // Degree audit downloadable PDF transcript
  if (cleanUrl === '/academic/credits/audit/pdf' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    const content = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << >> /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 250 >>\nstream\nBT\n/F1 12 Tf\n70 700 Td\n(VelTech University - Official Degree Transcript & Audit) Tj\n0 -20 Td\n(Student: ${activeUser?.first_name || 'Mani'} ${activeUser?.last_name || 'Manjunath'}) Tj\n0 -20 Td\n(Roll Number: ${activeUser?.roll_number || '22CSE101'}) Tj\n0 -20 Td\n(Department: ${activeUser?.department || 'CSE'}  Semester: ${activeUser?.semester || 4}) Tj\n0 -40 Td\n(Earned Credits progress: 62 out of 160 required. CGPA: ${activeUser?.cgpa || 8.4}) Tj\n0 -20 Td\n(Cryptographically Signed Audit verification complete.) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000212 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n382\n%%EOF`;
    return {
      status: 200,
      data: new Blob([content], { type: 'application/pdf' })
    };
  }

  // Searchable faculty directory listings
  if (cleanUrl === '/academic/faculty-directory' && method === 'get') {
    const dept = urlParams.get('department');
    const q = urlParams.get('q')?.toLowerCase() || '';
    
    let facList = db.users.filter((u: any) => u.role === 'faculty');
    if (dept) {
      facList = facList.filter((f: any) => f.department.toLowerCase() === dept.toLowerCase());
    }
    if (q) {
      facList = facList.filter((f: any) => 
        (f.first_name + " " + f.last_name).toLowerCase().includes(q) ||
        f.email.toLowerCase().includes(q) ||
        (f.specialization || '').toLowerCase().includes(q)
      );
    }
    
    const facMapped = facList.map((f: any) => ({
      id: f.id,
      first_name: f.first_name,
      last_name: f.last_name,
      full_name: `${f.first_name} ${f.last_name}`,
      email: f.email,
      phone: "+91 98765 43210",
      department: f.department,
      designation: f.designation || "Assistant Professor",
      specialization: f.specialization || "Advanced Computing",
      office_location: f.office_location || "LH-302, 3rd Floor, Main Block",
      avatar_url: null
    }));
    
    return {
      status: 200,
      data: { faculty: facMapped }
    };
  }

  // Booking Meeting slots query
  if (cleanUrl === '/faculty/meetings/slots' && method === 'get') {
    const fid = urlParams.get('faculty_id') || 'fac_1';
    if (!db.meetingSlots) db.meetingSlots = [];
    const existingSlots = db.meetingSlots.filter((s: any) => s.faculty_id === fid);
    
    if (existingSlots.length === 0) {
      const mockSlots = [
        { id: `slot_m1_${fid}`, faculty_id: fid, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], start_time: "10:00", end_time: "11:00", is_booked: false },
        { id: `slot_m2_${fid}`, faculty_id: fid, date: new Date(Date.now() + 86400000).toISOString().split('T')[0], start_time: "14:00", end_time: "15:00", is_booked: false },
        { id: `slot_m3_${fid}`, faculty_id: fid, date: new Date(Date.now() + 172800000).toISOString().split('T')[0], start_time: "11:00", end_time: "12:00", is_booked: false }
      ];
      if (fid === 'fac_1') {
        return {
          status: 200,
          data: { slots: [] }
        };
      }
      db.meetingSlots.push(...mockSlots);
      saveMockDb(db);
      return {
        status: 200,
        data: { slots: mockSlots }
      };
    }
    
    return {
      status: 200,
      data: { slots: existingSlots.filter((s: any) => !s.is_booked) }
    };
  }

  // Booking a slot
  if (cleanUrl.startsWith('/faculty/meetings/slots/') && cleanUrl.endsWith('/book') && method === 'post') {
    const parts = cleanUrl.split('/');
    const slotId = parts[parts.length - 2];
    
    const slot = (db.meetingSlots || []).find((s: any) => s.id === slotId);
    if (slot) {
      slot.is_booked = true;
      saveMockDb(db);
    }
    return {
      status: 200,
      data: { success: true, message: "Meeting booked successfully!" }
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
        pass.status = status;
        if (status === 'approved') {
          pass.qr_code_url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PASS-${pass.id}`;
        }
      }
    });
    saveMockDb(db);
    return { status: 200, data: { success: true } };
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

  // Document Scanner Mock Endpoints
  if (cleanUrl === '/campus/documents/scan' && method === 'post') {
    const payload = getPayload(config.data);
    const previews = payload.images || [];
    
    const cutoff = Date.now() - 5 * 60 * 1000;
    if (!db.scanned_documents) db.scanned_documents = [];
    db.scanned_documents = db.scanned_documents.filter((d: any) => new Date(d.created_at).getTime() >= cutoff);
    
    const newDoc = {
      id: `doc_${Date.now()}`,
      name: payload.name || `Scan_${new Date().toLocaleDateString('en-IN').replace(/\//g,'-')}`,
      download_url: previews.length > 0 ? previews[0] : '',
      images: previews,
      created_at: new Date().toISOString()
    };
    
    db.scanned_documents.push(newDoc);
    saveMockDb(db);
    
    return {
      status: 201,
      data: {
        message: "Scanned document created successfully. It will be deleted in 5 minutes.",
        document: newDoc
      }
    };
  }

  if (cleanUrl === '/campus/documents/scan' && method === 'get') {
    const cutoff = Date.now() - 5 * 60 * 1000;
    if (!db.scanned_documents) db.scanned_documents = [];
    db.scanned_documents = db.scanned_documents.filter((d: any) => new Date(d.created_at).getTime() >= cutoff);
    saveMockDb(db);
    
    return {
      status: 200,
      data: {
        documents: db.scanned_documents
      }
    };
  }

  if (cleanUrl.startsWith('/campus/documents/scan/') && method === 'delete') {
    const id = cleanUrl.split('/').pop();
    if (!db.scanned_documents) db.scanned_documents = [];
    db.scanned_documents = db.scanned_documents.filter((d: any) => d.id !== id);
    saveMockDb(db);
    return {
      status: 200,
      data: { success: true }
    };
  }

  if (cleanUrl === '/attendance/students' && method === 'get') {
    const dept = urlParams.get('department') || 'CSE';
    const sem = parseInt(urlParams.get('semester') || '4');
    const sec = urlParams.get('section') || 'A';
    
    const students = db.users.filter((u: any) => 
      u.role === 'student' &&
      u.department === dept &&
      u.semester === sem &&
      u.section === sec
    );
    
    return {
      status: 200,
      data: {
        students: students.map((s: any) => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`,
          roll_number: s.roll_number,
          email: s.email,
          department: s.department,
          semester: s.semester,
          section: s.section,
          avatar_url: s.avatar_url || null
        })),
        total: students.length
      }
    };
  }

  if (cleanUrl === '/attendance/session' && method === 'post') {
    const payload = getPayload(config.data);
    const newSession = {
      id: `sess_${Date.now()}`,
      faculty_id: activeUserId,
      subject_code: payload.subject_code,
      subject_name: payload.subject_name,
      department: payload.department,
      semester: parseInt(payload.semester || '4'),
      section: payload.section,
      period_number: parseInt(payload.period_number || '1'),
      session_date: payload.session_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      total_present: 0,
      total_absent: 0
    };
    
    if (!db.attendanceSessions) db.attendanceSessions = [];
    db.attendanceSessions.push(newSession);
    saveMockDb(db);
    
    return {
      status: 201,
      data: {
        message: "Session created",
        session: newSession
      }
    };
  }

  if (cleanUrl.startsWith('/attendance/session/') && cleanUrl.endsWith('/bulk') && method === 'post') {
    const sessionId = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    const records = payload.records || [];
    
    if (!db.attendanceSessions) db.attendanceSessions = [];
    const session = db.attendanceSessions.find((s: any) => s.id === sessionId);
    
    let present = 0;
    let absent = 0;
    records.forEach((rec: any) => {
      if (rec.status === 'present') present++;
      else absent++;
      
      const newRecord = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        session_id: sessionId,
        student_id: rec.student_id,
        status: rec.status,
        marked_at: new Date().toISOString(),
        remarks: null,
        discrepancy_reported: false,
        discrepancy: null,
        session: {
          subject_code: session?.subject_code || "CS301",
          subject_name: session?.subject_name || "Database Management Systems",
          session_date: session?.session_date || new Date().toISOString().split('T')[0],
          period_number: session?.period_number || 1
        }
      };
      
      if (!db.attendanceRecords) db.attendanceRecords = [];
      db.attendanceRecords.push(newRecord);
    });
    
    if (session) {
      session.total_present = present;
      session.total_absent = absent;
    }
    
    saveMockDb(db);
    
    return {
      status: 200,
      data: {
        message: "Attendance marked successfully"
      }
    };
  }

  if (cleanUrl === '/attendance/my-sessions' && method === 'get') {
    if (!db.attendanceSessions) db.attendanceSessions = [];
    const sessions = db.attendanceSessions.filter((s: any) => s.faculty_id === activeUserId);
    return {
      status: 200,
      data: { sessions }
    };
  }

  if (cleanUrl === '/faculty/assignments/submissions' && method === 'get') {
    if (!db.assignmentSubmissions) {
      db.assignmentSubmissions = [
        { id: '1', student: 'Arun Kumar', roll: '21CSE101', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'pending', plagiarism: 12 },
        { id: '2', student: 'Priya Sharma', roll: '21CSE102', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'pending', plagiarism: 78, matchWith: 'VTU26012' },
        { id: '3', student: 'Rahul Verma', roll: '21CSE103', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-14', status: 'graded', marks: 8, comment: 'Good work!', plagiarism: 6 },
        { id: '4', student: 'Sneha Patel', roll: '21CSE104', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-16', status: 'pending', plagiarism: 15 },
        { id: '5', student: 'Vikram Singh', roll: '21CSE105', title: 'Assignment 3 - Linked Lists', submitted_at: '2026-05-15', status: 'graded', marks: 9, comment: 'Excellent implementation.', plagiarism: 22 }
      ];
      saveMockDb(db);
    }
    return {
      status: 200,
      data: { submissions: db.assignmentSubmissions }
    };
  }

  if (cleanUrl === '/faculty/assignments/submissions/grade-bulk' && method === 'post') {
    const payload = getPayload(config.data);
    const grades = payload.grades || [];
    
    if (!db.assignmentSubmissions) db.assignmentSubmissions = [];
    
    grades.forEach((g: any) => {
      const sub = db.assignmentSubmissions.find((s: any) => s.id === g.id);
      if (sub) {
        sub.status = 'graded';
        sub.marks = parseInt(g.marks);
        sub.comment = g.comment || '';
      }
    });
    
    saveMockDb(db);
    return {
      status: 200,
      data: { message: "Grades updated in bulk", submissions: db.assignmentSubmissions }
    };
  }

  if (cleanUrl.startsWith('/faculty/assignments/submissions/') && cleanUrl.endsWith('/grade') && method === 'post') {
    const subId = cleanUrl.split('/')[4];
    const payload = getPayload(config.data);
    
    if (!db.assignmentSubmissions) db.assignmentSubmissions = [];
    const sub = db.assignmentSubmissions.find((s: any) => s.id === subId);
    if (sub) {
      sub.status = 'graded';
      sub.marks = parseInt(payload.marks);
      sub.comment = payload.comment || '';
      saveMockDb(db);
      return {
        status: 200,
        data: { message: "Grade submitted", submission: sub }
      };
    }
    return {
      status: 404,
      data: { error: "Submission not found" }
    };
  }

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

  if (cleanUrl === '/attendance/bunk-calculator' && method === 'get') {
    let userSubjects = db.attendanceSubjects.filter((s: any) => s.student_id === activeUserId);
    if (userSubjects.length === 0) {
      userSubjects = INITIAL_ATTENDANCE_SUBJECTS.map((s: any) => ({ ...s, student_id: activeUserId }));
      db.attendanceSubjects.push(...userSubjects);
      saveMockDb(db);
    }

    let total_global = 0;
    let present_global = 0;

    const subjects_calc = userSubjects.map((s: any) => {
      const present = s.present + s.late + s.on_duty;
      const total = s.total_classes;
      const pct = s.percentage;

      total_global += total;
      present_global += present;

      let bunk_limit = 0;
      let consecutive = 0;
      if (pct >= 75.0) {
        bunk_limit = Math.floor(present / 0.75) - total;
      } else {
        consecutive = 3 * total - 4 * present;
      }

      return {
        subject_code: s.subject_code,
        subject_name: s.subject_name,
        present: present,
        total: total,
        percentage: pct,
        safe: pct >= 75.0,
        bunk_limit: Math.max(0, bunk_limit),
        consecutive_needed: Math.max(0, consecutive)
      };
    });

    const global_pct = total_global > 0 ? (present_global / total_global * 100) : 0.0;
    let global_bunk_limit = 0;
    let global_consecutive = 0;
    if (global_pct >= 75.0) {
      global_bunk_limit = Math.floor(present_global / 0.75) - total_global;
    } else {
      global_consecutive = 3 * total_global - 4 * present_global;
    }

    return {
      status: 200,
      data: {
        global: {
          present: present_global,
          total: total_global,
          percentage: Math.round(global_pct * 100) / 100,
          safe: global_pct >= 75.0,
          bunk_limit: Math.max(0, global_bunk_limit),
          consecutive_needed: Math.max(0, global_consecutive)
        },
        subjects: subjects_calc
      }
    };
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

  if (cleanUrl === '/attendance/session/active/reactivate' && method === 'post') {
    const todayStr = new Date().toISOString().split('T')[0];
    // Remove all student attendance records for the active session CS301 today, period 1
    db.attendanceRecords = db.attendanceRecords.filter((r: any) => 
      !(r.session?.subject_code === "CS301" &&
        r.session?.session_date === todayStr &&
        r.session?.period_number === 1)
    );
    saveMockDb(db);
    return {
      status: 200,
      data: {
        message: "Mock attendance records cleared for active session",
        qr_token: `MOCK_REACTIVATED_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        expires_at: new Date(Date.now() + 60000).toISOString(),
        validity_seconds: 60
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
    return { status: 200, data: { jobs: db.jobs || [] } };
  }
  if (cleanUrl === '/career/jobs/saved' && method === 'get') {
    const saved = db.savedJobs || [];
    const savedList = db.jobs.filter((j: any) => saved.includes(j.id));
    return { status: 200, data: { saved_jobs: savedList } };
  }
  if (cleanUrl === '/career/jobs/my-applications' && method === 'get') {
    const apps = db.jobApplications || [];
    const myApps = apps.filter((a: any) => a.student_id === activeUserId);
    const enrichedApps = myApps.map((a: any) => ({
      ...a,
      posting_id: a.job_id
    }));
    return { status: 200, data: { applications: enrichedApps } };
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
    const q = getQueryParam('q').toLowerCase();
    const cat = getQueryParam('category').toLowerCase();
    const books = db.libraryBooks || [];
    const filtered = books.filter((b: any) => {
      const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      const matchCat = !cat || (b.category || '').toLowerCase().includes(cat);
      return matchQ && matchCat;
    });
    return { status: 200, data: { books: filtered } };
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
  // Interviews & Slot Booking Routes
  // ==========================================
  if (cleanUrl === '/career/interviews' && method === 'get') {
    const list = db.interviews || [];
    const myIvs = list.filter((i: any) => i.student_id === activeUserId);
    return { status: 200, data: { interviews: myIvs } };
  }
  if (cleanUrl.startsWith('/career/jobs/') && cleanUrl.endsWith('/interview-slots') && method === 'get') {
    const jobId = cleanUrl.split('/')[3];
    const now = new Date();
    const slots = Array.from({ length: 5 }, (_, i) => {
      const t = new Date(now);
      t.setDate(now.getDate() + i + 1);
      t.setHours(10 + i, 0, 0, 0);
      return { id: `slot-${jobId}-${i}`, time: t.toISOString(), available: true };
    });
    return { status: 200, data: { slots } };
  }
  if (cleanUrl.startsWith('/career/jobs/') && cleanUrl.endsWith('/book-interview') && method === 'post') {
    const jobId = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    if (!db.interviews) db.interviews = [];
    
    const newIv = {
      id: `iv_${Date.now()}`,
      posting_id: jobId,
      student_id: activeUserId,
      round_name: payload.round_name || "Technical Interview",
      scheduled_at: payload.time,
      venue: "Main Block Room 102 (Offline)",
      status: "scheduled"
    };
    db.interviews.push(newIv);
    saveMockDb(db);
    return { status: 201, data: { message: "Slot booked successfully", schedule: newIv } };
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
  // Notices Routes
  // ==========================================
  if (cleanUrl === '/campus/notices' && method === 'get') {
    const noticesList = db.notices || [];
    const sorted = [...noticesList].sort((a: any, b: any) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime();
    });
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    let filtered = sorted;
    if (activeUser && activeUser.role === 'student') {
      filtered = sorted.filter((n: any) => {
        if (!n.target_audience || n.target_audience === 'all') return true;
        const matchBranch = !n.branch || n.branch === '' || n.branch === activeUser.department || !activeUser.department || activeUser.department === '';
        const matchYear = !n.year || n.year === activeUser.semester || !activeUser.semester;
        const matchSection = !n.section || n.section === '' || n.section === activeUser.section || !activeUser.section || activeUser.section === '';
        return matchBranch && matchYear && matchSection;
      });
    }
    return { status: 200, data: { notices: filtered } };
  }

  if (cleanUrl.startsWith('/campus/notices/') && cleanUrl.endsWith('/read') && method === 'post') {
    const nid = cleanUrl.split('/')[3];
    const notice = db.notices.find((n: any) => n.id === nid);
    if (notice) {
      if (!notice.reads) notice.reads = [];
      if (!notice.reads.includes(activeUserId)) {
        notice.reads.push(activeUserId);
      }
      saveMockDb(db);
    }
    return { status: 200, data: { success: true } };
  }

  if (cleanUrl === '/faculty/broadcast' && method === 'post') {
    const payload = getPayload(config.data);
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    
    // Parse target class into branch/year/section
    let branch = null;
    let year = null;
    let section = null;
    let target_audience = 'all';
    const target = payload.target_class;
    if (target && target !== 'All Students') {
      target_audience = 'class';
      try {
        const parts = target.split(' Sem ');
        const deptSec = parts[0].split('-');
        branch = deptSec[0];
        section = deptSec.length > 1 ? deptSec[1] : null;
        year = parseInt(parts[1]);
      } catch (e) { /* ignore parse errors */ }
    }
    
    const newNotice = {
      id: `n_${Date.now()}`,
      title: payload.title || `Class Broadcast from Prof. ${activeUser?.last_name || 'Faculty'}`,
      content: payload.message,
      priority: payload.priority || 'normal',
      target_audience,
      is_pinned: true,
      branch,
      year,
      section,
      files: payload.files || [],
      reads: [],
      author_id: activeUserId,
      created_at: new Date().toISOString()
    };
    if (!db.notices) db.notices = [];
    db.notices.push(newNotice);
    saveMockDb(db);
    return { status: 200, data: { success: true, notice: newNotice } };
  }

  // ==========================================
  // Projects & Milestones Routes
  // ==========================================
  if (cleanUrl === '/career/projects' && method === 'get') {
    const activeUser = db.users.find((u: any) => u.id === activeUserId);
    let list = db.projects || [];
    if (activeUser && activeUser.role === 'faculty') {
      list = list.filter((p: any) => p.faculty_id === activeUserId || p.student_id === 'std_1');
    } else {
      list = list.filter((p: any) => p.student_id === activeUserId || !p.student_id);
    }
    return { status: 200, data: { projects: list } };
  }

  if (cleanUrl === '/career/projects' && method === 'post') {
    const payload = getPayload(config.data);
    const newProj = {
      id: `proj_${Date.now()}`,
      student_id: activeUserId,
      title: payload.title,
      description: payload.description || "",
      subject_code: payload.subject_code || "",
      team_members: payload.team_members || "",
      deadline: payload.deadline || null,
      status: "in_progress",
      progress_pct: 0,
      faculty_id: payload.faculty_id || null,
      faculty_status: payload.faculty_id ? "pending" : "approved",
      milestones: (payload.milestones || []).map((m: any, idx: number) => ({
        id: `ms_${Date.now()}_${idx}`,
        title: m.title,
        due_date: m.due_date || null,
        column: m.column || "todo",
        is_completed: m.is_completed || false,
        assigned_to: m.assigned_to || null
      }))
    };
    if (!db.projects) db.projects = [];
    db.projects.push(newProj);
    saveMockDb(db);
    return { status: 201, data: { message: "Project created", project: newProj } };
  }

  if (cleanUrl.startsWith('/career/projects/') && method === 'put') {
    const pid = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    const idx = db.projects.findIndex((p: any) => p.id === pid);
    if (idx !== -1) {
      const p = db.projects[idx];
      if (payload.faculty_id !== undefined && payload.faculty_id !== p.faculty_id) {
        p.faculty_id = payload.faculty_id;
        p.faculty_status = payload.faculty_id ? "pending" : "approved";
      }
      db.projects[idx] = { ...p, ...payload };
      saveMockDb(db);
      return { status: 200, data: { project: db.projects[idx] } };
    }
  }

  if (cleanUrl.startsWith('/career/projects/') && method === 'delete') {
    const pid = cleanUrl.split('/').pop();
    db.projects = (db.projects || []).filter((p: any) => p.id !== pid);
    saveMockDb(db);
    return { status: 200, data: { success: true } };
  }

  if (cleanUrl.startsWith('/career/projects/') && cleanUrl.endsWith('/milestones') && method === 'post') {
    const pid = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    const project = db.projects.find((p: any) => p.id === pid);
    if (project) {
      const newMs = {
        id: `ms_${Date.now()}`,
        title: payload.title,
        due_date: payload.due_date || null,
        column: payload.column || "todo",
        is_completed: payload.column === 'done',
        assigned_to: payload.assigned_to || null
      };
      if (!project.milestones) project.milestones = [];
      project.milestones.push(newMs);
      
      const doneCount = project.milestones.filter((m: any) => m.column === 'done').length;
      project.progress_pct = Math.round((doneCount / project.milestones.length) * 100);
      
      saveMockDb(db);
      return { status: 201, data: { milestone: newMs, project } };
    }
  }

  if (cleanUrl.startsWith('/career/milestones/') && method === 'put') {
    const mid = cleanUrl.split('/').pop();
    const payload = getPayload(config.data);
    let updatedProject: any = null;
    
    (db.projects || []).forEach((proj: any) => {
      const ms = (proj.milestones || []).find((m: any) => m.id === mid);
      if (ms) {
        if (payload.column !== undefined) {
          ms.column = payload.column;
          ms.is_completed = payload.column === 'done';
        }
        if (payload.assigned_to !== undefined) {
          ms.assigned_to = payload.assigned_to;
        }
        const doneCount = proj.milestones.filter((m: any) => m.column === 'done').length;
        proj.progress_pct = Math.round((doneCount / proj.milestones.length) * 100);
        updatedProject = proj;
      }
    });
    
    if (updatedProject) {
      saveMockDb(db);
      return { status: 200, data: { project: updatedProject } };
    }
  }

  if (cleanUrl.startsWith('/career/projects/') && cleanUrl.endsWith('/accept') && method === 'post') {
    const pid = cleanUrl.split('/')[3];
    const project = db.projects.find((p: any) => p.id === pid);
    if (project) {
      project.faculty_status = 'approved';
      project.status = 'in_progress';
      saveMockDb(db);
      return { status: 200, data: { project } };
    }
  }

  if (cleanUrl.startsWith('/career/projects/') && cleanUrl.endsWith('/decline') && method === 'post') {
    const pid = cleanUrl.split('/')[3];
    const project = db.projects.find((p: any) => p.id === pid);
    if (project) {
      if (project.faculty_status === 'pending_completion') {
        project.faculty_status = 'approved';
      } else {
        project.faculty_status = 'declined';
        project.status = 'declined';
      }
      saveMockDb(db);
      return { status: 200, data: { project } };
    }
  }

  if (cleanUrl.startsWith('/career/projects/') && cleanUrl.endsWith('/complete') && method === 'post') {
    const pid = cleanUrl.split('/')[3];
    const project = db.projects.find((p: any) => p.id === pid);
    if (project) {
      const activeUser = db.users.find((u: any) => u.id === activeUserId);
      const isFaculty = activeUser?.role === 'faculty' || project.faculty_id === activeUserId;
      if (isFaculty) {
        project.status = 'completed';
        project.faculty_status = 'completed';
        project.progress_pct = 100;
        if (project.milestones) {
          project.milestones.forEach((m: any) => {
            m.column = 'done';
            m.is_completed = true;
          });
        }
      } else {
        if (project.faculty_id) {
          project.faculty_status = 'pending_completion';
        } else {
          project.status = 'completed';
          project.faculty_status = 'completed';
          project.progress_pct = 100;
          if (project.milestones) {
            project.milestones.forEach((m: any) => {
              m.column = 'done';
              m.is_completed = true;
            });
          }
        }
      }
      saveMockDb(db);
      return { status: 200, data: { project } };
    }
  }

  // ==========================================
  // Badges Routes
  // ==========================================
  if (cleanUrl === '/career/badges' && method === 'get') {
    return { status: 200, data: { badges: db.badges || [] } };
  }

  if (cleanUrl === '/career/badges/my-badges' && method === 'get') {
    const earned = (db.earnedBadges || []).filter((eb: any) => eb.student_id === activeUserId);
    return { status: 200, data: { earned_badges: earned } };
  }

  if (cleanUrl === '/career/badges/claim-volunteer' && method === 'post') {
    const badge = (db.badges || []).find((b: any) => b.name === "Volunteer Excellence");
    if (badge) {
      if (!db.earnedBadges) db.earnedBadges = [];
      const existing = db.earnedBadges.find((eb: any) => eb.student_id === activeUserId && eb.badge?.id === badge.id);
      if (existing) {
        return { status: 200, data: { message: "Badge already claimed", earned_badge: existing } };
      }
      const newEarned = {
        id: `eb_${Date.now()}`,
        student_id: activeUserId,
        badge: badge,
        note: "Awarded automatically for completing 30+ hours of volunteering duty.",
        status: "approved",
        earned_at: new Date().toISOString()
      };
      db.earnedBadges.push(newEarned);
      saveMockDb(db);
      return { status: 201, data: { message: "Volunteer Excellence Badge claimed successfully!", earned_badge: newEarned } };
    }
    return { status: 404, data: { error: "Volunteer Excellence badge template not found" } };
  }

  // ==========================================
  // Clubs Routes
  // ==========================================
  if (cleanUrl === '/campus/clubs' && method === 'get') {
    return { status: 200, data: { clubs: db.clubs || [] } };
  }

  if (cleanUrl === '/campus/clubs/my-clubs' && method === 'get') {
    return { status: 200, data: { clubs: db.clubs || [] } };
  }

  if (cleanUrl.startsWith('/campus/clubs/') && method === 'put') {
    const cid = cleanUrl.split('/')[3];
    const payload = getPayload(config.data);
    const club = (db.clubs || []).find((c: any) => c.id === cid);
    if (club) {
      if (payload.website_url !== undefined) club.website_url = payload.website_url;
      if (payload.instagram_url !== undefined) club.instagram_url = payload.instagram_url;
      saveMockDb(db);
      return { status: 200, data: { success: true, club } };
    }
    return { status: 404, data: { error: "Club not found" } };
  }

  // ==========================================
  // Previous Year Question Papers (PYQs)
  // ==========================================
  if (cleanUrl === '/academic/question-papers' && method === 'get') {
    const papers = db.questionPapers || [];
    return { status: 200, data: papers };
  }

  // ==========================================
  // Flashcards Routes (Mock API)
  // ==========================================
  if (cleanUrl === '/career/flashcards' && method === 'get') {
    const fc_type = urlParams.get('type') || 'company_prep';
    const cards = (db.flashcards || []).filter((fc: any) => fc.type === fc_type);
    return { status: 200, data: { flashcards: cards } };
  }

  if (cleanUrl === '/career/flashcards' && method === 'post') {
    const payload = getPayload(config.data);
    if (!db.flashcards) db.flashcards = [];
    
    if (Array.isArray(payload)) {
      const added = [];
      for (const item of payload) {
        if (!item.front || !item.back) continue;
        const newCard = {
          id: `fc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          front: item.front,
          back: item.back,
          category: item.category || 'Algorithms',
          type: item.type || 'company_prep',
          created_by: activeUserId,
          created_at: new Date().toISOString()
        };
        db.flashcards.push(newCard);
        added.push(newCard);
      }
      saveMockDb(db);
      return { status: 201, data: { message: `Successfully created ${added.length} flashcards`, flashcards: added } };
    } else {
      if (!payload.front || !payload.back) {
        return { status: 400, data: { error: "front and back fields are required" } };
      }
      const newCard = {
        id: `fc_${Date.now()}`,
        front: payload.front,
        back: payload.back,
        category: payload.category || 'Algorithms',
        type: payload.type || 'company_prep',
        created_by: activeUserId,
        created_at: new Date().toISOString()
      };
      db.flashcards.push(newCard);
      saveMockDb(db);
      return { status: 201, data: { message: "Flashcard created", flashcard: newCard } };
    }
  }

  if (cleanUrl.startsWith('/career/flashcards/') && method === 'delete') {
    const fcId = cleanUrl.split('/')[3];
    if (db.flashcards) {
      db.flashcards = db.flashcards.filter((fc: any) => fc.id !== fcId);
      saveMockDb(db);
    }
    return { status: 200, data: { message: "Flashcard deleted" } };
  }

  // ==========================================
  // Portfolio Routes (Mock API)
  // ==========================================
  if (cleanUrl === '/career/portfolio' && method === 'get') {
    const portfolio = (db.portfolios || []).find((p: any) => p.user_id === activeUserId);
    return { status: 200, data: { portfolio: portfolio || null } };
  }

  if (cleanUrl === '/career/portfolio' && (method === 'post' || method === 'put')) {
    const payload = getPayload(config.data);
    if (!db.portfolios) db.portfolios = [];
    let portfolio = db.portfolios.find((p: any) => p.user_id === activeUserId);
    if (!portfolio) {
      const activeUser = db.users.find((u: any) => u.id === activeUserId);
      const slug = activeUser ? `${activeUser.first_name.toLowerCase()}-${activeUser.last_name.toLowerCase()}-${activeUserId.slice(0, 6)}` : activeUserId.slice(0, 12);
      portfolio = {
        id: `port_${Date.now()}`,
        user_id: activeUserId,
        template: payload.template || 'modern',
        is_public: payload.is_public || false,
        public_slug: slug,
        view_count: 0,
        data: payload.data || {}
      };
      db.portfolios.push(portfolio);
    } else {
      if (payload.template !== undefined) portfolio.template = payload.template;
      if (payload.is_public !== undefined) portfolio.is_public = payload.is_public;
      if (payload.data !== undefined) portfolio.data = payload.data;
    }
    saveMockDb(db);
    return { status: 200, data: { portfolio } };
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
