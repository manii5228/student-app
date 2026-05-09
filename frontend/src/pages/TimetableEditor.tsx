import React, { useState } from 'react';
import { ChevronLeft, Save, AlertTriangle, Search, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00'];

const INITIAL_GRID = {
  Mon: { '09:00': 'CS301-A', '10:00': 'CS302-A', '11:00': null, '12:00': 'MA301-A', '14:00': 'LAB-1', '15:00': 'LAB-1' },
  Tue: { '09:00': 'CS303-A', '10:00': null, '11:00': 'CS301-A', '12:00': 'CS302-A', '14:00': null, '15:00': null },
  Wed: { '09:00': 'MA301-A', '10:00': 'CS303-A', '11:00': null, '12:00': null, '14:00': 'LAB-2', '15:00': 'LAB-2' },
  Thu: { '09:00': 'CS302-A', '10:00': 'CS301-A', '11:00': 'CS303-A', '12:00': null, '14:00': null, '15:00': null },
  Fri: { '09:00': null, '10:00': 'MA301-A', '11:00': null, '12:00': null, '14:00': 'LAB-3', '15:00': 'LAB-3' },
};

const SUBJECTS = [
  { id: 'CS301-A', name: 'Data Structures (A)', faculty: 'F101' },
  { id: 'CS302-A', name: 'Digital Logic (A)', faculty: 'F102' },
  { id: 'CS303-A', name: 'Operating Sys (A)', faculty: 'F103' },
  { id: 'MA301-A', name: 'Mathematics III (A)', faculty: 'F104' },
];

const TimetableEditor = () => {
  const navigate = useNavigate();
  const [grid, setGrid] = useState<Record<string, Record<string, string | null>>>(INITIAL_GRID);
  const [draggedItem, setDraggedItem] = useState<{ id: string, source: 'pool' | {day: string, slot: string} } | null>(null);
  const [conflict, setConflict] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string, source: 'pool' | {day: string, slot: string}) => {
    setDraggedItem({ id, source });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: string, targetSlot: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { id, source } = draggedItem;

    // Simulate Conflict Logic: "Faculty X cannot be in Room A and Room B"
    // We'll mock a conflict if 'CS301-A' is placed at 10:00 (Faculty F101 busy)
    if (id === 'CS301-A' && targetSlot === '10:00' && targetDay === 'Wed') {
      setConflict('Dr. Ramesh (F101) is already teaching Section B at Wed 10:00');
      setDraggedItem(null);
      return;
    }
    setConflict(null);

    setGrid(prev => {
      const newGrid = { ...prev, [targetDay]: { ...prev[targetDay] } };
      
      // Remove from old cell if moving within grid
      if (source !== 'pool') {
        const newSourceDay = { ...prev[source.day] };
        newSourceDay[source.slot] = null;
        newGrid[source.day] = newSourceDay;
      }
      
      // Place in new cell
      newGrid[targetDay][targetSlot] = id;
      return newGrid;
    });
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  return (
    <div className="h-full bg-slate-900 flex flex-col font-sans animate-fade-in relative z-50">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-bold text-white">Master Timetable</h1>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Save className="w-4 h-4" /> Save
        </button>
      </div>

      {conflict && (
        <div className="m-4 bg-red-500/20 border border-red-500/50 rounded-xl p-3 flex items-center gap-3 text-red-200 text-sm font-medium animate-fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p>{conflict}</p>
        </div>
      )}

      {/* Editor Layout: Subjects Pool (Top) + Grid (Bottom) */}
      <div className="flex flex-col h-[calc(100%-80px)]">
        
        {/* Pool */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 overflow-x-auto whitespace-nowrap hide-scrollbar">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Available Subjects (Drag to schedule)</p>
          <div className="flex gap-3">
            {SUBJECTS.map(sub => (
              <div 
                key={sub.id}
                draggable
                onDragStart={(e) => handleDragStart(e, sub.id, 'pool')}
                className="bg-slate-800 border border-slate-700 rounded-xl p-3 inline-flex items-center gap-3 cursor-grab active:cursor-grabbing hover:bg-slate-700 transition-colors"
              >
                <GripVertical className="w-4 h-4 text-slate-500" />
                <div>
                  <h4 className="text-sm font-bold text-slate-200">{sub.id}</h4>
                  <p className="text-[10px] text-slate-400 font-medium">{sub.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-auto bg-slate-950 p-4 relative">
          <div className="min-w-[600px]">
            {/* Header Row */}
            <div className="flex mb-2 sticky top-0 bg-slate-950 z-10 pt-2 pb-2">
              <div className="w-16 shrink-0"></div>
              {SLOTS.map(slot => (
                <div key={slot} className="flex-1 text-center text-[10px] font-bold text-slate-500 uppercase">
                  {slot}
                </div>
              ))}
            </div>

            {/* Grid Rows */}
            <div className="flex flex-col gap-2">
              {DAYS.map(day => (
                <div key={day} className="flex items-stretch gap-2 min-h-[60px]">
                  {/* Day Label */}
                  <div className="w-16 flex items-center justify-center bg-slate-900 rounded-xl border border-slate-800 text-xs font-bold text-slate-400">
                    {day}
                  </div>
                  
                  {/* Slots */}
                  {SLOTS.map(slot => {
                    const cellData = grid[day][slot];
                    return (
                      <div 
                        key={`${day}-${slot}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, day, slot)}
                        className={`flex-1 rounded-xl border-2 transition-colors flex items-center justify-center p-1
                          ${draggedItem ? 'border-dashed border-indigo-500/30 bg-indigo-500/5' : 'border-slate-800 bg-slate-900'}
                          ${cellData ? '' : 'hover:bg-slate-800/50'}`}
                      >
                        {cellData && (
                          <div 
                            draggable
                            onDragStart={(e) => handleDragStart(e, cellData, {day, slot})}
                            className="w-full h-full bg-indigo-500/20 border border-indigo-500/50 rounded-lg flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-indigo-500/30 transition-colors"
                          >
                            <span className="text-xs font-bold text-indigo-300">{cellData}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      <BottomNav />

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TimetableEditor;
