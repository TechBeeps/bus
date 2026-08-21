import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
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
  UserCheck,
  Plus,
  Trash2,
  Sparkles,
  Check,
} from 'lucide-react';

import Login from './components/Login';
import Buses from './pages/Buses';
import Conductors from './pages/Conductors';
import Cities from './pages/Cities';
import ShiftAuditLogs from './pages/ShiftAuditLogs';
import TicketsList from './pages/TicketsList';
import MonthlyPasses from './pages/MonthlyPasses';
import Customers from './pages/Customers';

import {
  getSystemSettings,
  updateSystemSettings,
  getBuses,
  getConductors,
  getAdminTickets,
  getAdminMonthlyPasses,
  getShiftLogs,
  getAdminCustomers,
  getLoyaltyRules,
  createLoyaltyRule,
  deleteLoyaltyRule,
} from './services/api';
import { useToast } from './contexts/ToastContext';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Overview Stats
  const [stats, setStats] = useState({
    totalBuses: 0,
    activeBuses: 0,
    totalConductors: 0,
    totalTickets: 0,
    totalRevenue: 0,
    totalPasses: 0,
    totalCustomers: 0,
    todayShifts: 0,
  });

  // Dynamic Discount Settings (Stored in DB)
  const [cashbackSettings, setCashbackSettings] = useState({
    defaultCashbackPct: 10,
    minSpendAmount: 50,
  });
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Dynamic Spend Milestone Rules
  const [loyaltyRules, setLoyaltyRules] = useState([]);
  const [newThreshold, setNewThreshold] = useState('');
  const [newRuleTitle, setNewRuleTitle] = useState('');
  const [addingRule, setAddingRule] = useState(false);

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

  // Load Overview Data, Settings & Loyalty Rules
  const loadDashboardData = async () => {
    try {
      const [settingsRes, busRes, condRes, ticketsRes, passRes, shiftRes, custRes, loyaltyRes] = await Promise.all([
        getSystemSettings(),
        getBuses(),
        getConductors(),
        getAdminTickets(),
        getAdminMonthlyPasses(),
        getShiftLogs(),
        getAdminCustomers(),
        getLoyaltyRules(),
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
      const custList = Array.isArray(custRes.data) ? custRes.data : [];
      const loyaltyList = Array.isArray(loyaltyRes.data) ? loyaltyRes.data : [];

      setLoyaltyRules(loyaltyList);

      setStats({
        totalBuses: busList.length,
        activeBuses: busList.filter((b) => b.status === 'ACTIVE').length,
        totalConductors: condList.length,
        totalTickets: ticketData.total || 0,
        totalRevenue: ticketData.total_revenue || 0,
        totalPasses: passList.length,
        totalCustomers: custList.length,
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

  // Save Dynamic Instant Discount Settings to MySQL DB
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsSaving(true);
    try {
      const res = await updateSystemSettings({
        default_cashback_pct: parseFloat(cashbackSettings.defaultCashbackPct),
        min_spend_amount: parseFloat(cashbackSettings.minSpendAmount),
      });
      if (res.data && res.data.success) {
        showToast?.('Instant discount and spend rules saved dynamically to Database!');
      }
    } catch (err) {
      showToast?.('Failed to save settings to database');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Add New Spend Milestone Rule
  const handleAddMilestoneRule = async (e) => {
    e.preventDefault();
    if (!newThreshold || parseFloat(newThreshold) <= 0) {
      showToast?.('Please enter a valid spend threshold amount');
      return;
    }

    setAddingRule(true);
    try {
      const payload = {
        spend_threshold: parseFloat(newThreshold),
        reward_rides: 1,
        title: newRuleTitle.trim() || `Free Ride on Rs.${parseInt(newThreshold)} Spend`,
      };
      const res = await createLoyaltyRule(payload);
      if (res.data && res.data.success) {
        showToast?.(`Milestone rule for ₹${newThreshold} created successfully!`);
        setNewThreshold('');
        setNewRuleTitle('');
        // Reload loyalty rules
        const updated = await getLoyaltyRules();
        setLoyaltyRules(Array.isArray(updated.data) ? updated.data : []);
      }
    } catch (err) {
      showToast?.('Failed to create milestone rule');
    } finally {
      setAddingRule(false);
    }
  };

  // Delete Spend Milestone Rule
  const handleDeleteMilestoneRule = async (ruleId, threshold) => {
    if (!window.confirm(`Are you sure you want to delete the Free Ride milestone rule for ₹${threshold}?`)) {
      return;
    }
    try {
      const res = await deleteLoyaltyRule(ruleId);
      if (res.data && res.data.success) {
        showToast?.(`Milestone rule for ₹${threshold} deleted`);
        setLoyaltyRules(loyaltyRules.filter((r) => r.id !== ruleId));
      }
    } catch (err) {
      showToast?.('Failed to delete milestone rule');
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  const currentPath = location.pathname === '/' ? '/overview' : location.pathname;

  const navItems = [
    { path: '/overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { path: '/buses', label: 'Bus Fleet', icon: Bus },
    { path: '/conductors', label: 'Conductors', icon: Users },
    { path: '/cities', label: 'City List', icon: MapPin },
    { path: '/shifts', label: 'Shift Audit Logs', icon: Clock },
    { path: '/tickets', label: 'All Tickets', icon: Ticket },
    { path: '/monthly-passes', label: 'Monthly Passes', icon: CreditCard },
    { path: '/customers', label: 'Customers Directory', icon: UserCheck },
    { path: '/discount-rules', label: 'Discount Rules (DB)', icon: Gift },
  ];

  const getHeaderTitle = () => {
    switch (currentPath) {
      case '/buses': return 'Bus Fleet Management';
      case '/conductors': return 'Conductor Roster';
      case '/cities': return 'Operational Cities';
      case '/shifts':
      case '/shift-logs': return 'Shift Auditing';
      case '/tickets': return 'Ticket Repository';
      case '/monthly-passes': return 'Monthly Pass Directory';
      case '/customers': return 'Customer & Passenger Directory';
      case '/discount-rules':
      case '/cashback-rules': return 'Dynamic Discount & Milestone Rules';
      default: return 'Live Fleet & Financial Overview';
    }
  };

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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path === '/shifts' && currentPath === '/shift-logs');

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
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
              {getHeaderTitle()}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <Clock className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400" />
              <span>{currentTime}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Container with Routes */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/overview" replace />} />
            
            {/* OVERVIEW ROUTE */}
            <Route
              path="/overview"
              element={
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
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Customers</p>
                        <h3 className="text-2xl font-black text-indigo-400 mt-1">{stats.totalCustomers}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Unique passengers</p>
                      </div>
                      <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                        <UserCheck className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Instant Discount</p>
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
                        onClick={() => navigate('/buses')}
                        className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                      >
                        <Bus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                        <div className="text-xs font-bold text-white">Add / Edit Bus</div>
                        <div className="text-[11px] text-slate-400">Assign routes & crew</div>
                      </button>

                      <button
                        onClick={() => navigate('/conductors')}
                        className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                      >
                        <Users className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                        <div className="text-xs font-bold text-white">Add Conductor</div>
                        <div className="text-[11px] text-slate-400">New login credentials</div>
                      </button>

                      <button
                        onClick={() => navigate('/customers')}
                        className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                      >
                        <UserCheck className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                        <div className="text-xs font-bold text-white">View Customers</div>
                        <div className="text-[11px] text-slate-400">Passenger history & discount</div>
                      </button>

                      <button
                        onClick={() => navigate('/tickets')}
                        className="p-4 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 rounded-2xl text-left transition-all group cursor-pointer"
                      >
                        <Ticket className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform mb-2" />
                        <div className="text-xs font-bold text-white">View All Tickets</div>
                        <div className="text-[11px] text-slate-400">Filter by bus & date</div>
                      </button>
                    </div>
                  </div>
                </div>
              }
            />

            {/* ROUTE: BUS FLEET */}
            <Route path="/buses" element={<Buses />} />

            {/* ROUTE: CONDUCTORS */}
            <Route path="/conductors" element={<Conductors />} />

            {/* ROUTE: CITIES */}
            <Route path="/cities" element={<Cities />} />

            {/* ROUTE: SHIFTS */}
            <Route path="/shifts" element={<ShiftAuditLogs />} />
            <Route path="/shift-logs" element={<Navigate to="/shifts" replace />} />

            {/* ROUTE: ALL TICKETS */}
            <Route path="/tickets" element={<TicketsList />} />

            {/* ROUTE: MONTHLY PASSES */}
            <Route path="/monthly-passes" element={<MonthlyPasses />} />

            {/* ROUTE: CUSTOMERS */}
            <Route path="/customers" element={<Customers />} />

            {/* ROUTE: DISCOUNT & MILESTONE RULES */}
            <Route
              path="/discount-rules"
              element={
                <div className="max-w-5xl mx-auto space-y-8">
                  {/* Page Header */}
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                      <Gift className="w-6 h-6 text-indigo-400" />
                      <span>Dynamic Discounts & Spend Milestone Rules</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Manage instant percentage discounts on tickets and configure unlimited spend milestone rules to reward loyal passengers with 100% Free Rides.
                    </p>
                  </div>

                  {/* SECTION 1: SPEND MILESTONE RULES (FREE RIDES) */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center space-x-2">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span>Spend Milestone Free Ride Rewards</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Whenever a passenger's total ticket spend hits any of these thresholds, their next ride is automatically 100% FREE without payment.
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold font-mono">
                        {loyaltyRules.length} Active Milestone Rules
                      </span>
                    </div>

                    {/* Add Milestone Form */}
                    <form onSubmit={handleAddMilestoneRule} className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Spend Target (₹)
                        </label>
                        <div className="relative">
                          <IndianRupee className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="number"
                            step="50"
                            min="100"
                            required
                            placeholder="e.g. 1500, 3000, 5000"
                            value={newThreshold}
                            onChange={(e) => setNewThreshold(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Reward Title (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1st Free Ride on ₹1500 Spend"
                          value={newRuleTitle}
                          onChange={(e) => setNewRuleTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          disabled={addingRule}
                          className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{addingRule ? 'Adding...' : 'Add Milestone'}</span>
                        </button>
                      </div>
                    </form>

                    {/* Milestone Rules Table */}
                    <div className="border border-slate-800/80 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold border-b border-slate-800">
                          <tr>
                            <th className="p-3.5">Spend Target</th>
                            <th className="p-3.5">Reward Granted</th>
                            <th className="p-3.5">Milestone Title</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-200">
                          {loyaltyRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-800/20 transition-colors">
                              <td className="p-3.5 font-mono font-black text-emerald-400 text-sm">
                                ₹{rule.spend_threshold.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-3.5">
                                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                                  <Gift className="w-3 h-3 text-amber-400" />
                                  <span>1 Free Bus Ride (100% Off)</span>
                                </span>
                              </td>
                              <td className="p-3.5 font-medium text-slate-300">
                                {rule.title}
                              </td>
                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  ACTIVE
                                </span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={() => handleDeleteMilestoneRule(rule.id, rule.spend_threshold)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Milestone Rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SECTION 2: INSTANT PERCENTAGE DISCOUNT */}
                  <form onSubmit={handleSaveSettings} className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
                    <div className="border-b border-slate-800/80 pb-4">
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <Percent className="w-5 h-5 text-indigo-400" />
                        <span>Instant Percentage Discount on Bookings</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Applied directly to standard passenger ticket fares exceeding the minimum spend threshold.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Default Discount Percentage (%)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <Percent className="w-4 h-4" />
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
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Instant percentage discount deducted directly from passenger ticket fare at checkout.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Minimum Spend Threshold (₹)
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                            <IndianRupee className="w-4 h-4" />
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
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                          />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5">
                          Tickets with fare equal or greater than this threshold will receive the instant discount.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-indigo-950/40 border border-indigo-800/40 rounded-2xl text-xs text-indigo-300 space-y-1">
                      <div className="font-bold flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>Live Computation Formula:</span>
                      </div>
                      <div>
                        If Fare ≥ ₹{cashbackSettings.minSpendAmount}, Passenger gets{' '}
                        <span className="font-bold text-white">{cashbackSettings.defaultCashbackPct}% Instant Discount</span>.
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Example: For ₹100 ticket &rarr; Discount is ₹
                        {((100 * cashbackSettings.defaultCashbackPct) / 100).toFixed(2)}, Passenger pays ₹
                        {(100 - (100 * cashbackSettings.defaultCashbackPct) / 100).toFixed(2)}.
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={settingsSaving}
                      className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>{settingsSaving ? 'Saving to Database...' : 'Save Instant Discount Settings'}</span>
                    </button>
                  </form>
                </div>
              }
            />
            <Route path="/cashback-rules" element={<Navigate to="/discount-rules" replace />} />

            {/* FALLBACK ROUTE */}
            <Route path="*" element={<Navigate to="/overview" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
