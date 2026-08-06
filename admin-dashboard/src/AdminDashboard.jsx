import React, { useState } from 'react';
import axios from 'axios';
import Buses from './pages/Buses';
import Conductors from './pages/Conductors';
import RoutesPage from './pages/Routes';
import {
  Bus,
  Users,
  Gift,
  Clock,
  ShieldAlert,
  ArrowRightLeft,
  Percent,
  Sparkles,
  Save,
  CheckCircle,
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('conductors');
  const [buses, setBuses] = useState([
    { id: 'BUS-101', route: 'Central Stand ➔ Tech Park', currentConductor: 'Rajesh Kumar', status: 'ACTIVE' },
    { id: 'BUS-102', route: 'Market Stand ➔ City Hospital', currentConductor: 'Suresh Verma', status: 'ACTIVE' },
    { id: 'BUS-103', route: 'Terminal ➔ Airport Express', currentConductor: 'Unassigned', status: 'INACTIVE' },
  ]);

  const [conductors] = useState([
    { id: 'COND-01', name: 'Rajesh Kumar', phone: '9876543210' },
    { id: 'COND-02', name: 'Suresh Verma', phone: '9876543211' },
    { id: 'COND-03', name: 'Amit Singh', phone: '9876543212' },
    { id: 'COND-04', name: 'Vikram Patel', phone: '9876543213' },
  ]);

  const [assignmentLogs, setAssignmentLogs] = useState([
    { id: 1, busId: 'BUS-101', assignedTo: 'Rajesh Kumar', assignedBy: 'Owner (Admin)', timestamp: '2026-08-05 08:30 AM' },
    { id: 2, busId: 'BUS-102', assignedTo: 'Suresh Verma', assignedBy: 'Owner (Admin)', timestamp: '2026-08-05 09:15 AM' },
  ]);

  const [cashbackRules, setCashbackRules] = useState({
    defaultCashbackPct: 5,
    minSpendAmount: 100,
    festivalBonusPct: 10,
    routeSpecificRule: { routeId: 'BUS-101', extraCashbackPct: 2 },
    isEmergencyCreditEnabled: true,
    maxEmergencyTrips: 1,
  });

  const [selectedBusForReassign, setSelectedBusForReassign] = useState(null);
  const [newConductorId, setNewConductorId] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleReassignConductor = (e) => {
    e.preventDefault();
    if (!selectedBusForReassign || !newConductorId) return;

    const conductorObj = conductors.find((c) => c.id === newConductorId);
    const conductorName = conductorObj ? conductorObj.name : 'Unassigned';

    setBuses((prev) =>
      prev.map((b) =>
        b.id === selectedBusForReassign
          ? { ...b, currentConductor: conductorName, status: 'ACTIVE' }
          : b
      )
    );

    const newLog = {
      id: Date.now(),
      busId: selectedBusForReassign,
      assignedTo: conductorName,
      assignedBy: 'Owner (Admin)',
      timestamp: new Date().toLocaleString(),
    };
    setAssignmentLogs([newLog, ...assignmentLogs]);

    showToast(`Successfully assigned ${conductorName} to ${selectedBusForReassign}`);
    setSelectedBusForReassign(null);
    setNewConductorId('');
  };

  const handleSaveFintechRules = (e) => {
    e.preventDefault();
    showToast('Loyalty & Cashback Rules updated live across all buses!');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
      {toastMessage && (
        <div className="fixed top-5 right-5 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 z-50 animate-bounce">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      <aside className="w-64 bg-slate-950 p-6 border-r border-slate-800 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white">FleetAdmin</h1>
              <p className="text-xs text-slate-400">Bus Operator Portal</p>
            </div>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('conductors')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'conductors'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Conductor Duty</span>
            </button>

            <button
              onClick={() => setActiveTab('cashback')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'cashback'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Gift className="w-5 h-5" />
              <span>Loyalty & Cashback</span>
            </button>

            <button
              onClick={() => setActiveTab('buses')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'buses'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Bus className="w-5 h-5" />
              <span>Buses</span>
            </button>

            <button
              onClick={() => setActiveTab('conductors_list')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'conductors_list'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Conductors</span>
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'routes'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-5 h-5" />
              <span>Routes</span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'logs'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Shift Audit Logs</span>
            </button>
          </nav>
        </div>

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-500">
          Logged in as <span className="text-slate-300 font-medium">Bus Owner</span>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Active Buses</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {buses.filter((b) => b.status === 'ACTIVE').length} / {buses.length}
              </h3>
            </div>
            <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
              <Bus className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Default Cashback</p>
              <h3 className="text-2xl font-black text-emerald-400 mt-1">
                {cashbackRules.defaultCashbackPct}%
              </h3>
            </div>
            <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-400">
              <Percent className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Emergency Overdraft</p>
              <h3 className="text-2xl font-black text-amber-400 mt-1">
                {cashbackRules.isEmergencyCreditEnabled ? 'ENABLED' : 'DISABLED'}
              </h3>
            </div>
            <div className="bg-amber-500/10 p-3 rounded-xl text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </div>
        </div>

        {activeTab === 'conductors' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Conductor Shift Management</h2>
                <p className="text-xs text-slate-400">Assign authorized conductors to specific buses in real time.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {buses.map((bus) => (
                <div key={bus.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-950 px-3 py-1 rounded-lg border border-indigo-800/50">
                        {bus.id}
                      </span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        bus.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {bus.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">{bus.route}</h4>
                    <p className="text-xs text-slate-400 mb-4">
                      Active Conductor:{' '}
                      <span className="text-slate-200 font-semibold">{bus.currentConductor}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedBusForReassign(bus.id)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Change Conductor</span>
                  </button>
                </div>
              ))}
            </div>

            {selectedBusForReassign && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
                  <h3 className="text-lg font-bold text-white">Reassign Conductor: {selectedBusForReassign}</h3>
                  <p className="text-xs text-slate-400">
                    Payment webhooks for {selectedBusForReassign} will immediately route to the newly assigned conductor's mobile phone.
                  </p>

                  <form onSubmit={handleReassignConductor} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Select Conductor</label>
                      <select
                        value={newConductorId}
                        onChange={(e) => setNewConductorId(e.target.value)}
                        className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        required
                      >
                        <option value="">-- Choose Authorized Conductor --</option>
                        {conductors.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBusForReassign(null)}
                        className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl text-xs font-bold hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-xs font-bold hover:bg-indigo-500"
                      >
                        Save Assignment
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'buses' && (
          <div className="space-y-6">
            <Buses apiBaseUrl={API_BASE_URL} />
          </div>
        )}

        {activeTab === 'conductors_list' && (
          <div className="space-y-6">
            <Conductors apiBaseUrl={API_BASE_URL} />
          </div>
        )}

        {activeTab === 'routes' && (
          <div className="space-y-6">
            <RoutesPage apiBaseUrl={API_BASE_URL} />
          </div>
        )}

        {activeTab === 'cashback' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Loyalty, Cashback & Overdraft Controls</h2>
              <p className="text-xs text-slate-400">Configure real-time incentives for commuters and monthly pass holders.</p>
            </div>

            <form onSubmit={handleSaveFintechRules} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Default Cashback Percentage (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={cashbackRules.defaultCashbackPct}
                      onChange={(e) => setCashbackRules({ ...cashbackRules, defaultCashbackPct: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Percent className="w-4 h-4 text-slate-500 absolute right-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Minimum Spend Threshold (₹)</label>
                  <input
                    type="number"
                    min="10"
                    value={cashbackRules.minSpendAmount}
                    onChange={(e) => setCashbackRules({ ...cashbackRules, minSpendAmount: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-700/60 pt-6">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Festival / Special Offer Campaign</h3>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Festival Bonus Cashback (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={cashbackRules.festivalBonusPct}
                      onChange={(e) => setCashbackRules({ ...cashbackRules, festivalBonusPct: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2">Route-Specific Extra Reward (%)</label>
                    <input
                      type="number"
                      min="0"
                      value={cashbackRules.routeSpecificRule.extraCashbackPct}
                      onChange={(e) => setCashbackRules({
                        ...cashbackRules,
                        routeSpecificRule: { ...cashbackRules.routeSpecificRule, extraCashbackPct: Number(e.target.value) },
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700/60 pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Emergency Overdraft Trip (Wallet Balance)</h3>
                    <p className="text-xs text-slate-400">Allow regular commuters 1 emergency trip loan if wallet balance is low.</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={cashbackRules.isEmergencyCreditEnabled}
                    onChange={(e) => setCashbackRules({ ...cashbackRules, isEmergencyCreditEnabled: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all flex items-center space-x-2 shadow-lg shadow-indigo-600/30"
                >
                  <Save className="w-4 h-4" />
                  <span>Update Rules Live</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Conductor Shift Audit Trail</h2>
              <p className="text-xs text-slate-400">Immutable record of conductor shifts and bus assignments.</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-700/60">
                  <tr>
                    <th className="p-4">Bus ID</th>
                    <th className="p-4">Assigned Conductor</th>
                    <th className="p-4">Assigned By</th>
                    <th className="p-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {assignmentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 text-slate-200">
                      <td className="p-4 font-mono font-bold text-indigo-400">{log.busId}</td>
                      <td className="p-4 font-semibold">{log.assignedTo}</td>
                      <td className="p-4 text-xs text-slate-400">{log.assignedBy}</td>
                      <td className="p-4 text-xs font-mono text-slate-400">{log.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
