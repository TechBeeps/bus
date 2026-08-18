import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../config";

export default function MonthlyPlan() {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    try {
      setLoading(true);

      const response = await axios.post(
        `${config.API_URL}/monthly-pass/order`,
        {
          bus_id: busId,
          name,
          mobile,
        }
      );

      const data = response.data;

      const options = {
        key: data.key,
        amount: 1000 * 100,
        currency: "INR",
        name: "Monthly Bus Pass",
        description: "62 Rides (60 + 2 Free)",
        order_id: data.razorpay_order_id,

        handler: async function (response) {
          const successResponse = await axios.post(
            `${config.API_URL}/monthly-pass/success`,
            {
              payment_id: data.payment_id,
              bus_id: busId,
              name,
              mobile,
              razorpay_payment_id:
                response.razorpay_payment_id,
            }
          );

          const result = successResponse.data;

          navigate(`/monthly-pass-result`, {
          state: {
            status: "SUCCESS",
            pin: result.pin,
            rides: result.rides,
            mobile: mobile,
            name: name,
          },
        });
        },

        modal: {
          ondismiss: function () {

            navigate("/monthly-pass-result", {
              state: {
                status: "CANCELLED",
              },
            });

          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function () {

        navigate("/monthly-pass-result", {
          state: {
            status: "FAILED",
          },
        });

      });

      rzp.open();
    } catch (error) {
      console.error(error);
      alert("Unable to create monthly pass");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-green-600 text-white shadow-lg">
        <div className="mx-auto max-w-md px-4 py-4">
          <p className="text-xs uppercase tracking-widest text-green-100">
            Monthly Travel Pass
          </p>

          <h1 className="text-xl font-semibold">
            Purchase Monthly Pass
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5">

        <section className="rounded-3xl bg-white p-5 shadow-sm border">

          <div className="mb-5 rounded-2xl bg-green-50 p-4 border border-green-200">
            <h3 className="font-semibold text-green-700">
              ₹1000 Monthly Plan
            </h3>

            <p className="mt-2 text-sm text-green-600">
              60 Rides + 2 Free Rides
            </p>

            <p className="text-sm text-green-600">
              Total 62 Rides
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block font-medium">
              Full Name
            </label>

            <input
              type="text"
              className="w-full rounded-xl border p-3"
              placeholder="Enter Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block font-medium">
              Mobile Number
            </label>

            <input
              type="text"
              maxLength={10}
              className="w-full rounded-xl border p-3"
              placeholder="Enter Mobile Number"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value)
              }
            />
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading}
            className="w-full rounded-3xl bg-green-600 px-6 py-3.5 font-semibold text-white"
          >
            {loading
              ? "Processing..."
              : "Purchase Pass ₹1000"}
          </button>

        </section>

      </main>
    </div>
  );
}