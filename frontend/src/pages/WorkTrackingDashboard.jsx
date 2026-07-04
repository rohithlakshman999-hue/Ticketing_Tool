import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Clock, User, CheckCircle, AlertCircle, ArrowRight, X, RotateCcw } from 'lucide-react';
import { formatDateTime } from '../utils/date';

const statusBadge = {
  open: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  in_progress: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  resolved: 'bg-green-500/20 text-green-300 border-green-500/30',
  closed: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
};

export default function WorkTrackingDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [engineerFilter, setEngineerFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [assigningId, setAssigningId] = useState({});
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeUpdateTicket, setActiveUpdateTicket] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (statusFilter) query.set('status', statusFilter);
      if (engineerFilter) query.set('engineer_id', engineerFilter);
      if (priorityFilter) query.set('priority', priorityFilter);
      const res = await api.get(`/tickets/tracking/all?${query.toString()}`);
      setTickets(res.data);
    } catch (e) {
      console.error(e);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await api.get('/auth/engineers');
      setEngineers(res.data);
    } catch (e) {
      console.error(e);
      setEngineers([]);
    }
  };

  const fetchTimeline = async (ticket) => {
    setTicketLoading(true);
    try {
      const [activityRes, ticketRes] = await Promise.all([
        api.get(`/tickets/${ticket.id}/activity`),
        api.get(`/tickets/${ticket.id}`)
      ]);
      
      const combined = [
        ...activityRes.data.map(a => ({ ...a, _type: 'activity' })),
        ...ticketRes.data.history.map(h => ({ 
          ...h, 
          _type: 'history', 
          message: `${h.action.replace('_', ' ')}: "${h.old_value || 'none'}" → "${h.new_value || 'none'}"`,
          created_at: h.timestamp,
          engineer_name: h.changed_by_name || 'System'
        }))
      ].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

      setActivity(combined);
      setSelectedTicket(ticket);
    } catch (e) {
      console.error(e);
      setActivity([]);
      setSelectedTicket(ticket);
    } finally {
      setTicketLoading(false);
    }
  };

  const handleAssign = async (ticketId, engineerId) => {
    setActionError(''); setActionSuccess('');
    try {
      // If engineerId is empty string, it means unassigned.
      const payload = engineerId ? { engineer_id: parseInt(engineerId) } : { engineer_id: null };
      await api.put(`/tickets/${ticketId}/assign`, payload);
      setActionSuccess(`Ticket #${ticketId} assignment updated successfully`);
      fetchTickets();
    } catch (e) {
      setActionError('Failed to assign engineer');
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    if (!newStatus) return;
    setActionError(''); setActionSuccess('');
    try {
      await api.put(`/tickets/${ticketId}/status`, { status: newStatus, note: 'Status updated via tracking board' });
      setActionSuccess(`Ticket #${ticketId} status updated to ${newStatus}`);
      fetchTickets();
    } catch (e) {
      setActionError('Failed to update status');
    }
  };

  const handleStatusUpdateWithNote = async () => {
    if (!activeUpdateTicket || !newStatus) return;
    setActionError(''); setActionSuccess('');
    try {
      setSubmittingUpdate(true);
      await api.put(`/tickets/${activeUpdateTicket.id}/status`, { 
        status: newStatus, 
        note: progressNote || `Status changed to ${newStatus}` 
      });
      setActionSuccess(`Ticket #${activeUpdateTicket.id} updated successfully`);
      setActiveUpdateTicket(null);
      setProgressNote('');
      fetchTickets();
    } catch (e) {
      setActionError('Failed to update ticket');
    } finally {
      setSubmittingUpdate(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'staff') return;
    fetchTickets();
    if (user?.role === 'admin') fetchEngineers();
  }, [user, statusFilter, engineerFilter, priorityFilter]);

  const ticketRows = tickets;

  if (user?.role !== 'admin' && user?.role !== 'staff') {
    return (
      <div className="rounded-lg bg-white border border-red-100 p-8 text-center text-red-700">
        Access restricted.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-card p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Work Tracking Dashboard</h1>
          <p className="text-sm text-slate-300 mt-1">Monitor ticket progress, engineer updates, and resolution timelines in real time.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md glass-button-secondary text-sm font-medium transition-colors"
          >
            <ArrowRight size={16} /> Return to Dashboard
          </button>
        </div>
      </div>

      {(actionSuccess || actionError) && (
        <div className={`p-4 rounded-lg text-sm animate-fade-in shadow-lg border backdrop-blur-md ${actionSuccess ? 'bg-green-900/30 border-green-500/30 text-green-300' : 'bg-red-900/30 border-red-500/30 text-red-300'}`}>
          {actionSuccess || actionError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.85fr] gap-6">
        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <label className="block">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-2 w-full glass-input text-sm"
                  >
                    <option value="" className="bg-slate-800 text-slate-200">All statuses</option>
                    <option value="open" className="bg-slate-800 text-slate-200">Open</option>
                    <option value="in_progress" className="bg-slate-800 text-slate-200">In Progress</option>
                    <option value="resolved" className="bg-slate-800 text-slate-200">Resolved</option>
                    <option value="closed" className="bg-slate-800 text-slate-200">Closed</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Engineer</span>
                  <select
                    value={engineerFilter}
                    onChange={(e) => setEngineerFilter(e.target.value)}
                    className="mt-2 w-full glass-input text-sm"
                  >
                    <option value="" className="bg-slate-800 text-slate-200">All engineers</option>
                    {engineers.map((engineer) => (
                      <option key={engineer.id} value={engineer.id} className="bg-slate-800 text-slate-200">{engineer.name}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Priority</span>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="mt-2 w-full glass-input text-sm"
                  >
                    <option value="" className="bg-slate-800 text-slate-200">All priorities</option>
                    <option value="low" className="bg-slate-800 text-slate-200">Low</option>
                    <option value="medium" className="bg-slate-800 text-slate-200">Medium</option>
                    <option value="high" className="bg-slate-800 text-slate-200">High</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-glass">
                <thead>
                  <tr>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Ticket</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Customer</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Created By</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Engineer Management</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Status Control</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Priority</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Last update</th>
                    <th className="px-4 py-4 text-left text-xs uppercase text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-slate-400">Loading tickets…</td>
                    </tr>
                  ) : ticketRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-slate-400">No tickets match the selected filters.</td>
                    </tr>
                  ) : ticketRows.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <Link 
                          to={`/tickets/${ticket.id}`} 
                          className="block hover:translate-x-1 transition-transform group"
                        >
                          <div className="font-semibold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                            #{ticket.id} {ticket.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">Created {formatDateTime(ticket.created_at)}</div>
                        </Link>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">{ticket.contact_name || ticket.customer_name}</div>
                        <div className="text-xs text-slate-400">{ticket.company_name || 'Individual'}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-300">{ticket.creator_name}</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter">Ticket Creator</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          className="text-xs glass-input py-1 w-full max-w-[150px]"
                          value={ticket.engineer_id || ''}
                          onChange={(e) => handleAssign(ticket.id, e.target.value)}
                        >
                          <option value="" className="bg-slate-800 text-slate-200">-- Unassigned --</option>
                          {engineers.map(eng => (
                            <option key={eng.id} value={eng.id} className="bg-slate-800 text-slate-200">{eng.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          className={`text-xs glass-input py-1 font-semibold uppercase tracking-wider w-full max-w-[130px] border-none cursor-pointer ${statusBadge[ticket.status] || 'bg-slate-500/20 text-slate-300'}`}
                          value={ticket.status}
                          onChange={(e) => {
                            setActiveUpdateTicket(ticket);
                            setNewStatus(e.target.value);
                          }}
                        >
                          <option value="open" className="bg-slate-800 text-slate-200">Open</option>
                          <option value="in_progress" className="bg-slate-800 text-slate-200">In Progress</option>
                          <option value="resolved" className="bg-slate-800 text-slate-200">Resolved</option>
                          <option value="closed" className="bg-slate-800 text-slate-200">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-xs font-semibold text-slate-300 uppercase">{ticket.priority}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDateTime(ticket.latest_update?.created_at || ticket.updated_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => fetchTimeline(ticket)}
                          className="inline-flex items-center gap-2 rounded-md glass-button-secondary px-3 py-1.5 text-xs font-medium"
                        >
                          View progress
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Progress Timeline</h2>
                <p className="text-sm text-slate-400">Select a ticket to see a detailed timeline of every update.</p>
              </div>
              {selectedTicket && (
                <span className="text-xs uppercase tracking-wide text-slate-400">Current: {selectedTicket.status.replace('_', ' ')}</span>
              )}
            </div>

            {!selectedTicket ? (
              <div className="py-16 text-center text-slate-500">Pick a ticket to view activity details.</div>
            ) : ticketLoading ? (
              <div className="py-16 text-center text-slate-500">Loading activity…</div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl bg-blue-900/20 p-4 border border-blue-500/30 backdrop-blur-sm">
                  <div className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Ticket</div>
                  <div className="mt-1 text-sm text-white font-medium">{selectedTicket.title}</div>
                  <div className="mt-1 text-xs text-blue-200/70">Assigned to {selectedTicket.engineer_name || 'Unassigned'}</div>
                </div>
                <div className="space-y-4">
                  {activity.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/20 p-6 text-sm text-slate-400 text-center">No updates have been recorded for this ticket yet.</div>
                  ) : activity.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                      <div className="flex justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-semibold text-white">
                            {entry._type === 'history' ? (
                              <RotateCcw size={14} className="text-indigo-400" />
                            ) : (
                              <span className={`inline-flex h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] ${entry.status === 'open' ? 'text-blue-400 bg-blue-400' : entry.status === 'in_progress' ? 'text-yellow-400 bg-yellow-400' : entry.status === 'resolved' ? 'text-green-400 bg-green-400' : 'text-slate-400 bg-slate-400'}`} />
                            )}
                            {entry._type === 'history' ? 'System Log' : entry.status.replace('_', ' ')}
                          </div>
                          <div className="mt-1 text-sm text-slate-300">{entry.message}</div>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                          <div className="text-blue-300">{entry.engineer_name || 'System'}</div>
                          <div className="mt-1">{formatDateTime(entry.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="glass-card p-6 bg-blue-900/10 border-blue-500/20">
            <h2 className="text-lg font-semibold text-blue-300 mb-3">Tracking Insight</h2>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2"><Clock size={16} className="text-blue-400 mt-0.5 flex-shrink-0" /> Last update is shown in chronological order for every ticket.</li>
              <li className="flex items-start gap-2"><User size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" /> Filter by engineer and see only their assigned work.</li>
              <li className="flex items-start gap-2"><CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" /> Resolved work appears clearly with a green progress bar in the timeline.</li>
            </ul>
          </div>
        </div>
      </div>
      {/* Status Update Modal */}
      {activeUpdateTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-6 glass-header flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Update Ticket #{activeUpdateTicket.id}</h3>
              <button onClick={() => setActiveUpdateTicket(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Selected Status</label>
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border ${statusBadge[newStatus]}`}>
                  {newStatus.replace('_', ' ')}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Progress Note / Message</label>
                <textarea
                  className="w-full glass-input min-h-[120px] p-3 text-sm resize-none"
                  placeholder="Describe the update, what was done, or next steps..."
                  value={progressNote}
                  onChange={e => setProgressNote(e.target.value)}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveUpdateTicket(null)}
                  className="flex-1 px-4 py-2.5 glass-button-secondary rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStatusUpdateWithNote}
                  disabled={submittingUpdate}
                  className="flex-1 px-4 py-2.5 glass-button rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                >
                  {submittingUpdate ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
