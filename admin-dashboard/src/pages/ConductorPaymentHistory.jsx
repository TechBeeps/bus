import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  IndianRupee,
  Ticket,
  Bus,
  Search,
  RefreshCw,
  Clock,
  ArrowRight,
  Phone,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Receipt,
  Gift,
  X,
  CreditCard,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { getConductors, getConductorPaymentHistory } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime, formatDate } from '../utils/dateFormatter';

export default function ConductorPaymentHistory() {
  const [conductors, setConductors] = useState([]);
  const [selectedConductorId, setSelectedConductorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, UPI, PASS
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const showToast = useToast();

  // 1. Load Conductors on Mount
  useEffect(() => {
    const fetchConductorsList = async () => {
      try {
        const res = await getConductors();
        const list = Array.isArray(res.data) ? res.data : [];
        setConductors(list);
        if (list.length > 0) {
          setSelectedConductorId(list[0].conductor_id || list[0].id);
        }
      } catch (err) {
        showToast?.('Failed to load conductors roster');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchConductorsList();
  }, []);

  // 2. Fetch Payment History whenever Conductor or Date changes
  const fetchPaymentHistory = async () => {
    if (!selectedConductorId) return;
    setLoading(true);
    try {
      const res = await getConductorPaymentHistory({
        conductor_id: selectedConductorId,
        date: selectedDate,
      });
      if (res.data && res.data.success) {
        setHistoryData(res.data);
      } else {
        setHistoryData({
          conductor_id: selectedConductorId,
          conductor_name: 'Conductor',
          date: selectedDate,
          total_amount: 0,
          total_tickets: 0,
          total_passengers: 0,
          total_cashback: 0,
          buses_covered: [],
          tickets: [],
        });
      }
    } catch (err) {
      showToast?.('Failed to fetch conductor payment history');
      setHistoryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedConductorId) {
      fetchPaymentHistory();
    }
  }, [selectedConductorId, selectedDate]);

  // Date Navigation Helpers
  const handleShiftDate = (days) => {
    const curr = new Date(selectedDate);
    if (isNaN(curr.getTime())) return;
    curr.setDate(curr.getDate() + days);
    const y = curr.getFullYear();
    const m = String(curr.getMonth() + 1).padStart(2, '0');
    const d = String(curr.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const handleJumpToToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  const isToday = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return selectedDate === `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Active Conductor Details
  const activeConductor = useMemo(() => {
    return conductors.find((c) => (c.conductor_id || c.id) === selectedConductorId);
  }, [conductors, selectedConductorId]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    if (!historyData || !Array.isArray(historyData.tickets)) return [];
    let list = historyData.tickets;

    if (filterMode !== 'ALL') {
      list = list.filter((t) => t.payment_mode === filterMode);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          String(t.ticket_id || '').toLowerCase().includes(q) ||
          String(t.phone_number || '').toLowerCase().includes(q) ||
          String(t.bus_number || '').toLowerCase().includes(q) ||
          String(t.origin || '').toLowerCase().includes(q) ||
          String(t.destination || '').toLowerCase().includes(q) ||
          String(t.razorpay_payment_id || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [historyData, filterMode, searchQuery]);

  // Export CSV Helper
  const handleExportCSV = () => {
    if (!filteredTickets.length) {
      showToast?.('No tickets available to export');
      return;
    }

    const headers = [
      'Ticket ID',
      'Time',
      'Date',
      'Bus Number',
      'Origin',
      'Destination',
      'Passengers',
      'Base Fare (INR)',
      'Cashback (INR)',
      'Paid Amount (INR)',
      'Payment Mode',
      'Razorpay ID',
      'Phone Number',
      'Conductor Name',
      'Conductor ID',
    ];

    const rows = filteredTickets.map((t) => [
      t.ticket_id || t.id,
      t.time_formatted || '',
      selectedDate,
      t.bus_number || '',
      t.origin || '',
      t.destination || '',
      t.passenger_count || 1,
      t.fare || t.amount || 0,
      t.cashback || 0,
      t.total_paid || t.paidamount || 0,
      t.payment_mode || 'UPI',
      t.razorpay_payment_id || '',
      t.phone_number || '',
      historyData?.conductor_name || activeConductor?.name || '',
      selectedConductorId,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `conductor_payment_history_${selectedConductorId}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <Receipt className="w-6 h-6 text-indigo-400" />
            <span>Payment History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track daily collection amounts, instant cashback discounts, and verified ticket transactions per conductor and date.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchPaymentHistory}
            disabled={loading}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 border border-slate-700 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh payment data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!filteredTickets.length}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Selector Bar (Conductor + Date Controls) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Conductor Selector */}
        <div className="lg:col-span-6 space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Select Conductor
          </label>
          <div className="relative">
            <Users className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedConductorId}
              onChange={(e) => setSelectedConductorId(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {conductors.map((c) => {
                const cId = c.conductor_id || c.id;
                const busLabel = c.assigned_bus_id ? ` • Bus: ${c.assigned_bus_id}` : '';
                return (
                  <option key={cId} value={cId}>
                    {c.name} ({cId}){busLabel}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Date Switcher & Jump to Today */}
        <div className="lg:col-span-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              Shift Date
            </label>
            {!isToday && (
              <button
                onClick={handleJumpToToday}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                Jump to Today
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => handleShiftDate(1)}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Conductor Quick Profile Card (Selected) */}
      {activeConductor && (
        <div className="bg-indigo-950/30 border border-indigo-800/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-black text-sm text-indigo-300">
              {activeConductor.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{activeConductor.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeConductor.conductor_id || activeConductor.id}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-3 mt-0.5">
                <span>📱 {activeConductor.mobile || 'N/A'}</span>
                {activeConductor.email && <span>✉️ {activeConductor.email}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-slate-400">Assigned Fleet:</span>
            <span className="font-bold font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-indigo-300">
              🚍 {activeConductor.assigned_bus_id || 'Not Assigned'}
            </span>
          </div>
        </div>
      )}

      {/* 4. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Collection */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Collection
            </span>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-400 font-mono">
              ₹{(historyData?.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Net Paid Revenue on {formatDate(selectedDate)}</p>
          </div>
        </div>

        {/* Tickets Paid */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tickets Paid
            </span>
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-white font-mono">
              {historyData?.total_tickets || 0}
            </h3>
            <p className="text-[11px] text-indigo-400 mt-1">Verified bookings</p>
          </div>
        </div>

        {/* Total Passengers */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Passengers
            </span>
            <div className="p-2.5 bg-sky-500/10 rounded-xl text-sky-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-sky-400 font-mono">
              {historyData?.total_passengers || historyData?.total_tickets || 0}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Total head count</p>
          </div>
        </div>

        {/* Discount / Cashback Given */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Instant Discount
            </span>
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-amber-400 font-mono">
              ₹{(historyData?.total_cashback || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Cashback & milestone perks</p>
          </div>
        </div>

        {/* Buses Covered */}
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Buses Covered
            </span>
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-black text-purple-300 truncate">
              {historyData?.buses_covered?.length > 0
                ? historyData.buses_covered.join(', ')
                : activeConductor?.assigned_bus_id || '1 Bus'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Assigned shifts</p>
          </div>
        </div>
      </div>

      {/* 5. Live Search & Mode Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl">
        <div className="flex items-center space-x-2">
          {['ALL', 'UPI', 'PASS'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterMode === mode
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {mode === 'ALL' ? 'All Tickets' : mode === 'UPI' ? 'UPI Online' : 'Monthly Passes'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search ticket, phone, bus, route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 6. Tickets Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Ticket className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">
              Verified Ticket Transactions ({filteredTickets.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {formatDate(selectedDate)}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">Loading conductor payment ledger...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <div className="text-3xl">🎫</div>
            <h4 className="text-sm font-bold text-slate-300">No Tickets Recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No verified payment transactions found for {activeConductor?.name || 'this conductor'} on{' '}
              {formatDate(selectedDate)}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Time (IST)</th>
                  <th className="p-3.5">Bus No</th>
                  <th className="p-3.5">Route</th>
                  <th className="p-3.5">Passenger</th>
                  <th className="p-3.5">Breakdown</th>
                  <th className="p-3.5">Net Paid</th>
                  <th className="p-3.5">Mode</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredTickets.map((ticket, idx) => {
                  const isPass = ticket.payment_mode === 'PASS';
                  const baseFare = ticket.fare || ticket.amount || 0;
                  const discount = ticket.cashback || 0;
                  const paid = ticket.total_paid || ticket.paidamount || 0;

                  return (
                    <tr
                      key={ticket.ticket_id || ticket.id || idx}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3.5 font-mono font-bold text-indigo-300">
                        #{ticket.ticket_id || ticket.id}
                      </td>

                      <td className="p-3.5">
                        <span className="inline-flex items-center space-x-1 font-mono text-slate-300">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{ticket.time_formatted || 'N/A'}</span>
                        </span>
                      </td>

                      <td className="p-3.5 font-bold font-mono text-white">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-indigo-300">
                          🚍 {ticket.bus_number || activeConductor?.assigned_bus_id || 'BUS'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                          <span>{ticket.origin || 'Origin'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span>{ticket.destination || 'Destination'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-slate-300 font-mono flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{ticket.phone_number || 'Cash/Walk-in'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {ticket.passenger_count || 1} Passenger(s)
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div className="text-slate-400">
                            Fare: <span className="text-slate-300">₹{baseFare.toFixed(2)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="text-amber-400">
                              Off: <span>-₹{discount.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="text-sm font-black font-mono text-emerald-400">
                          ₹{paid.toFixed(2)}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {isPass ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                            <CreditCard className="w-3 h-3 text-purple-400" />
                            <span>PASS</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>UPI PAID</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedReceipt(ticket)}
                          className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold transition-colors cursor-pointer"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. Detailed Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Receipt Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] font-bold text-indigo-400 tracking-wider uppercase">
                  Digital Ticket Receipt
                </div>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Shree Mateshwari Express
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Ticket #{selectedReceipt.ticket_id || selectedReceipt.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Route & Booking Info */}
            <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <span className="text-slate-400 font-semibold">Route</span>
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <span>{selectedReceipt.origin}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{selectedReceipt.destination}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Bus Number</span>
                <span className="font-mono font-bold text-indigo-300">
                  🚍 {selectedReceipt.bus_number || activeConductor?.assigned_bus_id}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Conductor</span>
                <span className="font-semibold text-slate-200">
                  {historyData?.conductor_name || activeConductor?.name} ({selectedConductorId})
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Passenger Phone</span>
                <span className="font-mono text-slate-300">
                  {selectedReceipt.phone_number || 'Walk-in Cash/Card'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Passengers</span>
                <span className="font-bold text-white font-mono">
                  {selectedReceipt.passenger_count || 1} Person(s)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Time (IST)</span>
                <span className="font-mono text-slate-300">
                  {selectedReceipt.time_formatted} • {formatDate(selectedDate)}
                </span>
              </div>
            </div>

            {/* Price Breakup */}
            <div className="bg-indigo-950/20 border border-indigo-800/30 p-4 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Standard Fare</span>
                <span className="text-slate-300">
                  ₹{(selectedReceipt.fare || selectedReceipt.amount || 0).toFixed(2)}
                </span>
              </div>

              {(selectedReceipt.cashback || 0) > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Instant Cashback Discount</span>
                  <span>-₹{Number(selectedReceipt.cashback).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-indigo-800/40">
                <span className="text-emerald-400">Total Paid Amount</span>
                <span className="text-emerald-400">
                  ₹{(selectedReceipt.total_paid || selectedReceipt.paidamount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Razorpay Transaction Box */}
            {selectedReceipt.razorpay_payment_id && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>Razorpay Txn:</span>
                <span className="text-indigo-300 font-bold">
                  {selectedReceipt.razorpay_payment_id}
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
