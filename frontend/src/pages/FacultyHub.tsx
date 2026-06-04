import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, QrCode, PenTool, LayoutDashboard, FileText, Bell, 
  Calendar, CheckSquare, Upload, Clock, UserCheck,
  Briefcase, Target, BarChart3, Coffee, MapPin, Heart,
  AlertTriangle, RefreshCw, MessageSquare, ChevronRight,
  BookOpen, GraduationCap, ClipboardList, Lock, X, FolderKanban
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const featureKeys: Record<string, string> = {
  'Syllabus Tracker': 'syllabus_tracker',
  'Clubs & Societies': 'clubs'
};

const FacultyHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard'|'academic'|'campus'|'career'>('dashboard');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const facultyName = user.first_name ? `Dr. ${user.first_name}` : 'Faculty';
  const [stats, setStats] = useState({ mentees: 0, subjects: 0, pending: 0 });
  const [assignedFeatures, setAssignedFeatures] = useState<string[]>([]);
  const [showRestrictedModal, setShowRestrictedModal] = useState(false);
  const [restrictedFeatureName, setRestrictedFeatureName] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchStatsAndAssignments = async () => {
      try {
        const [menteesRes, leavesRes, assignmentsRes] = await Promise.allSettled([
          api.get('/faculty/mentees'),
          api.get('/faculty/leaves'),
          api.get('/faculty/assignments')
        ]);
        const menteeCount = menteesRes.status === 'fulfilled' ? (menteesRes.value.data.total || 0) : 0;
        const pendingCount = leavesRes.status === 'fulfilled' ? (leavesRes.value.data.leaves?.length || 0) : 0;
        const assigned = assignmentsRes.status === 'fulfilled' ? (assignmentsRes.value.data.assigned_features || []) : [];
        
        setStats({ mentees: menteeCount, subjects: 4, pending: pendingCount });
        setAssignedFeatures(assigned);
      } catch {
        // Keep defaults
      }
    };
    fetchStatsAndAssignments();
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4"/> },
    { key: 'academic', label: 'Academic', icon: <GraduationCap className="w-4 h-4"/> },
    { key: 'campus', label: 'Campus', icon: <MapPin className="w-4 h-4"/> },
    { key: 'career', label: 'Career', icon: <Briefcase className="w-4 h-4"/> },
  ];

  // ── Dashboard Section (Core Faculty Tools) ──
  const dashboardFeatures = [
    { name: 'Bulk Attendance', desc: 'One-tap grid marker', icon: <Users className="w-6 h-6"/>, color: 'from-indigo-500 to-indigo-600', path: '/faculty/bulk-attendance' },
    { name: 'QR Attendance', desc: 'Dynamic QR code', icon: <QrCode className="w-6 h-6"/>, color: 'from-emerald-500 to-emerald-600', path: '/faculty/qr' },
    { name: 'Marks Entry', desc: 'Auto-save portal', icon: <PenTool className="w-6 h-6"/>, color: 'from-amber-500 to-amber-600', path: '/faculty/marks' },
    { name: 'Hostel Passes', desc: 'Approve student out-passes', icon: <CheckSquare className="w-6 h-6"/>, color: 'from-violet-500 to-indigo-600', path: '/faculty/hostel-passes' },
    { name: 'Leave Approval', desc: 'Review student leaves', icon: <CheckSquare className="w-6 h-6"/>, color: 'from-teal-500 to-teal-600', path: '/faculty/leaves' },
    { name: 'Broadcast', desc: 'Notify your class', icon: <Bell className="w-6 h-6"/>, color: 'from-rose-500 to-rose-600', path: '/faculty/broadcast' },
    { name: 'Mentees', desc: 'Your 25-30 students', icon: <UserCheck className="w-6 h-6"/>, color: 'from-violet-500 to-violet-600', path: '/faculty/mentees' },
    { name: 'Office Hours', desc: 'Set meeting slots', icon: <Clock className="w-6 h-6"/>, color: 'from-cyan-500 to-cyan-600', path: '/faculty/meetings' },
    { name: 'Resources', desc: 'Upload notes/PPTs', icon: <Upload className="w-6 h-6"/>, color: 'from-orange-500 to-orange-600', path: '/faculty/resources' },
  ];

  // ── Academic Management ──
  const academicFeatures = [
    { name: 'Question Bank', desc: 'Upload & manage PYQs', icon: <FileText className="w-5 h-5 text-blue-600"/>, color: 'bg-blue-100', path: '/faculty/question-bank' },
    { name: 'Syllabus Tracker', desc: 'Mark curriculum progress', icon: <ClipboardList className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/faculty/syllabus-tracker' },
    { name: 'Assignment Grader', desc: 'Grade student uploads', icon: <CheckSquare className="w-5 h-5 text-purple-600"/>, color: 'bg-purple-100', path: '/faculty/grader' },
    { name: 'Report Generator', desc: 'Export to PDF/Excel', icon: <BookOpen className="w-5 h-5 text-amber-600"/>, color: 'bg-amber-100', path: '/faculty/reports' },
    { name: 'Student Performance', desc: 'Analytics dashboard', icon: <Target className="w-5 h-5 text-cyan-600"/>, color: 'bg-cyan-100', path: '/faculty/student-performance' },
    { name: 'Attendance Disputes', desc: 'Resolve marked errors', icon: <AlertTriangle className="w-5 h-5 text-rose-600"/>, color: 'bg-rose-100', path: '/faculty/discrepancies' },
    { name: 'Supervised Projects', desc: 'Accept, decline & complete student projects', icon: <FolderKanban className="w-5 h-5 text-cyan-600"/>, color: 'bg-cyan-100', path: '/faculty/projects' },
  ];

  // ── Campus Quick Access ──
  const campusFeatures = [
    { name: 'Hostel Passes', icon: <CheckSquare className="w-5 h-5 text-indigo-600"/>, color: 'bg-indigo-100', path: '/faculty/hostel-passes' },
    { name: 'Canteen', icon: <Coffee className="w-5 h-5 text-orange-600"/>, color: 'bg-orange-100', path: '/campus/canteen' },
    { name: 'Indoor Map', icon: <MapPin className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/campus/map' },
    { name: 'Events & Fests', icon: <Calendar className="w-5 h-5 text-pink-600"/>, color: 'bg-pink-100', path: '/campus/events' },
    { name: 'Clubs & Societies', icon: <Users className="w-5 h-5 text-teal-600"/>, color: 'bg-teal-100', path: '/campus/clubs' },
    { name: 'Notice Board', icon: <Bell className="w-5 h-5 text-red-600"/>, color: 'bg-red-100', path: '/campus/notices' },
    { name: 'Anon Feedback', icon: <MessageSquare className="w-5 h-5 text-purple-600"/>, color: 'bg-purple-100', path: '/campus/feedback' },
    { name: 'Health Center', icon: <Heart className="w-5 h-5 text-red-600"/>, color: 'bg-red-100', path: '/utility/health' },
    { name: 'Emergency', icon: <AlertTriangle className="w-5 h-5 text-red-700"/>, color: 'bg-red-50', path: '/utility/emergency' },
  ];

  // ── Career Management (Faculty adds/manages) ──
  const careerFeatures = [
    { name: 'Job Portal', desc: 'Post placement drives', icon: <Briefcase className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/career/jobs' },
    { name: 'Interview Schedule', desc: 'Manage rounds', icon: <Clock className="w-5 h-5 text-violet-600"/>, color: 'bg-violet-100', path: '/career/interviews' },
    { name: 'Company Prep', desc: 'Add prep material', icon: <FileText className="w-5 h-5 text-blue-600"/>, color: 'bg-blue-100', path: '/career/prep' },
    { name: 'Internships', desc: 'Track student internships', icon: <PenTool className="w-5 h-5 text-teal-600"/>, color: 'bg-teal-100', path: '/career/internships' },
    { name: 'Skill Badges', desc: 'Create & award skill badges', icon: <Target className="w-5 h-5 text-amber-600"/>, color: 'bg-amber-100', path: '/career/badges' },
  ];

  const handleCardClick = (name: string, path: string) => {
    const key = featureKeys[name];
    const isLocked = key && !assignedFeatures.includes(key) && user.role !== 'admin';
    if (isLocked) {
      setRestrictedFeatureName(name);
      setShowRestrictedModal(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 pt-12 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg">{(user.first_name || 'F')[0]}</div>
              <div>
                <h1 className="text-xl font-bold text-white">Faculty Hub</h1>
                <p className="text-xs text-slate-400">Welcome, {facultyName}</p>
              </div>
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900"></span>
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 text-slate-800 z-30 animate-fade-in">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-slate-400 hover:text-slate-650">Dismiss</button>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-50 rounded-xl text-[10px] text-left">
                      <p className="font-semibold text-slate-805 text-slate-800">New Leave Application</p>
                      <p className="text-slate-500 mt-0.5">Student Rahul M. applied for medical leave.</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl text-[10px] text-left">
                      <p className="font-semibold text-slate-805 text-slate-800">Syllabus Review</p>
                      <p className="text-slate-500 mt-0.5">Admin requested syllabus completion updates.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex gap-3 mt-4">
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
              <p className="text-lg font-black text-white">{stats.mentees}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Mentees</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
              <p className="text-lg font-black text-white">{stats.subjects}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Subjects</p>
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center border border-white/10">
              <p className="text-lg font-black text-emerald-400">{stats.pending}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-3 px-3 mt-4 bg-white rounded-2xl mx-4 p-1.5 shadow-sm border border-slate-100 overflow-x-auto hide-scrollbar">
        <style>{`
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 min-w-[85px] flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-[11px] font-bold transition-all shrink-0 ${activeTab === t.key ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Management Tools</h2>
            <div className="grid grid-cols-2 gap-3">
              {dashboardFeatures.map((f, i) => {
                const key = featureKeys[f.name];
                const isLocked = key && !assignedFeatures.includes(key) && user.role !== 'admin';
                return (
                  <button key={i} onClick={() => handleCardClick(f.name, f.path)}
                    className={`bg-gradient-to-br ${f.color} rounded-[20px] p-4 flex flex-col items-start gap-2 text-white shadow-md hover:shadow-lg active:scale-95 transition-all text-left relative ${isLocked ? 'opacity-60 saturate-50' : ''}`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      {isLocked ? <Lock className="w-5 h-5 text-white/90" /> : f.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold flex items-center gap-1.5">
                        {f.name}
                        {isLocked && <Lock className="w-3.5 h-3.5 text-white/60" />}
                      </h3>
                      <p className="text-[10px] text-white/70">{isLocked ? 'Restricted Access' : f.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ACADEMIC TAB */}
        {activeTab === 'academic' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Management</h2>
            <div className="flex flex-col gap-3">
              {academicFeatures.map((f, i) => {
                const key = featureKeys[f.name];
                const isLocked = key && !assignedFeatures.includes(key) && user.role !== 'admin';
                return (
                  <button key={i} onClick={() => handleCardClick(f.name, f.path)}
                    className={`bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left relative ${isLocked ? 'opacity-65' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl ${isLocked ? 'bg-slate-100 text-slate-400' : f.color} flex items-center justify-center shrink-0`}>
                      {isLocked ? <Lock className="w-5 h-5 text-slate-450" /> : f.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {f.name}
                        {isLocked && <Lock className="w-3.5 h-3.5 text-slate-405" />}
                      </h3>
                      <p className="text-[11px] text-slate-500">{isLocked ? 'Assigned coordinators only' : f.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300"/>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CAMPUS TAB */}
        {activeTab === 'campus' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Campus Quick Access</h2>
            <div className="grid grid-cols-2 gap-3">
              {campusFeatures.map((f, i) => {
                const key = featureKeys[f.name];
                const isLocked = key && !assignedFeatures.includes(key) && user.role !== 'admin';
                return (
                  <button key={i} onClick={() => handleCardClick(f.name, f.path)}
                    className={`bg-white rounded-[20px] p-4 flex items-center gap-3 shadow-sm border border-slate-100 hover:shadow-md active:scale-95 transition-all text-left relative ${isLocked ? 'opacity-65' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl ${isLocked ? 'bg-slate-100 text-slate-400' : f.color} flex items-center justify-center shrink-0`}>
                      {isLocked ? <Lock className="w-5 h-5 text-slate-450" /> : f.icon}
                    </div>
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {f.name}
                      {isLocked && <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CAREER TAB */}
        {activeTab === 'career' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Placement & Career Management</h2>
            <div className="flex flex-col gap-3">
              {careerFeatures.map((f, i) => {
                const key = featureKeys[f.name];
                const isLocked = key && !assignedFeatures.includes(key) && user.role !== 'admin';
                return (
                  <button key={i} onClick={() => handleCardClick(f.name, f.path)}
                    className={`bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left relative ${isLocked ? 'opacity-65' : ''}`}>
                    <div className={`w-12 h-12 rounded-2xl ${isLocked ? 'bg-slate-100 text-slate-400' : f.color} flex items-center justify-center shrink-0`}>
                      {isLocked ? <Lock className="w-5 h-5 text-slate-450" /> : f.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        {f.name}
                        {isLocked && <Lock className="w-3.5 h-3.5 text-slate-405" />}
                      </h3>
                      <p className="text-[11px] text-slate-500">{isLocked ? 'Assigned coordinators only' : f.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300"/>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Restricted Access Modal */}
      {showRestrictedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-5 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-slide-up border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-500" /> Access Restricted
              </h3>
              <button onClick={() => setShowRestrictedModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-5">
              You are not assigned as the coordinator/advisor for <span className="font-extrabold text-slate-800">{restrictedFeatureName}</span>.
              <br /><br />
              Please contact the administration office or system administrator to add this role to your coordinator assignments.
            </p>
            <button
              onClick={() => setShowRestrictedModal(false)}
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-bold active:scale-[0.98] transition-all hover:bg-slate-800"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      <BottomNav/>
    </div>
  );
};

export default FacultyHub;
