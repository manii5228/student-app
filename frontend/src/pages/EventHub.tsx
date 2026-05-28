import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  ChevronLeft,
  Clock,
  MapPin,
  Ticket,
  Users,
  Code2,
  Cpu,
  Palette,
  Radio,
  Search,
  ShieldCheck,
  ClipboardCheck,
  Headphones,
  Megaphone,
  BadgeCheck,
  Image as ImageIcon,
  Play
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';
import UpsellModal from '../components/UpsellModal';

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
];

interface Club {
  id: string;
  name: string;
  description: string;
  club_type: string;
  member_count: number;
}

const FALLBACK_CLUBS: Club[] = [
  { id: 'codechef', name: 'CodeChef Chapter', description: 'Weekly CP ladders, contest discussions, and ICPC prep.', club_type: 'technical', member_count: 248 },
  { id: 'robotics', name: 'Robotics Society', description: 'Autonomous bots, drone builds, and embedded systems labs.', club_type: 'technical', member_count: 142 },
  { id: 'finearts', name: 'Fine Arts Forum', description: 'Poster design, stage props, murals, and event branding.', club_type: 'cultural', member_count: 96 },
];

const iconForClub = (type: string) => {
  if (type === 'cultural') return Palette;
  if (type === 'media') return Radio;
  if (type === 'technical') return Cpu;
  return Code2;
};

const COMMITTEES = [
  { id: 'stage', name: 'Stage Crew', icon: Headphones, slots: 12, color: 'bg-[#0080c7]/10 text-[#0080c7]' },
  { id: 'media', name: 'Media Desk', icon: Megaphone, slots: 8, color: 'bg-[#c9503d]/10 text-[#c9503d]' },
  { id: 'hospitality', name: 'Hospitality', icon: Users, slots: 15, color: 'bg-[#27bcd1]/15 text-[#0080c7]' },
  { id: 'security', name: 'Crowd Control', icon: ShieldCheck, slots: 18, color: 'bg-emerald-100 text-emerald-700' },
];

