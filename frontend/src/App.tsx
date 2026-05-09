import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Academic from './pages/Academic';
import Campus from './pages/Campus';
import Career from './pages/Career';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
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
import SystemHealth from './pages/SystemHealth';

// Check if the user has a valid token in localStorage
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" />;
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
            <Route path="/academic" element={<ProtectedRoute><Academic /></ProtectedRoute>} />
            <Route path="/campus" element={<ProtectedRoute><Campus /></ProtectedRoute>} />
            <Route path="/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Academic Core Features */}
            <Route path="/academic/timetable" element={<ProtectedRoute><SmartTimetable /></ProtectedRoute>} />
            <Route path="/academic/attendance" element={<ProtectedRoute><BunkOMeter /></ProtectedRoute>} />
            <Route path="/academic/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
            <Route path="/academic/question-papers" element={<ProtectedRoute><QuestionPapers /></ProtectedRoute>} />

            {/* Campus Operations */}
            <Route path="/campus/canteen" element={<ProtectedRoute><DigitalCanteen /></ProtectedRoute>} />
            <Route path="/campus/bus" element={<ProtectedRoute><LiveBusTracking /></ProtectedRoute>} />
            <Route path="/campus/map" element={<ProtectedRoute><IndoorMap /></ProtectedRoute>} />

            {/* Career & Placements */}
            <Route path="/career/jobs" element={<ProtectedRoute><JobPortal /></ProtectedRoute>} />
            <Route path="/career/referrals" element={<ProtectedRoute><ReferralHub /></ProtectedRoute>} />

            {/* Faculty Management Layer */}
            <Route path="/faculty" element={<ProtectedRoute><FacultyHub /></ProtectedRoute>} />
            <Route path="/faculty/bulk-attendance" element={<ProtectedRoute><FacultyBulkAttendance /></ProtectedRoute>} />
            <Route path="/faculty/qr" element={<ProtectedRoute><FacultyQRAttendance /></ProtectedRoute>} />
            <Route path="/faculty/marks" element={<ProtectedRoute><FacultyMarksEntry /></ProtectedRoute>} />

            {/* Admin & Infrastructure Layer */}
            <Route path="/admin/timetable" element={<ProtectedRoute><TimetableEditor /></ProtectedRoute>} />
            <Route path="/admin/health" element={<ProtectedRoute><SystemHealth /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
