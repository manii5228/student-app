import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Calendar, Clock, MapPin, AlertTriangle, 
  ChevronDown, ChevronUp, Upload, BookOpen, Sparkles, 
  Download, ExternalLink, HelpCircle, FileSpreadsheet, Check
} from 'lucide-react';
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
  building?: string | null;
  exam_type: string;
}

// Sub-component for individual ticking timers in the sheet
const ExamTimer = ({ targetDate, startTime }: { targetDate: string; startTime: string }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(`${targetDate}T${startTime}`).getTime();
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

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate, startTime]);

  if (!timeLeft) {
    return (
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-center">
        <span className="text-xs font-bold text-rose-600">Exam has already started or concluded.</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      <div className="bg-slate-900 rounded-2xl p-3 flex flex-col items-center border border-slate-800">
        <span className="text-2xl font-black text-white">{timeLeft.days}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Days</span>
      </div>
      <div className="bg-slate-900 rounded-2xl p-3 flex flex-col items-center border border-slate-800">
        <span className="text-2xl font-black text-white">{timeLeft.hours}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Hours</span>
      </div>
      <div className="bg-slate-900 rounded-2xl p-3 flex flex-col items-center border border-slate-800">
        <span className="text-2xl font-black text-white">{timeLeft.minutes}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Mins</span>
      </div>
      <div className="bg-slate-900 rounded-2xl p-3 flex flex-col items-center border border-slate-800">
        <span className="text-2xl font-black text-rose-500">{timeLeft.seconds}</span>
        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Secs</span>
      </div>
    </div>
  );
};

