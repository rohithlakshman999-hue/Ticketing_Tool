import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Plus, Monitor, X, Search, ShieldCheck, AlertTriangle, ShieldAlert, Trash2, Check } from 'lucide-react';

function Devices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    model_number: '',
    serial_number: '',
    device_type_id: '',
    warranty_available: false,
    description: ''
  });
  
  const [filterType, setFilterType] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null); // device to delete
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterType]);

  const fetchData = async () => {
    try {
      const [typesRes, devicesRes] = await Promise.all([
        api.get('/devices/types'),
        api.get('/devices/', { 
          params: { 
            type_id: filterType || undefined,
            only_with_tickets: user?.role === 'customer' ? true : undefined
          } 
        })
      ]);
      setDeviceTypes(typesRes.data);
      setDevices(devicesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.post('/devices/', {
        ...formData,
        device_type_id: parseInt(formData.device_type_id)
      });
      setShowModal(false);
      setFormData({
        product_name: '', model_number: '', serial_number: '', 
        device_type_id: '', warranty_available: false, description: ''
      });
      setSuccess('Device created successfully');
      fetchData();
    } catch (err) {
      setError("Failed to create device. Serial number might exist.");
    }
  };

  const handleDeleteDevice = async (deviceId) => {
    setError(''); setSuccess('');
    try {
      await api.delete(`/devices/${deviceId}`);
      setDeleteConfirm(null);
      setSuccess('Device deleted successfully');
      fetchData();
    } catch (err) {
      setError('Failed to delete device. It may be linked to an active ticket.');
      setDeleteConfirm(null);
    }
  };

  const getWarrantyBadge = (status) => {
    switch(status) {
      case 'under_warranty':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-500/30"><ShieldCheck size={14}/> Active</span>;
      case 'expiring_soon':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"><AlertTriangle size={14}/> Expiring Soon</span>;
      case 'expired':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30"><ShieldAlert size={14}/> Expired</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-500/20 text-slate-300 border border-slate-500/30">Unknown</span>;
    }
  };

  if (loading) return <div className="text-slate-400">Loading devices...</div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-end glass-card p-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Device & Asset Management</h1>
          <p className="text-slate-300 mt-1">Track warranties and link devices to your service tickets.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 glass-button px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Register New Device
        </button>
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

      <div className="glass-card p-4 flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search serial number..."
            className="block w-full pl-10 pr-3 py-2 glass-input text-sm"
          />
        </div>
        <select 
          className="block w-48 pl-3 pr-10 py-2 glass-input text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="" className="bg-slate-800 text-slate-200">All Device Types</option>
          {deviceTypes.map(t => (
            <option key={t.id} value={t.id} className="bg-slate-800 text-slate-200">{t.name}</option>
          ))}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full table-glass">
          <thead>
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs uppercase">Make / Brand</th>
              <th scope="col" className="px-6 py-4 text-left text-xs uppercase">Type</th>
              <th scope="col" className="px-6 py-4 text-left text-xs uppercase">Serial No.</th>
              <th scope="col" className="px-6 py-4 text-left text-xs uppercase">Warranty Status</th>
              <th scope="col" className="px-6 py-4 text-right text-xs uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((device) => (
              <tr key={device.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-white">{device.product_name}</div>
                      <div className="text-sm text-slate-400">{device.model_number}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300">{device.device_type.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-400 font-mono">{device.serial_number}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getWarrantyBadge(device.warranty_status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => setDeleteConfirm(device)}
                    title="Delete Device"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/10 transition-colors bg-white/5"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {devices.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                  No devices found. Add your first device to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md overflow-hidden border border-white/10">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/10 glass-header">
              <h3 className="text-lg font-bold text-white">Register Device</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Device Type</label>
                <select 
                  required
                  value={formData.device_type_id}
                  onChange={e => setFormData({...formData, device_type_id: e.target.value})}
                  className="w-full glass-input text-sm"
                >
                  <option value="" className="bg-slate-800 text-slate-200">Select a type...</option>
                  {deviceTypes.map(t => (
                    <option key={t.id} value={t.id} className="bg-slate-800 text-slate-200">{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {formData.device_type_id && deviceTypes.find(t => t.id === parseInt(formData.device_type_id))?.name.toLowerCase().includes('laptop') && 
                   !deviceTypes.find(t => t.id === parseInt(formData.device_type_id))?.name.toLowerCase().includes('laptop ') ? 
                   "Make / Brand" : "Accessory Name / Make"}
                </label>
                <input 
                  type="text" required
                  placeholder="e.g. Dell XPS 15 or 6-Cell Battery"
                  value={formData.product_name}
                  onChange={e => setFormData({...formData, product_name: e.target.value})}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Model Number</label>
                  <input 
                    type="text" required
                    value={formData.model_number}
                    onChange={e => setFormData({...formData, model_number: e.target.value})}
                    className="w-full glass-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Serial Number</label>
                  <input 
                    type="text" required
                    value={formData.serial_number}
                    onChange={e => setFormData({...formData, serial_number: e.target.value})}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Warranty Available?</label>
                  <select 
                    className="w-full glass-input text-sm"
                    value={formData.warranty_available ? 'yes' : 'no'}
                    onChange={e => setFormData({...formData, warranty_available: e.target.value === 'yes'})}
                  >
                    <option value="no" className="bg-slate-800 text-slate-200">No</option>
                    <option value="yes" className="bg-slate-800 text-slate-200">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Product Description</label>
                <textarea 
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="e.g. Blue color, slight scratch on lid"
                  className="w-full glass-input text-sm resize-none"
                ></textarea>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 glass-button-secondary rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 glass-button rounded-lg text-sm font-medium transition-colors"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Device Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-sm p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center">
                <Trash2 className="text-red-400" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Device?</h3>
            </div>
            <p className="text-slate-300 text-sm mb-2">
              You are about to delete <strong className="text-white">{deleteConfirm.product_name}</strong>.
            </p>
            <p className="text-slate-400 text-xs mb-6 font-mono">Serial: {deleteConfirm.serial_number}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 glass-button-secondary rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDevice(deleteConfirm.id)}
                className="flex-1 px-4 py-2 bg-red-600/80 hover:bg-red-500 border border-red-500/50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Devices;
