// Centralized Offline Database layer for standalone mobile operation
// Seeded with the exact same records as the Flask server

const INITIAL_USERS = [
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

const INITIAL_TIMETABLE_SLOTS = [
  // Monday
  { id: "s1", day: "monday", period_number: 1, start_time: "09:00", end_time: "09:50", slot_type: "lecture", subject_code: "CS301", subject_name: "Data Structures", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s2", day: "monday", period_number: 2, start_time: "10:00", end_time: "10:50", slot_type: "lecture", subject_code: "CS302", subject_name: "Digital Logic", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s3", day: "monday", period_number: 3, start_time: "11:00", end_time: "11:50", slot_type: "lecture", subject_code: "MA301", subject_name: "Mathematics III", room_number: "LH-102", building: "Main Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s4", day: "monday", period_number: 4, start_time: "12:00", end_time: "12:50", slot_type: "break", subject_code: "", subject_name: "Lunch Break", room_number: "Canteen", building: "Student Hub", faculty_name: "" },
  { id: "s5", day: "monday", period_number: 5, start_time: "14:00", end_time: "14:50", slot_type: "lecture", subject_code: "CS303", subject_name: "Operating Systems", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  
  // Tuesday
  { id: "s6", day: "tuesday", period_number: 1, start_time: "09:00", end_time: "09:50", slot_type: "lecture", subject_code: "CS303", subject_name: "Operating Systems", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s7", day: "tuesday", period_number: 2, start_time: "10:00", end_time: "10:50", slot_type: "lecture", subject_code: "CS301", subject_name: "Data Structures", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s8", day: "tuesday", period_number: 3, start_time: "11:00", end_time: "11:50", slot_type: "lecture", subject_code: "HU301", subject_name: "English", room_number: "LH-103", building: "Main Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s9", day: "tuesday", period_number: 4, start_time: "12:00", end_time: "12:50", slot_type: "break", subject_code: "", subject_name: "Lunch Break", room_number: "Canteen", building: "Student Hub", faculty_name: "" },
  { id: "s10", day: "tuesday", period_number: 5, start_time: "14:00", end_time: "15:40", slot_type: "lab", subject_code: "CS301", subject_name: "Data Structures Lab", room_number: "Lab-201", building: "Lab Block", faculty_name: "Dr. Ramesh Kumar" },
  
  // Wednesday
  { id: "s11", day: "wednesday", period_number: 1, start_time: "09:00", end_time: "09:50", slot_type: "lecture", subject_code: "CS302", subject_name: "Digital Logic", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s12", day: "wednesday", period_number: 2, start_time: "10:00", end_time: "10:50", slot_type: "lecture", subject_code: "MA301", subject_name: "Mathematics III", room_number: "LH-102", building: "Main Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s13", day: "wednesday", period_number: 3, start_time: "11:00", end_time: "11:50", slot_type: "lecture", subject_code: "CS303", subject_name: "Operating Systems", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s14", day: "wednesday", period_number: 4, start_time: "12:00", end_time: "12:50", slot_type: "break", subject_code: "", subject_name: "Lunch Break", room_number: "Canteen", building: "Student Hub", faculty_name: "" },
  { id: "s15", day: "wednesday", period_number: 5, start_time: "14:00", end_time: "14:50", slot_type: "lecture", subject_code: "HU301", subject_name: "English", room_number: "LH-103", building: "Main Block", faculty_name: "Dr. Ramesh Kumar" },
  
  // Thursday
  { id: "s16", day: "thursday", period_number: 1, start_time: "09:00", end_time: "09:50", slot_type: "lecture", subject_code: "MA301", subject_name: "Mathematics III", room_number: "LH-102", building: "Main Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s17", day: "thursday", period_number: 2, start_time: "10:00", end_time: "10:50", slot_type: "lecture", subject_code: "CS303", subject_name: "Operating Systems", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s18", day: "thursday", period_number: 3, start_time: "11:00", end_time: "11:50", slot_type: "lecture", subject_code: "CS301", subject_name: "Data Structures", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s19", day: "thursday", period_number: 4, start_time: "12:00", end_time: "12:50", slot_type: "break", subject_code: "", subject_name: "Lunch Break", room_number: "Canteen", building: "Student Hub", faculty_name: "" },
  { id: "s20", day: "thursday", period_number: 5, start_time: "14:00", end_time: "15:40", slot_type: "lab", subject_code: "CS302", subject_name: "Digital Logic Lab", room_number: "Lab-202", building: "Lab Block", faculty_name: "Dr. Ramesh Kumar" },
  
  // Friday
  { id: "s21", day: "friday", period_number: 1, start_time: "09:00", end_time: "09:50", slot_type: "lecture", subject_code: "HU301", subject_name: "English", room_number: "LH-103", building: "Main Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s22", day: "friday", period_number: 2, start_time: "10:00", end_time: "10:50", slot_type: "lecture", subject_code: "CS302", subject_name: "Digital Logic", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s23", day: "friday", period_number: 3, start_time: "11:00", end_time: "11:50", slot_type: "lecture", subject_code: "CS301", subject_name: "Data Structures", room_number: "LH-101", building: "CSE Block", faculty_name: "Dr. Ramesh Kumar" },
  { id: "s24", day: "friday", period_number: 4, start_time: "12:00", end_time: "12:50", slot_type: "break", subject_code: "", subject_name: "Lunch Break", room_number: "Canteen", building: "Student Hub", faculty_name: "" },
  { id: "s25", day: "friday", period_number: 5, start_time: "14:00", end_time: "14:50", slot_type: "free", subject_code: "", subject_name: "Library/Self Study", room_number: "Library", building: "Student Hub", faculty_name: "" }
];

const INITIAL_RESULTS = [
  { semester: 1, subject_code: "MA101", subject_name: "Mathematics I", credits: 4, grade: "A", grade_points: 8.0 },
  { semester: 1, subject_code: "PH101", subject_name: "Engineering Physics", credits: 4, grade: "B", grade_points: 7.0 },
  { semester: 1, subject_code: "CS101", subject_name: "Intro to Programming", credits: 3, grade: "A+", grade_points: 9.0 },
  { semester: 1, subject_code: "CS101L", subject_name: "Programming Lab", credits: 2, grade: "O", grade_points: 10.0 },
  
  { semester: 2, subject_code: "MA102", subject_name: "Mathematics II", credits: 4, grade: "B+", grade_points: 7.5 },
  { semester: 2, subject_code: "CY101", subject_name: "Engineering Chemistry", credits: 4, grade: "B", grade_points: 7.0 },
  { semester: 2, subject_code: "CS201", subject_name: "Object Oriented Programming", credits: 3, grade: "A", grade_points: 8.0 },
  
  { semester: 3, subject_code: "MA201", subject_name: "Discrete Mathematics", credits: 4, grade: "A", grade_points: 8.0 },
  { semester: 3, subject_code: "CS302", subject_name: "Computer Organization", credits: 4, grade: "A+", grade_points: 9.0 },
  { semester: 3, subject_code: "CS303", subject_name: "Database Management Systems", credits: 3, grade: "A", grade_points: 8.0 }
];

const INITIAL_SYLLABUS = [
  { subject_code: "CS301", subject_name: "Data Structures", unit_number: 1, unit_title: "Unit 1: Linear Data Structures", topics: "Arrays, stacks, queues, linked lists, and recursion. Applications of stacks and queues.", hours: 12, is_completed: true },
  { subject_code: "CS301", subject_name: "Data Structures", unit_number: 2, unit_title: "Unit 2: Trees", topics: "Binary trees, binary search trees, AVL trees, B-trees, tree traversal algorithms, heaps.", hours: 10, is_completed: true },
  { subject_code: "CS301", subject_name: "Data Structures", unit_number: 3, unit_title: "Unit 3: Graphs", topics: "Graph representations, BFS, DFS, MST algorithms (Kruskal, Prim), shortest path algorithms.", hours: 12, is_completed: true },
  { subject_code: "CS301", subject_name: "Data Structures", unit_number: 4, unit_title: "Unit 4: Sorting and Searching", topics: "Bubble, insertion, selection, quick, merge, heap sort, hash tables, hash functions, collision resolution.", hours: 8, is_completed: false },
  { subject_code: "CS301", subject_name: "Data Structures", unit_number: 5, unit_title: "Unit 5: Advanced Structures", topics: "Tries, suffix trees, segment trees, union-find, complexity analysis of algorithmic operations.", hours: 8, is_completed: false }
];

const INITIAL_BADGES = [
  { id: "b1", name: "React Ninja", description: "Mastered React.js fundamentals", category: "technical", icon: "code", points: 50, criteria: "Complete React Workshop + Build 1 Project" },
  { id: "b2", name: "Hackathon Hero", description: "Participated in a 24-hour hackathon", category: "hackathon", icon: "trophy", points: 100, criteria: "Complete any hackathon event" },
  { id: "b3", name: "Team Leader", description: "Led a project team of 3+ members", category: "soft_skill", icon: "users", points: 30, criteria: "Successfully lead a team project to completion" }
];

const INITIAL_NOTICES = [
  { id: "n1", title: "End Semester Exams Schedule Published", content: "The end-semester examinations for all UG/PG classes will commence on June 15, 2026. Please check the Exam Schedule section for dates, times, and hall locations.", category: "academic", date: "2026-05-28" },
  { id: "n2", title: "Smart-Timetable Substitutions Activated", content: "To handle faculty leaves efficiently, real-time push substitution slots are now visible dynamically inside your Smart Timetable timeline.", category: "general", date: "2026-05-29" }
];

// Load database from localStorage or initialize with seed data
const getMockDb = () => {
  const data = localStorage.getItem('mock_db');
  if (data) {
    try { return JSON.parse(data); } catch { /* fallback */ }
  }
  
  const initialDb = {
    users: INITIAL_USERS,
    timetable: INITIAL_TIMETABLE_SLOTS,
    results: INITIAL_RESULTS,
    syllabus: INITIAL_SYLLABUS,
    badges: INITIAL_BADGES,
    notices: INITIAL_NOTICES,
    projects: [
      {
        id: "p1",
        title: "University Super-App",
        description: "A comprehensive campus management system with React + Flask",
        team_members: "Priya K.,Rahul S.",
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
    hostelPasses: [],
    canteenOrders: [],
    notifications: []
  };
  localStorage.setItem('mock_db', JSON.stringify(initialDb));
  return initialDb;
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

    let user = db.users.find((u: any) => u.email?.toLowerCase() === payload.email.toLowerCase());
    
    // Auto-register user via SSO if they don't exist in local DB
    if (!user) {
      const emailParts = payload.email.split('@');
      const namePart = emailParts[0] || 'Student';
      const firstName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      user = {
        id: `std_${Date.now()}`,
        email: payload.email,
        password: "sso-login-placeholder!",
        role: "student",
        first_name: firstName,
        last_name: "SSO",
        department: "CSE",
        roll_number: `22CSE${Math.floor(100 + Math.random() * 900)}`,
        hostel_status: "dayscholar",
        semester: 4,
        section: "A",
        batch_year: 2024,
        is_verified: true,
      };
      db.users.push(user);
      saveMockDb(db);
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
    return {
      status: 200,
      data: { earned_badges: db.badges.slice(0, 2) }
    };
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
      milestones: []
    };
    db.projects.push(newProject);
    saveMockDb(db);
    return {
      status: 201,
      data: newProject
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
      }
    });
    
    saveMockDb(db);
    if (updatedMilestone) {
      return { status: 200, data: updatedMilestone };
    }
  }

  // Hostel Passes
  if (cleanUrl === '/campus/hostel-pass' && method === 'post') {
    const payload = getPayload(config.data);
    const newPass = {
      id: `h_${Date.now()}`,
      ...payload,
      status: "pending",
      created_at: new Date().toISOString()
    };
    db.hostelPasses.push(newPass);
    saveMockDb(db);
    return { status: 201, data: newPass };
  }

  if (cleanUrl === '/campus/hostel-pass' && method === 'get') {
    return { status: 200, data: db.hostelPasses };
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
  if (cleanUrl === '/attendance/stats' && method === 'get') {
    return {
      status: 200,
      data: {
        overall_attendance: 82.5,
        total_conducted: 120,
        total_present: 99,
        subjects: [
          { subject_code: "CS301", subject_name: "Data Structures", present: 22, conducted: 25, percentage: 88.0 },
          { subject_code: "CS302", subject_name: "Digital Logic", present: 18, conducted: 24, percentage: 75.0 },
          { subject_code: "MA301", subject_name: "Mathematics III", present: 21, conducted: 25, percentage: 84.0 },
          { subject_code: "CS303", subject_name: "Operating Systems", present: 19, conducted: 24, percentage: 79.1 },
          { subject_code: "HU301", subject_name: "English", present: 19, conducted: 22, percentage: 86.3 }
        ]
      }
    };
  }

  if (cleanUrl === '/attendance/scan-qr' && method === 'post') {
    const payload = getPayload(config.data);
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
