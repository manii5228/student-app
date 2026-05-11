import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, Search, Mail, Phone, BookOpen, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Faculty {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  department: string;
  designation: string | null;
  specialization: string | null;
  avatar_url: string | null;
}

const FacultyDirectory = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

  useEffect(() => {
    fetchFaculty();
  }, [deptFilter]);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (deptFilter) params.department = deptFilter;
      if (search) params.q = search;
      const { data } = await api.get('/academic/faculty-directory', { params });
      setFaculty(data.faculty || []);
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchFaculty();
  };

  const filtered = faculty.filter(f =>
    f.full_name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase()) ||
    (f.specialization || '').toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-red-500'];

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-orange-500 p-6 pt-12 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/academic')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Faculty Directory</h1>
              <p className="text-xs text-orange-100">{filtered.length} professors found</p>
            </div>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-300" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search by name or specialization..."
            className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-orange-200 focus:outline-none focus:bg-white/20 transition-all"
          />
        </div>

        {/* Department Filter Pills */}
        {showFilters && (
          <div className="flex gap-2 mt-3 overflow-x-auto relative z-10 pb-1 animate-fade-in">
            <button
              onClick={() => setDeptFilter('')}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${!deptFilter ? 'bg-white text-orange-600' : 'bg-white/10 text-white'}`}
            >
              All
            </button>
            {departments.map(d => (
              <button
                key={d}
                onClick={() => setDeptFilter(d)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${deptFilter === d ? 'bg-white text-orange-600' : 'bg-white/10 text-white'}`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-slate-200 rounded-full mx-auto flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">No Faculty Found</h2>
            <p className="text-sm text-slate-500 mt-1">Try a different search or department filter.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 animate-slide-up">
            {filtered.map((f, idx) => (
              <div key={f.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${colors[idx % colors.length]} flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0`}>
                  {f.avatar_url ? (
                    <img src={f.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
                  ) : (
                    getInitials(f.full_name)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">{f.full_name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                    {f.designation || 'Professor'} · {f.department || '—'}
                  </p>
                  {f.specialization && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 truncate">
                      <BookOpen className="w-3 h-3 shrink-0" /> {f.specialization}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <a href={`mailto:${f.email}`} className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                    <Mail className="w-4 h-4" />
                  </a>
                  {f.phone && (
                    <a href={`tel:${f.phone}`} className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default FacultyDirectory;
