import React, { useEffect, useState } from 'react';
import { Clock, Calendar, Bus, IndianRupee, User, CheckCircle2, Search, Users } from 'lucide-react';
import { getShiftLogs, getBuses, getConductors } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDate } from '../utils/dateFormatter';

export default function ShiftAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [buses, setBuses] = useState([]);
  const [conductors, setConductors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedConductor, setSelectedConductor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [search, setSearch] = useState('');

  const showToast = useToast();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBus) params.bus_id = selectedBus;
      if (selectedConductor) params.conductor_id = selectedConductor;
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
      showToast?.('Failed to load shift logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedBus, selectedConductor, selectedDate]);

  const filteredLogs = logs.filter((log) =>
    (log.bus_number && log.bus_number.toLowerCase().includes(search.toLowerCase())) ||
    (log.bus_id && log.bus_id.toLowerCase().includes(search.toLowerCase())) ||
    (log.conductor_name && log.conductor_name.toLowerCase().includes(search.toLowerCase())) ||
    (log.conductor_id && log.conductor_id.toLowerCase().includes(search.toLowerCase())) ||
    (log.shift_date && log.shift_date.toLowerCase().includes(search.toLowerCase()))
  );

  const totalCollection = logs.reduce((acc, l) => acc + (parseFloat(l.collection_amount) || 0), 0);
  const totalTickets = logs.reduce((acc, l) => acc + (parseInt(l.tickets_count) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Clock className="w-6 h-6 text-indigo-400" />
            <span>Conductor Day-Wise Duty Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Konsi date ko konsa conductor kis bus par tha aur unka total collection kya tha.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              ₹{totalCollection.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Audited shift revenue</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">{totalTickets.toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Passenger trips across shifts</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Bus className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duty Days Recorded</p>
            <h3 className="text-2xl font-black text-white mt-1">{logs.length}</h3>
            <p className="text-[11px] text-slate-500 mt-1">Total conductor duty shifts</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-xl text-slate-300">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bus, conductor..."
              className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Conductor Filter */}
          <select
            value={selectedConductor}
            onChange={(e) => setSelectedConductor(e.target.value)}
            className="py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Conductors</option>
            {conductors.map((c) => (
              <option key={c.conductor_id || c.id} value={c.conductor_id || c.id}>
                {c.name} ({c.conductor_id || c.id})
              </option>
            ))}
          </select>

          {/* Bus Filter */}
          <select
            value={selectedBus}
            onChange={(e) => setSelectedBus(e.target.value)}
            className="py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">All Buses</option>
            {buses.map((b) => (
              <option key={b.bus_id || b.id} value={b.bus_id || b.id}>
                {b.bus_number || b.bus_id || b.id}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          />

          {(selectedBus || selectedConductor || selectedDate || search) && (
            <button
              onClick={() => {
                setSelectedBus('');
                setSelectedConductor('');
                setSelectedDate('');
                setSearch('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Day-Wise Duty Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading day-wise duty logs...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-500 space-y-2">
            <Clock className="w-10 h-10 mx-auto opacity-40 text-indigo-400" />
            <p className="text-sm font-bold text-slate-300">No Shift Duty Logs Found</p>
            <p className="text-xs">No conductor duty records match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Conductor</th>
                  <th className="p-4">Bus Number & ID</th>
                  <th className="p-4">Collection Amount</th>
                  <th className="p-4">Tickets Count</th>
                  <th className="p-4 text-right">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredLogs.map((log, idx) => (
                  <tr key={log.shift_id || `${log.shift_date}-${log.conductor_id}-${idx}`} className="hover:bg-slate-800/30 transition-colors">
                    {/* Date Column */}
                    <td className="p-4 font-mono font-bold text-sm text-indigo-300">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{formatDate(log.shift_date || log.start_time || log.created_at)}</span>
                      </div>
                    </td>

                    {/* Conductor Column */}
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{log.conductor_name}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{log.conductor_id}</div>
                    </td>

                    {/* Bus Number & ID Column */}
                    <td className="p-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-xs text-white">
                        <span>🚍 {log.bus_number || log.bus_id}</span>
                        {log.bus_id && <span className="text-slate-500 font-normal">({log.bus_id})</span>}
                      </span>
                    </td>

                    {/* Collection Amount Column */}
                    <td className="p-4 font-mono font-black text-emerald-400 text-base">
                      ₹{parseFloat(log.collection_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Tickets Count Column */}
                    <td className="p-4 font-mono font-semibold text-slate-300 text-xs">
                      {log.tickets_count || 0} tickets
                    </td>

                    {/* Status Column */}
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        log.status === 'ACTIVE'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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
    </div>
  );
}
