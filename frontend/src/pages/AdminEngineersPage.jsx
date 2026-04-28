import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Eye, EyeOff, Check, X } from 'lucide-react';

export default function AdminEngineersPage() {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    designation: '',
    role: 'staff'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchEngineers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/engineers');
      setEngineers(res.data);
    } catch (e) {
      console.error(e);
      setEngineers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') return;
    fetchEngineers();
  }, [user]);

  const handleCreateEngineer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.full_name || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        designation: formData.designation,
        role: 'staff',
        company_name: undefined
      });
      setSuccess(`Engineer "${formData.full_name}" added successfully!`);
      setFormData({ full_name: '', email: '', password: '', designation: '', role: 'staff' });
      setShowForm(false);
      fetchEngineers();
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(detail || 'Failed to add engineer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEngineer = async (engineerId) => {
    try {
      // Note: You'll need to add a delete endpoint on the backend
      // For now, this is a placeholder
      setError('Delete functionality coming soon');
    } catch (e) {
      setError('Failed to delete engineer');
    } finally {
      setDeletingId(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="rounded-lg bg-white border border-red-100 p-8 text-center text-red-700">
        Admin access required to manage engineers.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Engineers</h1>
          <p className="text-sm text-slate-300 mt-1">Add and manage your technical support team.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 glass-button rounded-lg font-medium text-sm transition-colors"
        >
          <Plus size={18} />
          {showForm ? 'Cancel' : 'Add Engineer'}
        </button>
      </div>

      {/* Messages */}
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

      {/* Add Engineer Form */}
      {showForm && (
        <div className="glass-card p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Engineer</h2>
          <form onSubmit={handleCreateEngineer} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 glass-input"
                  placeholder="e.g. John Smith"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 glass-input"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Designation</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 glass-input"
                  placeholder="e.g. Senior Technician, Field Engineer"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 glass-input pr-10"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">Share this temporary password with the engineer to login for the first time.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 glass-button rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Engineer'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2 glass-button-secondary rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Engineers List */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 glass-header">
          <h2 className="text-lg font-semibold text-white">
            All Engineers ({engineers.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading engineers...</div>
        ) : engineers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>No engineers added yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-400 hover:text-blue-300 font-medium mt-2 transition-colors"
            >
              Add your first engineer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-glass">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs uppercase">Designation</th>
                  <th className="px-6 py-4 text-left text-xs uppercase">Role</th>
                  <th className="px-6 py-4 text-left text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {engineers.map((engineer) => (
                  <tr key={engineer.id}>
                    <td className="px-6 py-4 text-sm font-medium text-white">{engineer.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{engineer.email}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{engineer.designation || '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Staff
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => setDeletingId(engineer.id)}
                        className="text-red-400 hover:text-red-300 font-medium disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-5 backdrop-blur-sm">
        <h3 className="font-semibold text-blue-300 mb-2">How to manage engineers:</h3>
        <ul className="text-sm text-blue-200/80 space-y-1.5 list-disc list-inside">
          <li>Click <strong className="text-blue-200">"Add Engineer"</strong> to create a new staff account</li>
          <li>Enter their full name, email, and a temporary password</li>
          <li>Share the password with them securely (recommend they change it on first login)</li>
          <li>They'll automatically appear in ticket assignment dropdowns</li>
          <li>Each engineer gets a personal "Workbench" to view and update their assigned tickets</li>
        </ul>
      </div>
    </div>
  );
}