const ExamSchedule = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  
  // Custom timer sheet modal
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // Coordinator Accordion
  const [showCoordinatorPortal, setShowCoordinatorPortal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [portalSuccess, setPortalSuccess] = useState<string | null>(null);
  
  // AI Bot alert
  const [botConsultMsg, setBotConsultMsg] = useState(false);

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
      case 'today': return 'border-rose-300 bg-rose-50/50';
      case 'soon': return 'border-amber-200 bg-amber-50/30';
      case 'past': return 'border-slate-200 bg-slate-50 opacity-60';
      default: return 'border-slate-100 bg-white';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'today': return <span className="text-[9px] font-black px-2 py-0.5 bg-rose-600 text-white rounded-md uppercase">Today</span>;
      case 'soon': return <span className="text-[9px] font-black px-2 py-0.5 bg-amber-500 text-white rounded-md uppercase">Soon</span>;
      case 'past': return <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md uppercase">Done</span>;
      default: return null;
    }
  };

  const examTypeLabel = (t: string) => {
    switch (t) {
      case 'cat1': return 'CAT-1';
      case 'cat2': return 'CAT-2';
      case 'midterm': case 'mid_semester': return 'Mid-Term Exam';
      case 'unit': case 'unit_test': return 'Unit Test';
      case 'model': case 'model_exam': return 'Model Exam';
      case 'end_semester': return 'End Semester';
      default: return t.replace('_', ' ').toUpperCase();
    }
  };

  const upcomingCount = exams.filter(e => {
    const s = getExamStatus(e.exam_date);
    return s === 'today' || s === 'soon' || s === 'upcoming';
  }).length;

  // Coordinator file drop zone actions
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handlePortalSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setParsing(true);
    setParseProgress(0);

    const connectionMode = localStorage.getItem('connection_mode') || 'mock';

    if (connectionMode === 'live') {
      try {
        const formData = new FormData();
        formData.append('file', selectedFiles[0]);
        
        // Simulating upload progress
        const interval = setInterval(() => {
          setParseProgress(prev => Math.min(prev + 15, 90));
        }, 150);
        
        await api.post('/academic/exams/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        
        clearInterval(interval);
        setParseProgress(100);
        setPortalSuccess("Timetable spreadsheet uploaded and parsed successfully on Flask backend!");
        fetchExams();
        setSelectedFiles([]);
      } catch (err: any) {
        console.error("Failed to upload schedule spreadsheet", err);
        alert(err.response?.data?.error || "Failed to upload timetable spreadsheet.");
      } finally {
        setParsing(false);
      }
    } else {
      // Mock Standalone mode simulation
      const interval = setInterval(() => {
        setParseProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 25;
        });
      }, 300);

      setTimeout(() => {
        clearInterval(interval);
        
        const newParsedExams: Exam[] = [
          {
            id: `coord_mid_${Date.now()}`,
            subject_code: 'CS301',
            subject_name: 'Data Structures',
            department: 'CSE',
            semester: 4,
            exam_date: new Date(Date.now() + 10 * 864e5).toISOString().split('T')[0],
            start_time: '10:00:00',
            end_time: '12:00:00',
            room_number: 'LH-101',
            exam_type: 'midterm'
          },
          {
            id: `coord_unit_${Date.now()}`,
            subject_code: 'CS302',
            subject_name: 'Digital Logic',
            department: 'CSE',
            semester: 4,
            exam_date: new Date(Date.now() + 5 * 864e5).toISOString().split('T')[0],
            start_time: '14:00:00',
            end_time: '15:30:00',
            room_number: 'LH-102',
            exam_type: 'unit'
          },
          {
            id: `coord_model_${Date.now()}`,
            subject_code: 'CS303',
            subject_name: 'Operating Systems',
            department: 'CSE',
            semester: 4,
            exam_date: new Date(Date.now() + 15 * 864e5).toISOString().split('T')[0],
            start_time: '09:30:00',
            end_time: '12:30:00',
            room_number: 'LH-103',
            exam_type: 'model'
          }
        ];

        setExams(prev => {
          const codes = newParsedExams.map(pe => pe.subject_code);
          const filteredPrev = prev.filter(e => !codes.includes(e.subject_code));
          return [...filteredPrev, ...newParsedExams].sort((a, b) => 
            new Date(`${a.exam_date}T${a.start_time}`).getTime() - new Date(`${b.exam_date}T${b.start_time}`).getTime()
          );
        });

        setParsing(false);
        setPortalSuccess("Timetable roster spreadsheet parsed! Imported 3 scheduled slots (Midterm, Unit Test, Model Exam).");
        setSelectedFiles([]);
        setParseProgress(0);
      }, 1500);
    }
  };

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
            <h1 className="text-xl font-bold text-white tracking-tight">Exam Timelines</h1>
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
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Timetable Slots</h3>
            
            {exams.map((exam) => {
              const status = getExamStatus(exam.exam_date);
              return (
                <div 
                  key={exam.id} 
                  onClick={() => setSelectedExam(exam)}
                  className={`rounded-[24px] p-5 shadow-sm border flex gap-4 transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer active:scale-95 duration-155 ${getStatusStyle(status)}`}
                >
                  {/* Date Block */}
                  <div className="shrink-0 w-16 flex flex-col items-center justify-center">
                    <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${
                      status === 'today' ? 'bg-rose-600 text-white' : 
                      status === 'soon' ? 'bg-amber-500 text-white' : 
                      'bg-slate-100 text-slate-700'
                    }`}>
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

                    <div className="flex flex-wrap items-center gap-2.5 mt-3">
                      <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {exam.start_time.slice(0, 5)} – {exam.end_time.slice(0, 5)}
                      </span>
                      {exam.room_number && (
                        <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          Rm {exam.room_number}
                        </span>
                      )}
                      <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-600 rounded-lg uppercase">
                        {examTypeLabel(exam.exam_type)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dynamic Coordinator Timetable Upload Accordion */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mt-4 overflow-hidden">
          <button 
            onClick={() => setShowCoordinatorPortal(!showCoordinatorPortal)}
            className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:bg-slate-50/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-bold text-slate-950">Coordinator Timetable Portal</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Parse & publish exam rosters from XLS/PDF sheets</p>
              </div>
            </div>
            {showCoordinatorPortal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showCoordinatorPortal && (
            <div className="p-5 border-t border-slate-50 bg-slate-50/40 flex flex-col gap-4 animate-fade-in">
              {portalSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex gap-3 text-xs font-bold shadow-sm">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{portalSuccess}</span>
                </div>
              )}

              {!parsing ? (
                <div className="flex flex-col gap-3">
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      dragActive ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <Upload className="w-7 h-7 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700">Drag & Drop Excel/PDF schedule</p>
                      <p className="text-[10px] text-slate-400 mt-1">Accepts CSV, XLSX, PDF (Max 8MB)</p>
                      <input type="file" className="hidden" accept=".csv,.xlsx,.pdf" onChange={handleFileChange} />
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="bg-white rounded-xl p-3 border border-slate-100 text-xs flex items-center justify-between font-bold text-slate-700">
                      <div className="flex items-center gap-2 truncate">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="truncate">{selectedFiles[0].name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{(selectedFiles[0].size / 1024).toFixed(1)} KB</span>
                    </div>
                  )}

                  <button 
                    disabled={selectedFiles.length === 0}
                    onClick={handlePortalSubmit}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-2xl text-xs font-black shadow hover:bg-slate-800 transition-all disabled:opacity-50"
                  >
                    ⚡ Extract & Merge Timetable Slots
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <span className="w-7 h-7 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                  <p className="text-[11px] font-bold text-slate-500">Parsing schedule roster ({parseProgress}%)...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Exam Timetable Sheet */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4" onClick={() => setSelectedExam(null)}>
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl animate-scale-in relative border border-slate-100" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedExam(null)} 
              className="absolute top-6 right-6 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold hover:bg-slate-200 transition-colors"
            >
              ✕
            </button>
            
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1.5">Exam Timetable Details</p>
            <h3 className="text-xl font-black text-slate-950 pr-8 leading-tight">{selectedExam.subject_name}</h3>
            <p className="text-xs text-slate-500 font-bold mt-1.5">{selectedExam.subject_code} · {examTypeLabel(selectedExam.exam_type)}</p>

            {/* Exam info summary */}
            <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex flex-col gap-3.5 mt-5">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-800">{new Date(selectedExam.exam_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Time:</span>
                <span className="text-slate-800">{selectedExam.start_time.slice(0, 5)} – {selectedExam.end_time.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Room Location:</span>
                <span className="text-slate-800">{selectedExam.room_number || "To be allocated"}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Building:</span>
                <span className="text-slate-800">{selectedExam.building || "Main Block"}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
};

export default ExamSchedule;
