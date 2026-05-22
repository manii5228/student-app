import { useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronLeft,
  Clock,
  MapPin,
  Mic2,
  Music,
  Sparkles,
  Ticket,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface CampusEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  venue: string;
  start_date: string;
  end_date?: string | null;
  max_participants?: number | null;
  registration_count: number;
}

const FALLBACK_EVENTS: CampusEvent[] = [
  {
    id: 'lavaza-26',
    title: "LAVAZA '26",
    description: 'Flagship cultural fest with music, dance, tech showcases, food lanes, and inter-college finals.',
    event_type: 'fest',
    venue: 'Main Auditorium',
    start_date: '2026-05-18T09:30:00+05:30',
    end_date: '2026-05-18T21:30:00+05:30',
    max_participants: 1200,
    registration_count: 846,
  },
  {
    id: 'hackgrid',
    title: 'HackGrid 36h',
    description: 'Build real campus utilities with mentors from alumni teams and industry judges.',
    event_type: 'technical',
    venue: 'CSE Block Lab 4',
    start_date: '2026-05-21T08:00:00+05:30',
    end_date: '2026-05-22T20:00:00+05:30',
    max_participants: 180,
    registration_count: 129,
  },
  {
    id: 'sports-night',
    title: 'Floodlight Sports Night',
    description: 'Department teams compete in volleyball, football shootout, and relay finals.',
    event_type: 'sports',
    venue: 'Central Ground',
    start_date: '2026-05-24T17:30:00+05:30',
    end_date: '2026-05-24T22:00:00+05:30',
    max_participants: 600,
    registration_count: 412,
  },
];

const LIVE_SCHEDULE = [
  { time: '09:30', title: 'Fest inauguration', venue: 'Main Auditorium', status: 'Now', icon: Sparkles },
  { time: '11:00', title: 'Battle of Bands prelims', venue: 'Open Stage', status: 'Next', icon: Music },
  { time: '13:30', title: 'HackGrid mentor clinic', venue: 'CSE Block Lab 4', status: 'Soon', icon: Users },
  { time: '18:00', title: 'Celebrity pro show', venue: 'Central Ground', status: 'Prime', icon: Mic2 },
];

import UpsellModal from '../components/UpsellModal';

const EventHub = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<CampusEvent[]>(FALLBACK_EVENTS);
  const [activeType, setActiveType] = useState('all');
  const [registered, setRegistered] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<'events' | 'schedule'>('events');
  const [upsellOpen, setUpsellOpen] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuest = user?.is_guest || user?.role === 'guest';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/campus/events');
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      } catch (error) {
        console.warn('Using offline event feed:', error);
      }
    };

    const fetchMyRegistrations = async () => {
      try {
        const { data } = await api.get('/campus/events/my-registrations');
        if (Array.isArray(data.event_ids)) {
          setRegistered(data.event_ids);
        }
      } catch (error) {
        // Fallback: load from localStorage
        const cached = localStorage.getItem('registered_events');
        if (cached) setRegistered(JSON.parse(cached));
      }
    };

    fetchEvents();
    fetchMyRegistrations();
  }, []);

  const eventTypes = useMemo(() => ['all', ...Array.from(new Set(events.map((event) => event.event_type)))], [events]);
  const filteredEvents = activeType === 'all' ? events : events.filter((event) => event.event_type === activeType);
  const featured = events[0];

  const handleRegister = async (eventId: string) => {
    if (isGuest) {
      setUpsellOpen(true);
      return;
    }
    if (registered.includes(eventId)) return;

    const newRegistered = [...registered, eventId];
    setRegistered(newRegistered);
    localStorage.setItem('registered_events', JSON.stringify(newRegistered));
    // Optimistically update registration count
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registration_count: e.registration_count + 1 } : e));
    try {
      await api.post(`/campus/events/${eventId}/register`, { role: 'participant' });
    } catch (error) {
      console.warn('Saved event registration locally:', error);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-[#0080c7] p-6 pt-12 rounded-b-[36px] shadow-md text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/campus')} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Event Hub</h1>
              <p className="text-xs text-white/75">Fests, registrations, live stage flow</p>
            </div>
          </div>
          <button onClick={() => navigate('/campus/volunteer')} className="w-10 h-10 rounded-full bg-white text-[#0080c7] flex items-center justify-center shadow-lg">
            <Users className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 rounded-[28px] overflow-hidden bg-slate-950 shadow-xl">
          <div
            className="h-40 bg-cover bg-center relative"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=900&q=80')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <span className="bg-[#a91f23] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">Featured</span>
              <h2 className="text-2xl font-black mt-2 leading-tight">{featured.title}</h2>
              <p className="text-xs text-slate-200 mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {featured.venue}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="grid grid-cols-2 bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveView('events')}
            className={`py-3 rounded-xl text-xs font-bold transition-all ${activeView === 'events' ? 'bg-[#0080c7] text-white shadow-md' : 'text-slate-500'}`}
          >
            Events
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={`py-3 rounded-xl text-xs font-bold transition-all ${activeView === 'schedule' ? 'bg-[#0080c7] text-white shadow-md' : 'text-slate-500'}`}
          >
            Live Schedule
          </button>
        </div>
      </div>

      {activeView === 'events' ? (
        <div className="flex-1 overflow-y-auto px-5 pt-4 custom-scrollbar">
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold capitalize ${
                  activeType === type ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {filteredEvents.map((event) => {
              const date = new Date(event.start_date);
              const seatsLeft = event.max_participants ? Math.max(event.max_participants - event.registration_count, 0) : null;
              const isRegistered = registered.includes(event.id);

              return (
                <div key={event.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#27bcd1]/15 flex flex-col items-center justify-center text-[#0080c7] shrink-0">
                      <span className="text-[10px] font-black uppercase">{date.toLocaleString('en-US', { month: 'short' })}</span>
                      <span className="text-2xl font-black leading-none">{date.getDate()}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">{event.event_type}</span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">{event.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{event.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Ticket className="w-4 h-4 text-[#c9503d]" />
                      {seatsLeft === null ? 'Open entry' : `${seatsLeft} seats left`}
                    </div>
                    <button
                      onClick={() => handleRegister(event.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        isRegistered ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white active:scale-95'
                      }`}
                    >
                      {isRegistered ? 'Registered' : 'Register'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#a91f23]/10 text-[#a91f23] flex items-center justify-center">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">Today at LAVAZA</h2>
                <p className="text-xs font-medium text-slate-500">Real-time stage updates</p>
              </div>
            </div>

            <div className="flex flex-col">
              {LIVE_SCHEDULE.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                        <Icon className="w-5 h-5" />
                      </div>
                      {index < LIVE_SCHEDULE.length - 1 && <div className="w-px flex-1 bg-slate-200 my-2" />}
                    </div>
                    <div className="pb-5 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black text-slate-900">{item.title}</p>
                        <span className="text-[10px] font-black px-2 py-1 rounded-full bg-[#27bcd1]/15 text-[#0080c7]">{item.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{item.time} at {item.venue}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={() => isGuest ? setUpsellOpen(true) : navigate('/campus/volunteer')} className="w-full bg-[#c9503d] text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-red-500/20">
            Apply as Volunteer
          </button>
        </div>
      )}

      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
};

export default EventHub;
