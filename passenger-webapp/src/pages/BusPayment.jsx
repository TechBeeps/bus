import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export default function BusPayment() {
  const { busId } = useParams();
 const navigate = useNavigate();
  const [amount, setAmount] = useState("");
//   const [mobile, setMobile] = useState("");
//   const [passengerName, setPassengerName] = useState("");

const handlePay = async () => {
  try {

    const response = await axios.post(
      "https://api.techbeeps.co.in/api/v1/payment/order",
      {
        bus_id: busId,
        amount: Number(amount)
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
    
        
        await axios.post(
          "http://127.0.0.1:8000/api/v1/payment/success",
          {
            payment_id: data.payment_id,
            razorpay_payment_id:
              response.razorpay_payment_id
          }
        );

        //alert("Payment Successful");
         navigate(`/ticket/${data.payment_id}`);
      },

      modal: {
        ondismiss: async function () {

            await axios.post(
            "http://127.0.0.1:8000/api/v1/payment/update-status",
            {
                payment_id: data.payment_id,
                status: "CANCELLED"
            }
            );

            //alert("Payment Cancelled");
            navigate(`/ticket/${data.payment_id}`);
        }
    }
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", async function (response) {
      console.log("PAYMENT FAILED", response);

      try {
        await axios.post(
          "http://127.0.0.1:8000/api/v1/payment/update-status",
          {
            payment_id: data.payment_id,
            status: "FAILED",
          }
        );
      } catch (error) {
        console.error("Failed status update:", error);
      }

      //alert("Payment Failed");
      navigate(`/ticket/${data.payment_id}`);
    });


    rzp.open();

  } catch (error) {
    console.error(error);
    alert("Unable to create payment");
  }
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
              <strong>Bus No:</strong> RJ14PA1234
            </div>

            <div>
              <strong>Route:</strong> Jhotwara → Chandpole → Badi Chaupar
            </div>

          </div>
             {/* <div className="mb-4">
            <label className="mb-2 block font-medium">
            Passenger Name
            </label>

            <input
            type="text"
            className="w-full rounded-xl border p-3"
            placeholder="Enter Passenger Name"
            value={passengerName}
            onChange={(e) => setPassengerName(e.target.value)}
            />
            </div> */}

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

          {/* <div className="mb-5">
            <label className="mb-2 block font-medium">
              Mobile Number
            </label>

            <input
              type="text"
              className="w-full rounded-xl border p-3"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div> */}

          <button
            onClick={handlePay}
            className="w-full rounded-3xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white"
          >
            Pay Now
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
