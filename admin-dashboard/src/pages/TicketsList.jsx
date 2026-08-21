import React, { useEffect, useState } from 'react';
import { Ticket, Search, Bus, IndianRupee, Gift, CheckCircle2, XCircle, Clock, ArrowRight, Phone, RefreshCw, CreditCard } from 'lucide-react';
import { getAdminTickets, getBuses } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime } from '../utils/dateFormatter';

export default function TicketsList() {
  const [tickets, setTickets] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCashback, setTotalCashback] = useState(0);

  // Filter States
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [search, setSearch] = useState('');

  const showToast = useToast();

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedBus) params.bus_id = selectedBus;
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus) params.status = selectedStatus;
      if (search.trim()) params.search = search.trim();

      const [ticketsRes, busRes] = await Promise.all([
        getAdminTickets(params),
        getBuses(),
      ]);

      const data = ticketsRes.data;
      if (data && data.success) {
        setTickets(data.tickets || []);
        setTotalCount(data.total || 0);
        setTotalRevenue(data.total_revenue || 0);
        setTotalCashback(data.total_cashback || 0);
      } else {
        setTickets(Array.isArray(data) ? data : []);
      }
      setBuses(Array.isArray(busRes.data) ? busRes.data : []);
    } catch (err) {
      showToast?.('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [selectedBus, selectedDate, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadTickets();
  };

  const handleResetFilters = () => {
    setSelectedBus('');
    setSelectedDate('');
    setSelectedStatus('');
    setSearch('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Ticket className="w-6 h-6 text-indigo-400" />
            <span>All Booked Tickets</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Realtime repository of all issued tickets with filters for Bus ID, Date, Status, and Passenger phone.
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 border border-slate-700 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">
              ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</p>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">{totalCount.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cashback Given</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">
              ₹{totalCashback.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Gift className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Ticket ID, Phone, UPI..."
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
                {b.bus_number} ({b.bus_id || b.id})
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

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="PAID">PAID</option>
            <option value="INITIATED">INITIATED</option>
            <option value="FAILED">FAILED</option>
          </select>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Apply
          </button>

          {(selectedBus || selectedDate || selectedStatus || search) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </form>
      </div>

      {/* Tickets Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Ticket className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No tickets match your filters.</p>
            <p className="text-xs mt-1">Try changing or resetting filter options.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Ticket ID</th>
                  <th className="p-4">Bus ID</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Passenger Info</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Cashback</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date & Time (IST)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {tickets.map((t) => {
                  const isMonthlyPass =
                    t.razorpay_payment_id === 'monthly_pass' ||
                    t.payment_id?.startsWith('PASS-');

                  return (
                    <tr key={t.id || t.payment_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-mono font-bold text-xs text-indigo-400">
                          {t.payment_id || `TICK-${t.id}`}
                        </div>
                        {isMonthlyPass ? (
                          <div className="text-[11px] text-purple-400 font-mono font-semibold">
                            Pass ID: {t.pass_id || (t.payment_id?.startsWith('PASS-') ? `MPASS-${t.payment_id.replace('PASS-', '')}` : (t.pass_number || 'MPASS-1001'))}
                          </div>
                        ) : (
                          t.razorpay_payment_id && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Txn ID: {t.razorpay_payment_id}
                            </div>
                          )
                        )}
                      </td>
                      <td className="p-4">
                        {(() => {
                          const bObj = buses.find((x) => (x.bus_id || x.id) === t.bus_id);
                          return (
                            <div className="space-y-0.5">
                              <div className="font-mono font-bold text-xs text-white">
                                {bObj?.bus_number || t.bus_number || t.bus_id || 'BUS001'}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono font-semibold">
                                ID: {t.bus_id || 'BUS001'}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 font-semibold text-xs text-white">
                          <span>{t.origin || 'Bari Sadri'}</span>
                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                          <span>{t.destination || 'Udaipur'}</span>
                        </div>
                      </td>
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center space-x-1 text-xs text-slate-300">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{t.phone_number || 'Cash / QR'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {t.passenger_count || 1} Passenger(s)
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                        ₹{(parseFloat(t.amount) || 0).toFixed(2)}
                      </td>
                      <td className="p-4 font-mono font-semibold text-amber-400 text-xs">
                        {parseFloat(t.cashback) > 0 ? `₹${parseFloat(t.cashback).toFixed(2)}` : '—'}
                      </td>
                      <td className="p-4">
                        {isMonthlyPass ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <CreditCard className="w-3 h-3" />
                            <span>PASS RIDE</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              t.status === 'PAID'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : t.status === 'INITIATED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {t.status === 'PAID' ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : t.status === 'INITIATED' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{t.status || 'PAID'}</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-300 font-mono">
                        {formatDateTime(t.paid_at || t.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
