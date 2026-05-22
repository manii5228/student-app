import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Coffee, Briefcase, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';
  const path = location.pathname;

  if (isAdmin) {
    return (
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 px-6 py-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center">
          <NavLink to="/admin" className={`flex flex-col items-center gap-1 ${path.startsWith('/admin') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home className={`w-6 h-6 ${path.startsWith('/admin') ? 'fill-blue-500/20' : ''}`} />
            <span className="text-[10px] font-bold">Admin Hub</span>
          </NavLink>
          <NavLink to="/profile" className={`flex flex-col items-center gap-1 ${path === '/profile' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <User className={`w-6 h-6 ${path === '/profile' ? 'fill-slate-900/20' : ''}`} />
            <span className="text-[10px] font-bold">Profile</span>
          </NavLink>
        </div>
      </div>
    );
  }

  if (isFaculty) {
    return (
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 px-6 py-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center">
          <NavLink to="/faculty" className={`flex flex-col items-center gap-1 ${path.startsWith('/faculty') ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home className={`w-6 h-6 ${path.startsWith('/faculty') ? 'fill-indigo-500/20' : ''}`} />
            <span className="text-[10px] font-bold">Faculty Hub</span>
          </NavLink>
          <NavLink to="/profile" className={`flex flex-col items-center gap-1 ${path === '/profile' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <User className={`w-6 h-6 ${path === '/profile' ? 'fill-slate-900/20' : ''}`} />
            <span className="text-[10px] font-bold">Profile</span>
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 px-6 py-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-between items-center">
        <NavLink to="/" className={`flex flex-col items-center gap-1 ${path === '/' ? 'text-[#0080c7]' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home className={`w-6 h-6 ${path === '/' ? 'fill-[#0080c7]/20' : ''}`} />
          <span className="text-[10px] font-bold">Home</span>
        </NavLink>
        
        <NavLink to="/academic" className={`flex flex-col items-center gap-1 ${path.startsWith('/academic') ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <BookOpen className={`w-6 h-6 ${path.startsWith('/academic') ? 'fill-indigo-500/20' : ''}`} />
          <span className="text-[10px] font-bold">Academic</span>
        </NavLink>
        
        <NavLink to="/campus" className={`flex flex-col items-center gap-1 ${path.startsWith('/campus') ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Coffee className={`w-6 h-6 ${path.startsWith('/campus') ? 'fill-orange-500/20' : ''}`} />
          <span className="text-[10px] font-bold">Campus</span>
        </NavLink>
        
        <NavLink to="/career" className={`flex flex-col items-center gap-1 ${path.startsWith('/career') ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Briefcase className={`w-6 h-6 ${path.startsWith('/career') ? 'fill-emerald-500/20' : ''}`} />
          <span className="text-[10px] font-bold">Career</span>
        </NavLink>
        
        <NavLink to="/profile" className={`flex flex-col items-center gap-1 ${path === '/profile' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
          <User className={`w-6 h-6 ${path === '/profile' ? 'fill-slate-900/20' : ''}`} />
          <span className="text-[10px] font-bold">Profile</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
