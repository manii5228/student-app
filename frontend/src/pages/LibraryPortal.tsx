import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, BookOpen, RotateCcw, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Book { id:string; title:string; author:string; isbn:string|null; category:string|null; total_copies:number; available_copies:number; shelf_location:string|null; }
interface Issue { id:string; book_id:string; student_id:string; issued_date:string; due_date:string; returned_date:string|null; fine_amount:number; renewed_count:number; }

const LibraryPortal = () => {
  const nav = useNavigate();
  const [tab, setTab] = useState<'search'|'issued'>('search');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [issueBooks, setIssueBooks] = useState<Record<string,Book>>({});
  const [renewing, setRenewing] = useState<string|null>(null);

  const categories = ['Engineering','Science','Mathematics','Computer Science','Literature','Reference'];

  useEffect(() => {
    if (tab === 'search') searchBooks();
    else fetchIssues();
  }, [tab]);

  const searchBooks = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (query) params.q = query;
      if (category) params.category = category;
      const { data } = await api.get('/campus/library/books', { params });
      setBooks(data.books || []);
    } catch {}
    setLoading(false);
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/campus/library/my-issues');
      const issueList = data.issues || [];
      setIssues(issueList);
      // Fetch book details for each issue
      const booksMap: Record<string,Book> = {};
      for (const iss of issueList) {
        if (!booksMap[iss.book_id]) {
          try {
            const res = await api.get('/campus/library/books', { params: { q: '' } });
            const found = (res.data.books || []).find((b:Book) => b.id === iss.book_id);
            if (found) booksMap[iss.book_id] = found;
          } catch {}
        }
      }
      setIssueBooks(booksMap);
    } catch {}
    setLoading(false);
  };

  const renewBook = async (issueId: string) => {
    setRenewing(issueId);
    try {
      const { data } = await api.post(`/campus/library/renew/${issueId}`);
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, due_date: data.issue.due_date, renewed_count: data.issue.renewed_count } : i));
    } catch {}
    setRenewing(null);
  };

  const daysUntilDue = (d: string) => Math.ceil((new Date(d).getTime() - Date.now()) / 864e5);

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button onClick={() => nav(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Library Portal</h1>
            <p className="text-xs text-amber-100">Search, borrow & renew books</p>
          </div>
        </div>
        {/* Search bar */}
        <div className="relative z-10">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl flex items-center gap-2 px-4 py-3">
            <Search className="w-4 h-4 text-white/70 shrink-0" />
            <input
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchBooks()}
              placeholder="Search by title or author..."
              className="bg-transparent text-white text-sm font-medium placeholder:text-white/50 flex-1 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-4">
        <div className="flex bg-slate-100 rounded-2xl p-1">
          <button onClick={() => setTab('search')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'search' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}>
            📚 Browse Books
          </button>
          <button onClick={() => setTab('issued')} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${tab === 'issued' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500'}`}>
            📖 My Books ({issues.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'search' && (
          <>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">
              <button onClick={() => { setCategory(''); searchBooks(); }}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${!category ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>All</button>
              {categories.map(c => (
                <button key={c} onClick={() => { setCategory(c); setTimeout(searchBooks, 0); }}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${category === c ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{c}</button>
              ))}
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>
            ) : books.length === 0 ? (
              <div className="text-center py-20">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-slate-900">No Books Found</h2>
                <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 animate-slide-up">
                {books.map(book => (
                  <div key={book.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex gap-4">
                    {/* Book icon */}
                    <div className={`w-14 h-20 rounded-xl flex items-center justify-center shrink-0 ${book.available_copies > 0 ? 'bg-gradient-to-br from-amber-100 to-orange-100' : 'bg-slate-100'}`}>
                      <BookOpen className={`w-6 h-6 ${book.available_copies > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{book.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {book.category && (
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">{book.category}</span>
                        )}
                        {book.shelf_location && (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3" />{book.shelf_location}</span>
                        )}
                        {book.isbn && (
                          <span className="text-[10px] text-slate-400">ISBN: {book.isbn}</span>
                        )}
                      </div>
                      <div className="mt-2">
                        {book.available_copies > 0 ? (
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {book.available_copies}/{book.total_copies} available
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> All copies issued
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'issued' && (
          loading ? (
            <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span></div>
          ) : issues.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-slate-900">No Books Issued</h2>
              <p className="text-sm text-slate-500 mt-1">You don't have any books checked out.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-slide-up">
              {issues.map(iss => {
                const days = daysUntilDue(iss.due_date);
                const book = issueBooks[iss.book_id];
                const isOverdue = days < 0;
                const isDueSoon = days >= 0 && days <= 3;
                return (
                  <div key={iss.id} className={`bg-white rounded-[24px] p-5 shadow-sm border ${isOverdue ? 'border-red-200 bg-red-50/30' : isDueSoon ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-900">{book?.title || 'Book'}</h3>
                        {book && <p className="text-xs text-slate-500">{book.author}</p>}
                      </div>
                      {isOverdue ? (
                        <span className="text-[9px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-lg uppercase">Overdue</span>
                      ) : isDueSoon ? (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-lg uppercase">Due Soon</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg uppercase">Active</span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Issued</p>
                        <p className="text-xs font-bold text-slate-700">{new Date(iss.issued_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Due</p>
                        <p className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>{new Date(iss.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Renewals</p>
                        <p className="text-xs font-bold text-slate-700">{iss.renewed_count}/2</p>
                      </div>
                    </div>

                    {iss.fine_amount > 0 && (
                      <div className="mt-2 bg-red-50 rounded-xl px-3 py-2">
                        <span className="text-xs font-bold text-red-600">Fine: ₹{iss.fine_amount}</span>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => renewBook(iss.id)}
                        disabled={iss.renewed_count >= 2 || renewing === iss.id}
                        className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {renewing === iss.id ? 'Renewing...' : iss.renewed_count >= 2 ? 'Max renewals' : 'Renew (+14 days)'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default LibraryPortal;
