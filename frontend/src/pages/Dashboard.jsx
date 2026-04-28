import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useWebSockets } from '../hooks/useWebSockets';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import EngineerDashboard from './EngineerDashboard';
import { Plus } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // New ticket state
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deviceType, setDeviceType] = useState('Laptop');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [category, setCategory] = useState('Hardware');
  
  // New Device Fields (Inline)
  const [isAddingNewDevice, setIsAddingNewDevice] = useState(false);
  const [deviceMake, setDeviceMake] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSerial, setDeviceSerial] = useState('');
  const [deviceDescription, setDeviceDescription] = useState('');
  const [deviceTypeId, setDeviceTypeId] = useState('');
  const [deviceWarrantyAvailable, setDeviceWarrantyAvailable] = useState('no');
  const [deviceWarrantyDuration, setDeviceWarrantyDuration] = useState('');
  const [devicePurchaseDate, setDevicePurchaseDate] = useState('');
  const [deviceWarrantyExpiryDate, setDeviceWarrantyExpiryDate] = useState('');
  
  // Devices state
  const [userDevices, setUserDevices] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  
  // Admin proxy creation state
  const [customerEmail, setCustomerEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [assignEngineerId, setAssignEngineerId] = useState('');
  const [engineers, setEngineers] = useState([]);

  // Real-time hook
  const { lastMessage } = useWebSockets();

  const fetchTicketsAndDevices = async () => {
    try {
      const requests = [
        api.get('/tickets/'),
        api.get('/devices/'),
        api.get('/devices/types')
      ];
      const [ticketsRes, devicesRes, typesRes] = await Promise.all(requests);
      setTickets(ticketsRes.data);
      setUserDevices(devicesRes.data);
      setDeviceTypes(typesRes.data);
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
      let finalDeviceId = selectedDeviceId;

      // If adding a new device inline
      if (isAddingNewDevice) {
        const deviceRes = await api.post('/devices/', {
          product_name: deviceMake,
          model_number: deviceModel,
          serial_number: deviceSerial,
          description: deviceDescription,
          device_type_id: parseInt(deviceTypeId),
          purchase_date: devicePurchaseDate || null,
          warranty_available: deviceWarrantyAvailable === 'yes',
          warranty_duration: deviceWarrantyAvailable === 'yes' ? deviceWarrantyDuration : null,
          warranty_expiry_date: deviceWarrantyAvailable === 'yes' ? deviceWarrantyExpiryDate : null
        });
        finalDeviceId = deviceRes.data.id;
      }

      const payload = {
        title: newTitle,
        description: newDesc,
        device_type: deviceType,
        device_id: finalDeviceId ? parseInt(finalDeviceId) : undefined,
        category: category,
        priority: 'low'
      };

      if ((user.role === 'admin' || user.role === 'staff') && customerEmail) {
        payload.customer_email = customerEmail;
        payload.company_name = companyName || undefined;
      }

      const res = await api.post('/tickets/', payload);

      // If admin explicitly assigned an engineer, call assign endpoint
      if (user.role === 'admin' && assignEngineerId) {
        await api.put(`/tickets/${res.data.id}/assign`, { engineer_id: parseInt(assignEngineerId) });
      }
      setShowForm(false);
      setNewTitle('');
      setNewDesc('');
      setCustomerEmail('');
      setCompanyName('');
      setSelectedDeviceId('');
      setIsAddingNewDevice(false);
      setDeviceMake('');
      setDeviceModel('');
      setDeviceSerial('');
      setDeviceDescription('');
      setDeviceTypeId('');
      setDeviceWarrantyAvailable('no');
      setDeviceWarrantyDuration('');
      setDevicePurchaseDate('');
      setDeviceWarrantyExpiryDate('');
      setAssignEngineerId('');
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Customer Email *</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 glass-input sm:text-sm"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="customer@company.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 glass-input sm:text-sm"
                        value={companyName}
                        onChange={e => setCompanyName(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  {user.role === 'admin' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">
                        Assign Engineer <span className="text-slate-500 font-normal">(optional — auto-assigned if blank)</span>
                      </label>
                      <select
                        className="w-full px-3 py-2 glass-input sm:text-sm"
                        value={assignEngineerId}
                        onChange={e => setAssignEngineerId(e.target.value)}
                      >
                        <option value="" className="bg-slate-800 text-slate-200">— Auto-assign —</option>
                        {engineers.map(eng => (
                          <option key={eng.id} value={eng.id} className="bg-slate-800 text-slate-200">{eng.name} ({eng.email})</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subject</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 glass-input sm:text-sm" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  required 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-300">Device</label>
                    <button 
                      type="button" 
                      onClick={() => {
                        setIsAddingNewDevice(!isAddingNewDevice);
                        // Refresh device types when toggling to add new device
                        if (!isAddingNewDevice) {
                          api.get('/devices/types').then(r => setDeviceTypes(r.data)).catch(() => {});
                        }
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                    >
                      {isAddingNewDevice ? 'Select Existing' : '+ Add New Device'}
                    </button>
                  </div>
                  {!isAddingNewDevice ? (
                    <select 
                      className="w-full px-3 py-2 glass-input sm:text-sm" 
                      value={selectedDeviceId} 
                      onChange={e => setSelectedDeviceId(e.target.value)}
                    >
                      <option value="" className="bg-slate-800 text-slate-200">-- Select a device --</option>
                      {userDevices.map(d => (
                        <option key={d.id} value={d.id} className="bg-slate-800 text-slate-200">{d.product_name} ({d.serial_number})</option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-4 p-5 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Device Type *</label>
                        <select 
                          required
                          className="w-full px-3 py-2 glass-input sm:text-sm bg-slate-800 text-slate-200"
                          value={deviceTypeId}
                          onChange={e => setDeviceTypeId(e.target.value)}
                        >
                          <option value="">-- Select Device Type --</option>
                          {deviceTypes && deviceTypes.length > 0 ? (
                            deviceTypes.map(t => (
                              <option key={t.id} value={t.id}>
                                {t.name}
                              </option>
                            ))
                          ) : (
                            <option disabled>Loading device types...</option>
                          )}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
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

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Serial Number *</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 glass-input sm:text-sm"
                          value={deviceSerial} 
                          onChange={e => setDeviceSerial(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-2">Description</label>
                        <textarea 
                          className="w-full px-3 py-2 glass-input sm:text-sm resize-none"
                          rows="2"
                          value={deviceDescription} 
                          onChange={e => setDeviceDescription(e.target.value)}
                        ></textarea>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-2">Purchase Date</label>
                          <input 
                            type="date"
                            className="w-full px-3 py-2 glass-input sm:text-sm"
                            value={devicePurchaseDate} 
                            onChange={e => setDevicePurchaseDate(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-300 mb-2">Warranty Available?</label>
                          <select 
                            className="w-full px-3 py-2 glass-input sm:text-sm"
                            value={deviceWarrantyAvailable}
                            onChange={e => setDeviceWarrantyAvailable(e.target.value)}
                          >
                            <option value="no" className="bg-slate-800 text-slate-200">No</option>
                            <option value="yes" className="bg-slate-800 text-slate-200">Yes</option>
                          </select>
                        </div>
                      </div>

                      {deviceWarrantyAvailable === 'yes' && (
                        <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-2">Warranty Duration</label>
                              <input 
                                type="text" 
                                placeholder="e.g. 12 months, 2 years"
                                className="w-full px-3 py-2 glass-input sm:text-sm"
                                value={deviceWarrantyDuration} 
                                onChange={e => setDeviceWarrantyDuration(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-2">Warranty Expiry Date</label>
                              <input 
                                type="date"
                                className="w-full px-3 py-2 glass-input sm:text-sm"
                                value={deviceWarrantyExpiryDate} 
                                onChange={e => setDeviceWarrantyExpiryDate(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select 
                    className="w-full px-3 py-2 glass-input sm:text-sm" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option className="bg-slate-800 text-slate-200">Hardware</option>
                    <option className="bg-slate-800 text-slate-200">Software</option>
                    <option className="bg-slate-800 text-slate-200">Network</option>
                    <option className="bg-slate-800 text-slate-200">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <textarea 
                  className="w-full px-3 py-2 glass-input sm:text-sm resize-none" 
                  rows="4" 
                  value={newDesc} 
                  onChange={e => setNewDesc(e.target.value)} 
                  required
                ></textarea>
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
        user.role === 'admin' ? (
          <AdminDashboard tickets={tickets} devices={userDevices} setShowForm={setShowForm} showForm={showForm} onRefresh={fetchTicketsAndDevices} />
        ) : user.role === 'staff' ? (
          <EngineerDashboard />
        ) : (
          <CustomerDashboard tickets={tickets} devices={userDevices} user={user} showForm={showForm} setShowForm={setShowForm} />
        )
      )}
    </div>
  );
}
