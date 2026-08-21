import React, { useEffect, useState } from 'react';
import { MapPin, PlusCircle, Edit2, Trash2, Save, X, Search, CheckCircle2 } from 'lucide-react';
import { getCities, createCity, updateCity, deleteCity } from '../services/api';
import { useToast } from '../contexts/ToastContext';

export default function Cities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [form, setForm] = useState({ name: '', state: 'Rajasthan', status: 'ACTIVE' });
  const [submitting, setSubmitting] = useState(false);

  const showToast = useToast();

  const loadCities = async () => {
    setLoading(true);
    try {
      const res = await getCities();
      setCities(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast?.('Failed to load cities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCities();
  }, []);

  const openAddModal = () => {
    setEditingCity(null);
    setForm({ name: '', state: 'Rajasthan', status: 'ACTIVE' });
    setShowModal(true);
  };

  const openEditModal = (city) => {
    setEditingCity(city);
    setForm({ name: city.name, state: city.state || 'Rajasthan', status: city.status || 'ACTIVE' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast?.('City name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCity) {
        await updateCity(editingCity.id, form);
        showToast?.(`City "${form.name}" updated successfully!`);
      } else {
        await createCity(form);
        showToast?.(`City "${form.name}" added successfully!`);
      }
      setShowModal(false);
      loadCities();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save city';
      showToast?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (city) => {
    if (!window.confirm(`Are you sure you want to remove city "${city.name}"?`)) return;
    try {
      await deleteCity(city.id);
      showToast?.(`City "${city.name}" deleted`);
      setCities((prev) => prev.filter((c) => c.id !== city.id));
    } catch (err) {
      showToast?.('Failed to delete city');
    }
  };

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.state && c.state.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <MapPin className="w-6 h-6 text-indigo-400" />
            <span>City List Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add and manage operational cities used dynamically for bus routes, origins, and destinations.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New City</span>
        </button>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cities or states..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Operational Cities: <span className="text-white font-bold">{cities.length}</span>
        </div>
      </div>

      {/* Cities Grid & Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading operational cities...
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No cities found.</p>
            <p className="text-xs mt-1">Click "Add New City" above to add your first city.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4"># ID</th>
                  <th className="p-4">City Name</th>
                  <th className="p-4">State</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredCities.map((city, idx) => (
                  <tr key={city.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-slate-400">#{city.id}</td>
                    <td className="p-4 font-bold text-white flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{city.name}</span>
                    </td>
                    <td className="p-4 text-slate-300">{city.state || 'Rajasthan'}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{city.status || 'ACTIVE'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(city)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer"
                          title="Edit City"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(city)}
                          className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg text-rose-400 transition-colors cursor-pointer"
                          title="Delete City"
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

      {/* Add / Edit City Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-indigo-400" />
                <span>{editingCity ? 'Edit City' : 'Add New City'}</span>
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
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Udaipur, Neemuch, Jaipur"
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="e.g. Rajasthan, Madhya Pradesh"
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  <span>{submitting ? 'Saving...' : editingCity ? 'Update City' : 'Add City'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
