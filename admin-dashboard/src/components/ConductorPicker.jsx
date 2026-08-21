import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock, User, UserCheck } from 'lucide-react';

export default function ConductorPicker({
  conductors = [],
  buses = [],
  currentBusId = null,
  selectedConductorId = '',
  onChange,
  label = 'Current Assigned Conductor',
  allowUnassigned = true,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Process conductors with availability
  const processedConductors = conductors.map((c) => {
    const cId = c.conductor_id || c.id;
    const assignedOtherBus = buses.find(
      (b) =>
        (b.current_conductor_id === cId || b.current_conductor_id === c.name) &&
        (b.bus_id || b.id) !== currentBusId
    );
    return {
      ...c,
      cId,
      isBusy: !!assignedOtherBus,
      busyBusNumber: assignedOtherBus?.bus_number || assignedOtherBus?.bus_id || '',
    };
  });

  const availableConductors = processedConductors.filter((c) => !c.isBusy);
  const busyConductors = processedConductors.filter((c) => c.isBusy);

  const selectedConductor = processedConductors.find((c) => c.cId === selectedConductorId);

  const handleSelect = (cId) => {
    onChange(cId);
    setIsOpen(false);
  };

  return (
    <div className="space-y-1 relative" ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 bg-slate-800/90 border rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
            : 'border-slate-700/80 hover:border-slate-600'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          {selectedConductor ? (
            <>
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-white text-sm truncate">{selectedConductor.name}</span>
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                Selected
              </span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-400 text-sm font-medium">-- Unassigned / Reserve Pool --</span>
            </>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu (Compact & Scrollable without overflow) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto p-1.5 space-y-1 animate-fadeIn divide-y divide-slate-800/50">
          {/* Unassigned Option */}
          {allowUnassigned && (
            <div
              onClick={() => handleSelect('')}
              className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-all cursor-pointer ${
                !selectedConductorId
                  ? 'bg-indigo-600/20 text-white font-bold'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2 truncate">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>-- Unassigned / Reserve Pool --</span>
              </div>
              {!selectedConductorId && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
          )}

          {/* Group 1: Available Conductors */}
          <div className="pt-1 space-y-1">
            <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              🟢 Available ({availableConductors.length})
            </div>

            {availableConductors.length === 0 ? (
              <div className="px-3 py-1.5 text-center text-xs text-slate-500">
                No available conductors
              </div>
            ) : (
              availableConductors.map((c) => {
                const isSelected = c.cId === selectedConductorId;
                return (
                  <div
                    key={c.cId}
                    onClick={() => handleSelect(c.cId)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white font-bold border border-indigo-500/40'
                        : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <span className="font-semibold truncate">{c.name}</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full shrink-0 ml-2">
                      Available
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Group 2: Occupied / Disabled Conductors */}
          {busyConductors.length > 0 && (
            <div className="pt-1 space-y-1">
              <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-400">
                ⛔ Disabled / On Duty ({busyConductors.length})
              </div>

              {busyConductors.map((c) => (
                <div
                  key={c.cId}
                  className="px-3 py-2 rounded-lg flex items-center justify-between text-xs bg-slate-950/60 opacity-50 cursor-not-allowed select-none"
                >
                  <div className="flex items-center space-x-1.5 text-slate-400 truncate">
                    <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                    <span className="line-through decoration-rose-500/50 truncate">{c.name}</span>
                  </div>
                  <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full shrink-0 ml-2">
                    On {c.busyBusNumber}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
