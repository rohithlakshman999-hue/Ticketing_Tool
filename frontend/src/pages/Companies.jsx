import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Building2, Plus, Trash2, Download, FileSpreadsheet, FileText, Table } from 'lucide-react';
import { formatDateTime } from '../utils/date';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Companies() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies/');
      setCompanies(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/companies/', { name: newName });
      setNewName('');
      setShowAddForm(false);
      setSuccess('Company added successfully');
      fetchCompanies();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to add company');
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    setError(''); setSuccess('');
    try {
      await api.delete(`/companies/${id}`);
      setSuccess('Company deleted');
      fetchCompanies();
    } catch (e) {
      setError('Failed to delete company');
    }
  };

  // ------------------- EXPORT LOGIC -------------------

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Created At'];
    const rows = companies.map(c => [c.id, c.name, formatDateTime(c.created_at)]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "companies_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToExcel = () => {
    const data = companies.map(c => ({
      ID: c.id,
      Name: c.name,
      'Created At': formatDateTime(c.created_at)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Companies");
    XLSX.writeFile(workbook, "companies_export.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Company Records", 14, 15);
    const tableColumn = ["ID", "Name", "Created At"];
    const tableRows = companies.map(c => [c.id, c.name, formatDateTime(c.created_at)]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("companies_export.pdf");
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-center text-red-400">Access Denied.</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between glass-card p-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="text-blue-400" /> Company Management
          </h1>
          <p className="text-slate-300 text-sm mt-1">Manage partner companies and export records.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="glass-button px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
          >
            <Plus size={16} /> {showAddForm ? 'Cancel' : 'Add Company'}
          </button>
          
          <div className="flex gap-2">
            <button onClick={exportToCSV} className="glass-button-secondary p-2 rounded-lg" title="Export CSV">
              <Table size={18} />
            </button>
            <button onClick={exportToExcel} className="glass-button-secondary p-2 rounded-lg" title="Export Excel">
              <FileSpreadsheet size={18} />
            </button>
            <button onClick={exportToPDF} className="glass-button-secondary p-2 rounded-lg" title="Export PDF">
              <FileText size={18} />
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="glass-card p-6 animate-fade-in-down">
          <form onSubmit={handleAddCompany} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full glass-input"
                placeholder="e.g. Acme Corp"
              />
            </div>
            <button type="submit" className="glass-button px-6 py-2.5 rounded-lg w-full sm:w-auto">
              Save Company
            </button>
          </form>
        </div>
      )}

      {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-300 text-sm">{error}</div>}
      {success && <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg text-green-300 text-sm">{success}</div>}

      <div className="glass-card overflow-hidden">
        <table className="w-full table-glass">
          <thead>
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Company Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Created At</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-slate-500">Loading companies...</td></tr>
            ) : companies.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-slate-500">No companies found.</td></tr>
            ) : companies.map(company => (
              <tr key={company.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">#{company.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{company.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{formatDateTime(company.created_at)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDeleteCompany(company.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
