import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Coffee, Briefcase, User } from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('accent_color') || '#0080c7');

  useEffect(() => {
    const handleThemeChange = () => {
      setAccentColor(localStorage.getItem('accent_color') || '#0080c7');
      try {
        const stored = localStorage.getItem('user');
        setUser(stored ? JSON.parse(stored) : null);
      } catch {}
    };

    window.addEventListener('theme-changed', handleThemeChange);
    return () => window.removeEventListener('theme-changed', handleThemeChange);
  }, []);

  const isFaculty = user?.role === 'faculty';
  const isAdmin = user?.role === 'admin';
  const path = location.pathname;

  const isDark = false;

  const containerClass = `fixed bottom-0 w-full max-w-md border-t px-6 py-4 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 transition-all duration-300 ${
    isDark ? 'bg-slate-900 border-slate-800/80 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
  }`;

  const defaultColor = '#adb5bd'; // slate-500

  const getLinkProps = (isActive: boolean, activeColor: string) => {
    return {
      style: {
        color: isActive ? activeColor : defaultColor,
        transition: 'color 0.25s ease',
      },
      className: 'flex flex-col items-center gap-1 transition-all duration-200 active:scale-95'
    };
  };

  const getIconClass = (isActive: boolean, activeColor: string) => {
    return `w-6 h-6 transition-all duration-250`;
  };

  const getIconStyle = (isActive: boolean, activeColor: string) => {
    return {
      fill: isActive ? `${activeColor}20` : 'transparent',
      stroke: isActive ? activeColor : defaultColor,
    };
  };

  if (isAdmin) {
    const activeCol = accentColor;
    return (
      <div className={containerClass}>
        <div className="flex justify-around items-center">
          <NavLink to="/admin">
            {({ isActive }) => (
              <div {...getLinkProps(isActive, activeCol)}>
                <Home className={getIconClass(isActive, activeCol)} style={getIconStyle(isActive, activeCol)} />
                <span className="text-[10px] font-bold">Admin Hub</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/profile">
            {({ isActive }) => (
              <div {...getLinkProps(isActive, activeCol)}>
                <User className={getIconClass(isActive, activeCol)} style={getIconStyle(isActive, activeCol)} />
                <span className="text-[10px] font-bold">Profile</span>
              </div>
            )}
          </NavLink>
        </div>
      </div>
    );
  }

  if (isFaculty) {
    return (
      <div className={containerClass}>
        <div className="flex justify-around items-center">
          <NavLink to="/faculty">
            {({ isActive }) => (
              <div {...getLinkProps(isActive, accentColor)}>
                <Home className={getIconClass(isActive, accentColor)} style={getIconStyle(isActive, accentColor)} />
                <span className="text-[10px] font-bold">Hub</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/faculty/question-bank">
            {({ isActive }) => (
              <div {...getLinkProps(isActive, accentColor)}>
                <BookOpen className={getIconClass(isActive, accentColor)} style={getIconStyle(isActive, accentColor)} />
                <span className="text-[10px] font-bold">PYQs</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/faculty/career">
            {({ isActive }) => (
              <div {...getLinkProps(isActive, accentColor)}>
                <Briefcase className={getIconClass(isActive, accentColor)} style={getIconStyle(isActive, accentColor)} />
                <span className="text-[10px] font-bold">Career</span>
              </div>
            )}
          </NavLink>
          <NavLink to="/profile">
            {({ isActive }) => (
              <div {...getLinkProps(isActive, accentColor)}>
                <User className={getIconClass(isActive, accentColor)} style={getIconStyle(isActive, accentColor)} />
                <span className="text-[10px] font-bold">Profile</span>
              </div>
            )}
          </NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex justify-between items-center">
        <NavLink to="/">
          {({ isActive }) => (
            <div {...getLinkProps(isActive, accentColor)}>
              <Home className={getIconClass(isActive, accentColor)} style={getIconStyle(isActive, accentColor)} />
              <span className="text-[10px] font-bold">Home</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/academic">
          {({ isActive }) => (
            <div {...getLinkProps(isActive, '#6366f1')}> {/* Indigo */}
              <BookOpen className={getIconClass(isActive, '#6366f1')} style={getIconStyle(isActive, '#6366f1')} />
              <span className="text-[10px] font-bold">Academic</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/campus">
          {({ isActive }) => (
            <div {...getLinkProps(isActive, '#f97316')}> {/* Orange */}
              <Coffee className={getIconClass(isActive, '#f97316')} style={getIconStyle(isActive, '#f97316')} />
              <span className="text-[10px] font-bold">Campus</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/career">
          {({ isActive }) => (
            <div {...getLinkProps(isActive, '#10b981')}> {/* Emerald */}
              <Briefcase className={getIconClass(isActive, '#10b981')} style={getIconStyle(isActive, '#10b981')} />
              <span className="text-[10px] font-bold">Career</span>
            </div>
          )}
        </NavLink>

        <NavLink to="/profile">
          {({ isActive }) => (
            <div {...getLinkProps(isActive, accentColor)}>
              <User className={getIconClass(isActive, accentColor)} style={getIconStyle(isActive, accentColor)} />
              <span className="text-[10px] font-bold">Profile</span>
            </div>
          )}
        </NavLink>
      </div>
    </div>
  );
};

export default BottomNav;
