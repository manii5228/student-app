import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Clock, BarChart3, CheckCircle, XCircle, Trophy, AlertTriangle, Plus, Trash2, Edit, Video, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Test { 
  id: string; 
  title: string; 
  description: string | null; 
  category: string; 
  duration_minutes: number; 
  total_questions: number; 
  difficulty: string; 
}

interface Question { 
  id: string; 
  question_text: string; 
  option_a: string; 
  option_b: string; 
  option_c: string; 
  option_d: string; 
  order_num: number; 
}

interface Result { 
  question_id: string; 
  correct_option: string; 
  student_answer: string; 
  is_correct: boolean; 
  explanation: string | null; 
}

const MockTestPortal = () => {
  const nav = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastViolationTimeRef = useRef<number>(0);
  
  // Lists and loading
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState('');

  // Flashcards state
  const [subTab, setSubTab] = useState<'tests' | 'flashcards'>('tests');
  const [flashcards, setFlashcards] = useState<Array<{ id: string; front: string; back: string; category: string; isMastered: boolean }>>(() => {
    const saved = localStorage.getItem('mock_test_flashcards');
    if (saved) return JSON.parse(saved);
    return [
      { id: "mc_1", front: "What is the primary difference between TCP and UDP?", back: "TCP is connection-oriented, reliable, and guarantees packet delivery order. UDP is connectionless, faster, but does not guarantee delivery or packet order.", category: "Computer Networks", isMastered: false },
      { id: "mc_2", front: "Explain ACID properties of Database Management Systems.", back: "Atomicity (all or nothing), Consistency (preserves database integrity), Isolation (concurrent transactions don't interfere), and Durability (permanent changes).", category: "DBMS", isMastered: false },
      { id: "mc_3", front: "What is dynamic programming?", back: "An algorithmic technique that solves complex problems by breaking them down into simpler overlapping subproblems, solving each subproblem once, and caching their solutions (memoization).", category: "Algorithms", isMastered: false },
      { id: "mc_4", front: "What is a deadlock and what are its four necessary conditions?", back: "A situation where set of processes are blocked because each holds a resource and waits for another. Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait.", category: "Operating Systems", isMastered: false }
    ];
  });
  
  useEffect(() => {
    localStorage.setItem('mock_test_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const [activeCardIdx, setActiveCardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Array<{ id: string; front: string; back: string; category: string }>>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardCat, setCardCat] = useState('Algorithms');

  const handleCreateCard = () => {
    if (!cardFront.trim() || !cardBack.trim()) return;
    const newCard = {
      id: `mc_${Date.now()}`,
      front: cardFront.trim(),
      back: cardBack.trim(),
      category: cardCat,
      isMastered: false
    };
    setFlashcards([...flashcards, newCard]);
    setCardFront('');
    setCardBack('');
    setShowAddCard(false);
    setSuccessToast("Revision Flash Card added successfully!");
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleParseBulk = () => {
    setBulkError(null);
    const input = bulkInput.trim();
    if (!input) {
      setBulkError("Please paste some flashcards data to parse.");
      return;
    }

    let parsed: Array<{ front: string; back: string; category: string }> = [];

    // JSON format parsing
    if (input.startsWith('[') || input.startsWith('{')) {
      try {
        const data = JSON.parse(input);
        const list = Array.isArray(data) ? data : [data];
        parsed = list.map((item: any, idx: number) => {
          if (!item.front || !item.back) {
            throw new Error(`Item ${idx + 1} is missing 'front' or 'back' fields.`);
          }
          return {
            front: String(item.front).trim(),
            back: String(item.back).trim(),
            category: String(item.category || 'Algorithms').trim()
          };
        });
      } catch (err: any) {
        setBulkError(`JSON Parse Error: ${err.message}`);
        return;
      }
    } else {
      // CSV format parsing
      const lines = input.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
        if (matches.length < 2) {
          setBulkError(`CSV Parse Error at line ${i + 1}: Must contain Question and Answer separated by a comma.`);
          return;
        }
        
        const front = matches[0].replace(/^"|"$/g, '').trim();
        const back = matches[1].replace(/^"|"$/g, '').trim();
        const category = (matches[2] ? matches[2].replace(/^"|"$/g, '').trim() : 'Algorithms');
        
        if (!front || !back) {
          setBulkError(`CSV Parse Error at line ${i + 1}: Question or Answer cannot be blank.`);
          return;
        }

        parsed.push({ front, back, category });
      }
    }

    if (parsed.length === 0) {
      setBulkError("No records parsed successfully.");
      return;
    }

    setParsedPreview(parsed.map((p, idx) => ({ ...p, id: `bulk_${idx}_${Date.now()}` })));
  };

  const handleImportBulk = () => {
    if (parsedPreview.length === 0) return;
    const newCards = parsedPreview.map(p => ({
      id: p.id,
      front: p.front,
      back: p.back,
      category: p.category,
      isMastered: false
    }));

    setFlashcards([...flashcards, ...newCards]);
    setBulkInput('');
    setParsedPreview([]);
    setShowBulkUpload(false);
    setSuccessToast(`Successfully imported ${newCards.length} flashcards!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleEditPreviewRow = (id: string, field: 'front' | 'back' | 'category', value: string) => {
    setParsedPreview(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleDeletePreviewRow = (id: string) => {
    setParsedPreview(prev => prev.filter(p => p.id !== id));
  };

  const toggleMastered = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlashcards(flashcards.map(c => c.id === id ? { ...c, isMastered: !c.isMastered } : c));
  };

  const filteredCards = flashcards.filter(c => !c.isMastered);

  // Authentication/Role details
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isFacultyOrAdmin = user?.role === 'admin' || user?.role === 'faculty';

  // Test-taking state
  const [activeTest, setActiveTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Results state
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Modals state (Faculty tools)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('technical');
  const [newDuration, setNewDuration] = useState('30');
  const [newDifficulty, setNewDifficulty] = useState('medium');
  const [newQuestions, setNewQuestions] = useState<Array<{
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    explanation: string;
  }>>([
    { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '' }
  ]);

  // Categories & Styling configurations
  const cats = ['aptitude', 'technical', 'verbal', 'coding'];
  const catColors: Record<string, string> = { 
    aptitude: 'from-amber-500 to-orange-600', 
    technical: 'from-blue-500 to-indigo-600', 
    verbal: 'from-pink-500 to-rose-600', 
    coding: 'from-emerald-500 to-teal-600' 
  };
  const diffColors: Record<string, string> = { 
    easy: 'text-emerald-600 bg-emerald-50 border border-emerald-100', 
    medium: 'text-amber-600 bg-amber-50 border border-amber-100', 
    hard: 'text-red-600 bg-red-50 border border-red-100' 
  };

  useEffect(() => { 
    fetchTests(); 
  }, [catFilter]);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (catFilter) params.category = catFilter;
      const { data } = await api.get('/career/mock-tests', { params });
      setTests(data.tests || []);
    } catch {}
    setLoading(false);
  };

  // Start active test session
  const startTest = async (test: Test) => {
    try {
      const { data } = await api.get(`/career/mock-tests/${test.id}/questions`);
      const testQuestions = data.questions || [];
      if (testQuestions.length === 0) {
        alert("This test has no questions yet.");
        return;
      }
      setQuestions(testQuestions);
      setActiveTest(test);
      setCurrentQ(0);
      setAnswers({});
      setStartTime(Date.now());
      setTimeLeft(test.duration_minutes * 60);
      
      // Initialize time spent per question tracking
      const initialMap: Record<string, number> = {};
      testQuestions.forEach((q: Question) => {
        initialMap[q.id] = 0;
      });
      setTimeSpentMap(initialMap);
      setShowResults(false);
      setWarnings(0);

      // Attempt to enter Fullscreen
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      }

      // Request webcam proctoring stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setWebcamStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (camErr) {
        console.warn("Proctoring webcam denied or unsupported.", camErr);
      }
    } catch {}
  };

  // Timer, Fullscreen change listener, and tab visibility monitoring (Proctoring)
  useEffect(() => {
    if (!activeTest || showResults) return;

    // Countdown and active question time accumulator
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { 
          submitTest(); 
          return 0; 
        }
        return prev - 1;
      });

      // Track seconds spent on current active question
      if (questions[currentQ]) {
        const activeQId = questions[currentQ].id;
        setTimeSpentMap(prev => ({
          ...prev,
          [activeQId]: (prev[activeQId] || 0) + 1
        }));
      }
    }, 1000);

    // Tab visibility monitoring
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tab_switch");
      }
    };

    // Fullscreen exit tracking
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("fullscreen_exit");
      }
    };

    // Window focus loss tracking (detect Alt+Tab, Windows key, clicking out, etc.)
    const handleWindowBlur = () => {
      handleViolation("window_blur");
    };

    // Keyboard shortcut interception
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Alt' || e.altKey || e.metaKey || e.key === 'Escape') {
        e.preventDefault();
        handleViolation("keyboard_shortcut");
        return;
      }
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
        e.preventDefault();
        handleViolation("reload_attempt");
        return;
      }
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'j' || e.key === 'c' || e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.metaKey && e.altKey && (e.key === 'i' || e.key === 'I'))
      ) {
        e.preventDefault();
        handleViolation("devtools_attempt");
        return;
      }
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'c' || key === 'v' || key === 'x' || key === 'a') {
          e.preventDefault();
          handleViolation("keyboard_shortcut");
          return;
        }
      }
    };

    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      handleViolation("copy_paste");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("right_click");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [activeTest, showResults, currentQ, questions]);

  // Handle webcam stream binding
  useEffect(() => {
    if (webcamStream && videoRef.current) {
      videoRef.current.srcObject = webcamStream;
    }
  }, [webcamStream, activeTest]);

  const handleViolation = (type: string) => {
    const now = Date.now();
    // Allow at most one violation warning every 1.5 seconds to prevent duplicate event registers (e.g. keydown + blur firing simultaneously)
    if (now - lastViolationTimeRef.current < 1500) {
      return;
    }
    lastViolationTimeRef.current = now;

    setWarnings(prev => {
      const nextWarn = prev + 1;
      if (nextWarn >= 3) {
        submitTest();
      } else {
        setShowWarningModal(true);
      }
      return nextWarn;
    });
  };

  const selectAnswer = (qId: string, opt: string) => {
    setAnswers(prev => ({ ...prev, [qId]: opt }));
  };

  // Submit test and clean up proctoring assets
  const submitTest = async () => {
    if (!activeTest || submitting) return;
    setSubmitting(true);
    
    // Stop webcam proctoring tracks
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }

    // Attempt exit fullscreen
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    try {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const { data } = await api.post(`/career/mock-tests/${activeTest.id}/submit`, {
        answers, 
        time_taken_seconds: elapsed,
      });
      setScore(data.score); 
      setTotal(data.total);
      setResults(data.results || []);
      setShowResults(true);
    } catch {}
    setSubmitting(false);
  };

  const quitTest = () => {
    if (confirm('Quit test? All progress will be lost.')) {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
        setWebcamStream(null);
      }
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setActiveTest(null);
      setShowWarningModal(false);
    }
  };

  // Faculty Actions: Create & Delete
  const handleCreateTest = async () => {
    if (!newTitle.trim()) {
      alert("Please specify a test title.");
      return;
    }
    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        category: newCategory,
        duration_minutes: parseInt(newDuration, 10),
        difficulty: newDifficulty,
        questions: newQuestions
      };
      await api.post('/career/mock-tests', payload);
      alert("Mock test published successfully!");
      setShowCreateModal(false);
      
      // Reset Create Form
      setNewTitle('');
      setNewDescription('');
      setNewCategory('technical');
      setNewDuration('30');
      setNewDifficulty('medium');
      setNewQuestions([{ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '' }]);
      
      fetchTests();
    } catch {
      alert("Failed to build mock test.");
    }
  };

  const handleEditTest = async () => {
    if (!editingTest) return;
    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        category: newCategory,
        duration_minutes: parseInt(newDuration, 10),
        difficulty: newDifficulty
      };
      await api.put(`/career/mock-tests/${editingTest.id}`, payload);
      alert("Mock test updated successfully!");
      setShowEditModal(false);
      setEditingTest(null);
      fetchTests();
    } catch {
      alert("Failed to update test metadata.");
    }
  };

  const handleDeleteTest = async (tid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this mock test?")) return;
    try {
      await api.delete(`/career/mock-tests/${tid}`);
      setTests(prev => prev.filter(t => t.id !== tid));
      alert("Mock test deleted.");
    } catch {
      alert("Failed to delete mock test.");
    }
  };

  const openEditModal = (test: Test, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTest(test);
    setNewTitle(test.title);
    setNewDescription(test.description || '');
    setNewCategory(test.category);
    setNewDuration(String(test.duration_minutes));
    setNewDifficulty(test.difficulty);
    setShowEditModal(true);
  };

  // Add/Remove Question helpers in Dynamic creator
  const addQuestionField = () => {
    setNewQuestions(prev => [
      ...prev, 
      { question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a', explanation: '' }
    ]);
  };

  const removeQuestionField = (idx: number) => {
    if (newQuestions.length <= 1) return;
    setNewQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQuestionField = (idx: number, field: string, value: string) => {
    setNewQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── TEST LIST VIEW ───
  if (!activeTest) return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-gradient-to-br from-rose-600 to-pink-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Mock Test Portal</h1>
              <p className="text-xs text-rose-200">Simulate online recruitment drives</p>
            </div>
          </div>
          
          {isFacultyOrAdmin && (
            <button 
              onClick={() => setShowCreateModal(true)} 
              className="bg-white/20 hover:bg-white/30 text-white rounded-xl px-3 py-2 text-xs font-black flex items-center gap-1 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Test
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Selector */}
      <div className="px-4 mt-4 shrink-0">
        <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-slate-100">
          <button onClick={() => setSubTab('tests')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'tests' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>📋 Mock Tests</button>
          <button onClick={() => setSubTab('flashcards')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${subTab === 'flashcards' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>🎴 Revision Decks</button>
        </div>
      </div>

      {subTab === 'tests' ? (
        <>
          <div className="px-4 mt-4 shrink-0">
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              <button 
                onClick={() => setCatFilter('')} 
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${!catFilter ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/10' : 'bg-white text-slate-500 border border-slate-100'}`}
              >
                All Packs
              </button>
              {cats.map(c => (
                <button 
                  key={c} 
                  onClick={() => setCatFilter(c)} 
                  className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${catFilter === c ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/10' : 'bg-white text-slate-500 border border-slate-100'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-16">
                <span className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></span>
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 p-8">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h2 className="text-base font-bold text-slate-900">No Tests Listed</h2>
                <p className="text-xs text-slate-500 mt-1">Please check back later or start a new test build.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-slide-up">
                {tests.map(t => {
                  const grad = catColors[t.category] || 'from-slate-500 to-slate-600';
                  return (
                    <div key={t.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all flex justify-between items-center gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/5`}>
                          <BarChart3 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-slate-800 truncate">{t.title}</h3>
                          {t.description && <p className="text-xs text-slate-400 mt-0.5 truncate leading-relaxed">{t.description}</p>}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${diffColors[t.difficulty] || ''}`}>{t.difficulty}</span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5"><Clock className="w-3 h-3" />{t.duration_minutes}m</span>
                            <span className="text-[10px] font-bold text-slate-400">{t.total_questions} Qs</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isFacultyOrAdmin && (
                          <>
                            <button onClick={(e) => openEditModal(t, e)} className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors border border-slate-100">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => handleDeleteTest(t.id, e)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors border border-red-100">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => startTest(t)} 
                          className="px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-500/10 hover:bg-rose-700 active:scale-95 flex items-center gap-1 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" /> Start
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ─── FLASHCARDS VIEW ─── */
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          <div className="flex justify-between items-center pl-1 shrink-0">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Concept Deck</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">{filteredCards.length} card(s) remaining</p>
            </div>
            {isFacultyOrAdmin && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowBulkUpload(true)} 
                  className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5 hover:bg-slate-800 transition-colors"
                >
                  📥 Bulk Upload
                </button>
                <button 
                  onClick={() => setShowAddCard(true)} 
                  className="bg-rose-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1 animate-pulse"
                >
                  <Plus className="w-4 h-4" /> Add Card
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center items-center py-6 min-h-[350px]">
            {filteredCards.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm w-full max-w-sm">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">Deck Completed!</h3>
                <p className="text-xs text-slate-500 mt-1">Great job! You have revised all academic core concepts in this pack.</p>
                <button 
                  onClick={() => setFlashcards(flashcards.map(c => ({ ...c, isMastered: false })))}
                  className="mt-6 bg-slate-900 text-white text-xs font-black px-6 py-3 rounded-2xl w-full"
                >
                  Reset Deck
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-6 items-center w-full">
                {/* Visual Flipping Card */}
                <div className="w-full aspect-[4/3] max-w-sm [perspective:1000px] cursor-pointer">
                  <div 
                    onClick={() => setCardFlipped(!cardFlipped)}
                    className={`relative w-full h-full rounded-[32px] shadow-xl border border-slate-100 transition-transform duration-500 [transform-style:preserve-3d] ${cardFlipped ? '[transform:rotateY(180deg)]' : ''}`}
                  >
                    {/* Front View */}
                    <div className="absolute inset-0 p-6 rounded-[32px] bg-white flex flex-col justify-between items-center [backface-visibility:hidden]">
                      <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-600 px-3 py-1 rounded-full tracking-wider">{filteredCards[activeCardIdx].category}</span>
                      <h4 className="text-base font-black text-slate-800 leading-relaxed max-w-xs">{filteredCards[activeCardIdx].front}</h4>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Tap to Flip Card</span>
                    </div>

                    {/* Back View */}
                    <div className="absolute inset-0 p-6 rounded-[32px] bg-white flex flex-col justify-between items-center [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full tracking-wider">Solution Explanation</span>
                      <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-xs mt-4">{filteredCards[activeCardIdx].back}</p>
                      <button
                        onClick={(e) => toggleMastered(filteredCards[activeCardIdx].id, e)}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-md flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark Mastered
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex gap-4 items-center mt-2 w-full max-w-sm justify-between px-4">
                  <button 
                    onClick={() => {
                      setActiveCardIdx(prev => Math.max(0, prev - 1));
                      setCardFlipped(false);
                    }}
                    disabled={activeCardIdx === 0}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-slate-400 font-bold">
                    {activeCardIdx + 1} of {filteredCards.length}
                  </span>
                  <button 
                    onClick={() => {
                      setActiveCardIdx(prev => Math.min(filteredCards.length - 1, prev + 1));
                      setCardFlipped(false);
                    }}
                    disabled={activeCardIdx === filteredCards.length - 1}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUCCESS TOAST MESSAGE */}
      {successToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-6 py-4 flex items-center gap-3 shadow-xl animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{successToast}</span>
        </div>
      )}

      {/* BULK UPLOAD MODAL (Faculty Revision) */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="text-lg font-black text-slate-900">Bulk Upload Flashcards</h3>
                <p className="text-xs text-slate-500 mt-0.5">Paste CSV or JSON format below</p>
              </div>
              <button 
                onClick={() => { setShowBulkUpload(false); setParsedPreview([]); setBulkInput(''); setBulkError(null); }} 
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              {/* Instructions */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-[11px] leading-relaxed text-slate-600 font-medium">
                <p className="font-bold text-slate-800 uppercase tracking-wider mb-1 text-[9px]">Accepted Formats</p>
                <ul className="list-disc pl-4 flex flex-col gap-1">
                  <li><strong>CSV Format:</strong> Line-separated rows with <code>"Question","Answer","Category"</code> (optional).<br />Example: <code>"What is TCP?","Connection oriented protocol","Networks"</code></li>
                  <li><strong>JSON Format:</strong> An array of objects.<br />Example: <code>{"["}{"{"}"front": "Q1", "back": "A1", "category": "DBMS"{"}"}{"]"}</code></li>
                </ul>
              </div>

              {bulkError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs font-semibold">
                  {bulkError}
                </div>
              )}

              {parsedPreview.length === 0 ? (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Paste Flashcards Data *</label>
                  <textarea
                    value={bulkInput}
                    onChange={e => setBulkInput(e.target.value)}
                    placeholder={`"What is SQL?","Structured Query Language","DBMS"\n"What is HTML?","HyperText Markup Language","Web"`}
                    rows={8}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold font-mono text-slate-800 outline-none focus:border-rose-500 focus:bg-white resize-none"
                  />
                </div>
              ) : (
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Parsed Preview ({parsedPreview.length} items)</h4>
                  <div className="flex flex-col gap-3">
                    {parsedPreview.map((row) => (
                      <div key={row.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 relative">
                        <button 
                          onClick={() => handleDeletePreviewRow(row.id)}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xs"
                          title="Delete card"
                        >
                          ✕ Delete
                        </button>
                        <div className="pr-12">
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Question / Front</label>
                          <input 
                            type="text" 
                            value={row.front} 
                            onChange={e => handleEditPreviewRow(row.id, 'front', e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Answer / Solution</label>
                          <textarea 
                            value={row.back} 
                            onChange={e => handleEditPreviewRow(row.id, 'back', e.target.value)}
                            rows={2}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold resize-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-wider block mb-0.5">Category</label>
                            <select 
                              value={row.category} 
                              onChange={e => handleEditPreviewRow(row.id, 'category', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-bold text-slate-700"
                            >
                              <option value="Algorithms">Algorithms</option>
                              <option value="Computer Networks">Computer Networks</option>
                              <option value="DBMS">DBMS</option>
                              <option value="Operating Systems">Operating Systems</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 shrink-0 border-t border-slate-100 pt-4">
              <button 
                onClick={() => {
                  if (parsedPreview.length > 0) {
                    setParsedPreview([]);
                  } else {
                    setShowBulkUpload(false);
                    setBulkInput('');
                    setBulkError(null);
                  }
                }} 
                className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl"
              >
                {parsedPreview.length > 0 ? "Back to Edit" : "Cancel"}
              </button>
              {parsedPreview.length === 0 ? (
                <button 
                  onClick={handleParseBulk}
                  className="flex-1 py-3.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-2xl"
                >
                  Parse Data
                </button>
              ) : (
                <button 
                  onClick={handleImportBulk}
                  className="flex-1 py-3.5 text-xs font-black text-white bg-rose-600 hover:bg-rose-700 rounded-2xl shadow-lg shadow-rose-500/10"
                >
                  Import {parsedPreview.length} Cards
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD FLASHCARD MODAL (Faculty Revision) */}
      {showAddCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Create Revision Flash Card</h3>
            <div className="flex flex-col gap-3.5">
              <textarea
                placeholder="Question (Front of the card)..."
                value={cardFront}
                onChange={e => setCardFront(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none h-20 resize-none"
              />
              <textarea
                placeholder="Answer explanation (Back of the card)..."
                value={cardBack}
                onChange={e => setCardBack(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none h-24 resize-none"
              />
              <select
                value={cardCat}
                onChange={e => setCardCat(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="Algorithms">Algorithms</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="DBMS">DBMS</option>
                <option value="Operating Systems">Operating Systems</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddCard(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
              <button onClick={handleCreateCard} disabled={!cardFront.trim() || !cardBack.trim()} className="flex-1 py-3.5 text-xs font-black text-white bg-rose-600 rounded-2xl disabled:opacity-50 shadow-lg shadow-rose-500/10">
                Add to Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MOCK TEST MODAL (Faculty build) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-lg font-black text-slate-900">Create Mock Test</h3>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Test Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Cognizant Aptitude Assessment" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white transition-all" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Brief overview of placement topics covered..." rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-rose-500 focus:bg-white transition-all resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500">
                    <option value="technical">Technical</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="verbal">Verbal</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Duration (mins)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:border-rose-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Difficulty</label>
                  <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Questions Builder ({newQuestions.length})</h4>
                  <button onClick={addQuestionField} className="flex items-center gap-0.5 text-xs font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                    <Plus className="w-3.5 h-3.5" /> Add Q
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {newQuestions.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 relative flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Question {idx + 1}</span>
                        {newQuestions.length > 1 && (
                          <button onClick={() => removeQuestionField(idx)} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <textarea
                        value={q.question_text}
                        onChange={e => updateQuestionField(idx, 'question_text', e.target.value)}
                        placeholder="Explain recursion limits in python..."
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium outline-none resize-none focus:border-rose-500"
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <input value={q.option_a} onChange={e => updateQuestionField(idx, 'option_a', e.target.value)} placeholder="Option A *" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-rose-500 outline-none" />
                        <input value={q.option_b} onChange={e => updateQuestionField(idx, 'option_b', e.target.value)} placeholder="Option B *" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-rose-500 outline-none" />
                        <input value={q.option_c} onChange={e => updateQuestionField(idx, 'option_c', e.target.value)} placeholder="Option C *" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-rose-500 outline-none" />
                        <input value={q.option_d} onChange={e => updateQuestionField(idx, 'option_d', e.target.value)} placeholder="Option D *" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-rose-500 outline-none" />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-1">
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Correct Answer</label>
                          <select value={q.correct_option} onChange={e => updateQuestionField(idx, 'correct_option', e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold">
                            <option value="a">Option A</option>
                            <option value="b">Option B</option>
                            <option value="c">Option C</option>
                            <option value="d">Option D</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Explanation (optional)</label>
                          <input value={q.explanation} onChange={e => updateQuestionField(idx, 'explanation', e.target.value)} placeholder="Why is this answer correct?" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:border-rose-500 outline-none" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 shrink-0 border-t border-slate-100 pt-4">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
              <button onClick={handleCreateTest} className="flex-1 py-3.5 text-xs font-black text-white bg-rose-600 rounded-2xl shadow-lg shadow-rose-500/10">Publish Test</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT TEST METADATA MODAL */}
      {showEditModal && editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up">
            <h3 className="text-lg font-black text-slate-900 mb-4">Edit Test Details</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Test Title *</label>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white" />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-rose-500 focus:bg-white resize-none" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Category</label>
                  <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700">
                    <option value="technical">Technical</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="verbal">Verbal</option>
                    <option value="coding">Coding</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Duration (mins)</label>
                  <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 block">Difficulty</label>
                  <select value={newDifficulty} onChange={e => setNewDifficulty(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => { setShowEditModal(false); setEditingTest(null); }} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
              <button onClick={handleEditTest} className="flex-1 py-3.5 text-xs font-black text-white bg-rose-600 rounded-2xl shadow-lg shadow-rose-500/10">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );

  // ─── RESULTS VIEW (WITH DETAILED ANALYTICS) ───
  if (showResults) {
    const pct = total ? Math.round(score / total * 100) : 0;
    const timeTakenSeconds = Math.round((Date.now() - startTime) / 1000);
    const avgTimePerQuestion = Math.round(timeTakenSeconds / questions.length);

    return (
      <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
        {/* Results Banner */}
        <div className={`p-8 pt-14 text-center shrink-0 ${pct >= 70 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-pink-600'}`}>
          <Trophy className="w-12 h-12 text-white/80 mx-auto mb-2" />
          <h1 className="text-4xl font-black text-white">{pct}%</h1>
          <p className="text-white/90 font-black mt-1 text-sm">{score} of {total} Questions Correct</p>
          <p className="text-white/65 text-xs mt-1 font-semibold">{activeTest?.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {/* Summary Performance Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Time Elapsed</p>
              <h4 className="text-base font-black text-slate-800 mt-1">{formatTime(timeTakenSeconds)}</h4>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Avg Time / Question</p>
              <h4 className="text-base font-black text-slate-800 mt-1">{avgTimePerQuestion}s</h4>
            </div>
          </div>

          {/* Time spent chart */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm mb-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-rose-500" /> Question Time Breakdown
            </h3>
            <div className="flex flex-col gap-3">
              {questions.map((q, idx) => {
                const seconds = timeSpentMap[q.id] || 0;
                const maxSeconds = Math.max(...Object.values(timeSpentMap), 1);
                const widthPct = Math.round((seconds / maxSeconds) * 100);
                
                // Retrieve if correct
                const res = results.find(r => r.question_id === q.id);
                const isCorrect = res?.is_correct || false;

                return (
                  <div key={q.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-8">Q{idx + 1}</span>
                    <div className="flex-1 bg-slate-50 h-5 rounded-lg overflow-hidden relative border border-slate-100">
                      <div 
                        className={`h-full rounded-lg transition-all ${isCorrect ? 'bg-emerald-500/80' : 'bg-red-500/80'}`} 
                        style={{ width: `${Math.max(widthPct, 6)}%` }}
                      />
                      <span className="absolute inset-y-0 right-2 flex items-center text-[10px] font-black text-slate-600">
                        {seconds}s
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Review Section */}
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3 px-1">Detailed Question review</h3>
          <div className="flex flex-col gap-3">
            {results.map((r, idx) => {
              const q = questions.find(x => x.id === r.question_id);
              return (
                <div key={r.question_id} className={`rounded-2xl p-4 shadow-sm border ${r.is_correct ? 'bg-emerald-50/30 border-emerald-200' : 'bg-red-50/30 border-red-200'}`}>
                  <div className="flex items-start gap-2.5">
                    {r.is_correct ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 leading-relaxed">{idx + 1}. {q?.question_text}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className={`p-2 rounded-lg text-xs font-semibold ${q?.option_a === r.student_answer ? 'border-2 border-slate-400 bg-white' : 'bg-slate-100/50'} ${r.correct_option === 'a' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200' : 'text-slate-600'}`}>
                          A. {q?.option_a}
                        </div>
                        <div className={`p-2 rounded-lg text-xs font-semibold ${q?.option_b === r.student_answer ? 'border-2 border-slate-400 bg-white' : 'bg-slate-100/50'} ${r.correct_option === 'b' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200' : 'text-slate-600'}`}>
                          B. {q?.option_b}
                        </div>
                        <div className={`p-2 rounded-lg text-xs font-semibold ${q?.option_c === r.student_answer ? 'border-2 border-slate-400 bg-white' : 'bg-slate-100/50'} ${r.correct_option === 'c' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200' : 'text-slate-600'}`}>
                          C. {q?.option_c}
                        </div>
                        <div className={`p-2 rounded-lg text-xs font-semibold ${q?.option_d === r.student_answer ? 'border-2 border-slate-400 bg-white' : 'bg-slate-100/50'} ${r.correct_option === 'd' ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200' : 'text-slate-600'}`}>
                          D. {q?.option_d}
                        </div>
                      </div>

                      {!r.is_correct && (
                        <p className="text-xs font-bold text-red-500 mt-2.5">
                          You selected option: {r.student_answer.toUpperCase() || 'No Answer'}
                        </p>
                      )}
                      {r.explanation && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Explanation</p>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">{r.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => { setActiveTest(null); setShowResults(false); }} 
            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-sm shadow-md"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE TEST-TAKING PAGE ───
  const activeQ = questions[currentQ];
  const opts = activeQ ? [
    ['a', activeQ.option_a],
    ['b', activeQ.option_b],
    ['c', activeQ.option_c],
    ['d', activeQ.option_d]
  ] : [];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in relative">
      {/* Active Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
        <button onClick={quitTest} className="text-xs font-black text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-100 px-3.5 py-2 rounded-xl">
          Quit Test
        </button>
        <span className={`text-sm font-black flex items-center gap-1 ${timeLeft <= 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
          <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
        </span>
        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
          {answeredCount} of {questions.length} Answered
        </span>
      </div>

      {/* Progress Line */}
      <div className="h-1 bg-slate-100 shrink-0">
        <div className="h-full bg-rose-600 transition-all duration-300" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}></div>
      </div>

      {activeQ && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col pb-28 relative">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Question {currentQ + 1} of {questions.length}</p>
          <h2 className="text-base font-bold text-slate-900 leading-relaxed mb-6">{activeQ.question_text}</h2>
          
          <div className="flex flex-col gap-3 flex-1">
            {opts.map(([key, text]) => (
              <button 
                key={key} 
                onClick={() => selectAnswer(activeQ.id, key)}
                className={`w-full p-4 rounded-2xl text-left text-sm font-semibold border-2 transition-all flex items-center gap-3 ${
                  answers[activeQ.id] === key 
                    ? 'border-rose-600 bg-rose-50 text-rose-700' 
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  answers[activeQ.id] === key ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {key.toUpperCase()}
                </span>
                <span className="flex-1 leading-normal">{text}</span>
              </button>
            ))}
          </div>

          {/* Live Proctoring Webcam Frame */}
          <div className="fixed bottom-20 right-4 w-28 h-36 rounded-2xl border-2 border-white shadow-2xl bg-slate-950 overflow-hidden z-40">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[8px] font-black text-white bg-slate-900/60 px-1 rounded-sm uppercase tracking-wider">PROCTORING</span>
            </div>
            
            {/* If stream is null (cam denied) */}
            {!webcamStream && (
              <div className="absolute inset-0 flex flex-col justify-center items-center p-2 bg-slate-900/90 text-center">
                <Video className="w-4 h-4 text-rose-500 mb-1" />
                <span className="text-[7px] font-bold text-white uppercase leading-tight">Cam required for verification</span>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => setCurrentQ(p => Math.max(0, p - 1))} 
              disabled={currentQ === 0} 
              className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs disabled:opacity-30 transition-all"
            >
              ← Previous
            </button>
            {currentQ < questions.length - 1 ? (
              <button 
                onClick={() => setCurrentQ(p => p + 1)} 
                className="flex-1 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs transition-all"
              >
                Next →
              </button>
            ) : (
              <button 
                onClick={submitTest} 
                disabled={submitting} 
                className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs disabled:opacity-40 shadow-lg shadow-rose-600/10 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Proctoring Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4 border border-red-200">
              <AlertTriangle className="w-8 h-8 text-red-600 animate-bounce" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Violation Detected</h3>
            <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
              Warning Count: {warnings} of 3 limit
            </span>
            <p className="text-xs font-medium text-slate-500 mt-4 leading-relaxed">
              Exit from fullscreen or tab switches are strictly monitored by AI Proctoring. Exceeding 3 warnings will auto-submit your answers immediately.
            </p>
            <button 
              onClick={() => {
                setShowWarningModal(false);
                // Attempt to re-enter fullscreen
                const docEl = document.documentElement;
                if (docEl.requestFullscreen) {
                  docEl.requestFullscreen().catch(() => {});
                }
              }} 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl font-bold text-xs shadow-md mt-6 transition-colors"
            >
              Resume Test
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockTestPortal;
