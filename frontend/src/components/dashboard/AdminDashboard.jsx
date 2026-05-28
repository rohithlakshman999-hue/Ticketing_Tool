import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Trash2, UserCheck, X, AlertTriangle, Check, Download } from 'lucide-react';
import { formatDateTime } from '../../utils/date';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280'];

export default function AdminDashboard({ tickets, devices = [], setShowForm, showForm, onRefresh }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [engineers, setEngineers] = useState([]);
  const [assigneeMap, setAssigneeMap] = useState({}); // for assignment selection
  const [selectedEngineerDetail, setSelectedEngineerDetail] = useState(null); // for showing modal details
  const [deleteConfirm, setDeleteConfirm] = useState(null); // ticket to delete
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState(null); // null, 'total', 'live', 'closed', 'unassigned'
  const [newPassword, setNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    api.get('/auth/engineers')
      .then(r => setEngineers(r.data))
      .catch(() => { });
  }, []);

  const handleAssign = async (ticketId) => {
    const engineerId = assigneeMap[ticketId];
    setError(''); setSuccess('');
    if (!engineerId) return;
    try {
      await api.put(`/tickets/${ticketId}/assign`, { engineer_id: parseInt(engineerId) });
      setAssigningTicket(null);
      setSuccess('Engineer assigned successfully');
      if (onRefresh) onRefresh();
    } catch (e) {
      setError('Failed to assign engineer.');
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/tickets/${ticketId}`);
      setDeleteConfirm(null);
      setSuccess('Ticket deleted successfully');
      if (onRefresh) onRefresh();
    } catch (e) {
      setError('Failed to delete ticket.');
      setDeleteConfirm(null);
    }
  };

  // Calculate KPIs
  const totalTickets = tickets.length;
  const liveTicketsCount = tickets.filter(t => t.assigned_technician_id).length;
  const closedTicketsCount = tickets.filter(t => t.status === 'closed' || t.status === 'resolved').length;
  const unassignedTicketsCount = tickets.filter(t => !t.assigned_technician_id).length;

  const handleDownloadCSV = () => {
    const headers = ['ID', 'Title', 'Status', 'Priority', 'Customer', 'Assigned Tech', 'Company', 'Created At'];
    const rows = tickets.map(t => [
      t.id,
      t.title,
      t.status,
      t.priority,
      t.customer_name || t.customer_email || 'Unknown',
      t.assigned_technician_name || 'Unassigned',
      t.company_name || 'N/A',
      t.created_at
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  const urgentTickets = tickets.filter(t => t.priority === 'high' || t.status === 'open');

  const filteredTickets = tickets.filter(t => {
    if (filter === 'live') return !!t.assigned_technician_id;
    if (filter === 'closed') return t.status === 'closed' || t.status === 'resolved';
    if (filter === 'unassigned') return !t.assigned_technician_id;
    if (filter === 'total') return true;
    return false;
  });

  const statusData = [
    { name: 'Open', value: tickets.filter(t => t.status === 'open').length },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'in_progress').length },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'resolved').length },
    { name: 'Closed', value: tickets.filter(t => t.status === 'closed').length },
  ];

  return (
    <div className="space-y-8">

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-600" size={20} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Ticket?</h3>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              This will permanently delete ticket <strong>#{deleteConfirm.id} — {deleteConfirm.title}</strong> and all its comments and history. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTicket(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top action bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-card p-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Control Center</h1>
          <p className="text-slate-300 text-sm">Enterprise IT Service Management</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="glass-button px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ New Ticket'}
          </button>
          <button
            className="glass-button-secondary px-4 py-2 rounded-lg font-medium text-sm transition-colors"
            onClick={() => window.location.assign('/tracking')}
          >
            View Work Tracking
          </button>
        </div>
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

      {/* KPI Cards */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">System Overview</h2>
        <button 
          onClick={handleDownloadCSV}
          className="glass-button px-4 py-2 text-xs flex items-center gap-2"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => setFilter('total')}
          className={`glass-card p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20 ${filter === 'total' ? 'ring-2 ring-blue-500 bg-white/10' : ''}`}
        >
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2">Total Tickets</h3>
          <span className="text-4xl font-bold text-blue-400">{totalTickets}</span>
        </div>
        <div
          onClick={() => setFilter('live')}
          className={`glass-card p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-yellow-500/20 ${filter === 'live' ? 'ring-2 ring-yellow-500 bg-white/10' : ''}`}
        >
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2">Live Tickets</h3>
          <span className="text-4xl font-bold text-yellow-400">{liveTicketsCount}</span>
        </div>
        <div
          onClick={() => setFilter('closed')}
          className={`glass-card p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-green-500/20 ${filter === 'closed' ? 'ring-2 ring-green-500 bg-white/10' : ''}`}
        >
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2">Closed Tickets</h3>
          <span className="text-4xl font-bold text-green-400">{closedTicketsCount}</span>
        </div>
        <div
          onClick={() => setFilter('unassigned')}
          className={`glass-card p-6 flex flex-col items-center justify-center cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-red-500/20 ${filter === 'unassigned' ? 'ring-2 ring-red-500 bg-white/10' : ''}`}
        >
          <h3 className="text-slate-300 text-sm font-medium uppercase tracking-wider mb-2">Un-assigned</h3>
          <span className="text-4xl font-bold text-red-400">{unassignedTicketsCount}</span>
        </div>
      </div>

      {/* Live Ticket Feed with Assign & Delete */}
      {filter && (
        <div className="glass-card overflow-hidden animate-fade-in-down">
          <div className="px-6 py-4 glass-header flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2 capitalize">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
              {filter.replace('-', ' ')} Tickets View
            </h3>
            <button
              onClick={() => setFilter(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="p-4 hover:bg-white/5 transition-colors">
                {/* Top row: title + status */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/tickets/${ticket.id}`} className="text-blue-400 font-semibold hover:text-blue-300 text-sm transition-colors">
                        #{ticket.id} — {ticket.title}
                      </Link>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border flex-shrink-0
                        ${ticket.status === 'open' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            ticket.status === 'resolved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                              'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 border
                        ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                          ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                            'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-slate-400">
                        {formatDateTime(ticket.created_at)}
                      </p>
                      {ticket.company_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {ticket.company_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-2.5 border border-white/10 mt-1">
                  <UserCheck size={16} className="text-blue-400 flex-shrink-0" />
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Assigned Engineer</span>
                    <span className="text-sm text-slate-300 cursor-pointer hover:text-blue-400 transition-colors" 
                          onClick={() => {
                            const eng = engineers.find(e => e.id === ticket.assigned_technician_id);
                            if (eng) setSelectedEngineerDetail(eng);
                          }}>
                      {ticket.assigned_technician_name
                        ? <span className="text-blue-300 font-medium underline underline-offset-4 decoration-blue-500/30">{ticket.assigned_technician_name}</span>
                        : <span className="text-orange-400 font-medium italic">Unassigned</span>}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Raised By</span>
                    <span className="text-xs text-slate-400 font-medium">
                      {ticket.customer_name || ticket.customer_email || 'System'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="p-12 text-center text-slate-500">No tickets found for this category.</div>
            )}
          </div>
        </div>
      )}

      {/* Urgent + Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 bg-red-900/10 border-red-500/20">
          <h3 className="text-lg font-semibold text-red-400 mb-4">Urgent Issues</h3>
          <div className="space-y-4">
            {urgentTickets.slice(0, 5).map(ticket => (
              <div key={ticket.id} className="bg-white/5 p-4 rounded-xl border-l-4 border-red-500 shadow-sm backdrop-blur-sm">
                <Link to={`/tickets/${ticket.id}`} className="text-white font-medium hover:text-blue-300 text-sm transition-colors">
                  {ticket.title}
                </Link>
                <div className="text-xs text-slate-400 mt-1">Priority: {ticket.priority}</div>
              </div>
            ))}
            {urgentTickets.length === 0 && <p className="text-sm text-slate-400">No urgent issues!</p>}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Status Distribution</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="rgba(255,255,255,0.1)">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Ticket Volume</h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="value" fill="#3b82f6" barSize={32} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="glass-card p-6 bg-blue-900/10 border-blue-500/20">
        <h3 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
          ✨ AI Insights Panel
        </h3>
        <ul className="space-y-3 text-slate-300 text-sm list-disc list-inside">
          <li><strong>Workload Imbalance:</strong> Technicians are currently resolving tickets faster than they are being opened.</li>
          <li><strong>Trending Issue:</strong> "Hardware" category makes up the majority of recent tickets. Consider proactive maintenance checks.</li>
        </ul>
      </div>
      {/* Engineer Detail Modal */}
      {selectedEngineerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-md p-8 relative animate-zoom-in">
            <button 
              onClick={() => {
                setSelectedEngineerDetail(null);
                setNewPassword('');
                setPasswordSuccess('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <UserCheck className="text-blue-400" /> Engineer Details
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Full Name</label>
                  <p className="text-sm text-white font-medium">{selectedEngineerDetail.full_name || selectedEngineerDetail.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Role</label>
                  <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider bg-yellow-500/10 px-2 py-0.5 rounded inline-block border border-yellow-500/20">
                    {selectedEngineerDetail.role || 'Staff'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Login Email / Username</label>
                <p className="text-sm text-blue-400 font-medium">{selectedEngineerDetail.email}</p>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Last Login</label>
                <p className="text-sm text-slate-300 font-medium">
                  {selectedEngineerDetail.last_login || 'Never logged in'}
                </p>
              </div>

              {/* Password Reset Section — Admin Only */}
              {user.role === 'admin' && (
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Admin: Reset Password</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter new password"
                      className="glass-input text-xs py-1.5 flex-1"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                    <button 
                      onClick={async () => {
                        if (!newPassword) return;
                        try {
                          await api.put(`/auth/users/${selectedEngineerDetail.id}/password`, { new_password: newPassword });
                          setPasswordSuccess('Password changed!');
                          setNewPassword('');
                        } catch(e) {
                          alert('Failed to change password');
                        }
                      }}
                      className="glass-button text-[10px] px-3 py-1.5"
                    >
                      Update
                    </button>
                  </div>
                  {passwordSuccess && <p className="text-[10px] text-green-400 font-medium">{passwordSuccess}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
