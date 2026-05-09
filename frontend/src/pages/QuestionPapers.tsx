import React, { useState } from 'react';
import { ChevronLeft, Search, Download, Filter, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

// Mock PYQ data (production: /api/v1/academic/question-papers)
const MOCK_PAPERS = [
  { id: '1', subject_code: 'CS301', subject_name: 'Data Structures', year: 2025, exam_type: 'end_semester', download_count: 1240 },
  { id: '2', subject_code: 'CS301', subject_name: 'Data Structures', year: 2024, exam_type: 'end_semester', download_count: 890 },
  { id: '3', subject_code: 'CS301', subject_name: 'Data Structures', year: 2024, exam_type: 'cat2', download_count: 456 },
  { id: '4', subject_code: 'CS302', subject_name: 'Digital Logic', year: 2025, exam_type: 'end_semester', download_count: 1105 },
  { id: '5', subject_code: 'CS302', subject_name: 'Digital Logic', year: 2024, exam_type: 'end_semester', download_count: 780 },
  { id: '6', subject_code: 'MA301', subject_name: 'Mathematics III', year: 2025, exam_type: 'end_semester', download_count: 2100 },
  { id: '7', subject_code: 'MA301', subject_name: 'Mathematics III', year: 2025, exam_type: 'cat1', download_count: 650 },
  { id: '8', subject_code: 'CS303', subject_name: 'Operating Systems', year: 2025, exam_type: 'end_semester', download_count: 950 },
  { id: '9', subject_code: 'CS303', subject_name: 'Operating Systems', year: 2023, exam_type: 'end_semester', download_count: 520 },
  { id: '10', subject_code: 'HU301', subject_name: 'English', year: 2025, exam_type: 'end_semester', download_count: 310 },
];

const YEARS = [2025, 2024, 2023, 2022];
const EXAM_TYPES = ['all', 'end_semester', 'cat1', 'cat2'];

const QuestionPapers = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState('all');
  const [downloading, setDownloading] = useState<string | null>(null);

  const filtered = MOCK_PAPERS.filter(p => {
    const matchSearch = !search || 
      p.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      p.subject_code.toLowerCase().includes(search.toLowerCase());
    const matchYear = !selectedYear || p.year === selectedYear;
    const matchType = selectedType === 'all' || p.exam_type === selectedType;
    return matchSearch && matchYear && matchType;
  });

  // Group by subject
  const grouped = filtered.reduce<Record<string, typeof MOCK_PAPERS>>((acc, paper) => {
    const key = `${paper.subject_code} - ${paper.subject_name}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(paper);
    return acc;
  }, {});

  const handleDownload = (paperId: string) => {
    setDownloading(paperId);
    // Simulate CDN download
    setTimeout(() => {
      setDownloading(null);
    }, 1500);
  };

  const examTypeLabel = (t: string) => {
    switch (t) {
      case 'end_semester': return 'End Sem';
      case 'cat1': return 'CAT-1';
      case 'cat2': return 'CAT-2';
      default: return t;
    }
  };

  const examTypeColor = (t: string) => {
    switch (t) {
      case 'end_semester': return 'bg-indigo-100 text-indigo-700';
      case 'cat1': return 'bg-amber-100 text-amber-700';
      case 'cat2': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col font-sans animate-fade-in relative pb-24">

      {/* Header */}
      <div className="bg-purple-600 rounded-b-[40px] p-6 pt-12">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/academic')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Question Papers</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/15 text-white placeholder:text-purple-200 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:bg-white/25 transition-colors"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-white">{MOCK_PAPERS.length}</p>
            <p className="text-[10px] font-bold text-purple-100 uppercase">Total Papers</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-white">{new Set(MOCK_PAPERS.map(p => p.subject_code)).size}</p>
            <p className="text-[10px] font-bold text-purple-100 uppercase">Subjects</p>
          </div>
          <div className="flex-1 bg-white/15 rounded-2xl p-3 text-center">
            <p className="text-lg font-black text-white">{(MOCK_PAPERS.reduce((s, p) => s + p.download_count, 0) / 1000).toFixed(1)}k</p>
            <p className="text-[10px] font-bold text-purple-100 uppercase">Downloads</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 mt-6">
        {/* Year Filter */}
        <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
          <button onClick={() => setSelectedYear(null)}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${!selectedYear ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
            All Years
          </button>
          {YEARS.map(y => (
            <button key={y} onClick={() => setSelectedYear(selectedYear === y ? null : y)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedYear === y ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {y}
            </button>
          ))}
        </div>

        {/* Exam Type Filter */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {EXAM_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedType(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 capitalize transition-all ${selectedType === t ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-600'}`}>
              {t === 'all' ? 'All Types' : examTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-6 mt-4 flex-1 overflow-y-auto">
        {Object.keys(grouped).length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No papers found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([subject, papers]) => (
            <div key={subject} className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-2">{subject}</h3>
              <div className="flex flex-col gap-2">
                {papers.map(paper => (
                  <div key={paper.id} className="bg-slate-50 rounded-[20px] p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${examTypeColor(paper.exam_type)}`}>
                          {examTypeLabel(paper.exam_type)}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {paper.year}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {paper.download_count.toLocaleString()} downloads
                      </p>
                    </div>
                    <button onClick={() => handleDownload(paper.id)} disabled={downloading === paper.id}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        downloading === paper.id 
                          ? 'bg-purple-100 text-purple-400' 
                          : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                      }`}>
                      {downloading === paper.id ? (
                        <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin"></span>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default QuestionPapers;
