import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Academic from './pages/Academic';
import Campus from './pages/Campus';
import Career from './pages/Career';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import SmartTimetable from './pages/SmartTimetable';
import BunkOMeter from './pages/BunkOMeter';
import Assignments from './pages/Assignments';
import QuestionPapers from './pages/QuestionPapers';
import FacultyHub from './pages/FacultyHub';
import FacultyBulkAttendance from './pages/FacultyBulkAttendance';
import FacultyQRAttendance from './pages/FacultyQRAttendance';
import FacultyMarksEntry from './pages/FacultyMarksEntry';
import DigitalCanteen from './pages/DigitalCanteen';
import LiveBusTracking from './pages/LiveBusTracking';
import IndoorMap from './pages/IndoorMap';
import JobPortal from './pages/JobPortal';
import ReferralHub from './pages/ReferralHub';
import TimetableEditor from './pages/TimetableEditor';
import TeamFinder from './pages/TeamFinder';
import PortfolioBuilder from './pages/PortfolioBuilder';
import CreditDashboard from './pages/CreditDashboard';
import SystemHealth from './pages/SystemHealth';
import HostelPass from './pages/HostelPass';
import NoticeBoard from './pages/NoticeBoard';
import Results from './pages/Results';
import SyllabusViewer from './pages/SyllabusViewer';
import FacultyDirectory from './pages/FacultyDirectory';
import InternalMarks from './pages/InternalMarks';
import ExamSchedule from './pages/ExamSchedule';
import ProjectReminders from './pages/ProjectReminders';
import SkillBadges from './pages/SkillBadges';
import EventHub from './pages/EventHub';
import VolunteerPortal from './pages/VolunteerPortal';
import ClubsSocieties from './pages/ClubsSocieties';
import AnonymousFeedback from './pages/AnonymousFeedback';
import LibraryPortal from './pages/LibraryPortal';
import InterviewScheduler from './pages/InterviewScheduler';
import CompanyPrep from './pages/CompanyPrep';
import InternshipTracker from './pages/InternshipTracker';
import MockTestPortal from './pages/MockTestPortal';
import HealthCenter from './pages/HealthCenter';
import EmergencyButton from './pages/EmergencyButton';
import BuySell from './pages/BuySell';
import PollsSurveys from './pages/PollsSurveys';
import SyncStatus from './pages/SyncStatus';
import AIStudyAssistant from './pages/AIStudyAssistant';
import GPAPredictor from './pages/GPAPredictor';
import DocumentScanner from './pages/DocumentScanner';
import UsageAnalytics from './pages/UsageAnalytics';

// ── Route Guards ─────────────────────────────────────────────────
// Requires any valid JWT token (student, faculty, admin, or guest)
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

