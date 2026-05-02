import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  LogOut,
  Ticket,
  Monitor,
  Wrench,
  UserCheck,
  Building2
} from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 glass-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide">
            <div className="bg-blue-500 p-1.5 rounded-lg text-white flex shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Ticket size={20} />
            </div>
            IT Support
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-6">

            <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-300 font-medium hover:text-white transition-colors">
              <LayoutDashboard size={18} />
              {user.role === 'staff' ? 'Workbench' : 'Dashboard'}
            </Link>

            {user.role === 'admin' && (
              <Link to="/tracking" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Wrench size={18} />
                Work Tracking
              </Link>
            )}

            {user.role === 'admin' && (
              <Link to="/engineers" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <UserCheck size={18} />
                Engineers
              </Link>
            )}

            {user.role === 'admin' && (
              <Link to="/companies" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Building2 size={18} />
                Companies
              </Link>
            )}

            {user.role !== 'staff' && (
              <Link to="/devices" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Monitor size={18} />
                Devices
              </Link>
            )}

            <div className="w-px h-6 bg-white/20"></div>

            {/* User Info */}
            <div className="flex items-center gap-4">

              <div className="flex flex-col text-right">
                <span className="text-sm text-slate-300 font-medium truncate max-w-[180px]">
                  {user.full_name || user.email}
                </span>

                {/* 🔥 NEW: COMPANY NAME */}
                {user.company_name && (
                  <span className="text-[11px] text-purple-300">
                    {user.company_name}
                  </span>
                )}
              </div>

              <span className="bg-white/10 text-slate-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border border-white/10">
                {user.role}
              </span>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium glass-button-secondary rounded-lg"
              >
                <LogOut size={16} />
                Logout
              </button>

            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;