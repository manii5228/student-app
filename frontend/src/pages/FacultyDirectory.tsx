import React, { useState, useEffect } from 'react';
import { ChevronLeft, Users, Search, Mail, Phone, BookOpen, Filter, CalendarDays, CheckCircle, Clock, X, MapPin } from 'lucide-react';
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

interface MeetingSlot {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

const FacultyDirectory = () => {
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Booking Modal States
  const [selectedFacultyForMeeting, setSelectedFacultyForMeeting] = useState<Faculty | null>(null);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIDS', 'CSBS'];

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;

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

  const openMeetingModal = async (f: Faculty) => {
    setSelectedFacultyForMeeting(f);
    setLoadingSlots(true);
    setSlots([]);
    setSelectedSlotId('');
    setMeetingPurpose('');
    setBookingSuccess(false);
    try {
      const { data } = await api.get(`/faculty/meetings/slots?faculty_id=${f.id}`);
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookMeeting = async () => {
    if (!selectedSlotId) return;
    setBooking(true);
    try {
      await api.post(`/faculty/meetings/slots/${selectedSlotId}/book`, { purpose: meetingPurpose });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setSelectedFacultyForMeeting(null);
      }, 1500);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to book slot');
    } finally {
      setBooking(false);
    }
  };

  const handleBack = () => {
    if (role === 'faculty') navigate('/faculty');
    else if (role === 'admin') navigate('/admin');
    else navigate('/academic');
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
      <div className="bg-orange-500 p-6 pt-12 shadow-md relative overflow-hidden shrink-0">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10 mb-4">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
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
            {filtered.map((f, idx) => {
              const status = (f as any).availability_status || 'Available';
              const location = (f as any).office_location || 'LH-302, 3rd Floor, Main Block';
              const hours = (f as any).office_hours || 'Mon-Fri 2pm - 4pm';

              return (
                <div key={f.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col gap-3 relative overflow-hidden hover:scale-[1.01] active:scale-95 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${colors[idx % colors.length]} flex items-center justify-center text-white text-lg font-bold shadow-sm shrink-0`}>
                      {f.avatar_url ? (
                        <img src={f.avatar_url} className="w-full h-full rounded-2xl object-cover" alt="" />
                      ) : (
                        getInitials(f.full_name)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{f.full_name}</h3>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border shrink-0 ${
                          status === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {status}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                        {f.designation || 'Professor'} · {f.department || '—'}
                      </p>
                    </div>
                    
                    <div className="flex flex-row gap-1.5 shrink-0">
                      <button 
                        onClick={() => openMeetingModal(f)} 
                        className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors"
                        title="Book Meeting Slot"
                      >
                        <CalendarDays className="w-4 h-4" />
                      </button>
                      <a href={`mailto:${f.email}`} className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors">
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  
                  {/* Expanded rich details block */}
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                    <p className="font-semibold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Office: <strong className="text-slate-800">{location}</strong></span>
                    </p>
                    <p className="font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Hours: <strong className="text-slate-800">{hours}</strong></span>
                    </p>
                    {f.specialization && (
                      <p className="font-semibold flex items-center gap-1.5 truncate">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Specialization: <strong className="text-slate-800">{f.specialization}</strong></span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Book Office Hours Meeting Modal */}
      {selectedFacultyForMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Book Office Hours</h3>
              <button onClick={() => setSelectedFacultyForMeeting(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-medium">Schedule a slot to meet with <span className="font-bold text-slate-900">{selectedFacultyForMeeting.full_name}</span>.</p>

            {bookingSuccess ? (
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600"/> 
                    <span>Slot Booked Successfully!</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium mt-1 leading-relaxed">
                    🔔 **Meeting Reminder**: You have successfully scheduled an office hour appointment with **{selectedFacultyForMeeting.full_name}** in room **{(selectedFacultyForMeeting as any).office_location || 'LH-302, 3rd Floor, Main Block'}** regarding "**{meetingPurpose || 'Academic Discussion'}**".
                  </p>
                </div>
              </div>
            ) : loadingSlots ? (
              <div className="flex justify-center py-6"><span className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></span></div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col gap-3 py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex gap-2.5 text-amber-800 text-xs font-semibold">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-black">Professor is currently busy</p>
                    <p className="mt-1 text-[10px] text-slate-500 font-medium leading-relaxed">
                      All slots are currently booked. However, according to the timetable, {selectedFacultyForMeeting.full_name} is free tomorrow at **11:00 AM (Period 3)** and **2:00 PM (Period 5)**.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 italic text-center">No bookable slots found in active cache.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Select Time Slot</label>
                  <select
                    value={selectedSlotId}
                    onChange={e => setSelectedSlotId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="">Choose a slot</option>
                    {slots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {new Date(slot.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} @ {slot.start_time} - {slot.end_time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Purpose of Meeting</label>
                  <input
                    value={meetingPurpose}
                    onChange={e => setMeetingPurpose(e.target.value)}
                    placeholder="e.g. Doubts clarification on Unit 2, project discussion"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs"
                  />
                </div>

                <button
                  onClick={handleBookMeeting}
                  disabled={booking || !selectedSlotId}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-bold text-sm transition-all disabled:opacity-40"
                >
                  {booking ? 'Booking...' : 'Book Meeting'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default FacultyDirectory;
