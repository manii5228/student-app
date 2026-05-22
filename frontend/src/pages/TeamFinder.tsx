import React, { useState } from 'react';
import { ChevronLeft, X, Heart, Code, Star, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';

const MOCK_PROFILES = [
  { id: '1', name: 'Arjun M.', dept: 'CSE', year: '3rd Year', skills: ['React', 'Node.js'], lookingFor: 'Backend Developer for Hackathon', avatar: 'bg-app-blue', matchPercentage: 92 },
  { id: '2', name: 'Priya K.', dept: 'ECE', year: '4th Year', skills: ['Python', 'IoT'], lookingFor: 'UI/UX Designer', avatar: 'bg-app-purple', matchPercentage: 85 },
  { id: '3', name: 'Rahul S.', dept: 'IT', year: '2nd Year', skills: ['Figma', 'Tailwind'], lookingFor: 'Fullstack Dev for Startup Idea', avatar: 'bg-slate-100', matchPercentage: 78 },
];

const TeamFinder = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = (dir: 'left' | 'right') => {
    if (profiles.length === 0) return;
    setDirection(dir);
    
    setTimeout(() => {
      setProfiles(prev => prev.slice(1));
      setDirection(null);
    }, 400); // Wait for animation
  };

  return (
    <div className="h-full bg-white flex flex-col font-sans animate-fade-in pb-24 overflow-hidden relative">
      {/* Top Navigation */}
      <div className="flex justify-between items-center p-6 mt-4 relative z-20">
        <button onClick={() => navigate('/')} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors bg-white">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Team Finder</h1>
        <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-50 transition-colors bg-white">
          <Star className="w-5 h-5 text-app-accent" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {profiles.length > 0 ? (
          <div className="relative w-full max-w-sm h-[60vh]">
            {profiles.map((profile, index) => {
              const isTop = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              
              if (index > 2) return null;

              // Animation classes for swiping
              let transformClass = '';
              let opacityClass = 'opacity-100';
              if (isTop && direction === 'left') {
                transformClass = '-translate-x-[150%] -rotate-12';
                opacityClass = 'opacity-0';
              } else if (isTop && direction === 'right') {
                transformClass = 'translate-x-[150%] rotate-12';
                opacityClass = 'opacity-0';
              } else if (isSecond) {
                transformClass = isTop && direction ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.95]';
              } else if (isThird) {
                transformClass = 'translate-y-8 scale-[0.90]';
              }

              return (
                <div 
                  key={profile.id}
                  className={`absolute inset-0 bg-white border border-slate-100 rounded-[40px] shadow-xl p-6 flex flex-col transition-all duration-500 ease-out origin-bottom ${transformClass} ${opacityClass}`}
                  style={{ zIndex: 30 - index }}
                >
                  <div className={`flex-1 rounded-[24px] ${profile.avatar} flex flex-col items-center justify-center p-6 mb-6 shadow-inner`}>
                     <div className="w-24 h-24 rounded-full bg-white/50 backdrop-blur-md shadow-sm flex items-center justify-center mb-4">
                        <span className="text-4xl font-black text-slate-700">{profile.name.charAt(0)}</span>
                     </div>
                     <h2 className="text-2xl font-bold text-slate-900">{profile.name}</h2>
                     <p className="text-sm font-semibold text-slate-600 mt-1">{profile.dept} • {profile.year}</p>
                     
                     <div className="mt-4 bg-white/60 px-4 py-1.5 rounded-full backdrop-blur-sm">
                       <p className="text-xs font-bold text-app-accent">{profile.matchPercentage}% Skill Match</p>
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Looking For</h3>
                    <p className="text-lg font-bold text-slate-800 leading-tight mb-6">{profile.lookingFor}</p>

                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Top Skills</h3>
                    <div className="flex flex-wrap gap-2 mb-auto">
                      {profile.skills.map(s => (
                        <span key={s} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-[14px] text-sm font-bold text-slate-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center animate-fade-in">
             <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 border border-slate-100">
                <Inbox className="w-10 h-10 text-slate-300" />
             </div>
             <h2 className="text-2xl font-bold text-slate-900 mb-2">You're all caught up!</h2>
             <p className="text-sm text-slate-500 max-w-[250px]">You've seen all potential team matches for today. Check back later.</p>
             <button onClick={() => setProfiles(MOCK_PROFILES)} className="mt-8 bg-app-dark text-white px-8 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition-colors shadow-lg">
               Refresh Stack
             </button>
          </div>
        )}

        {/* Action Buttons */}
        {profiles.length > 0 && (
          <div className="flex gap-6 mt-8 z-40 relative pb-6">
            <button 
              onClick={() => handleSwipe('left')}
              className="w-16 h-16 rounded-full bg-white border border-slate-100 shadow-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:scale-110 hover:text-red-500 transition-all active:scale-95"
            >
              <X className="w-8 h-8" />
            </button>
            <button 
              onClick={() => handleSwipe('right')}
              className="w-16 h-16 rounded-full bg-app-accent border border-app-accent shadow-xl flex items-center justify-center text-white hover:opacity-90 hover:scale-110 transition-all active:scale-95"
            >
              <Heart className="w-7 h-7" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};

export default TeamFinder;
