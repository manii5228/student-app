import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Coffee, Briefcase, User } from 'lucide-react';

const BottomNav = () => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return (
      <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 px-6 py-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
        <div className="flex justify-around items-center">
          <NavLink to="/admin/timetable" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home className={`w-6 h-6 ${window.location.pathname.startsWith('/admin') ? 'fill-blue-500/20' : ''}`} />
            <span className="text-[10px] font-bold">Admin Hub</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <User className={`w-6 h-6 ${window.location.pathname === '/profile' ? 'fill-slate-900/20' : ''}`} />
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
          <NavLink to="/faculty" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
            <Home className={`w-6 h-6 ${window.location.pathname.startsWith('/faculty') ? 'fill-indigo-500/20' : ''}`} />
            <span className="text-[10px] font-bold">Faculty Hub</span>
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
            <User className={`w-6 h-6 ${window.location.pathname === '/profile' ? 'fill-slate-900/20' : ''}`} />
            <span className="text-[10px] font-bold">Profile</span>
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-100 px-6 py-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50">
      <div className="flex justify-between items-center">
        <NavLink to="/" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-app-accent' : 'text-slate-400 hover:text-slate-600'}`}>
          <Home className={`w-6 h-6 ${window.location.pathname === '/' ? 'fill-app-accent/20' : ''}`} />
          <span className="text-[10px] font-bold">Home</span>
        </NavLink>
        
        <NavLink to="/academic" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <BookOpen className={`w-6 h-6 ${window.location.pathname === '/academic' ? 'fill-indigo-500/20' : ''}`} />
          <span className="text-[10px] font-bold">Academic</span>
        </NavLink>
        
        <NavLink to="/campus" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Coffee className={`w-6 h-6 ${window.location.pathname === '/campus' ? 'fill-orange-500/20' : ''}`} />
          <span className="text-[10px] font-bold">Campus</span>
        </NavLink>
        
        <NavLink to="/career" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'}`}>
          <Briefcase className={`w-6 h-6 ${window.location.pathname === '/career' ? 'fill-emerald-500/20' : ''}`} />
          <span className="text-[10px] font-bold">Career</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>
          <User className={`w-6 h-6 ${window.location.pathname === '/profile' ? 'fill-slate-900/20' : ''}`} />
          <span className="text-[10px] font-bold">Profile</span>
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
