import React, { useEffect, useState } from 'react';
import { Users, PlusCircle, Edit2, Trash2, Save, X, Phone, Mail, Lock, Shield, Search } from 'lucide-react';
import { getConductors, createConductor, updateConductor, deleteConductor, getBuses } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function Conductors() {
  const [conductors, setConductors] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    gender: 'Male',
    assigned_bus_id: '',
  });

  const showToast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [condRes, busRes] = await Promise.all([getConductors(), getBuses()]);
      setConductors(Array.isArray(condRes.data) ? condRes.data : []);
      setBuses(Array.isArray(busRes.data) ? busRes.data : []);
    } catch (err) {
      showToast?.('Failed to load conductors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingConductor(null);
    setForm({
      name: '',
      mobile: '',
      email: '',
      password: '',
      gender: 'Male',
      assigned_bus_id: '',
    });
    setShowModal(true);
  };

  const openEditModal = (c) => {
    setEditingConductor(c);
    setForm({
      name: c.name || '',
      mobile: c.mobile || '',
      email: c.email || '',
      password: '',
      gender: c.gender || 'Male',
      assigned_bus_id: c.assigned_bus_id || '',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) {
      showToast?.('Name and Mobile Number are required');
      return;
    }

    if (!editingConductor && !form.password.trim()) {
      showToast?.('Password is required for new conductor');
      return;
    }

    setSubmitting(true);
    try {
      if (editingConductor) {
        await updateConductor(editingConductor.conductor_id || editingConductor.id, form);
        showToast?.(`Conductor ${form.name} updated successfully!`);
      } else {
        await createConductor(form);
        showToast?.(`Conductor ${form.name} added successfully!`);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save conductor';
      showToast?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Are you sure you want to delete conductor "${c.name}"?`)) return;
    try {
      await deleteConductor(c.conductor_id || c.id);
      showToast?.(`Conductor ${c.name} deleted`);
      setConductors((prev) => prev.filter((item) => (item.conductor_id || item.id) !== (c.conductor_id || c.id)));
    } catch (err) {
      showToast?.('Failed to delete conductor');
    }
  };

  const filteredConductors = conductors.filter((c) =>
    (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
    (c.mobile && c.mobile.includes(search)) ||
    (c.conductor_id && c.conductor_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Conductor Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add and manage conductors with live login credentials, contact info, and bus duties.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Conductor</span>
        </button>
      </div>

      {/* Search and Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or ID..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Conductors: <span className="text-white font-bold">{conductors.length}</span>
        </div>
      </div>

      {/* Conductors Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading conductors...
          </div>
        ) : filteredConductors.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No conductors found.</p>
            <p className="text-xs mt-1">Click "Add New Conductor" above to register a conductor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Conductor ID</th>
                  <th className="p-4">Name & Gender</th>
                  <th className="p-4">Contact (Mobile & Email)</th>
                  <th className="p-4">Assigned Bus</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredConductors.map((c) => (
                  <tr key={c.conductor_id || c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-indigo-400">
                      {c.conductor_id || `COND-${c.id}`}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.gender || 'Male'}</div>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <div className="flex items-center space-x-1.5 text-slate-300 text-xs">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.mobile}</span>
                      </div>
                      {c.email && (
                        <div className="flex items-center space-x-1.5 text-slate-400 text-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {c.assigned_bus_id ? (() => {
                        const bObj = buses.find((x) => (x.bus_id || x.id) === c.assigned_bus_id);
                        return (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                              {bObj?.bus_number || c.assigned_bus_id}
                            </span>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {c.assigned_bus_id}
                            </div>
                          </div>
                        );
                      })() : (
                        <span className="text-xs text-slate-500 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer"
                          title="Edit Conductor"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg text-rose-400 transition-colors cursor-pointer"
                          title="Delete Conductor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Conductor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span>{editingConductor ? 'Edit Conductor' : 'Add New Conductor'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Conductor Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. rajesh@bus.com"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    {editingConductor ? 'New Password (Optional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingConductor}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder={editingConductor ? 'Leave blank to keep same' : '••••••••'}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Assign to Bus (Optional)
                </label>
                <select
                  value={form.assigned_bus_id}
                  onChange={(e) => setForm({ ...form, assigned_bus_id: e.target.value })}
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Unassigned / Reserve Pool --</option>
                  {buses.map((b) => {
                    const bId = b.bus_id || b.id;
                    const orig = b.origin_city || b.route?.split('➔')[0] || 'Origin';
                    const dest = b.destination_city || b.route?.split('➔')[1] || 'Destination';
                    const editingConductorId = editingConductor ? (editingConductor.conductor_id || editingConductor.id) : null;
                    
                    // Check if this bus has another conductor assigned
                    const otherConductor = conductors.find(
                      (c) => (c.assigned_bus_id === bId) &&
                             (c.conductor_id || c.id) !== editingConductorId
                    );
                    const isOccupied = !!otherConductor;

                    return (
                      <option
                        key={bId}
                        value={bId}
                        disabled={isOccupied}
                        className={isOccupied ? 'text-slate-500 bg-slate-900' : 'text-white bg-slate-800'}
                      >
                        {b.bus_number || bId} ({bId}) — {orig} ➔ {dest} {isOccupied ? `— [Occupied by ${otherConductor.name}]` : `[Available]`}
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  1 Bus = 1 Conductor. Buses already assigned to other conductors are disabled.
                </p>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{submitting ? 'Saving...' : editingConductor ? 'Update Conductor' : 'Add Conductor'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
