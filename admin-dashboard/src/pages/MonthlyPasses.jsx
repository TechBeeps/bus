import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  PlusCircle,
  Search,
  IndianRupee,
  Phone,
  User,
  CheckCircle2,
  X,
  Save,
  ArrowRight,
  Edit2,
  Trash2,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Eye,
  Navigation,
  Clock,
  Compass,
} from 'lucide-react';
import {
  getAdminMonthlyPasses,
  createAdminMonthlyPass,
  updateAdminMonthlyPass,
  deleteAdminMonthlyPass,
  getCities,
} from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { formatDateTime } from '../utils/dateFormatter';

export default function MonthlyPasses() {
  const [passes, setPasses] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPass, setEditingPass] = useState(null);
  const [viewingPass, setViewingPass] = useState(null);
  const [submitting, setSubmitting] = useState(false);


  const [form, setForm] = useState({
    name: '',
    mobile: '',
    origin_city: '',
    destination_city: '',
    amount: 1000,
    total_rides: 62,
    used_rides: 0,
    pin: '',
    status: 'ACTIVE',
  });

  const showToast = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [passRes, cityRes] = await Promise.all([
        getAdminMonthlyPasses(),
        getCities(),
      ]);
      setPasses(Array.isArray(passRes.data) ? passRes.data : []);
      setCities(Array.isArray(cityRes.data) ? cityRes.data : []);
    } catch (err) {
      showToast?.('Failed to load monthly passes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingPass(null);
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    const defaultOrigin = cities.length > 0 ? cities[0].name : 'Bari Sadri';
    const defaultDest =
      cities.length > 1 ? cities[1].name : cities[0]?.name || 'Udaipur';

    setForm({
      name: '',
      mobile: '',
      origin_city: defaultOrigin,
      destination_city: defaultDest,
      amount: 1000,
      total_rides: 62,
      used_rides: 0,
      pin: randomPin,
      status: 'ACTIVE',
    });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingPass(p);
    const orig =
      p.origin_city ||
      p.route?.split('➔')[0]?.trim() ||
      cities[0]?.name ||
      'Bari Sadri';
    const dest =
      p.destination_city ||
      p.route?.split('➔')[1]?.trim() ||
      cities[1]?.name ||
      'Udaipur';

    setForm({
      name: p.name || '',
      mobile: p.mobile || '',
      origin_city: orig,
      destination_city: dest,
      amount: parseFloat(p.amount) || 1000,
      total_rides: parseInt(p.total_rides) || 62,
      used_rides: parseInt(p.used_rides) || 0,
      pin: p.pin || '1234',
      status: p.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.mobile.trim()) {
      showToast?.('Name and Mobile Number are required');
      return;
    }
    if (!form.origin_city || !form.destination_city) {
      showToast?.('Please select Origin and Destination cities');
      return;
    }
    if (form.origin_city === form.destination_city) {
      showToast?.('Origin and Destination cannot be the same city');
      return;
    }

    setSubmitting(true);
    try {
      const defaultAdminLocation = {
        lat: 24.571271,
        lng: 73.691544,
        address: 'Bus Operator Head Office, City Bus Station, Udaipur, Rajasthan 313001, India',
        timestamp: Date.now(),
      };

      const payload = {
        ...form,
        route: `${form.origin_city} ➔ ${form.destination_city}`,
        remaining_rides: Math.max(0, form.total_rides - form.used_rides),
        location: editingPass?.location || defaultAdminLocation,
      };


      if (editingPass) {
        await updateAdminMonthlyPass(
          editingPass.pass_id || editingPass.id,
          payload
        );
        showToast?.(`Monthly pass for ${form.name} updated successfully!`);
      } else {
        await createAdminMonthlyPass(payload);
        showToast?.(`Monthly pass for ${form.name} issued successfully!`);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      const msg =
        err.response?.data?.detail || 'Failed to save monthly pass';
      showToast?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    if (
      !window.confirm(
        `Are you sure you want to delete pass "${p.pass_id}" for ${p.name}?`
      )
    )
      return;
    try {
      await deleteAdminMonthlyPass(p.pass_id || p.id);
      showToast?.(`Pass ${p.pass_id} deleted successfully`);
      setPasses((prev) =>
        prev.filter((item) => (item.pass_id || item.id) !== (p.pass_id || p.id))
      );
    } catch (err) {
      showToast?.('Failed to delete monthly pass');
    }
  };

  // Helper to extract location details safely
  const extractLocationInfo = (p) => {
    let address = p.address || '';
    let lat = p.lat || null;
    let lng = p.lng || null;
    let timestamp = null;

    if (!address && p.location) {
      if (typeof p.location === 'string' && p.location.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(p.location);
          address = parsed.address || '';
          lat = parsed.lat || null;
          lng = parsed.lng || null;
          timestamp = parsed.timestamp || null;
        } catch (e) {
          address = p.location;
        }
      } else if (typeof p.location === 'object' && p.location !== null) {
        address = p.location.address || '';
        lat = p.location.lat || null;
        lng = p.location.lng || null;
        timestamp = p.location.timestamp || null;
      } else {
        address = p.location;
      }
    }

    if (p.location_data) {
      if (!address && p.location_data.address) address = p.location_data.address;
      if (!lat && p.location_data.lat) lat = p.location_data.lat;
      if (!lng && p.location_data.lng) lng = p.location_data.lng;
      if (!timestamp && p.location_data.timestamp)
        timestamp = p.location_data.timestamp;
    }

    return { address, lat, lng, timestamp };
  };

  const filteredPasses = passes.filter((p) => {
    const loc = extractLocationInfo(p);
    const s = search.toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(s)) ||
      (p.mobile && p.mobile.includes(s)) ||
      (p.pass_id && p.pass_id.toLowerCase().includes(s)) ||
      (p.origin_city && p.origin_city.toLowerCase().includes(s)) ||
      (p.destination_city && p.destination_city.toLowerCase().includes(s)) ||
      (p.route && p.route.toLowerCase().includes(s)) ||
      (loc.address && loc.address.toLowerCase().includes(s))
    );
  });

  const totalActivePasses = passes.filter((p) => p.status === 'ACTIVE').length;
  const totalRevenue = passes.reduce(
    (acc, p) => acc + (parseFloat(p.amount) || 0),
    0
  );
  const totalUsedRides = passes.reduce(
    (acc, p) => acc + (parseInt(p.used_rides) || 0),
    0
  );
  const passesWithLocation = passes.filter((p) => {
    const loc = extractLocationInfo(p);
    return loc.address || loc.lat;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <CreditCard className="w-6 h-6 text-indigo-400" />
            <span>Monthly Pass Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Issue, monitor, and edit passenger monthly passes with route access, rides tracking, security PIN, and purchase location details.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Monthly Pass</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pass Revenue
            </p>
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
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Passes
            </p>
            <h3 className="text-2xl font-black text-indigo-400 mt-1">
              {totalActivePasses}
            </h3>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Rides Used
            </p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">
              {totalUsedRides}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Passes Redeemed by Passengers
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Geo-Tagged Passes
            </p>
            <h3 className="text-2xl font-black text-cyan-400 mt-1">
              {passesWithLocation}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              With Purchase GPS & Address
            </p>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, route, address, location..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium">
          Total Passes: <span className="text-white font-bold">{passes.length}</span>
        </div>
      </div>

      {/* Passes Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
            Loading monthly passes...
          </div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
            <p className="text-sm font-medium">No monthly passes found.</p>
            <p className="text-xs mt-1">
              Click "Add New Monthly Pass" above to issue a pass.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4">Pass ID</th>
                  <th className="p-4">Passenger Details</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">PIN</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Rides Usage</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Issued On</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredPasses.map((p) => {
                  const used = parseInt(p.used_rides) || 0;
                  const total = parseInt(p.total_rides) || 62;
                  const remaining =
                    parseInt(p.remaining_rides) || total - used;
                  const pct = Math.min(
                    100,
                    Math.max(0, Math.round((remaining / total) * 100))
                  );
                  const loc = extractLocationInfo(p);

                  return (
                    <tr
                      key={p.id || p.pass_id}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Pass ID */}
                      <td className="p-4 font-mono font-bold text-xs text-indigo-400">
                        {p.pass_id}
                      </td>

                      {/* Passenger Details */}
                      <td className="p-4 space-y-1">
                        <div className="font-bold text-white flex items-center space-x-1.5">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{p.name}</span>
                          {/* Geo-tag indicator icon if address exists */}
                          {loc.address || loc.lat ? (
                            <span
                              onClick={() => setViewingPass(p)}
                              className="inline-flex items-center space-x-0.5 text-[10px] bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 px-1.5 py-0.2 rounded cursor-pointer hover:bg-cyan-900/80 transition-colors"
                              title={`Purchased from: ${loc.address || 'GPS Coordinates captured'}`}
                            >
                              <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                              <span>GPS</span>
                            </span>
                          ) : null}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.mobile}</span>
                        </div>
                      </td>

                      {/* Route */}
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 font-semibold text-xs text-white">
                          <span>
                            {p.origin_city ||
                              p.route?.split('➔')[0] ||
                              'Origin'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-indigo-400" />
                          <span>
                            {p.destination_city ||
                              p.route?.split('➔')[1] ||
                              'Destination'}
                          </span>
                        </div>
                      </td>

                      {/* PIN */}
                      <td className="p-4 font-mono text-xs font-bold text-indigo-300">
                        <span className="bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                          {p.pin}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-mono font-bold text-emerald-400 text-sm">
                        ₹{(parseFloat(p.amount) || 1000).toFixed(2)}
                      </td>

                      {/* Rides Usage */}
                      <td className="p-4">
                        <div className="space-y-1.5 w-36">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-emerald-400">
                              {remaining} Left
                            </span>
                            <span className="text-purple-400">
                              {used} Used
                            </span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{p.status || 'ACTIVE'}</span>
                        </span>
                      </td>

                      {/* Issued On */}
                      <td className="p-4 text-xs text-slate-300 font-mono">
                        {formatDateTime(p.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center space-x-2">
                          <button
                            onClick={() => setViewingPass(p)}
                            className="p-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/40 rounded-lg text-indigo-300 transition-colors cursor-pointer"
                            title="View Full Pass & Location Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors cursor-pointer"
                            title="Edit Monthly Pass"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            className="p-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 rounded-lg text-rose-400 transition-colors cursor-pointer"
                            title="Delete Monthly Pass"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Pass & Location Details Modal */}
      {viewingPass && (() => {
        const loc = extractLocationInfo(viewingPass);
        const used = parseInt(viewingPass.used_rides) || 0;
        const total = parseInt(viewingPass.total_rides) || 62;
        const remaining =
          parseInt(viewingPass.remaining_rides) || total - used;
        const pct = Math.min(
          100,
          Math.max(0, Math.round((remaining / total) * 100))
        );

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/20">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Monthly Pass Details
                    </h3>
                    <p className="text-xs font-mono text-indigo-400">
                      {viewingPass.pass_id}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingPass(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Location & Address Section (Highlight) */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-cyan-500/30 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <MapPin className="w-4 h-4" />
                    <span>Purchase Location & Address</span>
                  </div>
                  {loc.lat && loc.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open in Google Maps</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                </div>

                {loc.address || loc.lat ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Full Address Captured:
                      </p>
                      <p className="text-sm font-medium text-white leading-relaxed">
                        {loc.address || 'Address coordinates recorded'}
                      </p>
                    </div>

                    {loc.timestamp && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 pl-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Captured At:{' '}
                          {new Date(Number(loc.timestamp)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs bg-slate-900/60 rounded-xl border border-slate-800">
                    <Compass className="w-6 h-6 mx-auto mb-1 opacity-40 text-slate-500" />
                    <span>No GPS location or address was recorded for this pass.</span>
                  </div>
                )}
              </div>

              {/* Passenger & Pass Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <p className="text-slate-400 font-semibold mb-1">
                    Passenger Name
                  </p>
                  <p className="text-white font-bold text-sm">
                    {viewingPass.name}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <p className="text-slate-400 font-semibold mb-1">
                    Mobile Number
                  </p>
                  <p className="text-white font-bold text-sm">
                    {viewingPass.mobile}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <p className="text-slate-400 font-semibold mb-1">
                    Security PIN
                  </p>
                  <p className="text-indigo-400 font-mono font-bold text-sm">
                    {viewingPass.pin}
                  </p>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl sm:col-span-2">
                  <p className="text-slate-400 font-semibold mb-1">
                    Designated Route
                  </p>
                  <div className="flex items-center space-x-1.5 font-bold text-white text-sm">
                    <span>
                      {viewingPass.origin_city ||
                        viewingPass.route?.split('➔')[0] ||
                        'Origin'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {viewingPass.destination_city ||
                        viewingPass.route?.split('➔')[1] ||
                        'Destination'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                  <p className="text-slate-400 font-semibold mb-1">Pass Amount</p>
                  <p className="text-emerald-400 font-mono font-bold text-sm">
                    ₹{(parseFloat(viewingPass.amount) || 1000).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Rides Progress Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">Rides Utilization</span>
                  <div className="space-x-2">
                    <span className="text-emerald-400">
                      {remaining} Remaining
                    </span>
                    <span className="text-purple-400">
                      ({used} / {total} Used)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setViewingPass(null);
                    openEditModal(viewingPass);
                  }}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingPass(null)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Issue / Edit Monthly Pass Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-indigo-400" />
                <span>
                  {editingPass
                    ? 'Edit Monthly Pass'
                    : 'Issue New Monthly Pass'}
                </span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Passenger Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Ramesh Chandra"
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={form.mobile}
                  onChange={(e) =>
                    setForm({ ...form, mobile: e.target.value })
                  }
                  placeholder="e.g. 9829012345"
                  className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Origin & Destination Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Origin City (Start) *
                  </label>
                  <select
                    required
                    value={form.origin_city}
                    onChange={(e) =>
                      setForm({ ...form, origin_city: e.target.value })
                    }
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Origin City</option>
                    {cities.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Destination City (End) *
                  </label>
                  <select
                    required
                    value={form.destination_city}
                    onChange={(e) =>
                      setForm({ ...form, destination_city: e.target.value })
                    }
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Destination City</option>
                    {cities.map((c) => (
                      <option
                        key={c.id || c.name}
                        value={c.name}
                        disabled={c.name === form.origin_city}
                      >
                        {c.name}{' '}
                        {c.name === form.origin_city ? '(Same as Origin)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Pass Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    required
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Total Rides
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.total_rides}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        total_rides: parseInt(e.target.value) || 62,
                      })
                    }
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Security PIN
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value })}
                    placeholder="4 digits"
                    className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {!editingPass && (
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start space-x-2.5 text-xs">
                  <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Default Issue Location & Address:
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bus Operator Head Office, City Bus Station, Udaipur, Rajasthan 313001, India
                    </p>
                  </div>
                </div>
              )}


              {editingPass && (
                <>
                  {/* If pass has location, show read-only location card in edit modal */}
                  {(() => {
                    const loc = extractLocationInfo(editingPass);
                    if (loc.address || loc.lat) {
                      return (
                        <div className="p-3 bg-slate-950/60 border border-cyan-500/20 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Registered Purchase Address & Location</span>
                          </div>
                          <p className="text-slate-300 text-xs pl-5">
                            {loc.address || `${loc.lat}, ${loc.lng}`}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Rides Used (Auto-Tracked)
                      </label>
                      <div className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-purple-300 text-sm font-mono font-bold flex items-center justify-between">
                        <span>{form.used_rides} Rides Used</span>
                        <span className="text-[11px] text-emerald-400 font-semibold">
                          {Math.max(0, form.total_rides - form.used_rides)}{' '}
                          Remaining
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Automatically counted when passenger redeems pass.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Pass Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                        className="w-full p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

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
                  <span>
                    {submitting
                      ? 'Saving...'
                      : editingPass
                      ? 'Update Monthly Pass'
                      : 'Issue Monthly Pass'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
