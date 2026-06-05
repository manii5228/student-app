import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Edit2, Trash2, MapPin, Search, PlusCircle, Trash, Save, HelpCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface POI {
  id: string;
  name: string;
  type: string;
  building?: string;
  floor?: string;
  desc: string;
  coords: [number, number];
  directions: Record<string, string[]>;
}

const STARTING_POINTS = [
  { id: 'maingate', name: 'Main Security Gate' },
  { id: 'adminlobby', name: 'Admin Block Entrance Lobby' },
  { id: 'block24lobby', name: 'Block 24 Ground Floor Lobby' }
];

const AdminIndoorMap = () => {
  const navigate = useNavigate();
  const [pois, setPois] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [editingPoi, setEditingPoi] = useState<POI | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [type, setType] = useState('academic');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [desc, setDesc] = useState('');
  const [lat, setLat] = useState('13.1818');
  const [lng, setLng] = useState('80.0401');

  // Directions editor state
  const [selectedStartPointId, setSelectedStartPointId] = useState('maingate');
  const [directionsText, setDirectionsText] = useState('');

  const fetchPOIs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/indoor-pois');
      setPois(data.pois || []);
    } catch (err) {
      alert('Failed to load locations from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOIs();
  }, []);

  const openAddModal = () => {
    setEditingPoi(null);
    setName('');
    setType('academic');
    setBuilding('');
    setFloor('');
    setDesc('');
    setLat('13.1818');
    setLng('80.0401');
    setSelectedStartPointId('maingate');
    setDirectionsText('');
    setShowModal(true);
  };

  const openEditModal = (poi: POI) => {
    setEditingPoi(poi);
    setName(poi.name);
    setType(poi.type);
    setBuilding(poi.building || '');
    setFloor(poi.floor || '');
    setDesc(poi.desc);
    setLat(poi.coords[0] ? String(poi.coords[0]) : '13.1818');
    setLng(poi.coords[1] ? String(poi.coords[1]) : '80.0401');
    
    // Set directions for the default start point
    setSelectedStartPointId('maingate');
    const startDirections = poi.directions?.['maingate'] || [];
    setDirectionsText(startDirections.join('\n'));
    setShowModal(true);
  };

  // Sync directions text area when start point changes
  const handleStartPointChange = (startId: string) => {
    setSelectedStartPointId(startId);
    
    if (editingPoi) {
      // Load directions from local state
      const startDirections = editingPoi.directions?.[startId] || [];
      setDirectionsText(startDirections.join('\n'));
    } else {
      setDirectionsText('');
    }
  };

  const handleDelete = async (poiId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await api.delete(`/indoor-pois/${poiId}`);
      setPois(pois.filter(p => p.id !== poiId));
      alert('Location deleted successfully.');
    } catch {
      alert('Failed to delete location.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Location name is required.');
      return;
    }

    const parsedLat = parseFloat(lat) || 13.1818;
    const parsedLng = parseFloat(lng) || 80.0401;

    // Parse directions from textarea
    const steps = directionsText
      .split('\n')
      .map(step => step.trim())
      .filter(step => step.length > 0);

    // Build the directions object
    let finalDirections: Record<string, string[]> = {};
    if (editingPoi) {
      finalDirections = { ...editingPoi.directions };
      finalDirections[selectedStartPointId] = steps;
    } else {
      finalDirections[selectedStartPointId] = steps;
    }

    const payload = {
      name: name.trim(),
      type,
      building: building.trim(),
      floor: floor.trim(),
      desc: desc.trim(),
      coords: [parsedLat, parsedLng] as [number, number],
      directions: finalDirections
    };

    try {
      if (editingPoi) {
        // Edit API
        const { data } = await api.put(`/indoor-pois/${editingPoi.id}`, payload);
        setPois(pois.map(p => p.id === editingPoi.id ? data.poi : p));
        alert('Location updated successfully!');
      } else {
        // Create API
        const { data } = await api.post('/indoor-pois', payload);
        setPois([...pois, data.poi]);
        alert('Location added successfully!');
      }
      setShowModal(false);
      setEditingPoi(null);
    } catch (err) {
      alert('Failed to save location details.');
    }
  };

  // Temp helper to update directions local dictionary before submitting
  const handleDirectionsTextChange = (txt: string) => {
    setDirectionsText(txt);
    if (editingPoi) {
      const steps = txt.split('\n').map(s => s.trim()).filter(s => s.length > 0);
      const updatedDirections = { ...editingPoi.directions, [selectedStartPointId]: steps };
      setEditingPoi({ ...editingPoi, directions: updatedDirections });
    }
  };

  const filteredPois = pois.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.building && p.building.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-full bg-slate-50 flex flex-col font-sans animate-fade-in relative pb-24">
      {/* Header */}
      <div className="bg-slate-900 p-6 pt-12 shadow-md shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate('/admin')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Indoor Map Admin</h1>
            <p className="text-xs text-slate-400">Manage rooms & customized directions</p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="w-full bg-white/10 text-white placeholder:text-slate-400 rounded-xl py-2 pl-10 pr-4 text-xs font-semibold outline-none focus:bg-white/15"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 flex items-center gap-1 hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Room
          </button>
        </div>
      </div>

      {/* POI List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span></div>
        ) : filteredPois.length > 0 ? (
          filteredPois.map(poi => (
            <div key={poi.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-xs font-black text-slate-800 leading-tight">{poi.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Type: {poi.type} • Block: {poi.building || 'N/A'} • Floor: {poi.floor || 'N/A'}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-black text-slate-400">Directions:</span>
                  {STARTING_POINTS.map(s => {
                    const hasDir = poi.directions?.[s.id] && poi.directions[s.id].length > 0;
                    return (
                      <span 
                        key={s.id} 
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          hasDir ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'
                        }`}
                        title={s.name}
                      >
                        {s.id.substring(0, 5)}
                      </span>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => openEditModal(poi)}
                  className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                  title="Edit Room & Directions"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => handleDelete(poi.id)}
                  className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-all"
                  title="Delete Room"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">No campus locations matching search.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
            <h3 className="text-base font-black text-slate-900 mb-4 shrink-0">
              {editingPoi ? 'Edit Room & Directions' : 'Add Campus Location'}
            </h3>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 custom-scrollbar">
              {/* Basic Metadata */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Room / Location Name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="e.g. CSE Programming Lab 3"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Category Type</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none"
                  >
                    <option value="academic">Academic Block</option>
                    <option value="lab">Science/CS Lab</option>
                    <option value="library">Library Hub</option>
                    <option value="food">Food Court / Canteen</option>
                    <option value="restroom">Restroom</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Building Block</label>
                  <input 
                    type="text" 
                    value={building} 
                    onChange={e => setBuilding(e.target.value)} 
                    placeholder="e.g. Block 24"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Floor Level</label>
                  <input 
                    type="text" 
                    value={floor} 
                    onChange={e => setFloor(e.target.value)} 
                    placeholder="e.g. 2nd Floor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Description / Notes</label>
                  <input 
                    type="text" 
                    value={desc} 
                    onChange={e => setDesc(e.target.value)} 
                    placeholder="e.g. Room 212 - Java Programming"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Map Coords (Leaflet Marker Location)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Latitude</label>
                    <input 
                      type="text" 
                      value={lat} 
                      onChange={e => setLat(e.target.value)} 
                      placeholder="e.g. 13.1823"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 block mb-0.5">Longitude</label>
                    <input 
                      type="text" 
                      value={lng} 
                      onChange={e => setLng(e.target.value)} 
                      placeholder="e.g. 80.0387"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Directions Editor */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col gap-3">
                <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Step-by-Step Directions Editor
                </h4>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">Select Starting Location</label>
                  <select
                    value={selectedStartPointId}
                    onChange={e => handleStartPointChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
                  >
                    {STARTING_POINTS.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Directions from {STARTING_POINTS.find(s => s.id === selectedStartPointId)?.name}
                  </label>
                  <p className="text-[9px] text-slate-400 font-semibold mb-1.5">
                    Type each walk instruction step on a **new line**. Empty lines will be skipped.
                  </p>
                  <textarea
                    rows={4}
                    value={directionsText}
                    onChange={e => handleDirectionsTextChange(e.target.value)}
                    placeholder="e.g.&#10;Start at the Block 24 ground floor lobby.&#10;Take the staircase on the right up to 2nd Floor.&#10;Turn right and find Room 212 on the left."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none resize-none leading-relaxed h-28"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEditingPoi(null); }} 
                  className="flex-1 py-3 text-xs font-black text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-750 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" /> Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIndoorMap;
