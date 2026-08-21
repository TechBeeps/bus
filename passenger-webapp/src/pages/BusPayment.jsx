import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../config";

export default function BusPayment() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [mobile, setMobile] = useState("");
  const [paying, setPaying] = useState(false);
  const [usingPass, setUsingPass] = useState(false);

  const [tab, setTab] = useState("one-time");
  const [pin, setPin] = useState("");

  const validateMobile = () => {
    const mobileRegex = /^[6-9]\d{9}$/;

    if (!mobile) {
      alert("Please enter mobile number");
      return false;
    }

    if (!mobileRegex.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number");
      return false;
    }

    return true;
  };

  // handle one-time payment with multi-click prevention
  const handlePay = async () => {
    if (paying) return;

    if (!validateMobile()) {
      return;
    }

    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid fare amount");
      return;
    }

    setPaying(true);

    try {
      const response = await axios.post(
        `${config.API_URL}/payment/order`,
        {
          bus_id: busId,
          amount: Number(amount),
          mobile: mobile,
        }
      );

      const data = response.data;

      const options = {
        key: data.key,
        amount: Number(amount) * 100,
        currency: "INR",
        name: "Bus Ticket",
        description: "Bus Fare",
        order_id: data.razorpay_order_id,

        handler: async function (response) {
          try {
            await axios.post(
              `${config.API_URL}/payment/success`,
              {
                payment_id: data.payment_id,
                razorpay_payment_id: response.razorpay_payment_id
              }
            );
          } catch (e) {
            console.error("Payment success recording error:", e);
          }
          navigate(`/ticket/${data.payment_id}`);
        },

        modal: {
          ondismiss: async function () {
            setPaying(false);
            try {
              await axios.post(
                `${config.API_URL}/payment/update-status`,
                {
                  payment_id: data.payment_id,
                  status: "CANCELLED"
                }
              );
            } catch (e) {}
            navigate(`/ticket/${data.payment_id}`);
          }
        }
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", async function (response) {
        console.log("PAYMENT FAILED", response);
        setPaying(false);
        try {
          await axios.post(
            `${config.API_URL}/payment/update-status`,
            {
              payment_id: data.payment_id,
              status: "FAILED",
            }
          );
        } catch (error) {
          console.error("Failed status update:", error);
        }
        navigate(`/ticket/${data.payment_id}`);
      });

      rzp.open();

    } catch (error) {
      console.error(error);
      alert("Unable to create payment. Please try again.");
      setPaying(false);
    }
  };

  // handle monthly pass usage with multi-click prevention
  const handleMonthlyPass = async () => {
    if (usingPass) return;

    if (!validateMobile()) {
      return;
    }

    if (!pin) {
      alert("Please enter your 4-digit PIN");
      return;
    }

    setUsingPass(true);

    try {
      const response = await axios.post(
        `${config.API_URL}/monthly-pass/use`,
        {
          bus_id: busId,
          mobile,
          pin
        }
      );

      const data = response.data;

      if (data.success) {
        navigate(`/ticket/${data.payment_id}`);
      } else {
        alert(data.message || "Unable to use monthly pass");
        setUsingPass(false);
      }

    } catch (error) {
      console.error(error);
      alert("Unable to verify monthly pass");
      setUsingPass(false);
    }
  };

const buses = [
  {
    id: "BUS001",
    busNo: "RJ14PA1234",
    origin: "Bari Sadri",
    destination: "Udaipur",
  },
  {
    id: "BUS002",
    busNo: "RJ14PA5678",
    origin: "Nimbahera",
    destination: "Udaipur",
  },
  {
    id: "BUS003",
    busNo: "RJ14PA1212",
    origin: "Neemuch",
    destination: "Udaipur",
  },
];

const currentBus =
  buses.find((bus) => bus.id === busId) || {
    busNo: "N/A",
    origin: "",
    destination: "",
  };


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

          <h2 className="mb-4 text-lg font-semibold">
            Bus Details
          </h2>

          <div className="rounded-2xl bg-slate-50 p-4 mb-5">

            <div className="mb-2">
              <strong>Bus ID:</strong> {busId}
            </div>

            <div className="mb-2">
              <strong>Bus No:</strong> {currentBus.busNo}
            </div>

            <div className="mb-2">
              <strong>Origin:</strong> {currentBus.origin}
            </div>

            <div>
              <strong>Destination:</strong> {currentBus.destination}
            </div>

          </div>

            <div className="mb-5 text-center">
            <p>Get 10% Off Instantly Every Time You Scan & Pay for Your Bus Ticket!</p>
            </div>

          <div className="mb-5 flex rounded-2xl bg-slate-100 p-1">
            <button
              onClick={() => setTab("one-time")}
              className={`flex-1 rounded-xl py-3 ${
                tab === "one-time"
                  ? "bg-indigo-600 text-white"
                  : ""
              }`}
            >
              One Time
            </button>

            <button
              onClick={() => setTab("monthly")}
              className={`flex-1 rounded-xl py-3 ${
                tab === "monthly"
                  ? "bg-green-600 text-white"
                  : ""
              }`}
            >
              Monthly Pass
            </button>
          </div>

        {tab === "one-time" && (
          <>
            <div className="mb-4">
              <label className="mb-2 block font-medium">
                Amount
              </label>
            
              <input
                type="number"
                className="w-full rounded-xl border p-3"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="mb-5">
              <label className="mb-2 block font-medium">
                Mobile Number
              </label>

              <input
                type="text"
                className="w-full rounded-xl border p-3"
                placeholder="Enter Mobile Number"
                value={mobile}
                onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    setMobile(value);
  }}
              />
            </div>



            <button
              type="button"
              disabled={paying}
              onClick={handlePay}
              className={`w-full rounded-3xl py-3.5 text-sm font-semibold text-white transition-all flex items-center justify-center ${
                paying ? "bg-indigo-400 cursor-not-allowed opacity-80" : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] cursor-pointer"
              }`}
            >
              {paying ? (
                <span className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Processing Payment...</span>
                </span>
              ) : (
                <span>Pay Now</span>
              )}
            </button>
          </>
      )}

      {tab === "monthly" && (
          <>
            <div className="mb-4">
              <label>Mobile Number</label>
              <input
                type="text"
                className="w-full rounded-xl border p-3"
                value={mobile}
                onChange={(e) => {
    const value = e.target.value.replace(/\D/g, "");
    setMobile(value);
  }}
              />
            </div>

            <div className="mb-4">
              <label>PIN</label>
              <input
                type="password"
                className="w-full rounded-xl border p-3"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
              />
            </div>

            <button
              type="button"
              disabled={usingPass}
              onClick={handleMonthlyPass}
              className={`w-full rounded-3xl py-3 text-white transition-all flex items-center justify-center ${
                usingPass ? "bg-green-400 cursor-not-allowed opacity-80" : "bg-green-600 hover:bg-green-700 active:scale-[0.98] cursor-pointer"
              }`}
            >
              {usingPass ? (
                <span className="flex items-center space-x-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Verifying Pass...</span>
                </span>
              ) : (
                <span>Use Monthly Pass</span>
              )}
            </button>

            <button
              onClick={() => navigate(`/monthly-plan/${busId}`)}
              className="mt-3 w-full rounded-3xl border border-green-600 py-3"
            >
              Purchase Monthly Pass
            </button>
          </>
          )}

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
