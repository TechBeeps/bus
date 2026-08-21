import React, { useState, useEffect } from 'react';
import {
  Bus,
  Users,
  Gift,
  Clock,
  ArrowRightLeft,
  Percent,
  Save,
  CheckCircle,
  LogOut,
  MapPin,
  Ticket,
  CreditCard,
  LayoutDashboard,
  IndianRupee,
  ShieldCheck,
  TrendingUp,
  Activity,
} from 'lucide-react';

import Login from './components/Login';
import Buses from './pages/Buses';
import Conductors from './pages/Conductors';
import Cities from './pages/Cities';
import ShiftAuditLogs from './pages/ShiftAuditLogs';
import TicketsList from './pages/TicketsList';
import MonthlyPasses from './pages/MonthlyPasses';

import {
  getSystemSettings,
  updateSystemSettings,
  getBuses,
  getConductors,
  getAdminTickets,
  getAdminMonthlyPasses,
  getShiftLogs,
} from './services/api';
import { useToast } from './contexts/ToastContext';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState('');

  // Overview Stats
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    totalConductors: 0,
    totalTickets: 0,
    totalRevenue: 0,
    totalPasses: 0,
    todayShifts: 0,
  });

  // Dynamic Cashback Settings (Stored in DB)
  const [cashbackSettings, setCashbackSettings] = useState({
    defaultCashbackPct: 10,
    minSpendAmount: 50,
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const showToast = useToast();

  // Auth check
  useEffect(() => {
    const savedUser = localStorage.getItem('fleet_admin_user');
    const token = localStorage.getItem('fleet_admin_token');
    if (token && savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('fleet_admin_user');
        localStorage.removeItem('fleet_admin_token');
      }
    }
  }, []);

  // Live IST Clock (DD-MM-YYYY hh:mm:ss AM/PM)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = String(hours).padStart(2, '0');
      setCurrentTime(`${day}-${month}-${year} ${strHours}:${minutes}:${seconds} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load Overview Data & Settings
  const loadDashboardData = async () => {
    try {
      const [settingsRes, busRes, condRes, ticketsRes, passRes, shiftRes] = await Promise.all([
        getSystemSettings(),
        getBuses(),
        getConductors(),
        getAdminTickets(),
        getAdminMonthlyPasses(),
        getShiftLogs(),
      ]);

      if (settingsRes.data && settingsRes.data.settings) {
        setCashbackSettings({
          defaultCashbackPct: settingsRes.data.settings.default_cashback_pct,
          minSpendAmount: settingsRes.data.settings.min_spend_amount,
        });
      }

      const busList = Array.isArray(busRes.data) ? busRes.data : [];
      const condList = Array.isArray(condRes.data) ? condRes.data : [];
      const ticketData = ticketsRes.data || {};
      const passList = Array.isArray(passRes.data) ? passRes.data : [];
      const shiftList = Array.isArray(shiftRes.data) ? shiftRes.data : [];

      setStats({
        totalBuses: busList.length,
        activeBuses: busList.filter((b) => b.status === 'ACTIVE').length,
        totalConductors: condList.length,
        totalTickets: ticketData.total || 0,
        totalRevenue: ticketData.total_revenue || 0,
        totalPasses: passList.length,
        todayShifts: shiftList.length,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('fleet_admin_token');
    localStorage.removeItem('fleet_admin_user');
    setCurrentUser(null);
    showToast?.('Logged out successfully');
  };

  // Save Dynamic Cashback Settings to MySQL DB
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await updateSystemSettings({
        default_cashback_pct: parseFloat(cashbackSettings.defaultCashbackPct),
        min_spend_amount: parseFloat(cashbackSettings.minSpendAmount),
      });
      if (res.data && res.data.success) {
        showToast?.('Cashback and Spend rules saved dynamically to Database!');
      }
    } catch (err) {
      showToast?.('Failed to save settings to database');
    } finally {
      setSettingsSaving(false);
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col justify-between p-5 select-none shrink-0">
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-500/20">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-wide text-white">Shree Mateshwari</h1>
              <p className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">Operator Admin</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('buses')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'buses'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Bus className="w-4 h-4" />
              <span>Bus Fleet</span>
            </button>

            <button
              onClick={() => setActiveTab('conductors')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'conductors'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Conductors</span>
            </button>

            <button
              onClick={() => setActiveTab('cities')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cities'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>City List</span>
            </button>

            <button
              onClick={() => setActiveTab('shift_logs')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'shift_logs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Shift Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('tickets')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>All Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab('monthly_passes')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monthly_passes'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Monthly Passes</span>
            </button>

            <button
              onClick={() => setActiveTab('cashback')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'cashback'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <Gift className="w-4 h-4" />
              <span>Cashback Rules (DB)</span>
            </button>
          </nav>
        </div>

        {/* User Profile & Logout Bottom */}
        <div className="border-t border-slate-800/80 pt-4 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-700/50 flex items-center justify-center font-bold text-xs text-indigo-300">
              {currentUser.username?.slice(0, 2).toUpperCase() || 'AD'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">{currentUser.full_name || currentUser.username}</div>
              <div className="text-[10px] text-slate-400 truncate">{currentUser.email || 'Super Admin'}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-2 px-3 bg-slate-800/60 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-800/50 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-slate-900/60 border-b border-slate-800/80 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {activeTab === 'overview' && 'Live Fleet & Financial Overview'}
              {activeTab === 'buses' && 'Bus Fleet Management'}
              {activeTab === 'conductors' && 'Conductor Roster'}
              {activeTab === 'cities' && 'Operational Cities'}
              {activeTab === 'shift_logs' && 'Shift Auditing'}
              {activeTab === 'tickets' && 'Ticket Repository'}
              {activeTab === 'monthly_passes' && 'Monthly Pass Directory'}
              {activeTab === 'cashback' && 'Dynamic Cashback & Spend Thresholds'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Quick KPI Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-2xl font-black text-emerald-400 mt-1">
                      ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">{stats.totalTickets} total tickets</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                    <IndianRupee className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Buses</p>
                    <h3 className="text-2xl font-black text-white mt-1">
                      {stats.activeBuses} / {stats.totalBuses}
                    </h3>
                    <p className="text-[11px] text-indigo-400 mt-1">Fleet operational</p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                    <Bus className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Conductors Roster</p>
                    <h3 className="text-2xl font-black text-white mt-1">{stats.totalConductors}</h3>
                    <p className="text-[11px] text-slate-500 mt-1">Authorized crew</p>
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Default Cashback</p>
                    <h3 className="text-2xl font-black text-amber-400 mt-1">
                      {cashbackSettings.defaultCashbackPct}%
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">Min Spend: ₹{cashbackSettings.minSpendAmount}</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
                    <Percent className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Quick Actions / Shortcuts */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-900/60 border border-indigo-900/30 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-indigo-400" />
                  <span>Fleet Management Quick Actions</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => setActiveTab('buses')}
                    className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Bus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                    <div className="text-xs font-bold text-white">Add / Edit Bus</div>
                    <div className="text-[11px] text-slate-400">Assign routes & crew</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('conductors')}
                    className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                    <div className="text-xs font-bold text-white">Add Conductor</div>
                    <div className="text-[11px] text-slate-400">New login credentials</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('cities')}
                    className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <MapPin className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                    <div className="text-xs font-bold text-white">Manage City List</div>
                    <div className="text-[11px] text-slate-400">Add operational towns</div>
                  </button>

                  <button
                    onClick={() => setActiveTab('tickets')}
                    className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                  >
                    <Ticket className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                    <div className="text-xs font-bold text-white">View All Tickets</div>
                    <div className="text-[11px] text-slate-400">Filter by bus & date</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUS FLEET */}
          {activeTab === 'buses' && <Buses />}

          {/* TAB 3: CONDUCTORS */}
          {activeTab === 'conductors' && <Conductors />}

          {/* TAB 4: CITY LIST (Replacing Add Route) */}
          {activeTab === 'cities' && <Cities />}

          {/* TAB 5: SHIFT AUDIT LOGS */}
          {activeTab === 'shift_logs' && <ShiftAuditLogs />}

          {/* TAB 6: ALL TICKETS */}
          {activeTab === 'tickets' && <TicketsList />}

          {/* TAB 7: MONTHLY PASSES */}
          {activeTab === 'monthly_passes' && <MonthlyPasses />}

          {/* TAB 8: DYNAMIC CASHBACK RULES (SAVED TO DB) */}
          {activeTab === 'cashback' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Gift className="w-6 h-6 text-indigo-400" />
                  <span>Dynamic Cashback & Spend Thresholds</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure default percentage cashback and minimum spend amount. Saved directly to MySQL <code className="text-indigo-300">system_settings</code> and applied in real time to ticket orders.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Default Cashback Percentage (%)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Percent className="w-5 h-5" />
                    </div>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={cashbackSettings.defaultCashbackPct}
                      onChange={(e) =>
                        setCashbackSettings({
                          ...cashbackSettings,
                          defaultCashbackPct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Percentage discount/cashback applied immediately to passenger fare at checkout.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Minimum Spend Threshold (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      required
                      value={cashbackSettings.minSpendAmount}
                      onChange={(e) =>
                        setCashbackSettings({
                          ...cashbackSettings,
                          minSpendAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-11 pr-4 py-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Tickets with fare equal or greater than this threshold will receive cashback.
                  </p>
                </div>

                <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl text-xs text-indigo-300 space-y-1">
                  <div className="font-bold flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <span>Live Computation Formula:</span>
                  </div>
                  <div>
                    If Fare ≥ ₹{cashbackSettings.minSpendAmount}, Passenger gets{' '}
                    <span className="font-bold text-white">{cashbackSettings.defaultCashbackPct}% Cashback</span>.
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Example: For ₹100 ticket &rarr; Cashback is ₹
                    {((100 * cashbackSettings.defaultCashbackPct) / 100).toFixed(2)}, Passenger pays ₹
                    {(100 - (100 * cashbackSettings.defaultCashbackPct) / 100).toFixed(2)}.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsSaving}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{settingsSaving ? 'Saving to Database...' : 'Save Settings to Database'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
