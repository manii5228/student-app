import React, { useState } from 'react';
import { ChevronLeft, Search, MessageSquare, ChevronDown, ChevronUp, Plus, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Question { id:string; question_text:string; category:string; year:number|null; company_name:string; upvotes:number; }

const CompanyPrep = () => {
  const nav = useNavigate();
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedQ, setExpandedQ] = useState<string|null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newCategory, setNewCategory] = useState('technical');
  const [newYear, setNewYear] = useState('');

  const popular = ['Google', 'TCS', 'Infosys', 'Wipro', 'Amazon', 'Microsoft', 'Zoho', 'Cognizant'];

  const search = async (c?: string) => {
    const q = c || company;
    if (!q.trim()) return;
    setLoading(true); setSearched(true);
    try {
      const { data } = await api.get(`/career/prep/${encodeURIComponent(q)}`);
      setQuestions(data.questions || []);
    } catch {}
    setLoading(false);
  };

  const catColors: Record<string,string> = { technical:'bg-blue-100 text-blue-700', aptitude:'bg-amber-100 text-amber-700', hr:'bg-pink-100 text-pink-700' };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          await api.post(`/career/prep/question/${id}/upvote`);
          setQuestions(questions.map(q => q.id === id ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q));
      } catch (err) {}
  };

  const handleAddQuestion = async () => {
      if (!newQuestionText.trim() || !company) return;
      try {
          const res = await api.post(`/career/prep/${encodeURIComponent(company)}/question`, {
              question_text: newQuestionText,
              category: newCategory,
              year: newYear ? parseInt(newYear) : null
          });
          setQuestions([res.data.question, ...questions]);
          setShowAddModal(false);
          setNewQuestionText('');
      } catch (err) {}
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={()=>nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"><ChevronLeft className="w-5 h-5 text-white"/></button>
          <div><h1 className="text-xl font-bold text-white">Company Prep</h1><p className="text-xs text-blue-200">Previous years' interview questions</p></div>
        </div>
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl flex items-center gap-2 px-4 py-3 relative z-10">
          <Search className="w-4 h-4 text-white/70 shrink-0"/>
          <input value={company} onChange={e=>setCompany(e.target.value)} onKeyDown={e=>e.key==='Enter'&&search()} placeholder="Search company..." className="bg-transparent text-white text-sm font-medium placeholder:text-white/50 flex-1 outline-none"/>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!searched && <>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Popular Companies</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {popular.map(c=>(
              <button key={c} onClick={()=>{setCompany(c);search(c);}} className="px-4 py-2 bg-white rounded-2xl text-sm font-bold text-slate-700 shadow-sm border border-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all active:scale-95">{c}</button>
            ))}
          </div>
          <div className="text-center py-10">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <p className="text-sm text-slate-500">Search a company to see interview questions from previous years</p>
          </div>
        </>}

        {searched && (loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span></div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
            <h2 className="text-lg font-bold text-slate-900">No Questions Found</h2>
            <p className="text-sm text-slate-500 mt-1">No data for "{company}" yet. Try another company.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            <div className="flex justify-between items-center">
              <p className="text-xs font-bold text-slate-400">{questions.length} questions found</p>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                  <Plus className="w-3 h-3" /> Add
              </button>
            </div>
            {questions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-hidden">
                <button onClick={()=>setExpandedQ(expandedQ===q.id?null:q.id)} className="w-full p-4 text-left flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{idx+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 leading-relaxed">{q.question_text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${catColors[q.category]||'bg-slate-100 text-slate-500'}`}>{q.category}</span>
                        {q.year && <span className="text-[10px] font-bold text-slate-400">{q.year}</span>}
                      </div>
                      <button onClick={(e) => handleUpvote(q.id, e)} className="flex items-center gap-1 text-slate-400 hover:text-blue-500 bg-slate-50 px-2 py-1 rounded-full text-[10px] font-bold">
                          <ThumbsUp className="w-3 h-3" /> {q.upvotes || 0}
                      </button>
                    </div>
                  </div>
                  {expandedQ===q.id?<ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-1"/>:<ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-1"/>}
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Add Question Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">Add Question for {company}</h3>
                  <textarea value={newQuestionText} onChange={(e) => setNewQuestionText(e.target.value)} placeholder="Type the question..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium mb-4 outline-none h-24 resize-none" />
                  <div className="flex gap-2 mb-4">
                      <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none">
                          <option value="technical">Technical</option>
                          <option value="aptitude">Aptitude</option>
                          <option value="hr">HR</option>
                      </select>
                      <input type="number" value={newYear} onChange={(e) => setNewYear(e.target.value)} placeholder="Year (e.g. 2023)" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-700 outline-none" />
                  </div>
                  <div className="flex gap-3 mt-6">
                      <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
                      <button onClick={handleAddQuestion} disabled={!newQuestionText.trim()} className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 rounded-2xl disabled:opacity-50">Add Question</button>
                  </div>
              </div>
          </div>
      )}
      <BottomNav/>
    </div>
  );
};
export default CompanyPrep;
