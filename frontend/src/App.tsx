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
import SyncStatus from './pages/SyncStatus';
import AIStudyAssistant from './pages/AIStudyAssistant';
import GPAPredictor from './pages/GPAPredictor';
import DocumentScanner from './pages/DocumentScanner';
import UsageAnalytics from './pages/UsageAnalytics';
import FacultyLeaveApproval from './pages/FacultyLeaveApproval';
import FacultyBroadcast from './pages/FacultyBroadcast';
import FacultyDiscrepancies from './pages/FacultyDiscrepancies';
import FacultyMentees from './pages/FacultyMentees';
import FacultyMeetingScheduler from './pages/FacultyMeetingScheduler';
import FacultyResourceUploader from './pages/FacultyResourceUploader';
import FacultySyllabusTracker from './pages/FacultySyllabusTracker';
import FacultyAssignmentGrader from './pages/FacultyAssignmentGrader';
import FacultyReportGenerator from './pages/FacultyReportGenerator';
import AdminHub from './pages/AdminHub';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminGlobalAlerts from './pages/AdminGlobalAlerts';
import AdminFeeDefaulters from './pages/AdminFeeDefaulters';
import AdminAccessControl from './pages/AdminAccessControl';
import AdminDataExport from './pages/AdminDataExport';
import AdminModeration from './pages/AdminModeration';
import AdminPlacementAnalytics from './pages/AdminPlacementAnalytics';

import GuestLockedFeature from './components/GuestLockedFeature';

// Helper to read user role
const getUserRole = (): string | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try { return JSON.parse(userStr).role || null; } catch { return null; }
};

// Route Guards
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
      return <GuestLockedFeature />;
    }
  }
  return <>{children}</>;
};

// Faculty-only — redirects students/guests to home, admin to admin hub
const FacultyRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const role = getUserRole();
  if (role === 'admin') return <Navigate to="/admin" />;
  if (role !== 'faculty') return <Navigate to="/" />;
  return <>{children}</>;
};

// Admin-only — redirects students/guests to home, faculty to faculty hub
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const role = getUserRole();
  if (role === 'faculty') return <Navigate to="/faculty" />;
  if (role !== 'admin') return <Navigate to="/" />;
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
            <Route path="/academic/syllabus" element={<AuthenticatedRoute><SyllabusViewer /></AuthenticatedRoute>} />
            <Route path="/academic/faculty" element={<AuthenticatedRoute><FacultyDirectory /></AuthenticatedRoute>} />
            <Route path="/academic/internal-marks" element={<AuthenticatedRoute><InternalMarks /></AuthenticatedRoute>} />
            <Route path="/academic/exams" element={<AuthenticatedRoute><ExamSchedule /></AuthenticatedRoute>} />

            {/* Campus Operations — Map & Notices are guest-accessible */}
            <Route path="/campus/canteen" element={<AuthenticatedRoute><DigitalCanteen /></AuthenticatedRoute>} />
            <Route path="/campus/bus" element={<ProtectedRoute><LiveBusTracking /></ProtectedRoute>} />
            <Route path="/campus/map" element={<ProtectedRoute><IndoorMap /></ProtectedRoute>} />
            <Route path="/campus/hostel-pass" element={<AuthenticatedRoute><HostelPass /></AuthenticatedRoute>} />
            <Route path="/campus/notices" element={<ProtectedRoute><NoticeBoard /></ProtectedRoute>} />
            <Route path="/campus/library" element={<AuthenticatedRoute><LibraryPortal /></AuthenticatedRoute>} />
            <Route path="/campus/events" element={<ProtectedRoute><EventHub /></ProtectedRoute>} />
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

            {/* Utility & Health — marketplace and polls REMOVED per requirement */}
            <Route path="/utility/health" element={<AuthenticatedRoute><HealthCenter /></AuthenticatedRoute>} />
            <Route path="/utility/emergency" element={<ProtectedRoute><EmergencyButton /></ProtectedRoute>} />
            <Route path="/utility/sync" element={<ProtectedRoute><SyncStatus /></ProtectedRoute>} />

            {/* AI Features */}
            <Route path="/ai/study-assistant" element={<AuthenticatedRoute><AIStudyAssistant /></AuthenticatedRoute>} />
            <Route path="/ai/gpa-predictor" element={<AuthenticatedRoute><GPAPredictor /></AuthenticatedRoute>} />
            <Route path="/ai/scanner" element={<AuthenticatedRoute><DocumentScanner /></AuthenticatedRoute>} />
            <Route path="/ai/usage" element={<AuthenticatedRoute><UsageAnalytics /></AuthenticatedRoute>} />

            {/* Faculty Management Layer — Faculty only */}
            <Route path="/faculty" element={<FacultyRoute><FacultyHub /></FacultyRoute>} />
            <Route path="/faculty/bulk-attendance" element={<FacultyRoute><FacultyBulkAttendance /></FacultyRoute>} />
            <Route path="/faculty/qr" element={<FacultyRoute><FacultyQRAttendance /></FacultyRoute>} />
            <Route path="/faculty/marks" element={<FacultyRoute><FacultyMarksEntry /></FacultyRoute>} />
            <Route path="/faculty/leaves" element={<FacultyRoute><FacultyLeaveApproval /></FacultyRoute>} />
            <Route path="/faculty/discrepancies" element={<FacultyRoute><FacultyDiscrepancies /></FacultyRoute>} />
            <Route path="/faculty/broadcast" element={<FacultyRoute><FacultyBroadcast /></FacultyRoute>} />
            <Route path="/faculty/mentees" element={<FacultyRoute><FacultyMentees /></FacultyRoute>} />
            <Route path="/faculty/meetings" element={<FacultyRoute><FacultyMeetingScheduler /></FacultyRoute>} />
            <Route path="/faculty/resources" element={<FacultyRoute><FacultyResourceUploader /></FacultyRoute>} />
            <Route path="/faculty/syllabus-tracker" element={<FacultyRoute><FacultySyllabusTracker /></FacultyRoute>} />
            <Route path="/faculty/grader" element={<FacultyRoute><FacultyAssignmentGrader /></FacultyRoute>} />
            <Route path="/faculty/reports" element={<FacultyRoute><FacultyReportGenerator /></FacultyRoute>} />
            <Route path="/faculty/question-bank" element={<FacultyRoute><FacultyResourceUploader /></FacultyRoute>} />
            <Route path="/faculty/mock-tests-manage" element={<FacultyRoute><FacultyResourceUploader /></FacultyRoute>} />
            <Route path="/faculty/student-performance" element={<FacultyRoute><FacultyMentees /></FacultyRoute>} />

            {/* Admin & Infrastructure Layer — Admin only */}
            <Route path="/admin" element={<AdminRoute><AdminHub /></AdminRoute>} />
            <Route path="/admin/timetable" element={<AdminRoute><TimetableEditor /></AdminRoute>} />
            <Route path="/admin/health" element={<AdminRoute><SystemHealth /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
            <Route path="/admin/alerts" element={<AdminRoute><AdminGlobalAlerts /></AdminRoute>} />
            <Route path="/admin/fees" element={<AdminRoute><AdminFeeDefaulters /></AdminRoute>} />
            <Route path="/admin/access-control" element={<AdminRoute><AdminAccessControl /></AdminRoute>} />
            <Route path="/admin/export" element={<AdminRoute><AdminDataExport /></AdminRoute>} />
            <Route path="/admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
            <Route path="/admin/placements" element={<AdminRoute><AdminPlacementAnalytics /></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