const HIGHLIGHTS = [
  { id: 1, type: 'video', url: 'https://images.unsplash.com/photo-1540039155732-6761b54cb6b5?w=800&q=80', title: 'Dance Crew Finale' },
  { id: 2, type: 'image', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', title: 'Live Concert' },
  { id: 3, type: 'image', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', title: 'DJ Night Crowd' },
  { id: 4, type: 'image', url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80', title: 'Tech Expo' }
];

const EventHub = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as any) || 'events';

  const [activeView, setActiveView] = useState<'events' | 'clubs' | 'volunteer' | 'highlights'>(initialTab);
  const [upsellOpen, setUpsellOpen] = useState(false);

  // Events State
  const [events, setEvents] = useState<CampusEvent[]>(FALLBACK_EVENTS);
  const [activeType, setActiveType] = useState('all');
  const [registered, setRegistered] = useState<string[]>([]);

  // Clubs State
  const [clubs, setClubs] = useState<Club[]>(FALLBACK_CLUBS);
  const [clubQuery, setClubQuery] = useState('');
  const [activeClubType, setActiveClubType] = useState('all');
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [clubFeeds, setClubFeeds] = useState<Record<string, any[]>>({});
  const [activeClubFeed, setActiveClubFeed] = useState<string | null>(null);

  // Volunteer State
  const [committee, setCommittee] = useState(COMMITTEES[0].id);
  const [shift, setShift] = useState('morning');
  const [volunteerSubmitted, setVolunteerSubmitted] = useState(() => localStorage.getItem('volunteer_submitted') === 'true');

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isGuest = user?.is_guest || user?.role === 'guest';

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/campus/events');
        if (Array.isArray(data.events) && data.events.length > 0) setEvents(data.events);
      } catch (error) { console.warn('Offline events:', error); }
    };
    const fetchMyRegistrations = async () => {
      try {
        const { data } = await api.get('/campus/events/my-registrations');
        if (Array.isArray(data.event_ids)) setRegistered(data.event_ids);
      } catch (error) {
        const cached = localStorage.getItem('registered_events');
        if (cached) setRegistered(JSON.parse(cached));
      }
    };
    const fetchClubs = async () => {
      try {
        const { data } = await api.get('/campus/clubs');
        if (Array.isArray(data.clubs) && data.clubs.length > 0) setClubs(data.clubs);
      } catch (error) { console.warn('Offline clubs:', error); }
    };
    const fetchMyClubs = async () => {
      try {
        const { data } = await api.get('/campus/clubs/my-clubs');
        if (Array.isArray(data.clubs)) setJoinedClubs(data.clubs.map((c: Club) => c.id));
      } catch (error) {
        const cached = localStorage.getItem('joined_clubs');
        if (cached) setJoinedClubs(JSON.parse(cached));
      }
    };

    fetchEvents();
    if (!isGuest) {
      fetchMyRegistrations();
      fetchMyClubs();
    }
  }, [isGuest]);

  // View open club feed
  useEffect(() => {
    if (activeClubFeed && !clubFeeds[activeClubFeed]) {
      api.get(`/campus/clubs/${activeClubFeed}/posts`)
        .then(res => {
          setClubFeeds(prev => ({ ...prev, [activeClubFeed]: res.data.posts }));
        })
        .catch(err => console.log("Failed to fetch club feed", err));
    }
  }, [activeClubFeed, clubFeeds]);


  const handleRegisterEvent = async (eventId: string) => {
    if (isGuest) { setUpsellOpen(true); return; }
    if (registered.includes(eventId)) return;
    const newRegistered = [...registered, eventId];
    setRegistered(newRegistered);
    localStorage.setItem('registered_events', JSON.stringify(newRegistered));
    setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, registration_count: e.registration_count + 1 } : e));
    try { await api.post(`/campus/events/${eventId}/register`, { role: 'participant' }); } catch (error) { }
  };

  const handleJoinClub = async (clubId: string) => {
    if (isGuest) { setUpsellOpen(true); return; }
    if (joinedClubs.includes(clubId)) {
        // Toggle view feed
        setActiveClubFeed(activeClubFeed === clubId ? null : clubId);
        return;
    }
    const newJoined = [...joinedClubs, clubId];
    setJoinedClubs(newJoined);
    localStorage.setItem('joined_clubs', JSON.stringify(newJoined));
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, member_count: c.member_count + 1 } : c));
    try { await api.post(`/campus/clubs/${clubId}/join`); } catch (error) { }
  };

  const handleVolunteerSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isGuest) { setUpsellOpen(true); return; }
    setVolunteerSubmitted(true);
    localStorage.setItem('volunteer_submitted', 'true');
    localStorage.setItem('volunteer_committee', committee);
  };

  const renderTabs = () => (
    <div className="px-5 pt-5 pb-2">
      <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-x-auto hide-scrollbar">
        {['events', 'clubs', 'volunteer', 'highlights'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveView(tab as any); setActiveClubFeed(null); }}
            className={`flex-1 min-w-[90px] py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
              activeView === tab ? 'bg-[#0080c7] text-white shadow-md' : 'text-slate-500'
            }`}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-[#0080c7] p-6 pt-12 rounded-b-[36px] shadow-md text-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => {
              const role = JSON.parse(localStorage.getItem('user') || '{}').role;
              if (window.history.length > 2) { navigate(-1); }
              else { navigate(role === 'faculty' ? '/faculty' : role === 'admin' ? '/admin' : '/campus'); }
            }} className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Event & Comm Hub</h1>
            <p className="text-xs text-white/75">Fests, clubs, volunteer, and highlights</p>
          </div>
        </div>
      </div>

      {renderTabs()}

      <div className="flex-1 overflow-y-auto custom-scrollbar px-5">
        {/* Events Tab */}
        {activeView === 'events' && (
          <div className="flex flex-col gap-4 pb-6">
            <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
              {['all', ...Array.from(new Set(events.map(e => e.event_type)))].map((type) => (
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

            {(activeType === 'all' ? events : events.filter(e => e.event_type === activeType)).map((event) => {
              const date = new Date(event.start_date);
              const seatsLeft = event.max_participants ? Math.max(event.max_participants - event.registration_count, 0) : null;
              const isReg = registered.includes(event.id);

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
                      </div>
                      <h3 className="text-base font-black text-slate-900 leading-tight">{event.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{event.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Ticket className="w-4 h-4 text-[#c9503d]" />
                      {seatsLeft === null ? 'Open entry' : `${seatsLeft} seats left`}
                    </div>
                    <button
                      onClick={() => handleRegisterEvent(event.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                        isReg ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white active:scale-95'
                      }`}
                    >
                      {isReg ? 'Registered' : 'Register'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Clubs Tab */}
        {activeView === 'clubs' && (
          <div className="flex flex-col gap-4 pb-6">
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-3 mt-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                value={clubQuery}
                onChange={(e) => setClubQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
                placeholder="Search clubs"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto py-2 hide-scrollbar">
              {['all', ...Array.from(new Set(clubs.map(c => c.club_type)))].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveClubType(type)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold capitalize ${
                    activeClubType === type ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {clubs.filter(c => 
                (activeClubType === 'all' || c.club_type === activeClubType) && 
                c.name.toLowerCase().includes(clubQuery.toLowerCase())
            ).map((club) => {
              const Icon = iconForClub(club.club_type);
              const isJoined = joinedClubs.includes(club.id);
              const isActiveFeed = activeClubFeed === club.id;

              return (
                <div key={club.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-[#0080c7]/10 text-[#0080c7] flex items-center justify-center shrink-0">
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-black text-slate-900 leading-tight">{club.name}</h3>
                        {isJoined && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{club.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-slate-400">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {club.member_count} members</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinClub(club.id)}
                    className={`mt-4 w-full py-3 rounded-2xl text-xs font-black transition-all ${
                      isJoined ? (isActiveFeed ? 'bg-slate-100 text-slate-700' : 'bg-emerald-50 text-emerald-600') : 'bg-slate-900 text-white'
                    }`}
                  >
                    {!isJoined ? 'Join Club' : isActiveFeed ? 'Close Feed' : 'View Club Feed'}
                  </button>

                  {isActiveFeed && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-fade-in">
                       <h4 className="text-sm font-bold text-slate-900 mb-3 flex justify-between items-center">
                           Club Updates
                           <button className="text-[10px] bg-[#0080c7] text-white px-2 py-1 rounded-full">Scan Attendance</button>
                       </h4>
                       {clubFeeds[club.id]?.length ? (
                           <div className="flex flex-col gap-3">
                               {clubFeeds[club.id].map(post => (
                                   <div key={post.id} className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 border border-slate-100">
                                       <div className="font-bold mb-1 text-slate-900">President Post</div>
                                       {post.content}
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <p className="text-xs text-slate-400 italic text-center py-2">No updates yet.</p>
                       )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Volunteer Tab */}
        {activeView === 'volunteer' && (
          <div className="flex flex-col gap-5 pb-6 pt-2">
            {volunteerSubmitted ? (
              <div className="bg-white rounded-[30px] p-7 shadow-sm border border-slate-100 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
                  <BadgeCheck className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900">Application Sent</h2>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Your request is queued for the student coordinator.
                </p>
                <div className="mt-6 bg-[#0080c7]/5 rounded-2xl p-4 flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-600 uppercase">Volunteer Hours</p>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-[#0080c7] h-2 rounded-full" style={{width: '20%'}}></div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500">12 / 60 hours required</p>
                </div>
                <button onClick={() => setVolunteerSubmitted(false)} className="mt-6 w-full bg-slate-900 text-white py-4 rounded-2xl text-sm font-black">
                  Submit Another
                </button>
              </div>
            ) : (
              <form onSubmit={handleVolunteerSubmit} className="flex flex-col gap-5">
                <div>
                  <h2 className="text-sm font-black text-slate-900 mb-3">Choose Committee</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {COMMITTEES.map((item) => {
                      const Icon = item.icon;
                      const isActive = committee === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setCommittee(item.id)}
                          className={`bg-white rounded-[24px] p-4 text-left border shadow-sm transition-all ${
                            isActive ? 'border-[#0080c7] ring-2 ring-[#0080c7]/15' : 'border-slate-100'
                          }`}
                        >
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${item.color}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-sm font-black text-slate-900">{item.name}</h3>
                          <p className="text-[11px] font-bold text-slate-400 mt-1">{item.slots} slots left</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100">
                  <h2 className="text-sm font-black text-slate-900 mb-4">Application Details</h2>
                  <div className="flex flex-col gap-4">
                    <select
                      value={shift}
                      onChange={(e) => setShift(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:outline-none"
                    >
                      <option value="morning">Morning Shift</option>
                      <option value="afternoon">Afternoon Shift</option>
                      <option value="evening">Evening Shift</option>
                    </select>
                    <textarea
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 h-28 resize-none focus:outline-none"
                      placeholder="Mention prior experience."
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-[#0080c7] text-white py-4 rounded-2xl text-sm font-black shadow-lg shadow-blue-500/20">
                  Apply for Role
                </button>
              </form>
            )}
          </div>
        )}

        {/* Highlights Tab */}
        {activeView === 'highlights' && (
          <div className="flex flex-col gap-5 pb-6 pt-2">
            <h2 className="text-lg font-black text-slate-900">LAVAZA '26 Highlights</h2>
            <div className="flex flex-col gap-4">
                {HIGHLIGHTS.map(h => (
                    <div key={h.id} className="relative rounded-[28px] overflow-hidden bg-slate-900 shadow-md aspect-[4/3] group">
                        <img src={h.url} alt={h.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        {h.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white ml-1" />
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-white font-black text-lg">{h.title}</h3>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
      <UpsellModal isOpen={upsellOpen} onClose={() => setUpsellOpen(false)} />
    </div>
  );
};

export default EventHub;
