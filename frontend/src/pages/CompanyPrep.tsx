import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, MessageSquare, ChevronDown, ChevronUp, Plus, ThumbsUp, Trash2, Edit, CheckCircle, HelpCircle, Layers, Users, BookOpen, X, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Question {
  id: string;
  question_text: string;
  category: string;
  year: number | null;
  company_name: string;
  upvotes: number;
}

interface ForumThread {
  id: string;
  title: string;
  content: string;
  author: string;
  tags: string[];
  upvotes: number;
  comments: { author: string; text: string; date: string }[];
  date: string;
}

interface FlashCard {
  id: string;
  front: string;
  back: string;
  category: string;
  isMastered: boolean;
}

const CompanyPrep = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'company' | 'forum' | 'flashcards'>('company');
  const [company, setCompany] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  
  // Add/Edit Form State
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newCategory, setNewCategory] = useState('technical');
  const [newYear, setNewYear] = useState('');
  const [likedQuestions, setLikedQuestions] = useState<string[]>(() => {
    const saved = localStorage.getItem('liked_questions');
    return saved ? JSON.parse(saved) : [];
  });

  // User auth details
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isFacultyOrAdmin = user?.role === 'admin' || user?.role === 'faculty';

  const popular = ['Google', 'TCS', 'Infosys', 'Wipro', 'Amazon', 'Microsoft', 'Zoho', 'Cognizant'];
  const catColors: Record<string, string> = { 
    technical: 'bg-blue-100 text-blue-700', 
    aptitude: 'bg-amber-100 text-amber-700', 
    hr: 'bg-pink-100 text-pink-700' 
  };

  const search = async (c?: string) => {
    const q = c || company;
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/career/prep/${encodeURIComponent(q)}`);
      setQuestions(data.questions || []);
    } catch {
      // Offline fallback
      setQuestions([
        { id: 'q1', company_name: q, question_text: 'Explain the difference between process and thread.', category: 'technical', year: 2023, upvotes: 12 },
        { id: 'q2', company_name: q, question_text: 'Reverse a Linked List in place without recursion.', category: 'technical', year: 2024, upvotes: 21 },
        { id: 'q3', company_name: q, question_text: 'Tell me about your final year project difficulties.', category: 'hr', year: 2023, upvotes: 4 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedQuestions.includes(id)) {
      alert("You have already upvoted this question!");
      return;
    }
    try {
      await api.post(`/career/prep/question/${id}/upvote`);
      setQuestions(questions.map(q => q.id === id ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q));
      const newLikes = [...likedQuestions, id];
      setLikedQuestions(newLikes);
      localStorage.setItem('liked_questions', JSON.stringify(newLikes));
    } catch {
      // Mock upvote
      setQuestions(questions.map(q => q.id === id ? { ...q, upvotes: (q.upvotes || 0) + 1 } : q));
      const newLikes = [...likedQuestions, id];
      setLikedQuestions(newLikes);
      localStorage.setItem('liked_questions', JSON.stringify(newLikes));
    }
  };

  const handleAddOrEditQuestion = async () => {
    if (!newQuestionText.trim() || !company) return;
    try {
      if (editingQuestionId) {
        // Edit Question API
        const { data } = await api.put(`/career/prep/question/${editingQuestionId}`, {
          question_text: newQuestionText,
          category: newCategory,
          year: newYear ? parseInt(newYear) : null
        });
        setQuestions(questions.map(q => q.id === editingQuestionId ? data.question : q));
        alert('Question updated successfully!');
      } else {
        // Create Question API
        const res = await api.post(`/career/prep/${encodeURIComponent(company)}/question`, {
          question_text: newQuestionText,
          category: newCategory,
          year: newYear ? parseInt(newYear) : null
        });
        setQuestions([res.data.question, ...questions]);
        alert('Question shared to community prep board!');
      }
      setShowAddModal(false);
      setEditingQuestionId(null);
      setNewQuestionText('');
      setNewYear('');
    } catch (err) {
      alert('Failed to submit question.');
    }
  };

  const handleDeleteQuestion = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/career/prep/question/${id}`);
      setQuestions(questions.filter(q => q.id !== id));
      alert('Question deleted.');
    } catch {
      // Mock delete
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const openEditModal = (q: Question, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingQuestionId(q.id);
    setNewQuestionText(q.question_text);
    setNewCategory(q.category);
    setNewYear(q.year ? String(q.year) : '');
    setShowAddModal(true);
  };

  // ── Community Q&A Forum State ──
  const [threads, setThreads] = useState<ForumThread[]>(() => {
    const saved = localStorage.getItem('prep_forum_threads');
    return saved ? JSON.parse(saved) : [
      { id: 't_1', title: 'Google SWE screening interview experience', content: 'Had 2 coding questions. One on sliding window and other on topological sort. Make sure to discuss complexity first!', author: 'Gopal S.', tags: ['Google', 'Arrays', 'Graphs'], upvotes: 14, comments: [{ author: 'Amit K', text: 'Topological sort is common in Google. Thanks!', date: '2026-05-28' }], date: '2026-05-27' },
      { id: 't_2', title: 'Explain time complexity of building a heap', content: 'Most people think it is O(N log N) but Floyd\'s method runs in O(N). Let\'s discuss why mathematically.', author: 'Dr. Ramesh Kumar', tags: ['Heaps', 'Algorithms'], upvotes: 28, comments: [], date: '2026-05-28' }
    ];
  });
  const [showAddThread, setShowAddThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');
  const [threadTags, setThreadTags] = useState('');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('prep_forum_threads', JSON.stringify(threads));
  }, [threads]);

  const handleCreateThread = () => {
    if (!threadTitle.trim() || !threadContent.trim()) return;
    const newThread: ForumThread = {
      id: 'thread_' + Date.now(),
      title: threadTitle,
      content: threadContent,
      author: user?.full_name || 'Student',
      tags: threadTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
      upvotes: 1,
      comments: [],
      date: new Date().toISOString().split('T')[0]
    };
    setThreads([newThread, ...threads]);
    setThreadTitle('');
    setThreadContent('');
    setThreadTags('');
    setShowAddThread(false);
  };

  const handleUpvoteThread = (id: string) => {
    setThreads(threads.map(t => t.id === id ? { ...t, upvotes: t.upvotes + 1 } : t));
  };

  const handleAddThreadComment = (threadId: string) => {
    const text = commentInputs[threadId];
    if (!text || !text.trim()) return;
    setThreads(threads.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          comments: [...t.comments, { author: user?.full_name || 'Student', text, date: new Date().toISOString().split('T')[0] }]
        };
      }
      return t;
    }));
    setCommentInputs({ ...commentInputs, [threadId]: '' });
  };

  // ── Flashcards State ──
  const [flashcards, setFlashcards] = useState<FlashCard[]>(() => {
    const saved = localStorage.getItem('prep_flashcards');
    return saved ? JSON.parse(saved) : [
      { id: 'fc_1', front: 'What is the time complexity of Quick Sort in the worst case?', back: 'O(N^2). This happens when the pivot chosen is always the extreme element.', category: 'Algorithms', isMastered: false },
      { id: 'fc_2', front: 'Explain CAP Theorem in Distributed Databases.', back: 'Consistency, Availability, and Partition Tolerance. A distributed system can only provide 2 of these guarantees simultaneously.', category: 'System Design', isMastered: false },
      { id: 'fc_3', front: 'What is polymorphism in Object Oriented Programming?', back: 'Polymorphism allows objects of different classes to be treated as objects of a common superclass. Primarily implemented via overriding and overloading.', category: 'OOP Concepts', isMastered: false }
    ];
  });
  const [activeFlashcardIdx, setActiveFlashcardIdx] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showBulkCardModal, setShowBulkCardModal] = useState(false);
  const [bulkCardText, setBulkCardText] = useState('');
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [cardCat, setCardCat] = useState('Algorithms');

  useEffect(() => {
    localStorage.setItem('prep_flashcards', JSON.stringify(flashcards));
  }, [flashcards]);

  const handleCreateCard = () => {
    if (!cardFront.trim() || !cardBack.trim()) return;
    const newCard: FlashCard = {
      id: 'fc_' + Date.now(),
      front: cardFront,
      back: cardBack,
      category: cardCat,
      isMastered: false
    };
    setFlashcards([...flashcards, newCard]);
    setCardFront('');
    setCardBack('');
    setShowAddCard(false);
  };

  const handleBulkUploadCards = () => {
    if (!bulkCardText.trim()) return;
    const lines = bulkCardText.split('\n');
    const newCards: FlashCard[] = [];
    lines.forEach((line, idx) => {
      if (!line.trim()) return;
      const parts = line.split('|');
      const front = parts[0]?.trim() || '';
      const back = parts[1]?.trim() || '';
      const cat = parts[2]?.trim() || 'Algorithms';
      if (front && back) {
        newCards.push({
          id: `fc_bulk_${Date.now()}_${idx}`,
          front,
          back,
          category: cat,
          isMastered: false
        });
      }
    });
    if (newCards.length > 0) {
      setFlashcards([...flashcards, ...newCards]);
      alert(`Bulk uploaded ${newCards.length} flashcards successfully!`);
      setBulkCardText('');
      setShowBulkCardModal(false);
    } else {
      alert("No valid flashcards found. Use format: Front of Card | Back of Card | Category");
    }
  };

  const toggleMastered = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlashcards(flashcards.map(c => c.id === cardId ? { ...c, isMastered: !c.isMastered } : c));
  };

  const filteredCards = flashcards.filter(c => !c.isMastered);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => navigate(user?.role === 'faculty' ? '/faculty/career' : '/career')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Company Prep</h1>
            <p className="text-xs text-blue-200">Prepare for recruitment drives</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-x-auto hide-scrollbar">
          <button
            onClick={() => setActiveTab('company')}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'company' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Company Questions
          </button>
          <button
            onClick={() => setActiveTab('forum')}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'forum' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1" /> Q&A Forum
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'flashcards' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1" /> Flash Cards
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* COMPANY PREP QUESTIONS TAB */}
        {activeTab === 'company' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                value={company} 
                onChange={e => setCompany(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && search()} 
                placeholder="Search company..." 
                className="bg-transparent text-slate-800 text-sm font-semibold placeholder:text-slate-400 flex-1 outline-none"
              />
              <button onClick={() => search()} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-500/10">Search</button>
            </div>

            {!searched ? (
              <>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 pl-1">Popular Companies</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {popular.map(c => (
                    <button key={c} onClick={() => { setCompany(c); search(c); }} className="px-4 py-2 bg-white rounded-2xl text-xs font-bold text-slate-700 shadow-sm border border-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all active:scale-95">{c}</button>
                  ))}
                </div>
                <div className="text-center py-12">
                  <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs text-slate-500">Search a company above to see shared interview questions.</p>
                </div>
              </>
            ) : loading ? (
              <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></span></div>
            ) : questions.length === 0 ? (
              <div className="text-center py-20">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h2 className="text-sm font-bold text-slate-900">No Questions Found</h2>
                <p className="text-xs text-slate-500 mt-1">Be the first to add a question for {company}!</p>
                <button onClick={() => { setEditingQuestionId(null); setShowAddModal(true); }} className="mt-4 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-xl">Add Question</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <p className="text-xs font-bold text-slate-400">{questions.length} questions found</p>
                  <button onClick={() => { setEditingQuestionId(null); setShowAddModal(true); }} className="flex items-center gap-1 text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl">
                      <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="w-full p-4 text-left flex items-start gap-3">
                      <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 leading-relaxed pr-6">{q.question_text}</p>
                        <div className="flex items-center justify-between mt-2.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${catColors[q.category] || 'bg-slate-100 text-slate-500'}`}>{q.category}</span>
                            {q.year && <span className="text-[10px] font-bold text-slate-400">{q.year} Drive</span>}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleUpvote(q.id, e)}
                              disabled={likedQuestions.includes(q.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                                likedQuestions.includes(q.id)
                                  ? 'text-blue-600 bg-blue-100 cursor-not-allowed opacity-90'
                                  : 'text-slate-400 hover:text-blue-500 bg-slate-50 hover:bg-blue-50/50'
                              }`}
                            >
                                <ThumbsUp className="w-3 h-3" /> {q.upvotes || 0}
                            </button>
                            
                            {/* Edit/Delete visible for Faculty/Admin roles */}
                            {isFacultyOrAdmin && (
                              <>
                                <button onClick={(e) => openEditModal(q, e)} className="p-1 bg-slate-50 rounded-lg hover:bg-slate-100 text-slate-500">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button onClick={(e) => handleDeleteQuestion(q.id, e)} className="p-1 bg-red-50 rounded-lg hover:bg-red-100 text-red-500">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMMUNITY FORUM TAB (Reddit-style) */}
        {activeTab === 'forum' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center pl-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prep Discussions</h3>
              <button 
                onClick={() => setShowAddThread(true)} 
                className="bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Start Thread
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {threads.map(thread => (
                <div key={thread.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Posted by {thread.author} · {thread.date}</span>
                      <h4 className="text-sm font-black text-slate-900 mt-1 leading-snug pr-4">{thread.title}</h4>
                    </div>
                    <button
                      onClick={() => handleUpvoteThread(thread.id)}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl px-2.5 py-1.5 flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-[11px] font-bold text-slate-600">{thread.upvotes}</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-3 whitespace-pre-wrap">{thread.content}</p>

                  <div className="flex gap-1.5 flex-wrap mt-3">
                    {thread.tags.map(t => (
                      <span key={t} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Comment list */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2.5">Discussion Comments ({thread.comments.length})</p>
                    <div className="flex flex-col gap-2.5 mb-3">
                      {thread.comments.map((c, i) => (
                        <div key={i} className="bg-slate-50 rounded-xl p-3 text-xs leading-normal border border-slate-100">
                          <span className="font-bold text-slate-800">{c.author}</span> <span className="text-slate-400 text-[9px] font-bold ml-1">· {c.date}</span>
                          <p className="text-slate-600 mt-1">{c.text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        placeholder="Join discussion thread..."
                        value={commentInputs[thread.id] || ''}
                        onChange={e => setCommentInputs({ ...commentInputs, [thread.id]: e.target.value })}
                        onKeyDown={e => e.key === 'Enter' && handleAddThreadComment(thread.id)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:bg-white focus:border-blue-400 transition-all font-medium"
                      />
                      <button
                        onClick={() => handleAddThreadComment(thread.id)}
                        className="bg-slate-900 text-white text-xs font-black px-4 py-2 rounded-xl"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLASH CARDS TAB */}
        {activeTab === 'flashcards' && (
          <div className="flex flex-col gap-5 pt-2 animate-fade-in">
            <div className="flex justify-between items-center pl-1 gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">DSA & System Design Revision</h3>
                <p className="text-[10px] text-slate-500">Tap cards to flip. Master all {filteredCards.length} cards remaining.</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button 
                  onClick={() => setShowBulkCardModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-3.5 py-2 rounded-xl border border-slate-200 transition-all active:scale-95 flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" /> Bulk Upload
                </button>
                <button 
                  onClick={() => setShowAddCard(true)}
                  className="bg-blue-600 text-white text-xs font-black px-4 py-2 rounded-xl shadow-md shadow-blue-500/10 flex items-center gap-0.5 transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" /> Card
                </button>
              </div>
            </div>

            {filteredCards.length === 0 ? (
              <div className="bg-white rounded-[32px] p-8 text-center border border-slate-100 shadow-sm">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">All Mastered!</h3>
                <p className="text-xs text-slate-500 mt-1">Excellent work. You have mastered all flash cards in this deck.</p>
                <button 
                  onClick={() => setFlashcards(flashcards.map(c => ({ ...c, isMastered: false })))}
                  className="mt-4 bg-slate-900 text-white text-xs font-black px-5 py-3 rounded-2xl"
                >
                  Reset Deck
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4 items-center">
                {/* Visual Flipping Card Container */}
                <div 
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="w-full aspect-[4/3] max-w-sm rounded-[32px] shadow-lg border border-slate-200/50 bg-white cursor-pointer relative perspective-1000 transform-style-3d transition-transform duration-500 flex items-center justify-center p-6 text-center"
                  style={{ transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0)' }}
                >
                  {/* Front View */}
                  <div className={`absolute inset-0 backface-hidden p-6 flex flex-col justify-between items-center ${cardFlipped ? 'opacity-0' : 'opacity-100'}`}>
                    <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1 rounded-full tracking-wider">
                      {filteredCards[activeFlashcardIdx].category}
                    </span>
                    <h4 className="text-base font-black text-slate-800 leading-relaxed max-w-xs">
                      {filteredCards[activeFlashcardIdx].front}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tap to Flip Card</span>
                  </div>

                  {/* Back View (Rotated 180deg to avoid mirror image) */}
                  <div 
                    className={`absolute inset-0 backface-hidden p-6 flex flex-col justify-between items-center ${cardFlipped ? 'opacity-100' : 'opacity-0'}`}
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <span className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full tracking-wider">
                      Explanation
                    </span>
                    <p className="text-xs text-slate-700 font-semibold leading-relaxed max-w-xs mt-4">
                      {filteredCards[activeFlashcardIdx].back}
                    </p>
                    <button
                      onClick={(e) => toggleMastered(filteredCards[activeFlashcardIdx].id, e)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-1 animate-pulse"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark as Mastered
                    </button>
                  </div>
                </div>

                {/* Card Controls */}
                <div className="flex gap-4 items-center mt-2 w-full max-w-sm justify-between px-2">
                  <button 
                    onClick={() => {
                      setActiveFlashcardIdx(prev => Math.max(0, prev - 1));
                      setCardFlipped(false);
                    }}
                    disabled={activeFlashcardIdx === 0}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <span className="text-xs text-slate-400 font-bold">
                    {activeFlashcardIdx + 1} of {filteredCards.length}
                  </span>
                  <button 
                    onClick={() => {
                      setActiveFlashcardIdx(prev => Math.min(filteredCards.length - 1, prev + 1));
                      setCardFlipped(false);
                    }}
                    disabled={activeFlashcardIdx === filteredCards.length - 1}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Question Modal (Company Questions) */}
      {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">{editingQuestionId ? 'Edit Interview Question' : `Add Question for ${company}`}</h3>
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
                      <button onClick={() => { setShowAddModal(false); setEditingQuestionId(null); setNewQuestionText(''); }} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
                      <button onClick={handleAddOrEditQuestion} disabled={!newQuestionText.trim()} className="flex-1 py-3.5 text-xs font-black text-white bg-blue-600 rounded-2xl disabled:opacity-50 shadow-lg shadow-blue-500/10">
                        {editingQuestionId ? 'Update' : 'Publish Question'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Start Forum Thread Modal */}
      {showAddThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Start Discussion Thread</h3>
            <div className="flex flex-col gap-3.5">
              <input
                type="text"
                placeholder="Topic / Thread Title"
                value={threadTitle}
                onChange={e => setThreadTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none"
              />
              <textarea
                placeholder="Describe your question or preparation experience..."
                value={threadContent}
                onChange={e => setThreadContent(e.target.value)}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none resize-none"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated, e.g. Arrays, Google)"
                value={threadTags}
                onChange={e => setThreadTags(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddThread(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
              <button onClick={handleCreateThread} disabled={!threadTitle.trim() || !threadContent.trim()} className="flex-1 py-3.5 text-xs font-black text-white bg-blue-600 rounded-2xl disabled:opacity-50 shadow-lg shadow-blue-500/10">
                Post Thread
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Flashcard Modal */}
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
                <option value="System Design">System Design</option>
                <option value="OOP Concepts">OOP Concepts</option>
                <option value="HR Questions">HR Questions</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowAddCard(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
              <button onClick={handleCreateCard} disabled={!cardFront.trim() || !cardBack.trim()} className="flex-1 py-3.5 text-xs font-black text-white bg-blue-600 rounded-2xl disabled:opacity-50 shadow-lg shadow-blue-500/10">
                Add to Deck
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Flashcards Upload Modal */}
      {showBulkCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-slide-up flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="text-lg font-black text-slate-900">Bulk Upload Flash Cards</h3>
              <button onClick={() => setShowBulkCardModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Paste your flashcards below. Each card must be on a new line in the format:<br />
                <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-[11px] font-black">Front of Card | Back of Card | Category</code>
              </p>
              
              <textarea
                value={bulkCardText}
                onChange={e => setBulkCardText(e.target.value)}
                placeholder="What is DFS? | Depth First Search | Algorithms&#10;What is BFS? | Breadth First Search | Algorithms"
                rows={10}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all resize-none leading-relaxed h-64"
              />
            </div>
            
            <div className="flex gap-3 mt-6 shrink-0 border-t border-slate-100 pt-4">
              <button onClick={() => setShowBulkCardModal(false)} className="flex-1 py-3.5 text-xs font-black text-slate-500 bg-slate-100 rounded-2xl">Cancel</button>
              <button onClick={handleBulkUploadCards} disabled={!bulkCardText.trim()} className="flex-1 py-3.5 text-xs font-black text-white bg-blue-600 rounded-2xl disabled:opacity-50 shadow-lg shadow-blue-500/10">
                Upload Cards
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CompanyPrep;
