import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/date';

export default function CustomerDashboard({ tickets, devices = [], user, showForm, setShowForm }) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 glass-card p-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-300 text-sm">Welcome back, {user.full_name || user.email}</p>
        </div>
        <button 
          className="glass-button px-4 py-2 rounded-lg font-medium text-sm transition-colors"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Create Ticket'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2">My Tickets</h3>
          <span className="text-4xl font-bold text-blue-400">{tickets.length}</span>
        </div>
        <div className="glass-card p-6 flex flex-col items-center justify-center">
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2">My Devices</h3>
          <span className="text-4xl font-bold text-green-400">{devices.length}</span>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 glass-header">
          <h3 className="text-lg font-semibold text-white">My Tickets</h3>
        </div>
        
        {tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 mb-4">You haven't created any tickets yet.</p>
            <button 
              className="glass-button-secondary px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              onClick={() => setShowForm(true)}
            >
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tickets.map(ticket => (
              <div 
                key={ticket.id} 
                className="p-6 hover:bg-white/5 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4"
              >
                <div>
                  <h4 className="text-lg font-semibold mb-1">
                    <Link to={`/tickets/${ticket.id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                      {ticket.title}
                    </Link>
                  </h4>
                  <p className="text-sm text-slate-400">
                    ID: #{ticket.id} • Company: {ticket.company_name || 'N/A'} • Device: {ticket.device_type} • Category: {ticket.category}
                  </p>
                </div>
                <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border
                    ${ticket.status === 'open' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 
                      ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 
                      ticket.status === 'resolved' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatDate(ticket.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
