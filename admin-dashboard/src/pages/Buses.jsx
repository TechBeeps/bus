import React, { useEffect, useState } from 'react';
import { Bus, PlusCircle, Edit2, Trash2, Save, X, ArrowRight, UserCheck, Search, CheckCircle2, IndianRupee } from 'lucide-react';
import { getBuses, createBus, updateBus, deleteBus, reassignBusConductor, getCities, getConductors } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import ConductorPicker from '../components/ConductorPicker';

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [cities, setCities] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedBusForReassign, setSelectedBusForReassign] = useState(null);
  const [reassignConductorId, setReassignConductorId] = useState('');
  const [editingBus, setEditingBus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bus_id: '',
    bus_number: '',
    origin_city: '',
    destination_city: '',
    current_conductor_id: '',
    fare_amount: 50,
    status: 'ACTIVE',
  });

  const showToast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [busRes, cityRes, condRes] = await Promise.all([
        getBuses(),
        getCities(),
        getConductors(),
      ]);
      setBuses(Array.isArray(busRes.data) ? busRes.data : []);
      setCities(Array.isArray(cityRes.data) ? cityRes.data : []);
      setConductors(Array.isArray(condRes.data) ? condRes.data : []);
    } catch (err) {
      showToast?.('Failed to load buses data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingBus(null);
    setForm({
      bus_id: '',
      bus_number: '',
      origin_city: cities.length > 0 ? cities[0].name : '',
      destination_city: cities.length > 1 ? cities[1].name : (cities[0]?.name || ''),
      current_conductor_id: '',
      fare_amount: 50,
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const openEditModal = (bus) => {
    setEditingBus(bus);
    setForm({
      bus_id: bus.bus_id || bus.id,
      bus_number: bus.bus_number || '',
      origin_city: bus.origin_city || '',
      destination_city: bus.destination_city || '',
      current_conductor_id: bus.current_conductor_id || '',
      fare_amount: bus.fare_amount || 50,
      status: bus.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const openReassignModal = (bus) => {
    setSelectedBusForReassign(bus);
    setReassignConductorId(bus.current_conductor_id || '');
    setShowReassignModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.bus_id.trim() || !form.bus_number.trim() || !form.origin_city || !form.destination_city) {
      showToast?.('Bus ID, Number, Origin, and Destination are required');
      return;
    }

    if (form.origin_city === form.destination_city) {
      showToast?.('Origin and Destination city cannot be the same');
      return;
    }

    setSubmitting(true);
    try {
      if (editingBus) {
        await updateBus(editingBus.bus_id || editingBus.id, form);
        showToast?.(`Bus ${form.bus_id} updated successfully!`);
      } else {
        await createBus(form);
        showToast?.(`Bus ${form.bus_id} added successfully!`);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save bus';
      showToast?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (e) => {
    e.preventDefault();
    if (!selectedBusForReassign) return;

    setSubmitting(true);
    try {
      await reassignBusConductor(selectedBusForReassign.bus_id || selectedBusForReassign.id, {
        conductor_id: reassignConductorId,
      });
      showToast?.(`Conductor reassigned to ${selectedBusForReassign.bus_id || selectedBusForReassign.id}!`);
      setShowReassignModal(false);
      loadData();
    } catch (err) {
      showToast?.('Failed to reassign conductor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bus) => {
    const id = bus.bus_id || bus.id;
    if (!window.confirm(`Are you sure you want to delete bus "${id}"?`)) return;
    try {
      await deleteBus(id);
      showToast?.(`Bus ${id} deleted`);
      setBuses((prev) => prev.filter((b) => (b.bus_id || b.id) !== id));
    } catch (err) {
      showToast?.('Failed to delete bus');
    }
  };

  const filteredBuses = buses.filter((b) =>
    (b.bus_id && b.bus_id.toLowerCase().includes(search.toLowerCase())) ||
    (b.bus_number && b.bus_number.toLowerCase().includes(search.toLowerCase())) ||
    (b.origin_city && b.origin_city.toLowerCase().includes(search.toLowerCase())) ||
    (b.destination_city && b.destination_city.toLowerCase().includes(search.toLowerCase())) ||
    (b.currentConductor && b.currentConductor.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bus className="w-6 h-6 text-indigo-400" />
            <span>Bus Fleet Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamically add and manage buses, assign conductors, and configure origin-destination routes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Bus</span>
        </button>
      </div>

      {/* Search and Quick Metrics */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bus ID, Reg No, Route, Conductor..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center space-x-4 text-xs text-slate-400 font-medium">
          <div>Total Fleet: <span className="text-white font-bold">{buses.length}</span></div>
          <div>Active: <span className="text-emerald-400 font-bold">{buses.filter(b => b.status === 'ACTIVE').length}</span></div>
        </div>
      </div>

      {/* Buses Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading fleet buses...
          </div>
        ) : filteredBuses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bus className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No buses found.</p>
            <p className="text-xs mt-1">Click "Add New Bus" above to add your first bus to the fleet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Bus Number & ID</th>
                  <th className="p-4">Route (Origin ➔ Destination)</th>
                  <th className="p-4">Current Conductor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredBuses.map((bus) => (
                  <tr key={bus.bus_id || bus.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-mono font-bold text-white text-sm">
                        {bus.bus_number || 'RJ14PA----'}
                      </div>
                      <div className="text-xs text-indigo-400 font-mono font-semibold">
                        ID: {bus.bus_id || bus.id}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2 font-semibold text-white">
                        <span>{bus.origin_city || bus.route?.split('➔')[0] || 'Origin'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{bus.destination_city || bus.route?.split('➔')[1] || 'Destination'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-slate-200">
                          {bus.conductor_name || bus.currentConductor || 'Unassigned'}
                        </span>
                        <button
                          onClick={() => openReassignModal(bus)}
                          className="p-1 hover:bg-slate-800 rounded text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                          title="Quick Reassign Conductor"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      </div>
                      {bus.conductor_mobile && (
                        <div className="text-xs text-slate-400">{bus.conductor_mobile}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        bus.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{bus.status || 'ACTIVE'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(bus)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer"
                          title="Edit Bus"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(bus)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg text-rose-400 transition-colors cursor-pointer"
                          title="Delete Bus"
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

      {/* Add / Edit Bus Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Bus className="w-5 h-5 text-indigo-400" />
                <span>{editingBus ? 'Edit Bus' : 'Add New Bus'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bus ID *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingBus}
                    value={form.bus_id}
                    onChange={(e) => setForm({ ...form, bus_id: e.target.value.toUpperCase() })}
                    placeholder="e.g. BUS004"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Bus Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.bus_number}
                    onChange={(e) => setForm({ ...form, bus_number: e.target.value.toUpperCase() })}
                    placeholder="e.g. RJ14PA9999"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Route Dropdowns from Cities */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Origin City (Route Start) *
                  </label>
                  <select
                    required
                    value={form.origin_city}
                    onChange={(e) => setForm({ ...form, origin_city: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Origin City --</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Destination City (Route End) *
                  </label>
                  <select
                    required
                    value={form.destination_city}
                    onChange={(e) => setForm({ ...form, destination_city: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Destination City --</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Current Conductor Dropdown */}
              <ConductorPicker
                conductors={conductors}
                buses={buses}
                currentBusId={editingBus ? (editingBus.bus_id || editingBus.id) : null}
                selectedConductorId={form.current_conductor_id}
                onChange={(cId) => setForm({ ...form, current_conductor_id: cId })}
                label="Current Assigned Conductor"
                allowUnassigned={true}
              />

              {/* Operational Status (Base Fare removed) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Operational Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
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
                  <span>{submitting ? 'Saving...' : editingBus ? 'Update Bus' : 'Add Bus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Reassign Conductor Modal */}
      {showReassignModal && selectedBusForReassign && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Reassign Conductor</span>
              </h3>
              <button
                onClick={() => setShowReassignModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReassign} className="space-y-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-1.5">
                <div className="text-xs text-slate-400 font-medium">Selected Bus:</div>
                <div className="text-base font-bold text-white font-mono flex items-center space-x-2">
                  <span>{selectedBusForReassign.bus_number || selectedBusForReassign.bus_id}</span>
                  <span className="text-xs text-indigo-400 font-normal">({selectedBusForReassign.bus_id || selectedBusForReassign.id})</span>
                </div>
                <div className="text-xs text-indigo-300 font-semibold flex items-center space-x-1.5 pt-1 border-t border-slate-700/50">
                  <span className="text-slate-400">Route:</span>
                  <span className="text-white">{selectedBusForReassign.origin_city || selectedBusForReassign.route?.split('➔')[0] || 'Origin'}</span>
                  <span className="text-indigo-400 font-bold">➔</span>
                  <span className="text-white">{selectedBusForReassign.destination_city || selectedBusForReassign.route?.split('➔')[1] || 'Destination'}</span>
                </div>
              </div>

              <ConductorPicker
                conductors={conductors}
                buses={buses}
                currentBusId={selectedBusForReassign.bus_id || selectedBusForReassign.id}
                selectedConductorId={reassignConductorId}
                onChange={(cId) => setReassignConductorId(cId)}
                label="Select New Active Conductor"
                allowUnassigned={false}
              />

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowReassignModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reassignConductorId}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{submitting ? 'Assigning...' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
