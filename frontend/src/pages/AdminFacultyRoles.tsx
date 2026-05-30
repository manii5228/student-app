import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Plus, Shield, Check, X,
  Briefcase, BookOpen, FileText, Calendar, Users, Award, 
  HelpCircle, Settings, Trash2
} from 'lucide-react';
import { api } from '../lib/api';

interface Faculty {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
}

interface Club {
  id: string;
  name: string;
  club_type: string;
}

const DEFAULT_FEATURE_KEYS = [
  { key: 'syllabus_tracker', label: 'Syllabus Tracker', icon: <BookOpen className="w-4 h-4" />, desc: 'Manage syllabus tracking & content completion' },
  { key: 'internal_marks', label: 'Marks Entry', icon: <FileText className="w-4 h-4" />, desc: 'Input and update student assessment grades' },
  { key: 'job_portal', label: 'Placement Officer', icon: <Briefcase className="w-4 h-4" />, desc: 'Add job postings & oversee placement statistics' },
  { key: 'interview_schedule', label: 'Interview Scheduler', icon: <Calendar className="w-4 h-4" />, desc: 'Book and schedule placement interviews' },
];

const AdminFacultyRoles = () => {
  const navigate = useNavigate();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  
  // Custom feature keys added dynamically
  const [customFeatures, setCustomFeatures] = useState<{key: string, label: string, icon: any, desc: string}[]>([]);
  const [newKeyInput, setNewKeyInput] = useState('');
  const [showAddKey, setShowAddKey] = useState(false);

  const [assignedFeatures, setAssignedFeatures] = useState<string[]>([]);
  const [assignedClubs, setAssignedClubs] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch faculties
        const resFaculty = await api.get('/admin/users?role=faculty');
        setFaculties(resFaculty.data.users || []);

        // 2. Fetch clubs
        const resClubs = await api.get('/campus/clubs');
        setClubs(resClubs.data.clubs || []);

        setLoading(false);
      } catch (err) {
        console.error("Error loading admin role data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch roles/assignments when selectedFaculty changes
  useEffect(() => {
    if (!selectedFaculty) return;
    const fetchAssignments = async () => {
      try {
        const { data } = await api.get(`/admin/assignments/${selectedFaculty.id}`);
        setAssignedFeatures(data.assigned_features || []);
        setAssignedClubs(data.assigned_clubs || []);
        
        // Populate any custom features that the faculty has but aren't in defaults
        const customKeysInUse = (data.assigned_features || []).filter(
          (key: string) => !DEFAULT_FEATURE_KEYS.some(df => df.key === key)
        );
        
        const generatedCustom = customKeysInUse.map((key: string) => ({
          key,
          label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          icon: <Settings className="w-4 h-4 text-purple-500" />,
          desc: 'Custom assigned feature permission key'
        }));
        
        // Remove duplicates and combine
        setCustomFeatures(prev => {
          const combined = [...prev];
          generatedCustom.forEach((item: any) => {
            if (!combined.some(c => c.key === item.key)) {
              combined.push(item);
            }
          });
          return combined;
        });

      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };
    fetchAssignments();
  }, [selectedFaculty]);

  const handleSave = async () => {
    if (!selectedFaculty) return;
    try {
      setSaving(true);
      await api.put(`/admin/assignments/${selectedFaculty.id}`, {
        assigned_features: assignedFeatures,
        assigned_clubs: assignedClubs
      });
      setToastMessage("Assignments saved successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Error saving assignments:", err);
      alert("Failed to save assignments.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = (key: string) => {
    setAssignedFeatures(prev => 
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  const handleToggleClub = (clubId: string) => {
    setAssignedClubs(prev => 
      prev.includes(clubId) ? prev.filter(c => c !== clubId) : [...prev, clubId]
    );
  };

  const handleAddCustomKey = () => {
    const trimmed = newKeyInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (!trimmed) return;
    
    // Check if it already exists in defaults or custom
    if (DEFAULT_FEATURE_KEYS.some(f => f.key === trimmed) || customFeatures.some(f => f.key === trimmed)) {
      alert("This permission key already exists.");
      return;
    }

    const newFeature = {
      key: trimmed,
      label: newKeyInput.trim(),
      icon: <Settings className="w-4 h-4 text-purple-500" />,
      desc: `Custom permission key: ${trimmed}`
    };

    setCustomFeatures(prev => [...prev, newFeature]);
    setAssignedFeatures(prev => [...prev, trimmed]); // Auto-enable
    setNewKeyInput('');
    setShowAddKey(false);
  };

  const filteredFaculties = faculties.filter(f => {
    const fullName = `${f.first_name || ''} ${f.last_name || ''}`.toLowerCase();
    const email = (f.email || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  const allFeatures = [...DEFAULT_FEATURE_KEYS, ...customFeatures];

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg z-50 flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-20 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-300" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Faculty Roles</h1>
            <p className="text-[10px] text-slate-400">AWS-style IAM Permissions Management</p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
          <Shield className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Faculty Directory */}
        <div className="w-full md:w-80 border-r border-slate-200 bg-white p-4 flex flex-col shrink-0">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Faculty Member</h2>
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[250px] md:max-h-none">
            {loading ? (
              <p className="text-xs text-slate-400 text-center py-4">Loading faculties...</p>
            ) : filteredFaculties.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No faculty found.</p>
            ) : (
              filteredFaculties.map(f => {
                const isSelected = selectedFaculty?.id === f.id;
                return (
                  <button 
                    key={f.id} 
                    onClick={() => setSelectedFaculty(f)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between
                      ${isSelected ? 'bg-purple-50 border-purple-300 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-150'}`}
                  >
                    <div>
                      <h3 className={`font-bold text-xs ${isSelected ? 'text-purple-900' : 'text-slate-900'}`}>
                        {f.first_name} {f.last_name}
                      </h3>
                      <p className="text-[10px] text-slate-500">{f.email}</p>
                      {f.department && (
                        <span className="inline-block mt-1 text-[8px] bg-slate-200 text-slate-700 px-1 py-0.5 rounded uppercase font-bold">
                          {f.department}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: AWS IAM Style Toggle Dashboard */}
        <div className="flex-1 bg-slate-50 p-6 overflow-y-auto">
          {!selectedFaculty ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <Shield className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-500">No Faculty Selected</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">Select a faculty member from the directory list to edit their dashboard permissions and roles.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="bg-white rounded-2xl p-4 border border-slate-150 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[9px] bg-purple-100 text-purple-700 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">ACTIVE USER POLICY</span>
                  <h2 className="text-base font-bold text-slate-900 mt-1">
                    {selectedFaculty.first_name} {selectedFaculty.last_name}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedFaculty.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-700">{assignedFeatures.length + assignedClubs.length} Active Rules</p>
                  <p className="text-[9px] text-slate-400">Custom policy overrides</p>
                </div>
              </div>

              {/* Coordinator Dashboard Feature Access */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feature permission keys</h3>
                    <p className="text-[10px] text-slate-500">Toggle keys to authorize faculty to view or administer modules</p>
                  </div>
                  
                  {/* Custom permission trigger */}
                  <button 
                    onClick={() => setShowAddKey(!showAddKey)}
                    className="flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add custom key
                  </button>
                </div>

                {showAddKey && (
                  <div className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 mb-3 flex gap-2 items-center animate-fade-in">
                    <input 
                      type="text" 
                      placeholder="e.g. syllabus_tracker_hod, career_advisor"
                      value={newKeyInput}
                      onChange={(e) => setNewKeyInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button 
                      onClick={handleAddCustomKey}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700"
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => { setShowAddKey(false); setNewKeyInput(''); }}
                      className="p-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {allFeatures.map(feat => {
                    const isActive = assignedFeatures.includes(feat.key);
                    return (
                      <div 
                        key={feat.key} 
                        onClick={() => handleToggleFeature(feat.key)}
                        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none flex items-start justify-between hover:shadow-sm
                          ${isActive ? 'border-purple-300 bg-purple-50/10' : 'border-slate-150'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                            ${isActive ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                            {feat.icon}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              {feat.label}
                              {customFeatures.some(cf => cf.key === feat.key) && (
                                <span className="text-[8px] bg-amber-100 text-amber-800 font-bold px-1 rounded uppercase">Custom</span>
                              )}
                            </h4>
                            <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-2">{feat.desc}</p>
                            <code className="text-[8px] font-mono text-slate-500 bg-slate-100 px-1 rounded mt-1.5 inline-block">{feat.key}</code>
                          </div>
                        </div>

                        {/* Switch UI */}
                        <div className={`w-8 h-4 rounded-full p-0.5 transition-colors shrink-0 mt-1
                          ${isActive ? 'bg-purple-600' : 'bg-slate-200'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform
                            ${isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Club / Advisor Assignments */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Clubs & Societies Advisor assignments</h3>
                <p className="text-[10px] text-slate-500 mb-3">Select the student clubs this faculty member officially supervises as an Advisor</p>

                {clubs.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-white p-4 text-center rounded-2xl border border-slate-150">No clubs created in the system yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {clubs.map(club => {
                      const isActive = assignedClubs.includes(club.id);
                      return (
                        <div 
                          key={club.id} 
                          onClick={() => handleToggleClub(club.id)}
                          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none flex items-start justify-between hover:shadow-sm
                            ${isActive ? 'border-purple-300 bg-purple-50/10' : 'border-slate-150'}`}
                        >
                          <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                              ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-800">{club.name}</h4>
                              <p className="text-[9px] text-slate-400 capitalize mt-0.5">{club.club_type} Club</p>
                              <code className="text-[8px] font-mono text-slate-400 block mt-1">ID: {club.id.substring(0, 8)}...</code>
                            </div>
                          </div>

                          {/* Switch UI */}
                          <div className={`w-8 h-4 rounded-full p-0.5 transition-colors shrink-0 mt-1
                            ${isActive ? 'bg-purple-600' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white transition-transform
                              ${isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating / Bottom Save Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-md flex items-center justify-between sticky bottom-0">
                <div>
                  <p className="text-xs font-semibold text-slate-700">Save Changes for {selectedFaculty.first_name}</p>
                  <p className="text-[9px] text-slate-400">Overwrites existing access roles immediately</p>
                </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  {saving ? 'Saving...' : 'Apply Policies'}
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminFacultyRoles;
