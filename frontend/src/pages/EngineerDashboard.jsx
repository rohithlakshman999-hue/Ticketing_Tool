import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWebSockets } from '../hooks/useWebSockets';
import { Wrench, Clock, CheckCircle, XCircle, ArrowRight, ChevronRight, Activity, X, Check } from 'lucide-react';
import { formatDateTime } from '../utils/date';

const statusColors = {
  open: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

const priorityColors = {
  high: 'bg-red-500/20 text-red-300 border border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  low: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
};

export default function EngineerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { lastMessage } = useWebSockets();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null); // ticket id being updated
  const [statusNote, setStatusNote] = useState({});
  const [newStatus, setNewStatus] = useState({});
  const [submittingProgress, setSubmittingProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await api.get('/tickets/');
      setTickets(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'ticket_updated' || lastMessage.type === 'ticket_created' || lastMessage.type === 'ticket_deleted')) {
      fetchTickets();
    }
  }, [lastMessage]);

  const handleStatusUpdate = async (ticketId) => {
    setError(''); setSuccess('');
    const status = newStatus[ticketId];
    const note = statusNote[ticketId] || '';
    if (!status || !note.trim()) {
      setError('Please select a status and add a progress note');
      return;
    }
    try {
      setSubmittingProgress(prev => ({ ...prev, [ticketId]: true }));
      await api.post(`/tickets/${ticketId}/progress`, { status, message: note });
      setNewStatus(prev => ({ ...prev, [ticketId]: '' }));
      setStatusNote(prev => ({ ...prev, [ticketId]: '' }));
      setSuccess('Status updated successfully');
      fetchTickets();
    } catch (e) {
      setError('Failed to update status.');
    } finally {
      setSubmittingProgress(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-500">Loading your assignments...</div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white">Engineer Workbench</h1>
        <p className="text-slate-300 text-sm mt-1">Welcome, {user?.full_name || user?.email} — your assigned tickets are below.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/30 p-4 text-red-200 text-sm flex items-start gap-3 backdrop-blur-sm">
          <X size={18} className="flex-shrink-0 mt-0.5 text-red-400" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-900/30 border border-green-500/30 p-4 text-green-200 text-sm flex items-start gap-3 backdrop-blur-sm">
          <Check size={18} className="flex-shrink-0 mt-0.5 text-green-400" />
          <div>{success}</div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 flex flex-col items-center">
          <Activity className="text-yellow-400 mb-2" size={24} />
          <span className="text-3xl font-bold text-white">{openCount}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Active</span>
        </div>
        <div className="glass-card p-5 flex flex-col items-center">
          <CheckCircle className="text-green-400 mb-2" size={24} />
          <span className="text-3xl font-bold text-white">{resolvedCount}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Resolved</span>
        </div>
        <div className="glass-card p-5 flex flex-col items-center">
          <Wrench className="text-blue-400 mb-2" size={24} />
          <span className="text-3xl font-bold text-white">{tickets.length}</span>
          <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Total Assigned</span>
        </div>
      </div>

      {/* Ticket List */}
      <div className="space-y-4">
        {tickets.length === 0 && (
          <div className="glass-card p-12 text-center text-slate-400">
            No tickets assigned to you yet.
          </div>
        )}

        {tickets.map(ticket => (
          <div key={ticket.id} className="glass-card overflow-hidden">
            {/* Ticket Header */}
            <div className="flex items-center justify-between px-6 py-4 glass-header">
              <div className="flex items-center gap-4">
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="font-semibold text-white hover:text-blue-300 transition-colors text-base"
                >
                  #{ticket.id} — {ticket.title}
                </Link>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${statusColors[ticket.status]}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
              <Link
                to={`/tickets/${ticket.id}`}
                className="text-slate-400 hover:text-blue-300 transition-colors"
              >
                <ChevronRight size={20} />
              </Link>
            </div>

            {/* Status Update Panel */}
            <div className="px-6 py-4 bg-blue-900/20 backdrop-blur-sm flex flex-col gap-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" />
                  Submit Progress Update
                </label>
                <span className="text-xs text-slate-400">by {user?.full_name || user?.email}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <select
                    className="w-full px-3 py-2 glass-input text-sm"
                    value={newStatus[ticket.id] || ''}
                    onChange={e => setNewStatus(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                  >
                    <option value="" className="bg-slate-800 text-slate-200">— Select status —</option>
                    <option value="open" className="bg-slate-800 text-slate-200">Open</option>
                    <option value="in_progress" className="bg-slate-800 text-slate-200">In Progress</option>
                    <option value="resolved" className="bg-slate-800 text-slate-200">Resolved</option>
                    <option value="closed" className="bg-slate-800 text-slate-200">Closed</option>
                  </select>
                </div>

                <div>
                  <textarea
                    placeholder="What did you do? What's next?"
                    className="w-full px-3 py-2 glass-input text-sm resize-none"
                    rows="1"
                    value={statusNote[ticket.id] || ''}
                    onChange={e => setStatusNote(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                  />
                </div>
              </div>

              <button
                onClick={() => handleStatusUpdate(ticket.id)}
                disabled={!newStatus[ticket.id] || !statusNote[ticket.id]?.trim() || submittingProgress[ticket.id]}
                className="px-4 py-2 glass-button disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 whitespace-nowrap w-48"
              >
                <Activity size={16} />
                {submittingProgress[ticket.id] ? 'Submitting...' : 'Submit Update'}
              </button>
            </div>

            {/* Recent Activity */}
            {ticket.history && ticket.history.length > 0 && (
              <div className="px-6 py-3 border-t border-white/5 bg-white/5">
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Last Activity</p>
                <p className="text-xs text-slate-300">
                  <span className="font-medium capitalize text-white">{ticket.history[ticket.history.length - 1]?.action?.replace('_', ' ')}</span>
                  {' '}→ {ticket.history[ticket.history.length - 1]?.new_value}
                  {' • '}
                  {formatDateTime(ticket.history[ticket.history.length - 1]?.timestamp)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
