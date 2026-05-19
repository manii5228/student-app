import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Search, Plus, Filter, MoreVertical, 
  UserX, UserCheck, Edit, Trash2, Mail
} from 'lucide-react';
import { api } from '../lib/api';

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    // In a real app, this would fetch from /admin/users
    // For now, we'll simulate fetching all users
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@veltech.edu.in', role: 'student', status: 'active', department: 'CSE' },
      { id: '2', name: 'Jane Smith', email: 'jane@veltech.edu.in', role: 'student', status: 'suspended', department: 'ECE' },
      { id: '3', name: 'Dr. Alan Turing', email: 'alan@veltech.edu.in', role: 'faculty', status: 'active', department: 'CSE' },
      { id: '4', name: 'Dr. Ada Lovelace', email: 'ada@veltech.edu.in', role: 'faculty', status: 'active', department: 'IT' },
    ];
    setUsers(mockUsers);
    setLoading(false);
  }, []);

  const filteredUsers = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggleStatus = (id: string, currentStatus: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: currentStatus === 'active' ? 'suspended' : 'active' } : u));
  };

  const deleteUser = (id: string) => {
    if (window.confirm("Are you sure you want to delete this user? This cannot be undone.")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-white px-6 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
        </div>
        <button className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6">
        {/* Search & Filter */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  ${user.role === 'student' ? 'bg-indigo-100 text-indigo-700' : 
                    user.role === 'faculty' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 leading-tight">{user.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{user.email}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${user.role === 'student' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {user.role}
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${user.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {user.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleStatus(user.id, user.status)}
                  className={`p-2 rounded-full transition-colors ${user.status === 'active' ? 'text-amber-600 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}`}
                  title={user.status === 'active' ? 'Suspend User' : 'Activate User'}
                >
                  {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors" title="Edit User">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => deleteUser(user.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors" title="Delete User">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No users found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
