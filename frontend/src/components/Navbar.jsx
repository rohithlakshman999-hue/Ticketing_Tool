import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogOut, Ticket, Monitor, Wrench, UserCheck } from 'lucide-react';

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
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl no-underline tracking-wide">
            <div className="bg-blue-500 p-1.5 rounded-lg text-white flex shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Ticket size={20} />
            </div>
            IT Support
          </Link>
          
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-1.5 text-slate-300 font-medium hover:text-white transition-colors">
              <LayoutDashboard size={18} />
              {user.role === 'staff' ? 'Workbench' : 'Dashboard'}
            </Link>
            {user.role === 'admin' && (
              <Link to="/tracking" className="flex items-center gap-1.5 text-slate-300 font-medium hover:text-white transition-colors">
                <Wrench size={18} />
                Work Tracking
              </Link>
            )}
            {user.role === 'admin' && (
              <Link to="/engineers" className="flex items-center gap-1.5 text-slate-300 font-medium hover:text-white transition-colors">
                <UserCheck size={18} />
                Engineers
              </Link>
            )}
            {user.role !== 'staff' && (
              <Link to="/devices" className="flex items-center gap-1.5 text-slate-300 font-medium hover:text-white transition-colors">
                <Monitor size={18} />
                Devices
              </Link>
            )}
            
            <div className="w-px h-6 bg-white/20"></div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 font-medium flex items-center gap-2">
                {user.email} 
                <span className="bg-white/10 text-slate-200 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border border-white/10">
                  {user.role}
                </span>
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
