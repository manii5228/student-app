import React, { useState, useEffect } from 'react';
import { ChevronLeft, Search, BookOpen, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Book { 
  id: string; 
  title: string; 
  author: string; 
  isbn: string | null; 
  category: string | null; 
  total_copies: number; 
  available_copies: number; 
  shelf_location: string | null; 
}

const LibraryPortal = () => {
  const nav = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);

  const categories = ['Engineering', 'Science', 'Mathematics', 'Computer Science', 'Literature', 'Reference'];

  // Fetch books matching current category and query
  const searchBooks = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (query) params.q = query;
      if (category) params.category = category;
      const { data } = await api.get('/campus/library/books', { params });
      setBooks(data.books || data || []);
    } catch (e) {
      console.error('Failed to search books:', e);
    }
    setLoading(false);
  };

  // Bind search to category and query change
  useEffect(() => {
    searchBooks();
  }, [category, query]);

  // Load all books for quick count stats
  useEffect(() => {
    loadAllBooks();
  }, []);

  const loadAllBooks = async () => {
    try {
      const { data } = await api.get('/campus/library/books', { params: {} });
      setAllBooks(data.books || data || []);
    } catch (e) {
      console.error('Failed to load all books:', e);
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header with warm ambient theme */}
      <div className="bg-gradient-to-br from-amber-600 to-orange-700 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl"></div>
        
        <div className="flex items-center gap-3 relative z-10 mb-4">
          <button 
            onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (role === 'faculty') nav('/faculty');
              else if (role === 'admin') nav('/admin');
              else nav(-1);
            }} 
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Library Portal</h1>
            <p className="text-xs text-amber-100">Search and browse collection</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative z-10">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl flex items-center gap-2 px-4 py-3">
            <Search className="w-4 h-4 text-white/70 shrink-0" />
            <input
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by title or author..."
              className="bg-transparent text-white text-sm font-medium placeholder:text-white/50 flex-1 outline-none"
            />
          </div>
        </div>

        {/* Library Info stats */}
        <div className="flex gap-3 mt-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
            <p className="text-[9px] font-bold text-amber-100 uppercase tracking-wider">Total Books</p>
            <p className="text-lg font-black text-white">{allBooks.length}</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/10">
            <p className="text-[9px] font-bold text-amber-100 uppercase tracking-wider">Available Titles</p>
            <p className="text-lg font-black text-white">{allBooks.filter(b => b.available_copies > 0).length}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 shrink-0 scrollbar-hide">
          <button 
            onClick={() => setCategory('')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              !category ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            All
          </button>
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                category === c ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Scrollable Book Grid/List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></span>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[24px] border border-slate-100 shadow-sm p-6">
              <BookOpen className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <h2 className="text-sm font-bold text-slate-800">No Books Found</h2>
              <p className="text-xs text-slate-400 mt-1">Try a different search term or category</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 animate-slide-up pb-6">
              {books.map(book => (
                <div key={book.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex gap-4">
                  {/* Book icon */}
                  <div className={`w-14 h-20 rounded-xl flex items-center justify-center shrink-0 ${
                    book.available_copies > 0 ? 'bg-gradient-to-br from-amber-100 to-orange-100' : 'bg-slate-100'
                  }`}>
                    <BookOpen className={`w-6 h-6 ${book.available_copies > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2">{book.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
                    
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {book.category && (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">
                          {book.category}
                        </span>
                      )}
                      {book.shelf_location && (
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-slate-350" /> {book.shelf_location}
                        </span>
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
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default LibraryPortal;
