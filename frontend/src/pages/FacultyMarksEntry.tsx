import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Save, Search, CheckCircle2, AlertTriangle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

const SUBJECTS = [
  { code: 'CS301', name: 'Data Structures' },
  { code: 'CS302', name: 'Digital Logic' },
  { code: 'CS303', name: 'Operating Systems' },
  { code: 'CS304', name: 'Database Management Systems' },
  { code: 'CS305', name: 'Software Engineering' },
];

const EXAMS = {
  cat1: { label: 'CAT 1', max: 50 },
  cat2: { label: 'CAT 2', max: 50 },
  model: { label: 'Model Exam', max: 100 },
  lab: { label: 'Lab Internals', max: 100 },
  end_sem: { label: 'End Semester', max: 100 },
};

type ExamKey = keyof typeof EXAMS;

interface StudentMark {
  id: string;
  name: string;
  roll_number: string;
  marks: number | null;
}

const FacultyMarksEntry = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [selectedSubjectCode, setSelectedSubjectCode] = useState('CS301');
  const [selectedSubjectName, setSelectedSubjectName] = useState('Data Structures');
  const [selectedExam, setSelectedExam] = useState<ExamKey>('cat1');
  const [maxMarks, setMaxMarks] = useState(50);

  const [students, setStudents] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Refs for timer callback
  const studentsRef = useRef(students);
  const dirtyRef = useRef(dirty);
  const subjectCodeRef = useRef(selectedSubjectCode);
  const subjectNameRef = useRef(selectedSubjectName);
  const examRef = useRef(selectedExam);
  const maxMarksRef = useRef(maxMarks);

  useEffect(() => {
    studentsRef.current = students;
    dirtyRef.current = dirty;
    subjectCodeRef.current = selectedSubjectCode;
    subjectNameRef.current = selectedSubjectName;
    examRef.current = selectedExam;
    maxMarksRef.current = maxMarks;
  }, [students, dirty, selectedSubjectCode, selectedSubjectName, selectedExam, maxMarks]);

  // Fetch student class marks when subject or exam changes
  useEffect(() => {
    let active = true;
    const fetchClassMarks = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/academic/internal-marks/class', {
          params: {
            subject_code: selectedSubjectCode,
            test_type: selectedExam
          }
        });
        if (active) {
          setStudents(data.students || []);
          setDirty(false);
        }
      } catch (err) {
        console.error("Failed to fetch class marks:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchClassMarks();
    return () => { active = false; };
  }, [selectedSubjectCode, selectedExam]);

  // Auto-Save interval (Every 5 seconds if dirty and has no validation errors)
  useEffect(() => {
    const interval = setInterval(() => {
      const hasErrors = studentsRef.current.some(s => s.marks !== null && (s.marks > maxMarksRef.current || s.marks < 0));
      if (dirtyRef.current && !hasErrors) {
        handleSave(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMarksChange = (id: string, val: string) => {
    const num = val === '' ? null : Number(val);
    setStudents(prev => prev.map(s => s.id === id ? { ...s, marks: num } : s));
    setDirty(true);
  };

  const handleSave = async (isAuto = false) => {
    // Check validation errors before saving
    const hasErrors = studentsRef.current.some(s => s.marks !== null && (s.marks > maxMarksRef.current || s.marks < 0));
    if (hasErrors) return;

    if (isAuto && !dirtyRef.current) return;
    
    setSaving(true);
    try {
      const records = studentsRef.current.map(s => ({
        student_id: s.id,
        subject_code: subjectCodeRef.current,
        subject_name: subjectNameRef.current,
        semester: user.semester || 4,
        test_type: examRef.current,
        max_marks: maxMarksRef.current,
        marks: s.marks
      }));
      
      await api.post('/academic/internal-marks/bulk', { records });
      setDirty(false);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Failed to save internal marks:", err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.roll_number && s.roll_number.toLowerCase().includes(search.toLowerCase()))
  );

  const hasErrors = students.some(s => s.marks !== null && (s.marks > maxMarks || s.marks < 0));

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-32">

      {/* Header */}
      <div className="bg-emerald-600 p-6 pt-12 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Internal Marks</h1>
              <p className="text-xs text-emerald-100">Internal Marks • {user.department || 'N/A'}-{user.section || 'N/A'} • Sem {user.semester || 'N/A'}</p>
            </div>
          </div>
          
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2">
            {saving ? (
              <span className="text-xs font-bold text-emerald-100 bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-100 border-t-transparent rounded-full animate-spin"></span>
                Saving...
              </span>
            ) : dirty ? (
              <span className="text-xs font-bold text-amber-200 bg-black/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                Unsaved
              </span>
            ) : lastSaved && (
              <span className="text-xs font-bold text-emerald-100 bg-black/10 px-3 py-1.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          <div>
            <label className="text-[10px] font-bold text-emerald-100 uppercase mb-1 block">Subject</label>
            <select
              value={selectedSubjectCode}
              onChange={e => {
                const code = e.target.value;
                const found = SUBJECTS.find(s => s.code === code);
                setSelectedSubjectCode(code);
                if (found) setSelectedSubjectName(found.name);
              }}
              className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-colors cursor-pointer shadow-sm"
            >
              {SUBJECTS.map(s => (
                <option key={s.code} value={s.code} className="text-slate-800 font-medium">{s.code} - {s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-emerald-100 uppercase mb-1 block">Exam Type</label>
            <select
              value={selectedExam}
              onChange={e => {
                const val = e.target.value as ExamKey;
                setSelectedExam(val);
                setMaxMarks(EXAMS[val].max);
              }}
              className="w-full bg-slate-50 text-slate-900 rounded-xl px-3 py-2.5 text-xs font-bold border border-slate-350 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 transition-colors cursor-pointer shadow-sm"
            >
              {Object.entries(EXAMS).map(([key, info]) => (
                <option key={key} value={key} className="text-slate-800 font-medium">{info.label} (Max {info.max})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-200" />
          <input
            type="text"
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/15 text-white placeholder:text-emerald-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Grid List */}
      <div className="p-4 flex-1 overflow-y-auto pb-20">
        {hasErrors && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex gap-2.5 items-center mb-4 text-xs font-bold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <p>Some marks exceed the maximum allowed ({maxMarks}) or are negative. Please correct them to enable saving.</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
            <p className="text-xs font-bold text-slate-500">Loading student marks...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-sm font-bold text-slate-500">No students found</p>
            <p className="text-xs text-slate-400 mt-1">Make sure students exist in department {user.department}, semester {user.semester}, section {user.section}.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Table Header */}
            <div className="flex px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
              <div className="flex-[2]">Student</div>
              <div className="flex-1 text-center">Marks (Max {maxMarks})</div>
            </div>
            
            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {filtered.map(s => {
                const isInvalid = s.marks !== null && (s.marks > maxMarks || s.marks < 0);
                return (
                  <div key={s.id} className="flex items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                    <div className="flex-[2]">
                      <p className="text-sm font-bold text-slate-800">{s.name}</p>
                      <p className="text-[10px] font-mono font-bold text-slate-400">{s.roll_number || 'No Roll Number'}</p>
                    </div>
                    <div className="flex-1 flex justify-center">
                      <input 
                        type="number"
                        value={s.marks === null ? '' : s.marks}
                        onChange={(e) => handleMarksChange(s.id, e.target.value)}
                        placeholder="--"
                        className={`w-16 h-10 text-center rounded-xl font-bold text-sm outline-none transition-all ${
                          isInvalid
                            ? 'bg-rose-50 border-2 border-rose-500 text-rose-900 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                            : s.marks !== null && dirty 
                              ? 'bg-amber-50 border-2 border-amber-400 text-amber-900 shadow-[0_0_10px_rgba(251,191,36,0.3)]' 
                              : s.marks !== null 
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                                : 'bg-slate-100 border border-transparent text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 ring-emerald-500/10'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manual Save Button (for immediate save) */}
      <div className="fixed bottom-[88px] right-6">
        <button 
          onClick={() => handleSave(false)}
          disabled={!dirty || saving || hasErrors}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            dirty && !hasErrors
              ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 active:scale-95' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-6 h-6" />
        </button>
      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyMarksEntry;
