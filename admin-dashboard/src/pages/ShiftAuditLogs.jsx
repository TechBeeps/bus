import React, { useEffect, useState } from 'react';
import { Clock, PlusCircle, Calendar, Bus, IndianRupee, User, CheckCircle2, Search, X, Save, AlertCircle } from 'lucide-react';
import { getShiftLogs, createShiftLog, getBuses, getConductors } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime } from '../utils/dateFormatter';

export default function ShiftAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [buses, setBuses] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bus_id: '',
    conductor_id: '',
    shift_date: '',
    start_time: '',
    end_time: '',
    collection_amount: 0,
    tickets_count: 0,
    status: 'COMPLETED',
  });

  const showToast = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBus) params.bus_id = selectedBus;
      if (selectedDate) params.date = selectedDate;

      const [logsRes, busRes, condRes] = await Promise.all([
        getShiftLogs(params),
        getBuses(),
        getConductors(),
      ]);

      setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      setBuses(Array.isArray(busRes.data) ? busRes.data : []);
      setConductors(Array.isArray(condRes.data) ? condRes.data : []);
    } catch (err) {
      showToast?.('Failed to load shift audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedBus, selectedDate]);

  const openAddModal = () => {
    const today = new Date().toISOString().split('T')[0];
    setForm({
      bus_id: buses[0]?.bus_id || buses[0]?.id || '',
      conductor_id: conductors[0]?.conductor_id || conductors[0]?.id || '',
      shift_date: today,
      start_time: '',
      end_time: '',
      collection_amount: 0,
      tickets_count: 0,
      status: 'COMPLETED',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.bus_id || !form.conductor_id) {
      showToast?.('Bus and Conductor are required');
      return;
    }

    setSubmitting(true);
    try {
      await createShiftLog(form);
      showToast?.('Shift audit log recorded successfully!');
      setShowModal(false);
      loadLogs();
    } catch (err) {
      showToast?.('Failed to save shift log');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((log) =>
    (log.bus_number && log.bus_number.toLowerCase().includes(search.toLowerCase())) ||
    (log.bus_id && log.bus_id.toLowerCase().includes(search.toLowerCase())) ||
    (log.conductor_name && log.conductor_name.toLowerCase().includes(search.toLowerCase())) ||
    (log.shift_id && log.shift_id.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollection = logs.reduce((acc, l) => acc + (parseFloat(l.collection_amount) || 0), 0);
  const totalTickets = logs.reduce((acc, l) => acc + (parseInt(l.tickets_count) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Clock className="w-6 h-6 text-indigo-400" />
            <span>Conductor Shift Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time & historic shift logs showing Bus Number, Date - Time (IST), Conductor, and Collection Amount.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Record Shift Log</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Shift Revenue</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">₹{totalCollection.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audited Tickets</p>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">{totalTickets.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Shifts Recorded</p>
            <h3 className="text-2xl font-black text-white mt-1">{logs.length}</h3>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bus, conductor, shift ID..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Bus Filter */}
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Buses</option>
            {buses.map((b) => (
              <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
                {b.bus_id || b.id} ({b.bus_number})
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {(selectedBus || selectedDate || search) && (
            <button
              onClick={() => {
                setSelectedBus('');
                setSelectedDate('');
                setSearch('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading shift audit logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No shift audit logs found.</p>
            <p className="text-xs mt-1">Shift logs will record automatically as conductors complete duties.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Shift ID</th>
                  <th className="p-4">Bus Number & ID</th>
                  <th className="p-4">Date & Time (IST)</th>
                  <th className="p-4">Conductor</th>
                  <th className="p-4">Collection Amount</th>
                  <th className="p-4">Tickets Count</th>
                  <th className="p-4">Shift Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id || log.shift_id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-indigo-400">
                      {log.shift_id || `SHIFT-${log.id}`}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white font-mono">{log.bus_number || log.bus_id}</div>
                      <div className="text-xs text-slate-400 font-mono">{log.bus_id}</div>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-300">
                      {formatDateTime(log.start_time || log.shift_date || log.created_at)}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{log.conductor_name}</span>
                      </div>
                      <div className="text-xs text-slate-400">{log.conductor_id}</div>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                      ₹{parseFloat(log.collection_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-300">
                      {log.tickets_count || 0} trips
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{log.status || 'COMPLETED'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Shift Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span>Record Manual Shift Audit Log</span>
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
                    Bus Number / ID *
                  </label>
                  <select
                    required
                    value={form.bus_id}
                    onChange={(e) => setForm({ ...form, bus_id: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {buses.map((b) => {
                      const orig = b.origin_city || b.route?.split('➔')[0] || 'Origin';
                      const dest = b.destination_city || b.route?.split('➔')[1] || 'Destination';
                      return (
                        <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
                          {b.bus_number || b.bus_id || b.id} ({b.bus_id || b.id}) — {orig} ➔ {dest}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Conductor *
                  </label>
                  <select
                    required
                    value={form.conductor_id}
                    onChange={(e) => setForm({ ...form, conductor_id: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {conductors.map((c) => (
                      <option key={c.conductor_id || c.id} value={c.conductor_id || c.id}>
                        {c.name} ({c.conductor_id || `COND-${c.id}`})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Shift Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.shift_date}
                    onChange={(e) => setForm({ ...form, shift_date: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Shift Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ACTIVE">ACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Total Collection Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.collection_amount}
                    onChange={(e) => setForm({ ...form, collection_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 3500.00"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Total Tickets Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.tickets_count}
                    onChange={(e) => setForm({ ...form, tickets_count: parseInt(e.target.value) || 0 })}
                    placeholder="e.g. 70"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
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
                  <span>{submitting ? 'Recording...' : 'Save Audit Log'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
