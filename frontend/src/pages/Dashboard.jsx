import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useWebSockets } from '../hooks/useWebSockets';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import EngineerDashboard from './EngineerDashboard';
import { Plus } from 'lucide-react';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New ticket state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [contactName, setContactName] = useState(''); // ✅ Added
  const [contactNumber, setContactNumber] = useState(''); // ✅ Added
  const [deviceType, setDeviceType] = useState('Laptop');
  const [category, setCategory] = useState('Hardware');
  
  // New Device Fields (Inline) - forced open
  const [deviceMake, setDeviceMake] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSerial, setDeviceSerial] = useState('');
  const [deviceDescription, setDeviceDescription] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [deviceWarrantyAvailable, setDeviceWarrantyAvailable] = useState('no');
  const [deviceWarrantyDuration, setDeviceWarrantyDuration] = useState('');
  const [deviceWarrantyExpiryDate, setDeviceWarrantyExpiryDate] = useState('');
  
  // Devices state
  const [userDevices, setUserDevices] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  
  // Admin proxy creation state
  const [customerEmail, setCustomerEmail] = useState('');
  const [assignEngineerId, setAssignEngineerId] = useState('');
  const [engineers, setEngineers] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  // For CreatableSelect
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Real-time hook
  const { lastMessage } = useWebSockets();

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      background: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      color: 'white'
    }),
    singleValue: (base) => ({ ...base, color: 'white' }),
    input: (base) => ({ ...base, color: 'white' }),
    menu: (base) => ({ ...base, background: '#1e293b' }),
    option: (base, state) => ({
      ...base,
      background: state.isFocused ? '#334155' : '#1e293b',
      color: 'white',
      '&:active': { background: '#475569' }
    })
  };

  const fetchTicketsAndDevices = async () => {
    try {
      const requests = [
        api.get('/tickets/'),
        api.get('/devices/'),
        api.get('/devices/types'),
        api.get('/companies/')
      ];
      const [ticketsRes, devicesRes, typesRes, companiesRes] = await Promise.all(requests);
      setTickets(ticketsRes.data);
      setUserDevices(devicesRes.data);
      setDeviceTypes(typesRes.data);
      setCompanies(companiesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch engineers for admin assign dropdown
  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/auth/engineers').then(r => setEngineers(r.data)).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    fetchTicketsAndDevices();
  }, []);

  // Listen for real-time ticket events
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'ticket_created' || lastMessage.type === 'ticket_updated') {
        fetchTicketsAndDevices();
      }
    }
  }, [lastMessage]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      // Force Add New Device
      const deviceRes = await api.post('/devices/', {
        product_name: deviceMake,
        model_number: deviceModel,
        serial_number: deviceSerial || '', // ✅ Optional
        description: deviceDescription, // Now called Configuration
        device_type_id: parseInt(deviceTypeId),
        purchase_date: null,
        warranty_available: deviceWarrantyAvailable === 'yes',
        warranty_duration: null,
        warranty_expiry_date: null
      });
      const finalDeviceId = deviceRes.data.id;

      const payload = {
        title: newTitle, // Nature of Issue
        description: newDesc, // Condition of the Device
        contact_name: contactName,
        contact_number: contactNumber || undefined,
        device_type: deviceType,
        device_id: finalDeviceId,
        category: category,
        priority: 'low'
      };

      if ((user.role === 'admin' || user.role === 'staff')) {
        if (customerEmail) {
          payload.customer_email = customerEmail;
        }
        if (selectedCompany) {
          if (selectedCompany.__isNew__) {
             payload.company_name = selectedCompany.value;
          } else {
             payload.company_id = parseInt(selectedCompany.value);
          }
        }
      }

      const res = await api.post('/tickets/', payload);

      // If admin explicitly assigned an engineer, call assign endpoint
      if (user.role === 'admin' && assignEngineerId) {
        await api.put(`/tickets/${res.data.id}/assign`, { engineer_id: parseInt(assignEngineerId) });
      }
      setShowForm(false);
      setNewTitle('');
      setNewDesc('');
      setContactName('');
      setContactNumber('');
      setCustomerEmail('');
      setSelectedCompany(null);
      setDeviceMake('');
      setDeviceModel('');
      setDeviceSerial('');
      setDeviceDescription('');
      setDeviceTypeId('');
      setDeviceWarrantyAvailable('no');
      setAssignEngineerId('');
      fetchTicketsAndDevices();
    } catch(e) {
      console.error(e);
      alert('Failed to create ticket. Please check your connection.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Ticket Form Overlay/Card */}
      {showForm && (
        <div className="glass-card overflow-hidden mb-8 animate-fade-in-up">
          <div className="px-6 py-4 glass-header">
            <h3 className="text-lg font-semibold text-white">
              {user.role === 'admin' ? 'Create Ticket on Behalf of Customer' : 'New Support Ticket'}
            </h3>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleCreateTicket} className="space-y-6">
              
              {(user.role === 'admin' || user.role === 'staff') && (
                <div className="p-5 bg-blue-900/20 rounded-xl border border-blue-500/30 mb-6 space-y-4 backdrop-blur-sm">
                  <h4 className="text-md font-semibold text-blue-300 border-b border-blue-500/30 pb-2 mb-4">Section 1 — Customer Details</h4>
                  
                  {/* Row 1: Company */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Company</label>
                    <CreatableSelect
                      isClearable
                      styles={customSelectStyles}
                      placeholder="Search or Create Company..."
                      value={selectedCompany}
                      onChange={(newValue) => setSelectedCompany(newValue)}
                      options={companies.map(c => ({ value: c.id, label: c.name }))}
                    />
                  </div>

                  {/* Row 2: Customer Name, Email, Contact Number */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name *</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 glass-input sm:text-sm" 
                        value={contactName} 
                        onChange={e => setContactName(e.target.value)} 
                        placeholder="e.g. John Doe"
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Customer Email <span className="text-slate-500 font-normal">(optional)</span></label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 glass-input sm:text-sm"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="customer@company.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Contact Number <span className="text-slate-500 font-normal">(optional)</span></label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input sm:text-sm"
                        value={contactNumber}
                        onChange={e => setContactNumber(e.target.value)}
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>

                  </div>
              )}

              {/* Customer view only needs Customer Name if not admin/staff */}
              {user.role === 'customer' && (
                <div className="p-5 bg-blue-900/20 rounded-xl border border-blue-500/30 mb-6 space-y-4 backdrop-blur-sm">
                  <h4 className="text-md font-semibold text-blue-300 border-b border-blue-500/30 pb-2 mb-4">Section 1 — Customer Details</h4>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-slate-300 mb-1">Customer Name *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 glass-input sm:text-sm" 
                      value={contactName} 
                      onChange={e => setContactName(e.target.value)} 
                      placeholder="e.g. John Doe"
                      required 
                    />
                  </div>
                </div>
              )}

              {/* Row 4: Device Section */}
              <div className="p-5 bg-white/5 rounded-xl border border-white/10 mb-6 space-y-4">
                <h4 className="text-md font-semibold text-emerald-300 border-b border-white/10 pb-2 mb-4">Section 2 — Device Details</h4>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Device Type *</label>
                  <Select
                    styles={customSelectStyles}
                    placeholder="Search Device Type..."
                    value={deviceTypeId ? { value: deviceTypeId, label: deviceTypes.find(t => t.id === parseInt(deviceTypeId))?.name || 'Selected' } : null}
                    onChange={(newValue) => setDeviceTypeId(newValue ? newValue.value : '')}
                    options={deviceTypes.map(t => ({ value: t.id, label: t.name }))}
                    required
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Category *</label>
                    <Select
                      styles={customSelectStyles}
                      value={{ value: category, label: category }}
                      onChange={(newValue) => setCategory(newValue.value)}
                      options={[
                        { value: 'Hardware', label: 'Hardware' },
                        { value: 'Software', label: 'Software' },
                        { value: 'Network', label: 'Network' },
                        { value: 'Other', label: 'Other' }
                      ]}
                    />
                  </div>
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      {deviceTypeId && deviceTypes.find(t => t.id === parseInt(deviceTypeId))?.name.toLowerCase().includes('laptop') && 
                      !deviceTypes.find(t => t.id === parseInt(deviceTypeId))?.name.toLowerCase().includes('laptop ') ? 
                      "Make / Brand *" : "Name / Make *"}
                    </label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 glass-input sm:text-sm"
                      value={deviceMake} 
                      onChange={e => setDeviceMake(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Model Number *</label>
                    <input 
                      type="text" 
                      required
                      className="w-full px-3 py-2 glass-input sm:text-sm"
                      value={deviceModel} 
                      onChange={e => setDeviceModel(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Serial Number <span className="text-slate-500 font-normal">(optional)</span></label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 glass-input sm:text-sm"
                      value={deviceSerial} 
                      onChange={e => setDeviceSerial(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">Warranty Available?</label>
                    <Select
                      styles={customSelectStyles}
                      value={{ value: deviceWarrantyAvailable, label: deviceWarrantyAvailable === 'yes' ? 'Yes' : 'No' }}
                      onChange={(newValue) => setDeviceWarrantyAvailable(newValue.value)}
                      options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">Configuration</label>
                  <textarea 
                    className="w-full px-3 py-2 glass-input sm:text-sm resize-none"
                    rows="2"
                    value={deviceDescription} 
                    onChange={e => setDeviceDescription(e.target.value)}
                    placeholder="Device specs, RAM, Storage, etc."
                  ></textarea>
                </div>
              </div>

              {/* Row 5 & 6: Category and Nature of Issue */}
              <div className="p-5 bg-purple-900/20 rounded-xl border border-purple-500/30 mb-6 space-y-4 backdrop-blur-sm">
                <h4 className="text-md font-semibold text-purple-300 border-b border-purple-500/30 pb-2 mb-4">Section 3 — Ticket Details</h4>

                {/* Assign Engineer moved here */}
                {user.role === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Assign Engineer <span className="text-slate-500 font-normal">(optional — auto-assigned if blank)</span>
                    </label>
                    <Select
                      isClearable
                      styles={customSelectStyles}
                      placeholder="Search Engineer..."
                      value={assignEngineerId ? { value: assignEngineerId, label: engineers.find(e => e.id === parseInt(assignEngineerId))?.name || 'Selected' } : null}
                      onChange={(newValue) => setAssignEngineerId(newValue ? newValue.value : '')}
                      options={engineers.map(eng => ({ value: eng.id, label: `${eng.name} (${eng.email})` }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Nature of Issue *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 glass-input sm:text-sm" 
                      value={newTitle} 
                      onChange={e => setNewTitle(e.target.value)} 
                      placeholder="e.g. Screen flickering"
                      required 
                    />
                  </div>
                </div>

                {/* Row 7: Condition of the Device */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Condition of the Device *</label>
                  <textarea 
                    className="w-full px-3 py-2 glass-input sm:text-sm resize-none" 
                    rows="4" 
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)} 
                    placeholder="Describe the current state of the device..."
                    required
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="glass-button px-6 py-2 rounded-lg font-medium text-sm"
                >
                  Submit Ticket
                </button>
                <button 
                  type="button" 
                  className="glass-button-secondary px-6 py-2 rounded-lg font-medium text-sm"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showForm && (
        (user.role === 'admin' || user.role === 'staff') ? (
          <AdminDashboard tickets={tickets} devices={userDevices} setShowForm={setShowForm} showForm={showForm} onRefresh={fetchTicketsAndDevices} />
        ) : (
          <CustomerDashboard tickets={tickets} devices={userDevices} user={user} showForm={showForm} setShowForm={setShowForm} />
        )
      )}
    </div>
  );
}
