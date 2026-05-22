import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Code2, Cpu, Palette, Radio, Search, ShieldCheck, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

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
  { id: 'gdsc', name: 'Developer Student Club', description: 'Cloud, Android, web workshops, and product build sprints.', club_type: 'technical', member_count: 311 },
  { id: 'finearts', name: 'Fine Arts Forum', description: 'Poster design, stage props, murals, and event branding.', club_type: 'cultural', member_count: 96 },
  { id: 'radio', name: 'Campus Radio', description: 'Host shows, record interviews, and handle event announcements.', club_type: 'media', member_count: 54 },
];

const iconForClub = (type: string) => {
  if (type === 'cultural') return Palette;
  if (type === 'media') return Radio;
  if (type === 'technical') return Cpu;
  return Code2;
};

const ClubsSocieties = () => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>(FALLBACK_CLUBS);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const { data } = await api.get('/campus/clubs');
        if (Array.isArray(data.clubs) && data.clubs.length > 0) {
          setClubs(data.clubs);
        }
      } catch (error) {
        console.warn('Using offline club list:', error);
      }
    };

    const fetchMyClubs = async () => {
      try {
        const { data } = await api.get('/campus/clubs/my-clubs');
        if (Array.isArray(data.clubs)) {
          setJoined(data.clubs.map((c: Club) => c.id));
        }
      } catch (error) {
        // Fallback: load from localStorage
        const cached = localStorage.getItem('joined_clubs');
        if (cached) setJoined(JSON.parse(cached));
      }
    };

    fetchClubs();
    fetchMyClubs();
  }, []);

  const clubTypes = useMemo(() => ['all', ...Array.from(new Set(clubs.map((club) => club.club_type)))], [clubs]);
  const filteredClubs = clubs.filter((club) => {
    const matchesType = activeType === 'all' || club.club_type === activeType;
    const matchesQuery = `${club.name} ${club.description}`.toLowerCase().includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  const handleJoin = async (clubId: string) => {
    if (joined.includes(clubId)) return;

    const newJoined = [...joined, clubId];
    setJoined(newJoined);
    localStorage.setItem('joined_clubs', JSON.stringify(newJoined));
    // Update member count optimistically
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, member_count: c.member_count + 1 } : c));
    try {
      await api.post(`/campus/clubs/${clubId}/join`);
    } catch (error) {
      console.warn('Saved club membership locally:', error);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      <div className="bg-[#27bcd1] p-6 pt-12 rounded-b-[36px] shadow-md text-white">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/campus')} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Clubs & Societies</h1>
            <p className="text-xs text-white/80">Join communities and track activities</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-2xl font-black">{clubs.length}</p>
            <p className="text-[10px] font-bold text-white/75">Active clubs</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-2xl font-black">{joined.length}</p>
            <p className="text-[10px] font-bold text-white/75">Joined</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-2xl font-black">12</p>
            <p className="text-[10px] font-bold text-white/75">This week</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-5">
        <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-400"
            placeholder="Search clubs"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto py-4 hide-scrollbar">
          {clubTypes.map((type) => (
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
      </div>

      <div className="flex-1 overflow-y-auto px-5 custom-scrollbar">
        <div className="flex flex-col gap-4">
          {filteredClubs.map((club) => {
            const Icon = iconForClub(club.club_type);
            const isJoined = joined.includes(club.id);

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
                      <span className="capitalize">{club.club_type}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleJoin(club.id)}
                  className={`mt-4 w-full py-3 rounded-2xl text-xs font-black transition-all ${
                    isJoined ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white active:scale-[0.98]'
                  }`}
                >
                  {isJoined ? 'Joined Club' : 'Join Club'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ClubsSocieties;