// Requires a REAL account — blocks guest users
const AuthenticatedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;

  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.is_guest || user.role === 'guest') {
      // Redirect guests to their profile which shows the "limited access" banner
      return <Navigate to="/profile" />;
    }
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-app-bg flex items-center justify-center sm:p-4">
        <div className="mobile-container relative">
          <Routes>
            {/* Auth (public) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Main Hubs */}
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/academic" element={<AuthenticatedRoute><Academic /></AuthenticatedRoute>} />
            <Route path="/campus" element={<ProtectedRoute><Campus /></ProtectedRoute>} />
            <Route path="/career" element={<AuthenticatedRoute><Career /></AuthenticatedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/change-password" element={<AuthenticatedRoute><ChangePassword /></AuthenticatedRoute>} />

            {/* Academic Core Features — Authenticated only (no guests) */}
            <Route path="/academic/timetable" element={<AuthenticatedRoute><SmartTimetable /></AuthenticatedRoute>} />
            <Route path="/academic/attendance" element={<AuthenticatedRoute><BunkOMeter /></AuthenticatedRoute>} />
            <Route path="/academic/assignments" element={<AuthenticatedRoute><Assignments /></AuthenticatedRoute>} />
            <Route path="/academic/question-papers" element={<AuthenticatedRoute><QuestionPapers /></AuthenticatedRoute>} />
            <Route path="/academic/credits" element={<AuthenticatedRoute><CreditDashboard /></AuthenticatedRoute>} />
            <Route path="/academic/results" element={<AuthenticatedRoute><Results /></AuthenticatedRoute>} />

            {/* Campus Operations — Map & Notices are guest-accessible */}
            <Route path="/campus/canteen" element={<AuthenticatedRoute><DigitalCanteen /></AuthenticatedRoute>} />
            <Route path="/campus/bus" element={<ProtectedRoute><LiveBusTracking /></ProtectedRoute>} />
            <Route path="/campus/map" element={<ProtectedRoute><IndoorMap /></ProtectedRoute>} />
            <Route path="/campus/hostel-pass" element={<AuthenticatedRoute><HostelPass /></AuthenticatedRoute>} />
            <Route path="/campus/notices" element={<ProtectedRoute><NoticeBoard /></ProtectedRoute>} />
            <Route path="/campus/library" element={<AuthenticatedRoute><LibraryPortal /></AuthenticatedRoute>} />
            <Route path="/campus/events" element={<AuthenticatedRoute><EventHub /></AuthenticatedRoute>} />
            <Route path="/campus/volunteer" element={<AuthenticatedRoute><VolunteerPortal /></AuthenticatedRoute>} />
            <Route path="/campus/clubs" element={<AuthenticatedRoute><ClubsSocieties /></AuthenticatedRoute>} />
            <Route path="/campus/feedback" element={<AuthenticatedRoute><AnonymousFeedback /></AuthenticatedRoute>} />

            {/* Career & Placements — Authenticated only */}
            <Route path="/career/jobs" element={<AuthenticatedRoute><JobPortal /></AuthenticatedRoute>} />
            <Route path="/career/referrals" element={<AuthenticatedRoute><ReferralHub /></AuthenticatedRoute>} />
            <Route path="/career/team-finder" element={<AuthenticatedRoute><TeamFinder /></AuthenticatedRoute>} />
            <Route path="/career/portfolio" element={<AuthenticatedRoute><PortfolioBuilder /></AuthenticatedRoute>} />
            <Route path="/career/projects" element={<AuthenticatedRoute><ProjectReminders /></AuthenticatedRoute>} />
            <Route path="/career/badges" element={<AuthenticatedRoute><SkillBadges /></AuthenticatedRoute>} />
            <Route path="/career/interviews" element={<AuthenticatedRoute><InterviewScheduler /></AuthenticatedRoute>} />
            <Route path="/career/prep" element={<AuthenticatedRoute><CompanyPrep /></AuthenticatedRoute>} />
            <Route path="/career/internships" element={<AuthenticatedRoute><InternshipTracker /></AuthenticatedRoute>} />
            <Route path="/career/mock-tests" element={<AuthenticatedRoute><MockTestPortal /></AuthenticatedRoute>} />

            {/* Utility & Health */}
            <Route path="/utility/health" element={<AuthenticatedRoute><HealthCenter /></AuthenticatedRoute>} />
            <Route path="/utility/emergency" element={<ProtectedRoute><EmergencyButton /></ProtectedRoute>} />
            <Route path="/utility/marketplace" element={<AuthenticatedRoute><BuySell /></AuthenticatedRoute>} />
            <Route path="/utility/polls" element={<AuthenticatedRoute><PollsSurveys /></AuthenticatedRoute>} />
            <Route path="/utility/sync" element={<ProtectedRoute><SyncStatus /></ProtectedRoute>} />

            {/* AI Features */}
            <Route path="/ai/study-assistant" element={<AuthenticatedRoute><AIStudyAssistant /></AuthenticatedRoute>} />
            <Route path="/ai/gpa-predictor" element={<AuthenticatedRoute><GPAPredictor /></AuthenticatedRoute>} />
            <Route path="/ai/scanner" element={<AuthenticatedRoute><DocumentScanner /></AuthenticatedRoute>} />
            <Route path="/ai/usage" element={<AuthenticatedRoute><UsageAnalytics /></AuthenticatedRoute>} />

            {/* Faculty Management Layer */}
            <Route path="/faculty" element={<AuthenticatedRoute><FacultyHub /></AuthenticatedRoute>} />
            <Route path="/faculty/bulk-attendance" element={<AuthenticatedRoute><FacultyBulkAttendance /></AuthenticatedRoute>} />
            <Route path="/faculty/qr" element={<AuthenticatedRoute><FacultyQRAttendance /></AuthenticatedRoute>} />
            <Route path="/faculty/marks" element={<AuthenticatedRoute><FacultyMarksEntry /></AuthenticatedRoute>} />

            {/* Admin & Infrastructure Layer */}
            <Route path="/admin/timetable" element={<AuthenticatedRoute><TimetableEditor /></AuthenticatedRoute>} />
            <Route path="/admin/health" element={<AuthenticatedRoute><SystemHealth /></AuthenticatedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
