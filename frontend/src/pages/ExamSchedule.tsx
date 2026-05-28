import React, { useState, useEffect } from 'react';
import { ChevronLeft, Calendar, Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Exam {
  id: string;
  subject_code: string;
  subject_name: string;
  department: string;
  semester: number;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  exam_type: string;
}

const ExamSchedule = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data } = await api.get('/academic/exams');
      setExams(data.exams || []);
    } catch (err) {
      console.error('Failed to fetch exam schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNextExam = () => {
    if (exams.length === 0) return null;
    const now = new Date();
    const upcoming = exams.filter(e => {
      const examDateTime = new Date(`${e.exam_date}T${e.start_time}`);
      return examDateTime > now;
    });
    if (upcoming.length === 0) return null;
    return upcoming.sort((a, b) => {
      return new Date(`${a.exam_date}T${a.start_time}`).getTime() - new Date(`${b.exam_date}T${b.start_time}`).getTime();
    })[0];
  };

  const nextExam = getNextExam();

  useEffect(() => {
    if (!nextExam) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const target = new Date(`${nextExam.exam_date}T${nextExam.start_time}`).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextExam]);

  // Check if an exam is today or in the past
  const getExamStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(dateStr);
    examDate.setHours(0, 0, 0, 0);

    if (examDate.getTime() === today.getTime()) return 'today';
    if (examDate < today) return 'past';
    const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return 'soon';
    return 'upcoming';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'today': return 'border-red-300 bg-red-50/50';
      case 'soon': return 'border-amber-200 bg-amber-50/30';
      case 'past': return 'border-slate-200 bg-slate-50 opacity-60';
      default: return 'border-slate-100 bg-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'today': return <span className="text-[9px] font-black px-2 py-0.5 bg-red-600 text-white rounded-md uppercase">Today</span>;
      case 'soon': return <span className="text-[9px] font-black px-2 py-0.5 bg-amber-500 text-white rounded-md uppercase">Soon</span>;
      case 'past': return <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md uppercase">Done</span>;
      default: return null;
    }
  };

  const examTypeLabel = (t: string) => {
    switch (t) {
      case 'cat1': return 'CAT-1';
      case 'cat2': return 'CAT-2';
      case 'model': return 'Model Exam';
      case 'end_semester': return 'End Semester';
      default: return t;
    }
  };

  const upcomingCount = exams.filter(e => {
    const s = getExamStatus(e.exam_date);
    return s === 'today' || s === 'soon' || s === 'upcoming';
  }).length;

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-rose-600 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-2">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Exam Schedule</h1>
            <p className="text-xs text-rose-200">{upcomingCount} upcoming exams</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Prominent Countdown Timer Card */}
        {nextExam && timeLeft && (
          <div className="bg-slate-900 rounded-[28px] p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl"></div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">NEXT EXAM COUNTDOWN</p>
            <h2 className="text-base font-bold text-white leading-tight truncate">{nextExam.subject_name}</h2>
            <p className="text-xs text-slate-400 mt-1 font-semibold">{nextExam.subject_code} · Room {nextExam.room_number}</p>
            
            {/* Time Blocks */}
            <div className="grid grid-cols-4 gap-2 mt-5">
              <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center border border-white/5">
                <span className="text-2xl font-black text-white">{timeLeft.days}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Days</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center border border-white/5">
                <span className="text-2xl font-black text-white">{timeLeft.hours}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Hours</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center border border-white/5">
                <span className="text-2xl font-black text-white">{timeLeft.minutes}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Mins</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center border border-white/5">
                <span className="text-2xl font-black text-rose-400">{timeLeft.seconds}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Secs</span>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Exams Scheduled</h2>
            <p className="text-sm text-slate-500 mt-1">Your exam timetable will appear here once published.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {exams.map((exam) => {
              const status = getExamStatus(exam.exam_date);
              return (
                <div key={exam.id} className={`rounded-[24px] p-5 shadow-sm border flex gap-4 transition-all ${getStatusStyle(status)}`}>
                  {/* Date Block */}
                  <div className="shrink-0 w-16 flex flex-col items-center justify-center">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${status === 'today' ? 'bg-red-600 text-white' : status === 'soon' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <span className="text-lg font-black leading-none">{new Date(exam.exam_date).getDate()}</span>
                      <span className="text-[9px] font-bold uppercase">{new Date(exam.exam_date).toLocaleDateString('en-IN', { month: 'short' })}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 mt-1.5">{new Date(exam.exam_date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  </div>

                  {/* Exam Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{exam.subject_code}</p>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{exam.subject_name}</h3>
                      </div>
                      {getStatusBadge(status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.start_time} – {exam.end_time}
                      </span>
                      {exam.room_number && (
                        <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Room {exam.room_number}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                        {examTypeLabel(exam.exam_type)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default ExamSchedule;
