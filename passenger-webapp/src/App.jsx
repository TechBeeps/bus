import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import './App.css';


import {
  QrCode,
  Ticket as TicketIcon,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Bus,
  ArrowRight
} from 'lucide-react';


import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import QrScanner from "./pages/QrScanner";
import BusPayment from "./pages/BusPayment";
import MonthlyPlan from "./pages/MonthlyPlan";
import TicketSuccess from "./pages/TicketSuccess";
import MonthlyPassResult from "./pages/MonthlyPassResult";


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
// hi g
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<QrScanner />} />

        <Route
          path="/bus/:busId"
          element={<BusPayment />}
        />
        <Route path="/ticket/:paymentId" element={<TicketSuccess />} />
        <Route path="/monthly-plan/:busId" element={<MonthlyPlan />} />
        <Route path="/monthly-pass-result" element={<MonthlyPassResult />} />
      </Routes>

    </BrowserRouter>
  );
}

export default App;

// export default function PassengerApp() {
//   const [scannedBusId, setScannedBusId] = useState(null);
//   const [originStop, setOriginStop] = useState('');
//   const [destinationStop, setDestinationStop] = useState('');
//   const [passengerCount, setPassengerCount] = useState(1);
//   const [farePerTicket] = useState(20);
//   const [passengerPhone, setPassengerPhone] = useState('');
//   const [ticketData, setTicketData] = useState(null);
//   const [paymentStatus, setPaymentStatus] = useState('IDLE');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   const STOPS = ['Central Bus Stand', 'Market Junction', 'Tech Park', 'City Hospital', 'Terminal Stop'];

//   useEffect(() => {
//     if (!scannedBusId) {
//       const scanner = new Html5QrcodeScanner(
//         'qr-reader',
//         { fps: 10, qrbox: { width: 250, height: 250 } },
//         false
//       );

//       scanner.render(
//         (decodedText) => {
//           const busId = decodedText.includes('/bus/')
//             ? decodedText.split('/bus/')[1]
//             : decodedText;
//           setScannedBusId(busId);
//           scanner.clear();
//         },
//         () => {
//           // Ignore read errors to keep scanning active
//         }
//       );

//       return () => {
//         scanner.clear().catch(() => {});
//       };
//     }
//   }, [scannedBusId]);

//   useEffect(() => {
//     let intervalId;
//     if (ticketData?.ticket_id && paymentStatus === 'PENDING') {
//       intervalId = setInterval(async () => {
//         try {
//           const res = await axios.get(`${API_BASE_URL}/tickets/${ticketData.ticket_id}/status`);
//           if (res.data.status === 'PAID') {
//             setPaymentStatus('PAID');
//             setTicketData(res.data);
//             clearInterval(intervalId);
//           }
//         } catch (err) {
//           console.error('Polling error:', err);
//         }
//       }, 3000);
//     }
//     return () => clearInterval(intervalId);
//   }, [ticketData, paymentStatus]);

//   const handleInitiatePayment = async (e) => {
//     e.preventDefault();
//     if (!originStop || !destinationStop) {
//       setError('Please select origin and destination stops.');
//       return;
//     }
//     if (originStop === destinationStop) {
//       setError('Origin and destination cannot be the same.');
//       return;
//     }

//     setLoading(true);
//     setError(null);

//     const totalAmount = passengerCount * farePerTicket;

//     try {
//       const response = await axios.post(`${API_BASE_URL}/tickets/create`, {
//         bus_id: scannedBusId,
//         route_id: 'ROUTE-01',
//         origin_stop: originStop,
//         destination_stop: destinationStop,
//         passenger_count: passengerCount,
//         total_amount: totalAmount,
//         passenger_phone: passengerPhone || null
//       });

