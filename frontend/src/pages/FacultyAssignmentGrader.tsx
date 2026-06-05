import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, CheckCircle, Star, Palette, Trash, AlertTriangle, ShieldCheck, PenTool, Edit3, ClipboardList, CheckCircle2, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Submission { 
  id: string; 
  student: string; 
  roll: string; 
  title: string; 
  submitted_at: string; 
  status: 'pending' | 'graded'; 
  marks?: number; 
  comment?: string; 
  plagiarism: number; 
  matchWith?: string;
}

const FacultyAssignmentGrader = () => {
  const nav = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState<string | null>(null);
  const [gradeForm, setGradeForm] = useState({ marks: '', comment: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('pending');

  // Bulk Grading Mode state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkMarks, setBulkMarks] = useState<Record<string, string>>({});
  const [bulkComments, setBulkComments] = useState<Record<string, string>>({});
  const [bulkDefaultMarks, setBulkDefaultMarks] = useState('8');
  const [savingBulk, setSavingBulk] = useState(false);

  // Annotation Canvas states
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('red');
  const [lineWidth, setLineWidth] = useState(3);

  // Rubric state
  const [rubric, setRubric] = useState({
    codeQuality: 0,
    logic: 0,
    testing: 0,
    docs: 0
  });

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/faculty/assignments/submissions');
      if (data && data.submissions) {
        setSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Failed to load submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  // Setup drawing context
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSelectGrading = (sub: Submission) => {
    setGrading(sub.id);
    setGradeForm({ marks: sub.marks ? String(sub.marks) : '', comment: sub.comment || '' });
    setRubric({ codeQuality: 0, logic: 0, testing: 0, docs: 0 });
  };

  const updateRubricScore = (key: 'codeQuality' | 'logic' | 'testing' | 'docs', val: number) => {
    const updated = { ...rubric, [key]: val };
    setRubric(updated);
    
    // Sum standard max is 20, map to 10 scale
    const total = updated.codeQuality + updated.logic + updated.testing + updated.docs;
    const scale = Math.round((total / 20) * 10);
    setGradeForm(prev => ({ ...prev, marks: String(scale) }));
  };

  const submitGrade = async (id: string) => {
    if (!gradeForm.marks) return;
    try {
      await api.post(`/faculty/assignments/submissions/${id}/grade`, {
        marks: gradeForm.marks,
        comment: gradeForm.comment
      });
      await fetchSubmissions();
      setGrading(null);
    } catch (err) {
      console.error(err);
      alert("Failed to submit grade.");
    }
  };

  const applyBulkDefault = () => {
    const updatedMarks = { ...bulkMarks };
    const updatedComments = { ...bulkComments };
    submissions.forEach(sub => {
      if (sub.status === 'pending') {
        if (!updatedMarks[sub.id]) {
          updatedMarks[sub.id] = bulkDefaultMarks;
        }
        if (!updatedComments[sub.id]) {
          updatedComments[sub.id] = 'Good effort.';
        }
      }
    });
    setBulkMarks(updatedMarks);
    setBulkComments(updatedComments);
  };

  const submitBulkGrades = async () => {
    try {
      setSavingBulk(true);
      const grades = submissions
        .filter(sub => sub.status === 'pending')
        .map(sub => ({
          id: sub.id,
          marks: bulkMarks[sub.id] || bulkDefaultMarks || '8',
          comment: bulkComments[sub.id] || 'Good effort.'
        }));

      if (grades.length === 0) {
        setIsBulkMode(false);
        return;
      }

      await api.post('/faculty/assignments/submissions/grade-bulk', { grades });
      await fetchSubmissions();
      setIsBulkMode(false);
      setBulkMarks({});
      setBulkComments({});
    } catch (err) {
      console.error(err);
      alert("Failed to save bulk grades.");
    } finally {
      setSavingBulk(false);
    }
  };

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter);
  const pendingCount = submissions.filter(s => s.status === 'pending').length;

  const activeSubmission = submissions.find(s => s.id === grading);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={() => nav('/faculty')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Assignment Grader</h1>
            <p className="text-xs text-purple-200">{pendingCount} pending submissions</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col justify-center items-center py-20">
          <span className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-2"></span>
          <span className="text-xs font-semibold text-slate-400">Loading student uploads...</span>
        </div>
      ) : !grading ? (
        <>
          {/* Mode Switcher Toggle */}
          <div className="flex justify-between items-center px-4 mt-4 shrink-0">
            <div className="flex gap-1.5 bg-slate-200/60 p-1 rounded-2xl w-full">
              <button
                onClick={() => setIsBulkMode(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  !isBulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <PenTool className="w-4 h-4" /> Single Grader
              </button>
              <button
                onClick={() => setIsBulkMode(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  isBulkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardList className="w-4 h-4" /> Bulk Grader Mode
              </button>
            </div>
          </div>

          {isBulkMode ? (
            /* BULK GRADING INTERFACE */
            <div className="flex-1 flex flex-col overflow-hidden px-4 mt-4 pb-20">
              {/* Default Score Pre-filler Card */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-3xl p-5 mb-4 shadow-sm shrink-0">
                <h3 className="text-xs font-black text-purple-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" /> Default Score Utility
                </h3>
                <p className="text-[10px] text-purple-800 font-semibold mb-3 leading-relaxed">
                  Pre-fill all empty submission marks with a default value to save time:
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-2xl px-3.5 py-2 shrink-0 shadow-sm">
                    <span className="text-xs font-black text-slate-800">Marks:</span>
                    <input 
                      type="number" 
                      min={0} 
                      max={10} 
                      value={bulkDefaultMarks} 
                      onChange={e => setBulkDefaultMarks(e.target.value)} 
                      className="w-8 text-center text-xs font-black text-purple-700 bg-transparent outline-none"
                    />
                    <span className="text-xs font-bold text-slate-400">/10</span>
                  </div>
                  
                  <button 
                    onClick={applyBulkDefault}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-3 px-4 rounded-2xl transition-all active:scale-95 shadow-sm shadow-purple-600/10"
                  >
                    Apply Default to Empty
                  </button>
                </div>
              </div>

              {/* Roster of Pending Submissions */}
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-1 shrink-0">
                Pending Submissions ({submissions.filter(s => s.status === 'pending').length})
              </h3>
              
              {submissions.filter(s => s.status === 'pending').length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-500 flex-1 flex flex-col justify-center items-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2 animate-bounce" />
                  <p className="text-sm font-bold">All Submissions Graded</p>
                  <p className="text-xs text-slate-400 mt-1">There are no pending submissions left to grade.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 hide-scrollbar">
                  {submissions.filter(s => s.status === 'pending').map((s) => (
                    <div key={s.id} className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{s.student}</h4>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.roll} • {s.submitted_at}</p>
                        </div>
                        <span className="text-[9px] font-black bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">PENDING</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 items-end">
                        <div className="col-span-1">
                          <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Marks /10</label>
                          <input 
                            type="number"
                            min={0}
                            max={10}
                            placeholder="0-10"
                            value={bulkMarks[s.id] || ''}
                            onChange={e => setBulkMarks(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs font-black text-center text-slate-800 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Feedback Remarks</label>
                          <input 
                            type="text"
                            placeholder="Good implementation..."
                            value={bulkComments[s.id] || ''}
                            onChange={e => setBulkComments(prev => ({ ...prev, [s.id]: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk approval action button */}
              {submissions.filter(s => s.status === 'pending').length > 0 && (
                <div className="fixed bottom-[84px] left-0 right-0 px-6 sm:max-w-[480px] sm:mx-auto z-40">
                  <button 
                    onClick={submitBulkGrades}
                    disabled={savingBulk}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-4 flex items-center justify-center gap-2 font-black shadow-xl shadow-purple-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {savingBulk ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Approve & Release All Marks
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ORIGINAL SINGLE EVALUATION LIST */
            <>
              <div className="flex gap-2 px-4 mt-4 shrink-0">
                {(['pending', 'graded', 'all'] as const).map(f => (
                  <button 
                    key={f} 
                    onClick={() => setFilter(f)} 
                    className={`flex-1 py-2 rounded-xl text-[11px] font-bold capitalize transition-all ${
                      filter === f ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
                <div className="flex flex-col gap-3 animate-slide-up">
                  {filtered.map(s => (
                    <div key={s.id} className="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-900">{s.student}</h3>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.roll} • {s.submitted_at}</p>
                        </div>
                        {s.status === 'graded' ? (
                          <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg">
                            <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                            <span className="text-xs font-black">{s.marks}/10</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2.5 py-1 rounded-lg uppercase">Pending</span>
                        )}
                      </div>

                      {/* Plagiarism Similarity Check Badge */}
                      <div className="mt-2.5 flex items-center gap-1.5">
                        {s.plagiarism >= 50 ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-lg">
                            <AlertTriangle className="w-3 h-3" /> MOSS Score: {s.plagiarism}% Plagiarism Alert (Match with {s.matchWith})
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
                            <ShieldCheck className="w-3 h-3" /> MOSS Score: {s.plagiarism}% Match (Safe)
                          </span>
                        )}
                      </div>

                      {s.comment && <p className="text-xs text-slate-500 mt-2.5 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">💬 {s.comment}</p>}
                      {s.status === 'pending' && (
                        <button 
                          onClick={() => handleSelectGrading(s)} 
                          className="mt-3 w-full py-2.5 bg-purple-50 text-purple-600 rounded-xl text-xs font-black hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Start Evaluation
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      ) : (
        /* GoodNotes drawing canvas + Rubric rating page */
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl p-3 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900">{activeSubmission?.student}</h3>
              <p className="text-[10px] text-slate-400 font-bold">{activeSubmission?.roll} • {activeSubmission?.title}</p>
            </div>
            <button 
              onClick={() => setGrading(null)} 
              className="text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl"
            >
              Back
            </button>
          </div>

          {/* HTML5 drawing Canvas Over Student Submission */}
          <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-md flex flex-col">
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center gap-2 text-xs">
              <span className="font-bold flex items-center gap-1"><PenTool className="w-4 h-4 text-purple-400" /> GoodNotes Annotation</span>
              <div className="flex items-center gap-2">
                {/* Draw Color picker */}
                {['red', 'blue', 'green'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setDrawColor(c)}
                    className={`w-4 h-4 rounded-full border border-white ${
                      c === 'red' ? 'bg-red-500' : c === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                    } ${drawColor === c ? 'ring-2 ring-white scale-110' : ''}`}
                  />
                ))}
                <span className="w-px h-3 bg-slate-700" />
                <button onClick={clearCanvas} className="text-[10px] bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-700 font-bold">Clear Marks</button>
              </div>
            </div>

            {/* Simulated Paper sheet */}
            <div className="relative w-full aspect-[4/3] bg-amber-50/50 flex flex-col justify-start p-6 text-xs text-slate-700 select-none">
              <h4 className="font-mono font-bold border-b border-amber-250 pb-2 mb-3 text-slate-900">#include &lt;iostream&gt; using namespace std;</h4>
              <p className="font-mono text-[10px] leading-relaxed">
                // Implementation of doubly linked list insertNode<br />
                void insertNode(Node*& head, int value) &#123;<br />
                &nbsp;&nbsp;Node* newNode = new Node(value);<br />
                &nbsp;&nbsp;if (head == nullptr) &#123; head = newNode; return; &#125;<br />
                &nbsp;&nbsp;Node* temp = head;<br />
                &nbsp;&nbsp;while(temp-&gt;next != nullptr) temp = temp-&gt;next;<br />
                &nbsp;&nbsp;temp-&gt;next = newNode;<br />
                &nbsp;&nbsp;newNode-&gt;prev = temp; // Fixed bug here<br />
                &#125;
              </p>

              {/* Draw canvas overlay */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                width={400}
                height={300}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              />
            </div>
            <p className="text-[10px] text-center text-slate-400 py-1.5 bg-slate-50 border-t border-slate-100">Draw checks, crosses, or notes directly on code above.</p>
          </div>

          {/* Clickable Rubric Summing Grid */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Evaluation Rubric (Click score to calculate final grade)</h4>
            
            <div className="flex flex-col gap-3">
              {[
                { key: 'codeQuality', label: 'Code Quality / Structure', max: 5 },
                { key: 'logic', label: 'Logic & Correctness', max: 5 },
                { key: 'testing', label: 'Testing / Edge Cases', max: 5 },
                { key: 'docs', label: 'Documentation / Comments', max: 5 },
              ].map((item) => {
                const currentScore = rubric[item.key as keyof typeof rubric];
                return (
                  <div key={item.key} className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    <div className="flex gap-1.5">
                      {Array.from({ length: item.max }, (_, i) => i + 1).map((val) => (
                        <button
                          key={val}
                          onClick={() => updateRubricScore(item.key as any, val)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                            currentScore === val 
                              ? 'bg-purple-600 text-white border-purple-650' 
                              : 'bg-slate-55 bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment & Submit Grid */}
          <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="w-28">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Marks /10</label>
                <input 
                  type="number" 
                  min={0} 
                  max={10} 
                  value={gradeForm.marks} 
                  onChange={e => setGradeForm({ ...gradeForm, marks: e.target.value })} 
                  placeholder="0" 
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-black border border-slate-200 focus:outline-none focus:border-purple-400 text-slate-800 text-center"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Feedback Remarks</label>
                <input 
                  value={gradeForm.comment} 
                  onChange={e => setGradeForm({ ...gradeForm, comment: e.target.value })} 
                  placeholder="e.g. Excellent work on doubly linked lists..." 
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-purple-400 text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => submitGrade(activeSubmission!.id)} 
                disabled={!gradeForm.marks} 
                className="flex-1 py-3.5 bg-purple-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-purple-600/20 disabled:opacity-40"
              >
                Submit Grade & Release Result
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FacultyAssignmentGrader;
