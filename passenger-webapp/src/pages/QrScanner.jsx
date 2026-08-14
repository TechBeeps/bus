import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "react-qr-code";


export default function QrScanner() {
  const navigate = useNavigate();

  
  
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
     <header className="sticky top-0 z-30 bg-indigo-600 text-white shadow-lg">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
             
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/80">Passenger Journey</p>
              <h1 className="text-lg font-semibold">Instant Bus Ticket</h1>
            </div>
          </div>
          
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-md px-4 py-4 pb-24">

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Scan Bus QR Code
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Scan the QR code available inside the bus.
            </p>
          </div>

          {/* <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50">
            <div id="qr-reader" className="min-h-[320px]" />
          </div> */}

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex justify-center">
                <QRCode
                value="${config.API_URL}/bus/BUS001"
                size={250}
                />
              </div>
            </div>

          <button
            onClick={() => navigate("/bus/BUS001")}
            className="mt-5 w-full rounded-3xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white"
          >
            Continue Without Scan
          </button>

        </section>

      </main>

      {/* Footer */}
     <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xl md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3 text-sm text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">Ready to ride</p>
            <p className="text-xs text-slate-500">Scan, book, pay, and board in seconds.</p>
          </div>
          <div className="rounded-3xl bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
            Live</div>
        </div>
      </footer>
    </div>
  );
}