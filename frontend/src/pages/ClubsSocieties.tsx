import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Code2, Cpu, Palette, Radio, Search, ShieldCheck, Users, Plus, X, Award, CheckCircle, Globe, Link, Edit2, Trash2, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { api } from '../lib/api';

interface Club {
  id: string;
  name: string;
  description: string;
  club_type: string;
  member_count: number;
  president_id?: string | null;
  faculty_advisor_id?: string | null;
}

interface StudentUser {
  id: string;
  name: string;
  email: string;
  roll_number?: string;
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
  
  // Auth Info
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;
  const isFaculty = role === 'faculty';
  const isAdmin = role === 'admin';

  const [clubs, setClubs] = useState<Club[]>(FALLBACK_CLUBS);
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [joined, setJoined] = useState<string[]>([]);
  
  // Faculty Creation Modal State
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', club_type: 'technical' });
  const [creating, setCreating] = useState(false);

  // Faculty assignments
  const [assignedFeatures, setAssignedFeatures] = useState<string[]>([]);
  const [assignedClubs, setAssignedClubs] = useState<string[]>([]);

  // Assign President Modal State
  const [selectedClubForPresident, setSelectedClubForPresident] = useState<Club | null>(null);
  const [classStudents, setClassStudents] = useState<StudentUser[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [assigningPresident, setAssigningPresident] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Faculty Edit Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [selectedClubForEdit, setSelectedClubForEdit] = useState<Club | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', club_type: 'technical', website_url: '', instagram_url: '', linkedin_url: '' });
  const [updating, setUpdating] = useState(false);

  const openEditModal = (club: Club) => {
    setSelectedClubForEdit(club);
    setEditForm({
      name: club.name,
      description: club.description || '',
      club_type: club.club_type,
      website_url: (club as any).website_url || '',
      instagram_url: (club as any).instagram_url || '',
      linkedin_url: (club as any).linkedin_url || ''
    });
    setShowEdit(true);
  };

  const handleUpdateClub = async () => {
    if (!selectedClubForEdit || !editForm.name.trim()) return;
    setUpdating(true);
    try {
      await api.put(`/campus/clubs/${selectedClubForEdit.id}`, editForm);
      setShowEdit(false);
      loadClubs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to update club');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!window.confirm('Are you sure you want to delete this club?')) return;
    try {
      await api.delete(`/campus/clubs/${clubId}`);
      loadClubs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete club');
    }
  };

  const loadClubs = async () => {
    try {
      const { data } = await api.get('/campus/clubs');
      if (Array.isArray(data.clubs)) {
        setClubs(data.clubs);
      }
    } catch (error) {
      console.warn('Using offline club list:', error);
    }
  };

  const loadMyClubs = async () => {
    try {
      const { data } = await api.get('/campus/clubs/my-clubs');
      if (Array.isArray(data.clubs)) {
        setJoined(data.clubs.map((c: Club) => c.id));
      }
    } catch (error) {
      const cached = localStorage.getItem('joined_clubs');
      if (cached) setJoined(JSON.parse(cached));
    }
  };

  useEffect(() => {
    loadClubs();
    loadMyClubs();

    const fetchAssignments = async () => {
      try {
        const { data } = await api.get('/faculty/assignments');
        setAssignedFeatures(data.assigned_features || []);
        setAssignedClubs(data.assigned_clubs || []);
      } catch (error) {
        console.warn('Failed to load assignments:', error);
      }
    };
    if (role === 'faculty') {
      fetchAssignments();
    }
  }, [role]);

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
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, member_count: c.member_count + 1 } : c));
    try {
      await api.post(`/campus/clubs/${clubId}/join`);
    } catch (error) {
      console.warn('Saved club membership locally:', error);
    }
  };

  // Faculty: Create Club Action
  const handleCreateClub = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await api.post('/campus/clubs', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', description: '', club_type: 'technical' });
      loadClubs();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to create club');
    } finally {
      setCreating(false);
    }
  };

  // Faculty: Open Assign President Modal
  const openPresidentModal = async (club: Club) => {
    setSelectedClubForPresident(club);
    setLoadingStudents(true);
    setClassStudents([]);
    try {
      const { data } = await api.get('/faculty/class-students');
      setClassStudents(data.students || []);
    } catch (error) {
      console.error('Failed to load class students:', error);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Faculty: Submit President Assignment
  const handleAssignPresident = async (studentId: string) => {
    if (!selectedClubForPresident) return;
    setAssigningPresident(true);
    try {
      await api.put(`/campus/clubs/${selectedClubForPresident.id}/president`, { president_id: studentId });
      setSuccessMsg('President assigned successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setSelectedClubForPresident(null);
        loadClubs();
      }, 1500);
    } catch (error) {
      console.error(error);
    } finally {
      setAssigningPresident(false);
    }
  };

  const handleBack = () => {
    if (role === 'faculty') navigate('/faculty');
    else if (role === 'admin') navigate('/admin');
    else navigate('/campus');
  };

  return (
    <div className="min-h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-[#27bcd1] p-6 pt-12 rounded-b-[36px] shadow-md text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleBack} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Clubs & Societies</h1>
              <p className="text-xs text-white/80">Join communities and track activities</p>
            </div>
          </div>
          {(isAdmin || (isFaculty && (assignedFeatures.includes('clubs') || assignedFeatures.includes('club') || assignedClubs.length > 0))) && (
            <button onClick={() => setShowCreate(true)} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-white transition-all">
              <Plus className="w-5 h-5" />
            </button>
          )}
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
            const isAdvisor = club.faculty_advisor_id === user?.id || isAdmin;

            return (
              <div key={club.id} className="bg-white rounded-[28px] p-5 shadow-sm border border-slate-100 flex flex-col gap-4">
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
                      {club.president_id && <span className="text-amber-600 flex items-center gap-1 font-extrabold"><Award className="w-3 h-3"/> President Assigned</span>}
                    </div>
                    {/* Club Links */}
                    {((club as any).website_url || (club as any).instagram_url || (club as any).linkedin_url) && (
                      <div className="flex gap-2.5 mt-3">
                        {(club as any).website_url && (
                          <a href={(club as any).website_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 transition-colors" title="Website">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {(club as any).instagram_url && (
                          <a href={(club as any).instagram_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 transition-colors" title="Instagram">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {(club as any).linkedin_url && (
                          <a href={(club as any).linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-650 transition-colors" title="LinkedIn">
                            <Link className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {isAdvisor ? (
                  <div className="mt-2 border-t border-slate-100 pt-3 flex flex-col gap-2">
                    <p className="text-[10px] font-extrabold text-cyan-600 uppercase tracking-widest">advisor panel</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => openPresidentModal(club)}
                        className="py-2.5 rounded-xl text-xs font-bold bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
                      >
                        {club.president_id ? 'Reassign Pres.' : 'Assign Pres.'}
                      </button>
                      <button
                        onClick={() => openEditModal(club)}
                        className="py-2.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Details
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteClub(club.id)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Club
                    </button>
                  </div>
                ) : isFaculty ? (
                  <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-2 text-amber-700 text-xs">
                    <Lock className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Read-only: Locked for unassigned faculty. Only the assigned advisor can manage.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleJoin(club.id)}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition-all ${
                      isJoined ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white active:scale-[0.98]'
                    }`}
                  >
                    {isJoined ? 'Joined Club' : 'Join Club'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Faculty Create Club Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Create New Club</h2>
              <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500"/>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Club Name *</label>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="e.g. Coding Club"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Club Type</label>
                <select
                  value={createForm.club_type}
                  onChange={e => setCreateForm({...createForm, club_type: e.target.value})}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"
                >
                  <option value="technical">Technical</option>
                  <option value="cultural">Cultural</option>
                  <option value="media">Media</option>
                  <option value="other">Other / Social</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({...createForm, description: e.target.value})}
                  placeholder="Describe the club goals and activities..."
                  rows={3}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <button
                onClick={handleCreateClub}
                disabled={creating || !createForm.name.trim()}
                className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {creating ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Edit Club Modal */}
      {showEdit && selectedClubForEdit && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-t-[32px] p-6 w-full max-w-lg animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">Edit Club Details</h2>
              <button onClick={() => setShowEdit(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500"/>
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Club Name *</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  placeholder="e.g. Coding Club"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Club Type</label>
                <select
                  value={editForm.club_type}
                  onChange={e => setEditForm({...editForm, club_type: e.target.value})}
                  className="w-full bg-slate-50 rounded-xl px-3 py-2.5 text-sm border border-slate-200"
                >
                  <option value="technical">Technical</option>
                  <option value="cultural">Cultural</option>
                  <option value="media">Media</option>
                  <option value="other">Other / Social</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Describe the club goals and activities..."
                  rows={3}
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm border border-slate-200 focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Website Link</label>
                <input
                  value={editForm.website_url}
                  onChange={e => setEditForm({...editForm, website_url: e.target.value})}
                  placeholder="https://example.com"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Instagram Handle / URL</label>
                <input
                  value={editForm.instagram_url}
                  onChange={e => setEditForm({...editForm, instagram_url: e.target.value})}
                  placeholder="https://instagram.com/clubname"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">LinkedIn Page Link</label>
                <input
                  value={editForm.linkedin_url}
                  onChange={e => setEditForm({...editForm, linkedin_url: e.target.value})}
                  placeholder="https://linkedin.com/company/clubname"
                  className="w-full bg-slate-50 rounded-2xl px-4 py-3 text-sm font-medium border border-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                onClick={handleUpdateClub}
                disabled={updating || !editForm.name.trim()}
                className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold text-sm hover:bg-cyan-700 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {updating ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Assign President Modal */}
      {selectedClubForPresident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Assign President</h3>
              <button onClick={() => setSelectedClubForPresident(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">Assign a student from your class to be the president of <span className="font-bold text-slate-900">{selectedClubForPresident.name}</span>.</p>

            {successMsg ? (
              <div className="bg-emerald-50 text-emerald-700 rounded-2xl p-4 flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600"/> {successMsg}
              </div>
            ) : loadingStudents ? (
              <div className="flex justify-center py-6"><span className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></span></div>
            ) : classStudents.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No students found in your assigned class.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                {classStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => handleAssignPresident(student.id)}
                    disabled={assigningPresident}
                    className="w-full text-left bg-slate-50 hover:bg-cyan-50 border border-slate-100 hover:border-cyan-200 rounded-2xl p-3 flex items-center justify-between transition-all"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{student.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{student.roll_number || student.email}</p>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-600">Assign</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default ClubsSocieties;
