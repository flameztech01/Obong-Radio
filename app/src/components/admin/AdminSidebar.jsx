// src/components/admin/AdminSidebar.jsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router';
import { 
  LayoutDashboard, Radio, Users, Settings, 
  LogOut, ShieldAlert, Mic2, CalendarDays
} from 'lucide-react';
import { useLogoutMutation, useGetMeQuery } from '../../features/authApiSlice';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();
  const { data: userData } = useGetMeQuery();
  const user = userData?.user;

  const navItems = [
    { name: 'Command Center', path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Live Studio', path: '/admin/studio', icon: <Mic2 size={20} /> },
    { name: 'Schedule', path: '/admin/schedule', icon: <CalendarDays size={20} /> },
    { name: 'Users & Roles', path: '/admin/users', icon: <Users size={20} /> },
    { name: 'System Settings', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const handleLogout = async () => {
    if(window.confirm("Secure logout initiated. Proceed?")) {
      await logout();
      navigate('/admin/login');
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[280px] bg-[#0c0c0c] border-r border-zinc-800/80 h-screen sticky top-0 shrink-0">
      
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-zinc-800/80 gap-3 shrink-0">
        <div className="h-9 w-9 rounded-xl bg-zinc-900 border border-red-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <ShieldAlert size={20} className="text-red-500" />
        </div>
        <div>
          <h1 className="font-mono text-[15px] font-bold text-white tracking-widest uppercase">System Admin</h1>
          <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest">O.U Radio</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'text-zinc-400 border border-transparent hover:bg-zinc-900 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </div>

      {/* Admin Profile & Logout */}
      <div className="p-4 border-t border-zinc-800/80 shrink-0">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-zinc-800 border border-red-500/30 flex items-center justify-center shrink-0">
              <span className="text-[14px] font-bold text-red-500">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-red-400 font-mono truncate">{user?.role || 'admin'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-950 border border-zinc-800 py-2 text-[11px] font-bold text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <LogOut size={14} /> Secure Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;