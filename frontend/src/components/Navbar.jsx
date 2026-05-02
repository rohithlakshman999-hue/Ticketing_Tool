import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  LogOut,
  Ticket,
  Monitor,
  Wrench,
  UserCheck,
  Building2,
  ChevronDown,
  User,
  Plus,
  Shield,
  Briefcase
} from 'lucide-react';

function Navbar() {
  const { user, accounts, logout, switchAccount } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSwitch = (email) => {
    switchAccount(email);
    setIsDropdownOpen(false);
    navigate('/dashboard');
  };

  const handleAddAccount = () => {
    setIsDropdownOpen(false);
    navigate('/login?add_account=true');
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 glass-header border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-white font-bold text-xl tracking-wide group">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white flex shadow-[0_0_15px_rgba(59,130,246,0.5)] group-hover:scale-105 transition-transform">
              <Ticket size={20} />
            </div>
            IT Support
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-6">

            <Link to="/dashboard" className="hidden sm:flex items-center gap-1.5 text-slate-300 font-medium hover:text-white transition-colors">
              <LayoutDashboard size={18} />
              {user.role === 'staff' ? 'Workbench' : 'Dashboard'}
            </Link>

            {user.role === 'admin' && (
              <Link to="/tracking" className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Wrench size={18} />
                Work Tracking
              </Link>
            )}

            {user.role === 'admin' && (
              <Link to="/engineers" className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <UserCheck size={18} />
                Engineers
              </Link>
            )}

            {user.role === 'admin' && (
              <Link to="/companies" className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Building2 size={18} />
                Companies
              </Link>
            )}

            {user.role !== 'staff' && (
              <Link to="/devices" className="hidden sm:flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Monitor size={18} />
                Devices
              </Link>
            )}

            <div className="hidden sm:block w-px h-6 bg-white/10 mx-2"></div>

            {/* Account Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl glass-button-secondary hover:bg-white/10 transition-all border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                  {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold text-white leading-none mb-1">
                    {user.full_name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
                    {user.role}
                  </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 glass-card border border-white/20 shadow-2xl overflow-hidden animate-fade-in-down origin-top-right">
                  <div className="p-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white truncate max-w-[160px]">
                          {user.full_name || 'IT User'}
                        </span>
                        <span className="text-xs text-slate-400 truncate max-w-[160px]">
                          {user.email}
                        </span>
                      </div>
                    </div>
                    {user.company_name && (
                      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-300 font-medium">
                        <Briefcase size={12} />
                        {user.company_name}
                      </div>
                    )}
                  </div>

                  <div className="py-2 max-h-[300px] overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Your Accounts
                    </div>
                    
                    {accounts.map((acc) => (
                      <button
                        key={acc.user.email}
                        onClick={() => handleSwitch(acc.user.email)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 ${acc.user.email === user.email ? 'bg-blue-500/10' : ''}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${acc.user.email === user.email ? 'bg-blue-500 text-white' : 'bg-white/10 text-slate-300'}`}>
                          {acc.user.full_name?.charAt(0) || acc.user.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium text-slate-200 truncate">
                            {acc.user.full_name || acc.user.email}
                          </span>
                          {acc.user.email === user.email && (
                            <span className="text-[10px] text-blue-400 font-bold">Currently Active</span>
                          )}
                        </div>
                      </button>
                    ))}

                    <button
                      onClick={handleAddAccount}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left text-blue-400 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Plus size={16} />
                      </div>
                      <span className="text-sm font-medium">Add another account</span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-white/10 bg-white/5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out of current account
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;