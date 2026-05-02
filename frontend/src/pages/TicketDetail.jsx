import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Send, Lock, Clock, User as UserIcon, Monitor,
  ShieldCheck, AlertTriangle, ShieldAlert, Trash2, UserCheck,
  CheckCircle, RotateCcw, Activity, X, Check
} from 'lucide-react';
import { useWebSockets } from '../hooks/useWebSockets';
import { formatDate, formatTime, formatDateTime } from '../utils/date';

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [engineerStatus, setEngineerStatus] = useState('');
  const [engineerNote, setEngineerNote] = useState('');
  const [deletingComment, setDeletingComment] = useState(null);
  const [deletingTicket, setDeletingTicket] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [assignEngineerId, setAssignEngineerId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [activity, setActivity] = useState([]);
  const [submittingProgress, setSubmittingProgress] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const commentsEndRef = useRef(null);
  const { lastMessage } = useWebSockets();

  const fetchTicket = async () => {
    try {
      const [ticketRes, activityRes] = await Promise.all([
        api.get(`/tickets/${id}`),
        api.get(`/tickets/${id}/activity`).catch(() => ({ data: [] }))
      ]);
      setTicket(ticketRes.data);
      setStatus(ticketRes.data.status);
      setPriority(ticketRes.data.priority);
      setActivity(activityRes.data || []);
    } catch (e) {
      console.error(e);
      if (e.response && e.response.status === 404) navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  // Fetch engineers for admin assign
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/auth/engineers').then(r => setEngineers(r.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (lastMessage) {
      if ((lastMessage.type === 'ticket_updated' || lastMessage.type === 'comment_added') &&
          String(lastMessage.ticket_id) === String(id)) {
        fetchTicket();
      }
    }
  }, [lastMessage]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticket?.comments]);

  const handleUpdateStatus = async () => {
    try {
      setError(''); setSuccess('');
      await api.patch(`/tickets/${id}`, { status, priority });
      setSuccess('Ticket status updated successfully');
      fetchTicket();
    } catch (e) {
      setError('Failed to update ticket');
    }
  };

  const handleEngineerProgressUpdate = async () => {
    setError(''); setSuccess('');
    if (!engineerStatus || !engineerNote.trim()) {
      setError('Please select a status and add a progress note');
      return;
    }
    try {
      setSubmittingProgress(true);
      await api.post(`/tickets/${id}/progress`, { status: engineerStatus, message: engineerNote });
      setEngineerNote('');
      setEngineerStatus('');
      setSuccess('Progress updated successfully');
      fetchTicket();
    } catch (e) {
      setError('Failed to submit progress update.');
    } finally {
      setSubmittingProgress(false);
    }
  };

  const handleEngineerStatusUpdate = async () => {
    setError(''); setSuccess('');
    if (!engineerStatus) return;
    try {
      await api.put(`/tickets/${id}/status`, { status: engineerStatus, note: engineerNote });
      setEngineerNote('');
      setEngineerStatus('');
      setSuccess('Status updated successfully');
      fetchTicket();
    } catch (e) {
      setError('Failed to update status.');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!newComment.trim()) return;
    try {
      await api.post(`/tickets/${id}/comments`, { message: newComment, is_internal: isInternal });
      setNewComment('');
      setIsInternal(false);
      setSuccess('Comment added successfully');
      fetchTicket();
    } catch (e) {
      setError('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/tickets/${id}/comments/${commentId}`);
      setDeletingComment(null);
      setSuccess('Comment deleted');
      fetchTicket();
    } catch (e) {
      setError('Failed to delete comment.');
    }
  };

  const handleAssignEngineer = async () => {
    setError(''); setSuccess('');
    if (!assignEngineerId) return;
    try {
      setAssigning(true);
      await api.put(`/tickets/${id}/assign`, { engineer_id: parseInt(assignEngineerId) });
      setAssignEngineerId('');
      setSuccess('Engineer assigned successfully');
      fetchTicket();
    } catch (e) {
      setError('Failed to assign engineer.');
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteTicket = async () => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/tickets/${id}`);
      navigate('/dashboard');
    } catch (e) {
      setError('Failed to delete ticket.');
      setDeletingTicket(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="text-slate-400 font-medium">Loading ticket details...</div>
    </div>
  );
  if (!ticket) return <div className="text-center p-12 text-slate-400">Ticket not found.</div>;

  const canEdit = user.role === 'admin' || user.role === 'staff';
  const canUpdateProgress = user.role === 'admin' || user.role === 'staff';
  const isAdmin = user.role === 'admin';

  const timeline = [
    ...(ticket.comments || []).map(c => ({ ...c, _type: 'comment', date: new Date(c.created_at) })),
    ...(ticket.history || []).map(h => ({ ...h, _type: 'history', date: new Date(h.timestamp) })),
    ...(activity || []).map(a => ({ ...a, _type: 'activity', date: new Date(a.created_at) }))
  ].sort((a, b) => a.date - b.date);

  const getWarrantyBadge = (status) => {
    switch (status) {
      case 'under_warranty': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-green-500/20 text-green-300 border border-green-500/30"><ShieldCheck size={14} /> Active</span>;
      case 'expiring_soon': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><AlertTriangle size={14} /> Expiring Soon</span>;
      case 'expired': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-red-500/20 text-red-300 border border-red-500/30"><ShieldAlert size={14} /> Expired</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold bg-slate-500/20 text-slate-300 border border-slate-500/30">Unknown</span>;
    }
  };

  const activityIcon = (action) => {
    if (action?.includes('assigned')) return <UserCheck size={14} className="text-indigo-500" />;
    if (action?.includes('status')) return <RotateCcw size={14} className="text-yellow-500" />;
    if (action?.includes('resolved')) return <CheckCircle size={14} className="text-green-500" />;
    return <Activity size={14} className="text-gray-400" />;
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-500/30 p-4 text-red-200 text-sm flex items-start gap-3 backdrop-blur-sm mb-6">
          <X size={18} className="flex-shrink-0 mt-0.5 text-red-400" />
          <div>{error}</div>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-900/30 border border-green-500/30 p-4 text-green-200 text-sm flex items-start gap-3 backdrop-blur-sm mb-6">
          <Check size={18} className="flex-shrink-0 mt-0.5 text-green-400" />
          <div>{success}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Main Conversation Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card overflow-hidden flex flex-col h-[700px]">
            <div className="p-6 glass-header flex-shrink-0">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-2xl font-bold text-white leading-tight">{ticket.title}</h2>
              </div>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <UserIcon size={14} />
                {ticket.customer_name || `Customer #${ticket.customer_id}`} • {formatDateTime(ticket.created_at)}
              </p>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/30 custom-scrollbar">
              {/* Original Description */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-300 font-bold">
                  C
                </div>
                <div className="flex-1 bg-white/5 backdrop-blur-md rounded-xl rounded-tl-none p-4 border border-white/10">
                  <p className="whitespace-pre-wrap text-slate-200 text-sm">{ticket.description}</p>
                </div>
              </div>

              {timeline.map((item, idx) => {
                if (item._type === 'history') {
                  return (
                    <div key={`hist-${item.id}`} className="flex justify-center my-2">
                      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/5 text-slate-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 max-w-sm text-center">
                        {activityIcon(item.action)}
                        <span>
                          <strong className="capitalize text-slate-300">{item.action?.replace('_', ' ')}</strong>
                          {item.old_value && item.new_value && `: "${item.old_value}" → "${item.new_value}"`}
                          {item.changed_by_name && ` by ${item.changed_by_name}`}
                        </span>
                        <Clock size={11} className="flex-shrink-0 text-slate-500" />
                        <span className="flex-shrink-0 text-slate-500">{formatTime(item.timestamp)}</span>
                      </div>
                    </div>
                  );
                }

                if (item._type === 'activity') {
                  return (
                    <div key={`act-${item.id}`} className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 text-blue-400">
                        <Activity size={18} />
                      </div>
                      <div className="flex-1 rounded-xl p-4 border bg-blue-900/20 border-blue-500/20 text-sm backdrop-blur-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-semibold text-blue-300 uppercase tracking-wider text-xs">{item.status.replace('_', ' ')}</div>
                          <span className="text-xs text-blue-300/70">{formatTime(item.created_at)}</span>
                        </div>
                        <div className="mt-1 text-slate-200">{item.message}</div>
                        <div className="mt-3 text-[10px] uppercase tracking-wider text-blue-300/60 font-semibold">Updated by {item.engineer_name || 'System'}</div>
                      </div>
                    </div>
                  );
                }

                if (item._type === 'comment') {
                  const isOwn = item.sender_id === user.id;
                  return (
                    <div key={`comm-${item.id}`} className={`flex gap-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold border
                        ${isOwn ? 'bg-blue-600/80 text-white border-blue-400/50' : 'bg-slate-700 text-slate-200 border-slate-500'}`}>
                        {item.sender_id === ticket.customer_id ? 'C' : 'S'}
                      </div>
                      <div className={`flex-1 rounded-xl p-4 border text-sm group relative backdrop-blur-sm
                        ${item.is_internal ? 'bg-yellow-900/20 border-yellow-500/30' :
                          isOwn ? 'bg-blue-600/20 border-blue-500/30 rounded-tr-none' : 'bg-white/5 border-white/10 rounded-tl-none'}`}>
                        {item.is_internal && (
                          <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 uppercase tracking-wide mb-2">
                            <Lock size={12} /> Internal Note
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-slate-200">{item.message}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs text-slate-400">
                            {formatTime(item.created_at)}
                          </span>
                          {canEdit && (
                            <button
                              onClick={() => setDeletingComment(item)}
                              className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
              <div ref={commentsEndRef} />
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-slate-900/50 border-t border-white/10 flex-shrink-0 backdrop-blur-md">
              <form onSubmit={handleAddComment}>
                {canEdit && (
                  <div className="mb-3 flex items-center">
                    <input
                      type="checkbox"
                      id="internalNote"
                      className="rounded border-slate-600 bg-slate-800 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-slate-900 mr-2"
                      checked={isInternal}
                      onChange={e => setIsInternal(e.target.checked)}
                    />
                    <label htmlFor="internalNote" className="text-sm text-slate-300 font-medium flex items-center gap-1">
                      <Lock size={14} className="text-yellow-500" /> Internal Note (Staff only)
                    </label>
                  </div>
                )}
                <div className="flex gap-3">
                  <textarea
                    className={`flex-1 min-h-[80px] p-3 rounded-lg shadow-sm focus:ring-2 focus:outline-none sm:text-sm resize-none
                      ${isInternal ? 'border border-yellow-500/50 focus:ring-yellow-500 bg-yellow-900/10 text-yellow-100 placeholder-yellow-500/50' : 'glass-input'}`}
                    placeholder={isInternal ? "Write a private internal note..." : "Type your reply..."}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2 self-end
                      ${isInternal ? 'bg-yellow-600/80 hover:bg-yellow-500/90 text-white border border-yellow-500/50' : 'glass-button'}`}
                  >
                    <Send size={16} /> Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Ticket Properties */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Ticket Properties</h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1">Status</span>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border
                  ${ticket.status === 'open' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    ticket.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                    ticket.status === 'resolved' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1">Priority</span>
                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border
                  ${ticket.priority === 'high' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                    ticket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                    'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                  {ticket.priority}
                </span>
              </div>

              {/* Assigned Engineer */}
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <UserCheck size={12} /> Assigned Engineer
                </span>
                <p className="text-sm text-white font-medium">
                  {ticket.assigned_technician_name || (ticket.assigned_technician_id ? `Engineer #${ticket.assigned_technician_id}` : 'Unassigned')}
                </p>
              </div>

              {!ticket.device && (
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">Device Type</span>
                  <p className="text-sm text-white font-medium">{ticket.device_type}</p>
                </div>
              )}
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1">Category</span>
                <p className="text-sm text-white font-medium">{ticket.category}</p>
              </div>
            </div>
          </div>

          {/* Customer Details Info */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
              <UserIcon size={16} className="text-slate-400" /> Customer Details
            </h3>
            <div className="space-y-4">
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1">Full Name</span>
                <p className="text-sm text-white font-medium">{ticket.customer_name || 'N/A'}</p>
              </div>
              <div>
                <span className="block text-xs font-medium text-slate-400 mb-1">Email Address</span>
                <p className="text-sm text-blue-400 font-medium break-all">{ticket.customer_email || 'N/A'}</p>
              </div>
              {ticket.company_name && (
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">Company</span>
                  <p className="text-sm text-slate-300 font-medium">{ticket.company_name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Device Info */}
          {ticket.device && (
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 border-b border-white/10 pb-2 flex items-center gap-2">
                <Monitor size={16} className="text-slate-400" /> Linked Device
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">Make / Brand</span>
                  <p className="text-sm text-white font-medium">{ticket.device.product_name}</p>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">Model / Serial</span>
                  <p className="text-sm text-white font-mono">{ticket.device.model_number} / {ticket.device.serial_number}</p>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">Warranty Status</span>
                  {getWarrantyBadge(ticket.device.warranty_status)}
                </div>
              </div>
            </div>
          )}

          {/* Engineer Progress Update Panel */}
          {canUpdateProgress && (
            <div className="glass-card p-6 bg-blue-900/10 border-blue-500/20">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-blue-400" />
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Submit Progress Update</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4">Log your work details. Your name will be automatically attached to this update.</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2 border border-white/10 rounded-md text-sm bg-slate-800/50 text-slate-400"
                    value={user?.full_name || user?.email || 'You'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status <span className="text-red-400">*</span></label>
                  <select
                    className="w-full px-3 py-2 glass-input text-sm"
                    value={engineerStatus}
                    onChange={e => setEngineerStatus(e.target.value)}
                  >
                    <option value="" className="bg-slate-800 text-slate-200">— Select new status —</option>
                    <option value="in_progress" className="bg-slate-800 text-slate-200">In Progress</option>
                    <option value="resolved" className="bg-slate-800 text-slate-200">Resolved</option>
                    <option value="closed" className="bg-slate-800 text-slate-200">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Progress Note <span className="text-red-400">*</span></label>
                  <textarea
                    rows="4"
                    placeholder="Describe what you did, issues found, next steps..."
                    className="w-full px-3 py-2 glass-input text-sm resize-none"
                    value={engineerNote}
                    onChange={e => setEngineerNote(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleEngineerProgressUpdate}
                  disabled={!engineerStatus || !engineerNote.trim() || submittingProgress}
                  className="w-full glass-button disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Activity size={16} />
                  {submittingProgress ? 'Submitting...' : 'Submit Progress Update'}
                </button>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {isAdmin && (
            <div className="glass-card p-6 space-y-5">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider border-b border-white/10 pb-2">Admin Actions</h3>

              {/* Assign / Reassign Engineer */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <UserCheck size={12} />
                  {ticket.assigned_technician_id ? 'Reassign Engineer' : 'Assign Engineer'}
                </label>
                {ticket.assigned_technician_name && (
                  <p className="text-xs text-blue-400 font-medium mb-2">
                    Currently: {ticket.assigned_technician_name}
                  </p>
                )}
                <select
                  className="w-full px-3 py-2 glass-input text-sm mb-2"
                  value={assignEngineerId}
                  onChange={e => setAssignEngineerId(e.target.value)}
                >
                  <option value="" className="bg-slate-800 text-slate-200">— Select engineer —</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id} className="bg-slate-800 text-slate-200">{eng.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAssignEngineer}
                  disabled={!assignEngineerId || assigning}
                  className="w-full glass-button disabled:opacity-50 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck size={15} />
                  {assigning ? 'Assigning...' : ticket.assigned_technician_id ? 'Reassign' : 'Assign'}
                </button>
              </div>

              {/* Status + Priority */}
              <div className="border-t border-white/10 pt-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Update Status</label>
                  <select
                    className="w-full px-3 py-2 glass-input text-sm"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="open" className="bg-slate-800 text-slate-200">Open</option>
                    <option value="in_progress" className="bg-slate-800 text-slate-200">In Progress</option>
                    <option value="resolved" className="bg-slate-800 text-slate-200">Resolved</option>
                    <option value="closed" className="bg-slate-800 text-slate-200">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Update Priority</label>
                  <select
                    className="w-full px-3 py-2 glass-input text-sm"
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="low" className="bg-slate-800 text-slate-200">Low</option>
                    <option value="medium" className="bg-slate-800 text-slate-200">Medium</option>
                    <option value="high" className="bg-slate-800 text-slate-200">High</option>
                  </select>
                </div>
                <button
                  className="w-full glass-button-secondary py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  onClick={handleUpdateStatus}
                >
                  Apply Changes
                </button>
              </div>

              {/* Danger Zone — Delete Ticket */}
              <div className="border-t border-red-500/30 pt-4">
                <p className="text-xs font-medium text-red-400 uppercase tracking-wider mb-2">Danger Zone</p>
                <button
                  onClick={() => setDeletingTicket(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-500/20 rounded-md text-sm font-medium transition-colors bg-red-900/10"
                >
                  <Trash2 size={15} /> Delete This Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Comment Confirmation */}
      {deletingComment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trash2 size={18} className="text-red-400" /> Delete Comment?
            </h3>
            <p className="text-slate-300 text-sm mb-6">This comment will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingComment(null)} className="flex-1 px-4 py-2 glass-button-secondary rounded-md text-sm font-medium">Cancel</button>
              <button onClick={() => handleDeleteComment(deletingComment.id)} className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-500 border border-red-500/50 text-white rounded-md text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Ticket Confirmation */}
      {deletingTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-400" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Ticket?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              This will permanently delete <strong>#{ticket.id} — {ticket.title}</strong> and all comments and history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingTicket(false)} className="flex-1 px-4 py-2 glass-button-secondary rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleDeleteTicket} className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-500 border border-red-500/50 text-white rounded-md text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TicketDetail;
