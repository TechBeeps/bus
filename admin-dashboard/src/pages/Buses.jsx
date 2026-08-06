import React, { useEffect, useState } from 'react';
import { Trash2, PlusCircle, Edit, Save } from 'lucide-react';
import {
  getBuses,
  createBus,
  updateBus,
  deleteBus,
} from '../services/api';

import { useToast } from '../contexts/ToastContext';

export default function Buses({ apiBaseUrl }) {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', route: '', currentConductor: '', status: 'ACTIVE' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await getBuses();
      setBuses(Array.isArray(res.data) ? res.data : res.data.items || []);
    } catch (err) {
      // fallback: keep empty list
      showToast?.('Failed to load buses from API');
    } finally {
      setLoading(false);
    }
  };

  const showToast = useToast();

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ id: '', route: '', currentConductor: '', status: 'ACTIVE' }); setEditing(null); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.id || !form.route) { showToast('Bus ID and Route are required'); return; }
    try {
      if (editing) {
        await updateBus(editing, form);
        setBuses((p) => p.map((b) => (b.id === editing ? { ...b, ...form } : b)));
        showToast('Bus updated');
      } else {
        await createBus(form);
        setBuses((p) => [form, ...p]);
        showToast('Bus created');
      }
      setShowForm(false);
    } catch (err) {
      // optimistic: update local state
      if (editing) setBuses((p) => p.map((b) => (b.id === editing ? { ...b, ...form } : b)));
      else setBuses((p) => [form, ...p]);
      setShowForm(false);
    }
  };

  const handleEdit = (bus) => { setEditing(bus.id); setForm({ id: bus.id, route: bus.route, currentConductor: bus.currentConductor, status: bus.status }); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bus?')) return;
    try { await deleteBus(id); setBuses((p) => p.filter((b) => b.id !== id)); } catch (err) { setBuses((p) => p.filter((b) => b.id !== id)); }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Buses</h2>
          <p className="text-xs text-slate-400">Manage buses: add, edit, or remove vehicles and their route assignments.</p>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={openNew} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2">
            <PlusCircle className="w-4 h-4" />
            <span className="text-xs font-bold">Add Bus</span>
          </button>
        </div>
      </div>

      <div className="mt-6 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-400 uppercase">
                <tr>
                  <th className="p-3 text-left">Bus ID</th>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">Conductor</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {buses.map((bus) => (
                  <tr key={bus.id}>
                    <td className="p-3 font-mono font-bold">{bus.id}</td>
                    <td className="p-3">{bus.route}</td>
                    <td className="p-3">{bus.currentConductor || 'Unassigned'}</td>
                    <td className="p-3">{bus.status}</td>
                    <td className="p-3 flex items-center space-x-2">
                      <button onClick={() => handleEdit(bus)} className="p-2 bg-slate-700 rounded-md text-slate-200"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(bus.id)} className="p-2 bg-rose-700 rounded-md text-white"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="text-lg font-bold text-white">{editing ? 'Edit Bus' : 'Add Bus'}</h3>

            <div>
              <label className="text-xs text-slate-300">Bus ID</label>
              <input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
            </div>

            <div>
              <label className="text-xs text-slate-300">Route</label>
              <input required value={form.route} onChange={(e) => setForm({ ...form, route: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
            </div>

            <div>
              <label className="text-xs text-slate-300">Current Conductor</label>
              <input value={form.currentConductor} onChange={(e) => setForm({ ...form, currentConductor: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl">Cancel</button>
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl flex items-center justify-center space-x-2"><Save className="w-4 h-4" /><span>{editing ? 'Save' : 'Create'}</span></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
