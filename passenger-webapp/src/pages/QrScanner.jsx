import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  Bus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Upload,
  RefreshCw,
  SwitchCamera,
  AlertCircle,
  StopCircle,
  CheckCircle2,
  Search,
  X,
  Download,
} from "lucide-react";
import config from "../config";

const FALLBACK_BUSES = [
  {
    id: "BUS001",
    bus_id: "BUS001",
    bus_number: "RJ14PA1234",
    origin_city: "Bari Sadri",
    destination_city: "Udaipur",
    route: "Bari Sadri ➔ Udaipur",
    status: "ACTIVE",
  },
  {
    id: "BUS002",
    bus_id: "BUS002",
    bus_number: "RJ14PA5678",
    origin_city: "Nimbahera",
    destination_city: "Udaipur",
    route: "Nimbahera ➔ Udaipur",
    status: "ACTIVE",
  },
  {
    id: "BUS003",
    bus_id: "BUS003",
    bus_number: "RJ14PA1212",
    origin_city: "Neemuch",
    destination_city: "Udaipur",
    route: "Neemuch ➔ Udaipur",
    status: "ACTIVE",
  },
];

export default function QrScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner" | "manual_bus"
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // Always defaults to rear camera

  // Dynamic Buses & Search State
  const [buses, setBuses] = useState(FALLBACK_BUSES);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBus, setSelectedBus] = useState(FALLBACK_BUSES[0]);

  // Direct PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch dynamic bus fleet from backend API
  const fetchBuses = async () => {
    setLoadingBuses(true);
    try {
      const res = await axios.get(`${config.API_URL}/buses`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        setBuses(res.data);
        setSelectedBus(res.data[0]);
      }
    } catch (err) {
      console.warn("Could not load dynamic fleet, using defaults:", err);
    } finally {
      setLoadingBuses(false);
    }
  };

  useEffect(() => {
    fetchBuses();

    // Check if running as installed standalone PWA
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    const onPromptReady = () => {
      setDeferredPrompt(window.deferredPwaPrompt || window.pwaInstallPrompt);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.deferredPwaPrompt = null;
      window.pwaInstallPrompt = null;
    };

    if (window.deferredPwaPrompt || window.pwaInstallPrompt) {
      setDeferredPrompt(window.deferredPwaPrompt || window.pwaInstallPrompt);
    }

    window.addEventListener("pwa-prompt-ready", onPromptReady);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("pwa-prompt-ready", onPromptReady);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Direct 1-Click PWA Installation
  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.deferredPwaPrompt || window.pwaInstallPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
        window.deferredPwaPrompt = null;
        window.pwaInstallPrompt = null;
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    }
  };

  // Filtered buses (Search up to 50+ buses by ID, Number, Route, Origin, Destination)
  const filteredBuses = buses.filter((b) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const busId = (b.bus_id || b.id || "").toLowerCase();
    const busNo = (b.bus_number || b.busNo || "").toLowerCase();
    const origin = (b.origin_city || b.origin || "").toLowerCase();
    const dest = (b.destination_city || b.destination || "").toLowerCase();
    const route = (b.route || "").toLowerCase();
    return (
      busId.includes(q) ||
      busNo.includes(q) ||
      origin.includes(q) ||
      dest.includes(q) ||
      route.includes(q)
    );
  });

  // Handle scanned text or URL and navigate seamlessly
  const handleDecoded = (decodedText) => {
    if (!decodedText) return;

    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
    } catch (e) { }

    // Stop camera on successful scan
    stopScanner();

    const text = decodedText.trim();

    // 1. Full HTTP/HTTPS URL
    if (text.startsWith("http://") || text.startsWith("https://")) {
      try {
        const parsed = new URL(text);
        if (parsed.pathname) {
          navigate(parsed.pathname + parsed.search);
          return;
        }
      } catch (err) {
        window.location.href = text;
        return;
      }
    }

    // 2. Relative URL path like /bus/BUS001 or /ticket/PAY-123
    if (text.startsWith("/")) {
      navigate(text);
      return;
    }

    // 3. Raw Bus ID like BUS001
    if (text.toUpperCase().startsWith("BUS")) {
      navigate(`/bus/${text.toUpperCase()}`);
      return;
    }

    // 4. Fallback: Check if matches any bus ID
    const matched = buses.find(
      (b) => (b.bus_id || b.id || "").toLowerCase() === text.toLowerCase()
    );
    if (matched) {
      navigate(`/bus/${matched.bus_id || matched.id}`);
      return;
    }

    alert(`Scanned: ${text}`);
  };

  // Start Rear Camera Stream
  const startScanner = async (mode = facingMode) => {
    setCameraError(null);
    setCameraLoading(true);

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-camera-viewport");
      }

      await html5QrCodeRef.current.start(
        { facingMode: mode }, // Always opens rear camera by default ("environment")
        {
          fps: 12,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // ignore continuous scanning frame errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        "Camera permission denied or device camera not accessible. Please allow camera permissions or select a bus manually."
      );
      setIsScanning(false);
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop Camera Stream
  const stopScanner = async () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    } finally {
      setIsScanning(false);
      setCameraLoading(false);
    }
  };

  // Toggle Rear / Front Camera
  const toggleCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startScanner(nextMode);
  };

  // Scan QR from image file
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraLoading(true);
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode("qr-camera-viewport");
      }
      const decodedText = await html5QrCodeRef.current.scanFile(file, true);
      handleDecoded(decodedText);
    } catch (err) {
      alert("No valid QR code found in this image. Please try another image or select a bus manually.");
    } finally {
      setCameraLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Stop camera when user switches tabs or unmounts component
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-indigo-600 text-white shadow-lg px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 shadow-inner">
              <Bus className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/80 font-medium">Passenger Portal</p>
              <h1 className="text-lg font-bold">Instant Bus Ticket</h1>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-white text-xs font-bold font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-5 space-y-5">
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/70 shadow-inner">
          <button
            onClick={() => setActiveTab("scanner")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeTab === "scanner"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Bus QR</span>
          </button>

          <button
            onClick={() => {
              stopScanner();
              setActiveTab("manual_bus");
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${activeTab === "manual_bus"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
              }`}
          >
            <Bus className="w-4 h-4" />
            <span>Select Bus Manually</span>
          </button>
        </div>

        {/* TAB 1: LIVE QR CAMERA SCANNER */}
        {activeTab === "scanner" && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4 text-center">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Scan Bus QR Code</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Point camera at the QR code inside or outside the bus to start checkout.
                </p>
              </div>

              {/* Viewport Frame */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shadow-inner min-h-[300px] flex items-center justify-center">
                {/* Active html5-qrcode video viewport container */}
                <div id="qr-camera-viewport" className="w-full h-full min-h-[300px]" />

                {/* Laser Scanning Animation Overlay (When camera is live) */}
                {isScanning && (
                  <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
                    {/* Targeting Corner Brackets */}
                    <div className="w-56 h-56 relative border-2 border-transparent">
                      {/* Top-Left */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl shadow-sm" />
                      {/* Top-Right */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl shadow-sm" />
                      {/* Bottom-Left */}
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl shadow-sm" />
                      {/* Bottom-Right */}
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-indigo-400 rounded-br-xl shadow-sm" />

                      {/* Moving Laser Beam */}
                      <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-500 shadow-[0_0_12px_#6366f1] animate-scan-laser" />
                    </div>

                    {/* Instruction pill */}
                    <div className="absolute bottom-4 inset-x-0 flex justify-center">
                      <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-semibold border border-white/20">
                        Align QR Code inside box
                      </span>
                    </div>
                  </div>
                )}

                {/* Loading / Starting Indicator */}
                {cameraLoading && (
                  <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-white space-y-3">
                    <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-semibold text-slate-200">Opening Rear Camera...</p>
                  </div>
                )}

                {/* Camera Permission Denied / Error State */}
                {cameraError && !isScanning && !cameraLoading && (
                  <div className="absolute inset-0 bg-slate-900/90 p-6 z-20 flex flex-col items-center justify-center text-center space-y-3 text-white">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed px-2">
                      {cameraError}
                    </p>
                    <button
                      onClick={() => startScanner("environment")}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Allow Camera & Retry</span>
                    </button>
                  </div>
                )}

                {/* Idle / Click to Open Camera State */}
                {!isScanning && !cameraLoading && !cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 p-6 z-20 flex flex-col items-center justify-center text-center space-y-4 text-white">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Ready to Scan</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Click below to open rear camera</p>
                    </div>
                    <button
                      onClick={() => startScanner("environment")}
                      className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Open Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Icon-Only Action Controls Strip */}
              <div className="flex items-center justify-center gap-4 pt-1">
                {isScanning ? (
                  <>
                    {/* Flip Camera Icon Button */}
                    <button
                      onClick={toggleCamera}
                      className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95"
                      title="Flip Camera (Rear / Front)"
                    >
                      <SwitchCamera className="w-5 h-5 text-indigo-600" />
                    </button>

                    {/* Stop Camera Icon Button */}
                    <button
                      onClick={stopScanner}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95"
                      title="Stop Camera Scanner"
                    >
                      <StopCircle className="w-5 h-5 text-rose-600" />
                    </button>
                  </>
                ) : (
                  /* Start Camera Icon Button when stopped */
                  <button
                    onClick={() => startScanner("environment")}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95"
                    title="Open Camera"
                  >
                    <Camera className="w-5 h-5 text-indigo-600" />
                  </button>
                )}

                {/* Upload Image Icon Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-full transition-all cursor-pointer shadow-sm hover:scale-110 active:scale-95"
                  title="Scan QR from Gallery Image"
                >
                  <Upload className="w-5 h-5 text-indigo-600" />
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant Ticket Booking & Spend Milestones</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SELECT BUS MANUALLY (DYNAMIC FLEET, SEARCH & 50+ BUSES SCALABLE) */}
        {activeTab === "manual_bus" && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Bus className="w-5 h-5 text-indigo-600" />
                  <span>Select Bus Fleet</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pick any active bus from the fleet to book tickets directly.
                </p>
              </div>

              <button
                onClick={fetchBuses}
                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Refresh Bus Fleet"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBuses ? "animate-spin text-indigo-600" : ""}`} />
              </button>
            </div>

            {/* Search Input Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by bus ID, number, city, or route..."
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Fleet Counter Pill */}
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 px-1">
              <span>
                Showing <strong className="text-indigo-600 font-bold">{filteredBuses.length}</strong> of {buses.length} Buses
              </span>
              {selectedBus && (
                <span className="font-mono text-slate-600">
                  Selected: <strong className="text-indigo-600">{selectedBus.bus_id || selectedBus.id}</strong>
                </span>
              )}
            </div>

            {/* Scrollable Bus Fleet List (Optimized for 50+ Buses) */}
            <div className="max-h-[380px] overflow-y-auto pr-1 space-y-2.5">
              {loadingBuses ? (
                <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p>Loading active bus fleet...</p>
                </div>
              ) : filteredBuses.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <Bus className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-600">No buses found</p>
                  <p className="text-[11px] text-slate-400">
                    No active bus matches "{searchQuery}". Try another city or bus ID.
                  </p>
                </div>
              ) : (
                filteredBuses.map((bus) => {
                  const bId = bus.bus_id || bus.id;
                  const isSelected = (selectedBus?.bus_id || selectedBus?.id) === bId;
                  const bNo = bus.bus_number || bus.busNo || "Fleet Bus";
                  const origin = bus.origin_city || bus.origin || "Origin";
                  const dest = bus.destination_city || bus.destination || "Destination";

                  return (
                    <div
                      key={bId}
                      onClick={() => setSelectedBus(bus)}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${isSelected
                          ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50"
                        }`}
                    >
                      <div className="space-y-1 flex-1 pr-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                            {bId}
                          </span>
                          <span className="font-mono font-bold text-xs text-slate-800">{bNo}</span>
                        </div>

                        <div className="font-bold text-xs text-slate-900 flex items-center space-x-1.5 pt-0.5">
                          <span>{origin}</span>
                          <span className="text-indigo-500 font-bold">➔</span>
                          <span>{dest}</span>
                        </div>

                        {bus.conductor_name && bus.conductor_name !== "Unassigned" && (
                          <div className="text-[10px] text-slate-500 font-medium">
                            Conductor: {bus.conductor_name}
                          </div>
                        )}
                      </div>

                      <div className="pl-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white"
                            }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Sticky Action Button */}
            {selectedBus && (
              <button
                onClick={() => navigate(`/bus/${selectedBus.bus_id || selectedBus.id}`)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] mt-2"
              >
                <span>Proceed to Book Ticket ({selectedBus.bus_id || selectedBus.id})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* BOTTOM DIRECT PWA INSTALL CARD */}
        {!isInstalled && (
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-3xl p-4 shadow-lg flex items-center justify-between gap-3 border border-indigo-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white shrink-0 shadow-inner overflow-hidden">
                <img
                  src="/logo192.png"
                  alt="App Logo"
                  className="w-8 h-8 rounded-lg object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <Bus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Install Shree Mateshwari</h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">Add shortcut directly to home screen</p>
              </div>
            </div>

            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-indigo-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md cursor-pointer shrink-0 transition-transform active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          </div>
        )}
      </main>


    </div>
  );
}