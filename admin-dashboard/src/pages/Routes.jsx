import React, { useEffect, useState } from 'react';
import { Trash2, PlusCircle, Edit, Save } from 'lucide-react';
import { getRoutes, createRoute, updateRoute, deleteRoute } from '../services/api';

import { useToast } from '../contexts/ToastContext';

export default function Routes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try { const res = await getRoutes(); setItems(Array.isArray(res.data) ? res.data : res.data.items || []); } catch (err) {} finally { setLoading(false); }
  };

  const showToast = useToast();

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ id: '', name: '', from: '', to: '' }); setEditing(null); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.id) { showToast('Route ID is required'); return; }
    try {
      if (editing) { await updateRoute(editing, form); setItems((p) => p.map((r) => (r.id === editing ? { ...r, ...form } : r))); }
      else { await createRoute(form); setItems((p) => [form, ...p]); }
      setShowForm(false);
      showToast(editing ? 'Route updated' : 'Route created');
    } catch (err) {
      if (editing) setItems((p) => p.map((r) => (r.id === editing ? { ...r, ...form } : r)));
      else setItems((p) => [form, ...p]);
      setShowForm(false);
    }
  };

  const handleEdit = (it) => { setEditing(it.id); setForm({ id: it.id, name: it.name, from: it.from, to: it.to }); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm('Delete route?')) return; try { await deleteRoute(id); setItems((p) => p.filter((x) => x.id !== id)); } catch (err) { setItems((p) => p.filter((x) => x.id !== id)); } };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Routes</h2>
          <p className="text-xs text-slate-400">Manage bus routes and stops.</p>
        </div>
        <div>
          <button onClick={openNew} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center space-x-2"><PlusCircle className="w-4 h-4" /><span className="text-xs font-bold">Add</span></button>
        </div>
      </div>

      <div className="mt-6 bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4">
        {loading ? <div className="text-slate-400">Loading…</div> : (
          <ul className="space-y-3 text-slate-200">
            {items.map((r) => (
              <li key={r.id} className="flex items-center justify-between bg-slate-900/30 p-3 rounded-lg">
                <div>
                  <div className="font-semibold">{r.name || r.id}</div>
                  <div className="text-xs text-slate-400">{r.from} → {r.to}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleEdit(r)} className="p-2 bg-slate-700 rounded-md"><Edit className="w-4 h-4 text-slate-200" /></button>
                  <button onClick={() => handleDelete(r.id)} className="p-2 bg-rose-700 rounded-md text-white"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">{editing ? 'Edit Route' : 'Add Route'}</h3>
            <div>
              <label className="text-xs text-slate-300">Route ID</label>
              <input required value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-300">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300">From</label>
                <input value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
              </div>
              <div>
                <label className="text-xs text-slate-300">To</label>
                <input value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className="w-full p-3 bg-slate-800 rounded-xl text-white" />
              </div>
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
