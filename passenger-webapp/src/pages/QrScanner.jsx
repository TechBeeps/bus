import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  QrCode as QrCodeIcon,
  Bus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  Upload,
  RefreshCw,
  SwitchCamera,
  AlertCircle,
  CheckCircle2,
  StopCircle,
} from "lucide-react";
import config from "../config";

export default function QrScanner() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("scanner"); // "scanner" | "show_qr"
  const [isScanning, setIsScanning] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState("environment"); // "environment" | "user"

  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

  const buses = [
    {
      id: "BUS001",
      busNo: "RJ14PA1234",
      route: "Bari Sadri → Udaipur",
      origin: "Bari Sadri",
      destination: "Udaipur",
    },
    {
      id: "BUS002",
      busNo: "RJ14PA5678",
      route: "Nimbahera → Udaipur",
      origin: "Nimbahera",
      destination: "Udaipur",
    },
    {
      id: "BUS003",
      busNo: "RJ14PA1212",
      route: "Neemuch → Udaipur",
      origin: "Neemuch",
      destination: "Udaipur",
    },
  ];

  const [selectedBus, setSelectedBus] = useState(buses[0]);

  // Handle scanned text or URL and navigate seamlessly
  const handleDecoded = (decodedText) => {
    if (!decodedText) return;

    try {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
      }
    } catch (e) {}

    // Stop scanning on success
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
    const matched = buses.find((b) => b.id.toLowerCase() === text.toLowerCase());
    if (matched) {
      navigate(`/bus/${matched.id}`);
      return;
    }

    alert(`Scanned: ${text}`);
  };

  // Start Camera Stream
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
        { facingMode: mode },
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
        "Camera permission denied or camera not found. You can allow camera access in browser settings or scan an image file."
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

  // Switch between front and back camera
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
      alert("No valid QR code found in this image. Please try another image or point your camera directly.");
    } finally {
      setCameraLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Auto-start camera when scanner tab is opened
  useEffect(() => {
    if (activeTab === "scanner") {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [activeTab]);

  const originUrl = typeof window !== "undefined" ? window.location.origin : config.BASE_URL;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-20">
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
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === "scanner"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Scan Bus QR</span>
          </button>

          <button
            onClick={() => setActiveTab("show_qr")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeTab === "show_qr"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <QrCodeIcon className="w-4 h-4" />
            <span>Show Bus QR</span>
          </button>
        </div>

        {/* TAB 1: CUSTOM HIGH-END LIVE QR SCANNER */}
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
                {/* Hidden / Active html5-qrcode video viewport container */}
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
                    <p className="text-xs font-semibold text-slate-200">Starting Camera...</p>
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
                      onClick={() => startScanner()}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Camera</span>
                    </button>
                  </div>
                )}

                {/* Idle / Stopped State */}
                {!isScanning && !cameraLoading && !cameraError && (
                  <div className="absolute inset-0 bg-slate-900/90 p-6 z-20 flex flex-col items-center justify-center text-center space-y-4 text-white">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Ready to Scan</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Click below to open camera</p>
                    </div>
                    <button
                      onClick={() => startScanner()}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Start Camera Scanner</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Controls Below Scanner */}
              <div className="flex items-center justify-center gap-3 pt-1">
                {isScanning ? (
                  <>
                    <button
                      onClick={toggleCamera}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <SwitchCamera className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Flip Camera</span>
                    </button>

                    <button
                      onClick={stopScanner}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <StopCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Stop Camera</span>
                    </button>
                  </>
                ) : null}

                {/* Upload Image Option */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Scan Image File</span>
                </button>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Instant Ticket Booking & Spend Milestones</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUS QR CODE POSTER & MANUAL SELECT */}
        {activeTab === "show_qr" && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5 text-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Select Bus QR Code</h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose any bus fleet to generate its live booking QR code or continue directly to payment.
              </p>
            </div>

            {/* Bus Select Dropdown */}
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Active Bus Fleet
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedBus.id}
                onChange={(e) => {
                  const b = buses.find((item) => item.id === e.target.value);
                  if (b) setSelectedBus(b);
                }}
              >
                {buses.map((bus) => (
                  <option key={bus.id} value={bus.id}>
                    {bus.id} — {bus.busNo} ({bus.route})
                  </option>
                ))}
              </select>
            </div>

            {/* Generated QR Code Card */}
            <div className="bg-slate-50 p-5 rounded-2xl shadow-inner inline-block border border-slate-200">
              <QRCode
                value={`${originUrl}/bus/${selectedBus.id}`}
                size={220}
                level="H"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-center space-x-1.5">
                <Bus className="w-4 h-4 text-indigo-600" />
                <span>{selectedBus.id} ({selectedBus.busNo})</span>
              </div>
              <div className="text-slate-500 text-[11px] font-mono">
                {selectedBus.route}
              </div>
            </div>

            {/* Direct Proceed Button */}
            <button
              onClick={() => navigate(`/bus/${selectedBus.id}`)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs uppercase tracking-wider"
            >
              <span>Book Ticket for {selectedBus.id}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Sticky Bottom Help Pill */}
      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between text-xs text-slate-700">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Scan QR or choose bus to start journey</span>
          </div>
          <span className="font-bold text-indigo-600">Fast & Cashless</span>
        </div>
      </footer>
    </div>
  );
}