import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  IndianRupee,
  Ticket,
  Shield,
  Phone,
  UserCheck,
  Calendar,
  Gift,
  CreditCard,
  Eye,
  X,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { getAdminCustomers } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime } from '../utils/dateFormatter';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const showToast = useToast();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await getAdminCustomers();
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast?.('Failed to load customers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.mobile_number && c.mobile_number.includes(q)) ||
      (c.monthly_pass?.pass_id && c.monthly_pass.pass_id.toLowerCase().includes(q)) ||
      String(c.id).includes(q)
    );
  });

  const totalTickets = customers.reduce((sum, c) => sum + (parseInt(c.total_tickets) || 0), 0);
  const totalSpent = customers.reduce((sum, c) => sum + (parseFloat(c.total_spent) || 0), 0);
  const passHoldersCount = customers.filter((c) => Boolean(c.monthly_pass)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Customer Directory</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered passengers, linked monthly passes, booking histories, fare discounts, and loyalty metrics.
          </p>
        </div>

        <button
          onClick={loadCustomers}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer border border-slate-700/60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Customers</p>
            <h3 className="text-2xl font-black text-white mt-1">{customers.length}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pass Holders</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">{passHoldersCount}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tickets Booked</p>
            <h3 className="text-2xl font-black text-emerald-400 mt-1">{totalTickets.toLocaleString('en-IN')}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue Generated</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, pass ID..."
            className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs font-medium text-slate-400">
          Showing <span className="text-white font-bold">{filteredCustomers.length}</span> of {customers.length} Customers
        </div>
      </div>

      {/* Clean & Compact Customers Table (Without Monthly Pass Column) */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading customer records...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No customers found.</p>
            <p className="text-xs mt-1">Passengers will appear here automatically when they book tickets or passes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Customer ID</th>
                  <th className="p-4">Passenger Details</th>
                  <th className="p-4">Total Tickets</th>
                  <th className="p-4">Total Spent</th>
                  <th className="p-4">Discount Availed (₹)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs text-indigo-400">
                      CUST-{String(c.id).padStart(4, '0')}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-black">
                          {(c.name || 'C')[0].toUpperCase()}
                        </div>
                        <span>{c.name || 'Customer'}</span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{c.mobile_number}</span>
                      </div>
                    </td>

                    <td className="p-4 font-mono font-bold text-white text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
                        {c.total_tickets || 0} Ticket{(c.total_tickets || 0) === 1 ? '' : 's'}
                      </span>
                    </td>

                    <td className="p-4 font-mono font-black text-emerald-400 text-sm">
                      ₹{(parseFloat(c.total_spent) || 0).toFixed(2)}
                    </td>

                    <td className="p-4 font-mono font-bold text-amber-400 text-xs">
                      ₹{(parseFloat(c.cashback) || 0).toFixed(2)}
                    </td>

                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-600 transition-all cursor-pointer shadow-sm"
                        title="View Full Customer Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FULL CUSTOMER DETAILS POPUP MODAL (EXPANDED WIDTH, CLEAN 2-COLUMN VIEW) */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-lg font-black">
                  {(selectedCustomer.name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-white">{selectedCustomer.name || 'Customer'}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Customer ID: <span className="text-indigo-400 font-bold">CUST-{String(selectedCustomer.id).padStart(4, '0')}</span> • Mobile: <span className="text-slate-200">{selectedCustomer.mobile_number}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* LEFT COLUMN: Financials & Loyalty (7 cols) */}
              <div className="md:col-span-7 space-y-5">
                {/* Financial 3-Card Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block mb-1">Total Spent</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      ₹{(parseFloat(selectedCustomer.total_spent) || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block mb-1">Total Tickets</span>
                    <span className="text-lg font-black text-white font-mono">
                      {selectedCustomer.total_tickets || 0}
                    </span>
                  </div>

                  <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80">
                    <span className="text-slate-400 text-[11px] block mb-1">Discount Availed</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      ₹{(parseFloat(selectedCustomer.cashback) || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Spend Milestones & Loyalty Progress */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Spend Milestones & Free Ride Progress</span>
                  </h4>

                  <div className="space-y-3 text-xs pt-1">
                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block mb-1">Milestones Unlocked</span>
                      {parseFloat(selectedCustomer.last_milestone_claimed) > 0 ? (
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          <Gift className="w-3.5 h-3.5" />
                          <span>₹{parseInt(selectedCustomer.last_milestone_claimed)} Milestone ({selectedCustomer.free_rides_redeemed || 1} Free Ride Claimed)</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No free ride milestones claimed yet</span>
                      )}
                    </div>

                    <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50">
                      <span className="text-slate-400 block mb-1">Next Free Ride Target</span>
                      {selectedCustomer.next_threshold ? (
                        <div>
                          <div className="flex items-center justify-between font-mono text-slate-300 mb-1.5">
                            <span className="font-bold text-indigo-300">₹{(parseFloat(selectedCustomer.total_spent) || 0).toFixed(0)} / ₹{selectedCustomer.next_threshold}</span>
                            <span className="text-amber-400 font-semibold">₹{(parseFloat(selectedCustomer.amount_needed) || 0).toFixed(0)} left to Free Ride</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-700/80">
                            <div
                              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, Math.max(5, selectedCustomer.progress_pct || 0))}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-amber-300 font-bold">🎉 All Spend Milestones Completed!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Monthly Pass & Meta (5 cols) */}
              <div className="md:col-span-5 space-y-5">
                {/* Monthly Pass Subscription Card */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Monthly Pass Subscription</span>
                  </h4>

                  {selectedCustomer.monthly_pass ? (
                    <div className="space-y-3">
                      {/* Quota Usage Bar */}
                      <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Rides Quota:</span>
                          <span className="font-mono font-bold text-white text-[11px]">
                            <span className="text-purple-400">{selectedCustomer.monthly_pass.used_rides || 0} Used</span> / {selectedCustomer.monthly_pass.total_rides || 62} (
                            <span className="text-emerald-400">{selectedCustomer.monthly_pass.remaining_rides || (selectedCustomer.monthly_pass.total_rides - selectedCustomer.monthly_pass.used_rides)} Left</span>)
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-700/80">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(0, ((selectedCustomer.monthly_pass.used_rides || 0) / (selectedCustomer.monthly_pass.total_rides || 62)) * 100))}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Pass Details Grid */}
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-slate-400 block mb-0.5 text-[10px]">Pass ID</span>
                          <span className="font-mono font-bold text-purple-400">{selectedCustomer.monthly_pass.pass_id}</span>
                        </div>

                        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-slate-400 block mb-0.5 text-[10px]">Pass Cost</span>
                          <span className="font-mono font-bold text-emerald-400">₹{(parseFloat(selectedCustomer.monthly_pass.amount) || 0).toFixed(2)}</span>
                        </div>

                        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50 col-span-2">
                          <span className="text-slate-400 block mb-0.5 text-[10px]">Assigned Route</span>
                          <span className="font-bold text-white text-xs">{selectedCustomer.monthly_pass.origin_city} ➔ {selectedCustomer.monthly_pass.destination_city}</span>
                        </div>

                        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-slate-400 block mb-0.5 text-[10px]">Security PIN</span>
                          <span className="font-mono font-bold text-indigo-300">{selectedCustomer.monthly_pass.pin || '1234'}</span>
                        </div>

                        <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/50">
                          <span className="text-slate-400 block mb-0.5 text-[10px]">Status</span>
                          <span className="font-bold text-emerald-400">{selectedCustomer.monthly_pass.status || 'ACTIVE'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                      <CreditCard className="w-6 h-6 mx-auto mb-1 opacity-30 text-purple-400" />
                      No active monthly pass linked.
                    </div>
                  )}
                </div>

                {/* Security & Registration Meta Card */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl text-xs text-slate-400 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Security PIN:</span>
                    </span>
                    <strong className="text-white font-mono">{selectedCustomer.user_pin || '1234'}</strong>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                    <span className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Joined On:</span>
                    </span>
                    <strong className="text-slate-200 font-mono text-[11px]">{formatDateTime(selectedCustomer.created_at)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedCustomer(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer text-xs"
              >
                Close Customer Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