//       const data = response.data;
//       setTicketData(data);
//       setPaymentStatus('PENDING');
//       window.location.href = data.upi_intent_url;
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Failed to initialize payment. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
//       <header className="sticky top-0 z-30 bg-indigo-600 text-white shadow-lg">
//         <div className="mx-auto flex max-w-md items-center justify-between px-4 py-4 md:px-6">
//           <div className="flex items-center gap-3">
//             <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
//               <Bus className="h-6 w-6 text-white" />
//             </div>
//             <div>
//               <p className="text-xs uppercase tracking-[0.24em] text-indigo-100/80">Passenger Journey</p>
//               <h1 className="text-lg font-semibold">Instant Bus Ticket</h1>
//             </div>
//           </div>
//           {scannedBusId && (
//             <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
//               Bus: {scannedBusId}
//             </span>
//           )}
//         </div>
//       </header>

//       <main className="mx-auto max-w-md px-4 pb-28 pt-4 md:px-6 md:pb-10">
//         {!scannedBusId && (
//           <section className="app-panel mb-4">
//             <div className="flex flex-col items-center gap-3 text-center">
//               <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
//                 <QrCode className="h-8 w-8" />
//               </div>
//               <div>
//                 <h2 className="text-xl font-semibold text-slate-900">Scan Bus QR Code</h2>
//                 <p className="mt-1 text-sm text-slate-500">
//                   Point your camera at the QR sticker inside the bus to begin booking.
//                 </p>
//               </div>
//             </div>
//             <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-sm">
//               <div id="qr-reader" className="min-h-[320px]" />
//             </div>
//           </section>
//         )}

//         {scannedBusId && paymentStatus === 'IDLE' && (
//           <form onSubmit={handleInitiatePayment} className="space-y-4">
//             <section className="app-panel space-y-5">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-11 w-11 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
//                   <TicketIcon className="h-5 w-5" />
//                 </div>
//                 <div>
//                   <h2 className="text-lg font-semibold text-slate-900">Select Trip Details</h2>
//                   <p className="text-sm text-slate-500">Choose stops and passenger count before payment.</p>
//                 </div>
//               </div>

//               {error && (
//                 <div className="rounded-3xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
//                   <div className="flex items-start gap-2">
//                     <AlertCircle className="mt-0.5 h-4 w-4" />
//                     <p>{error}</p>
//                   </div>
//                 </div>
//               )}

//               <div className="grid gap-4">
//                 <div>
//                   <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Boarding</label>
//                   <select
//                     value={originStop}
//                     onChange={(e) => setOriginStop(e.target.value)}
//                     className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-200"
//                     required
//                   >
//                     <option value="">Select Boarding Stop</option>
//                     {STOPS.map((stop) => (
//                       <option key={stop} value={stop}>{stop}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Dropping</label>
//                   <select
//                     value={destinationStop}
//                     onChange={(e) => setDestinationStop(e.target.value)}
//                     className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-200"
//                     required
//                   >
//                     <option value="">Select Destination Stop</option>
//                     {STOPS.map((stop) => (
//                       <option key={stop} value={stop}>{stop}</option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Passengers</label>
//                   <div className="grid grid-cols-5 gap-2">
//                     {[1, 2, 3, 4, 5].map((count) => (
//                       <button
//                         type="button"
//                         key={count}
//                         onClick={() => setPassengerCount(count)}
//                         className={`rounded-3xl border px-3 py-2 text-sm font-semibold transition ${
//                           passengerCount === count
//                             ? 'border-indigo-600 bg-indigo-600 text-white'
//                             : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
//                         }`}
//                       >
//                         {count}
//                       </button>
//                     ))}
//                   </div>
//                 </div>

//                 <div>
//                   <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Mobile number (optional)</label>
//                   <input
//                     type="tel"
//                     placeholder="Enter 10-digit number"
//                     maxLength={10}
//                     value={passengerPhone}
//                     onChange={(e) => setPassengerPhone(e.target.value)}
//                     className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-transparent transition focus:border-indigo-500 focus:ring-indigo-200"
//                   />
//                 </div>
//               </div>
//             </section>

