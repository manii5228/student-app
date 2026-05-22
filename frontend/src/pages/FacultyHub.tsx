import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, QrCode, PenTool, LayoutDashboard, FileText, Bell, 
  Calendar, CheckSquare, Upload, Clock, UserCheck,
  Briefcase, Target, BarChart3, Coffee, MapPin, Heart,
  AlertTriangle, RefreshCw, MessageSquare, ChevronRight,
  BookOpen, GraduationCap, ClipboardList
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const FacultyHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard'|'academic'|'campus'|'career'>('dashboard');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const facultyName = user.first_name ? `Dr. ${user.first_name}` : 'Faculty';
  const [stats, setStats] = useState({ mentees: 0, subjects: 0, pending: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [menteesRes, leavesRes] = await Promise.allSettled([
          api.get('/faculty/mentees'),
          api.get('/faculty/leaves'),
        ]);
        const menteeCount = menteesRes.status === 'fulfilled' ? (menteesRes.value.data.total || 0) : 0;
        const pendingCount = leavesRes.status === 'fulfilled' ? (leavesRes.value.data.leaves?.length || 0) : 0;
        setStats({ mentees: menteeCount, subjects: 4, pending: pendingCount });
      } catch {
        // Keep defaults
      }
    };
    fetchStats();
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
    { name: 'Leave Approval', desc: 'Review student leaves', icon: <CheckSquare className="w-6 h-6"/>, color: 'from-teal-500 to-teal-600', path: '/faculty/leaves' },
    { name: 'Broadcast', desc: 'Notify your class', icon: <Bell className="w-6 h-6"/>, color: 'from-rose-500 to-rose-600', path: '/faculty/broadcast' },
    { name: 'Mentees', desc: 'Your 25-30 students', icon: <UserCheck className="w-6 h-6"/>, color: 'from-violet-500 to-violet-600', path: '/faculty/mentees' },
    { name: 'Office Hours', desc: 'Set meeting slots', icon: <Clock className="w-6 h-6"/>, color: 'from-cyan-500 to-cyan-600', path: '/faculty/meetings' },
    { name: 'Resources', desc: 'Upload notes/PPTs', icon: <Upload className="w-6 h-6"/>, color: 'from-orange-500 to-orange-600', path: '/faculty/resources' },
  ];

  // ── Academic Management ──
  const academicFeatures = [
    { name: 'Question Bank', desc: 'Upload & manage PYQs', icon: <FileText className="w-5 h-5 text-blue-600"/>, color: 'bg-blue-100', path: '/faculty/question-bank' },
    { name: 'Mock Tests', desc: 'Create practice tests', icon: <BarChart3 className="w-5 h-5 text-rose-600"/>, color: 'bg-rose-100', path: '/faculty/mock-tests-manage' },
    { name: 'Syllabus Tracker', desc: 'Mark curriculum progress', icon: <ClipboardList className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/faculty/syllabus-tracker' },
    { name: 'Assignment Grader', desc: 'Grade student uploads', icon: <CheckSquare className="w-5 h-5 text-purple-600"/>, color: 'bg-purple-100', path: '/faculty/grader' },
    { name: 'Report Generator', desc: 'Export to PDF/Excel', icon: <BookOpen className="w-5 h-5 text-amber-600"/>, color: 'bg-amber-100', path: '/faculty/reports' },
    { name: 'Student Performance', desc: 'Analytics dashboard', icon: <Target className="w-5 h-5 text-cyan-600"/>, color: 'bg-cyan-100', path: '/faculty/student-performance' },
    { name: 'Attendance Disputes', desc: 'Resolve marked errors', icon: <AlertTriangle className="w-5 h-5 text-rose-600"/>, color: 'bg-rose-100', path: '/faculty/discrepancies' },
  ];

  // ── Campus Quick Access ──
  const campusFeatures = [
    { name: 'Canteen', icon: <Coffee className="w-5 h-5 text-orange-600"/>, color: 'bg-orange-100', path: '/campus/canteen' },
    { name: 'Indoor Map', icon: <MapPin className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/campus/map' },
    { name: 'Events & Fests', icon: <Calendar className="w-5 h-5 text-pink-600"/>, color: 'bg-pink-100', path: '/campus/events' },
    { name: 'Notice Board', icon: <Bell className="w-5 h-5 text-red-600"/>, color: 'bg-red-100', path: '/campus/notices' },
    { name: 'Anon Feedback', icon: <MessageSquare className="w-5 h-5 text-purple-600"/>, color: 'bg-purple-100', path: '/campus/feedback' },
    { name: 'Health Center', icon: <Heart className="w-5 h-5 text-red-600"/>, color: 'bg-red-100', path: '/utility/health' },
    { name: 'Emergency', icon: <AlertTriangle className="w-5 h-5 text-red-700"/>, color: 'bg-red-50', path: '/utility/emergency' },
    { name: 'Sync & Offline', icon: <RefreshCw className="w-5 h-5 text-slate-600"/>, color: 'bg-slate-100', path: '/utility/sync' },
  ];

  // ── Career Management (Faculty adds/manages) ──
  const careerFeatures = [
    { name: 'Job Portal', desc: 'Post placement drives', icon: <Briefcase className="w-5 h-5 text-emerald-600"/>, color: 'bg-emerald-100', path: '/career/jobs' },
    { name: 'Interview Schedule', desc: 'Manage rounds', icon: <Clock className="w-5 h-5 text-violet-600"/>, color: 'bg-violet-100', path: '/career/interviews' },
    { name: 'Company Prep', desc: 'Add prep material', icon: <FileText className="w-5 h-5 text-blue-600"/>, color: 'bg-blue-100', path: '/career/prep' },
    { name: 'Internships', desc: 'Track student internships', icon: <PenTool className="w-5 h-5 text-teal-600"/>, color: 'bg-teal-100', path: '/career/internships' },
    { name: 'Mock Tests', desc: 'Create aptitude tests', icon: <BarChart3 className="w-5 h-5 text-rose-600"/>, color: 'bg-rose-100', path: '/career/mock-tests' },
  ];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 pt-12 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg">{(user.first_name || 'F')[0]}</div>
            <div>
              <h1 className="text-xl font-bold text-white">Faculty Hub</h1>
              <p className="text-xs text-slate-400">Welcome, {facultyName}</p>
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
      <div className="flex gap-1 px-4 mt-4 bg-white rounded-2xl mx-4 p-1 shadow-sm border border-slate-100">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${activeTab === t.key ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.icon}{t.label}
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
              {dashboardFeatures.map((f, i) => (
                <button key={i} onClick={() => navigate(f.path)}
                  className={`bg-gradient-to-br ${f.color} rounded-[20px] p-4 flex flex-col items-start gap-2 text-white shadow-md hover:shadow-lg active:scale-95 transition-all text-left`}>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">{f.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold">{f.name}</h3>
                    <p className="text-[10px] text-white/70">{f.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ACADEMIC TAB */}
        {activeTab === 'academic' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Academic Management</h2>
            <div className="flex flex-col gap-3">
              {academicFeatures.map((f, i) => (
                <button key={i} onClick={() => navigate(f.path)}
                  className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left">
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center shrink-0`}>{f.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                    <p className="text-[11px] text-slate-500">{f.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300"/>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CAMPUS TAB */}
        {activeTab === 'campus' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Campus Quick Access</h2>
            <div className="grid grid-cols-2 gap-3">
              {campusFeatures.map((f, i) => (
                <button key={i} onClick={() => navigate(f.path)}
                  className="bg-white rounded-[20px] p-4 flex items-center gap-3 shadow-sm border border-slate-100 hover:shadow-md active:scale-95 transition-all text-left">
                  <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center shrink-0`}>{f.icon}</div>
                  <span className="text-xs font-bold text-slate-800">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CAREER TAB */}
        {activeTab === 'career' && (
          <div className="animate-slide-up">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Placement & Career Management</h2>
            <div className="flex flex-col gap-3">
              {careerFeatures.map((f, i) => (
                <button key={i} onClick={() => navigate(f.path)}
                  className="bg-white rounded-[20px] p-4 flex items-center gap-4 shadow-sm border border-slate-100 hover:shadow-md active:scale-[0.98] transition-all text-left">
                  <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center shrink-0`}>{f.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{f.name}</h3>
                    <p className="text-[11px] text-slate-500">{f.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300"/>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav/>
    </div>
  );
};

export default FacultyHub;