//             <section className="app-panel flex flex-col gap-4 rounded-3xl p-5 shadow-sm md:flex-row md:items-center md:justify-between">
//               <div>
//                 <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Total fare</p>
//                 <p className="mt-1 text-3xl font-bold text-slate-900">₹{passengerCount * farePerTicket}</p>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="inline-flex items-center justify-center rounded-3xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200/40 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 <span>{loading ? 'Processing...' : 'Pay via UPI'}</span>
//                 <ArrowRight className="ml-2 h-5 w-5" />
//               </button>
//             </section>
//           </form>
//         )}

//         {paymentStatus === 'PENDING' && (
//           <section className="app-panel text-center space-y-4">
//             <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
//             <div>
//               <h3 className="text-lg font-semibold text-slate-900">Awaiting Bank Verification</h3>
//               <p className="mt-2 text-sm text-slate-500">
//                 Complete the payment in your UPI app. This ticket will automatically update once verified.
//               </p>
//             </div>
//             <div className="rounded-3xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
//               <div className="flex items-center justify-center gap-2">
//                 <Clock className="h-4 w-4" />
//                 <span>Verifying server webhook... Do not close or refresh this tab.</span>
//               </div>
//             </div>
//           </section>
//         )}

//         {paymentStatus === 'PAID' && ticketData && (
//           <section className="app-panel overflow-hidden rounded-[32px] shadow-xl">
//             <div className="bg-emerald-600 px-6 py-5 text-center text-white">
//               <CheckCircle2 className="mx-auto mb-3 h-10 w-10" />
//               <h2 className="text-xl font-semibold">Payment Verified</h2>
//               <p className="mt-1 text-sm text-emerald-100">Valid for travel on Bus #{ticketData.bus_id}</p>
//             </div>

//             <div className="bg-emerald-50 px-4 py-3 text-center border-b border-emerald-100 flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">
//               <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
//               Live Dynamic Verification Ticket
//             </div>

//             <div className="space-y-4 p-6">
//               <div className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm sm:grid-cols-2">
//                 <div>
//                   <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Ticket ID</p>
//                   <p className="mt-1 font-mono text-sm font-semibold text-slate-900">{ticketData.ticket_id}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-xs uppercase tracking-[0.16em] text-slate-400">UPI TXN ID</p>
//                   <p className="mt-1 font-mono text-sm font-semibold text-slate-600">{ticketData.upi_txn_id || 'N/A'}</p>
//                 </div>
//               </div>

//               <div className="grid gap-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 sm:grid-cols-2">
//                 <div className="space-y-2">
//                   <p className="uppercase tracking-[0.14em] text-slate-500">From</p>
//                   <p className="font-semibold text-slate-900">{ticketData.origin}</p>
//                 </div>
//                 <div className="space-y-2">
//                   <p className="uppercase tracking-[0.14em] text-slate-500">To</p>
//                   <p className="font-semibold text-slate-900">{ticketData.destination}</p>
//                 </div>
//                 <div className="space-y-2">
//                   <p className="uppercase tracking-[0.14em] text-slate-500">Passengers</p>
//                   <p className="font-semibold text-slate-900">{ticketData.passenger_count} Person(s)</p>
//                 </div>
//                 <div className="space-y-2">
//                   <p className="uppercase tracking-[0.14em] text-slate-500">Total Paid</p>
//                   <p className="font-semibold text-emerald-600">₹{ticketData.amount}</p>
//                 </div>
//               </div>

//               <div className="rounded-3xl bg-white p-4 text-center shadow-sm">
//                 <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs text-slate-600">
//                   <ShieldCheck className="h-4 w-4 text-emerald-600" />
//                   Conductor notified via real-time push alert
//                 </div>
//               </div>
//             </div>
//           </section>
//         )}
//       </main>

//       <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md shadow-xl md:hidden">
//         <div className="mx-auto flex max-w-md items-center justify-between gap-3 text-sm text-slate-700">
//           <div>
//             <p className="font-semibold text-slate-900">Ready to ride</p>
//             <p className="text-xs text-slate-500">Scan, book, pay, and board in seconds.</p>
//           </div>
//           <div className="rounded-3xl bg-indigo-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
//             Live</div>
//         </div>
//       </footer>
//     </div>
//   );
// }
