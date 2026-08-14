import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import config from "../config";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useRef } from "react";


export default function TicketPage() {
  const { paymentId } = useParams();
  const ticketRef = useRef(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayment();
  }, []);

  const loadPayment = async () => {
    try {
      const res = await axios.get(
        `${config.API_URL}/payment/${paymentId}`
      );

      setPayment(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Ticket Not Found
      </div>
    );
  }

  const getStatusUI = () => {
    switch (payment.status) {
      case "PAID":
        return {
          icon: "✅",
          title: "Payment Successful",
          bg: "bg-green-600",
          text: "Your ticket is confirmed",
        };

      case "FAILED":
        return {
          icon: "❌",
          title: "Payment Failed",
          bg: "bg-red-600",
          text: "Transaction failed",
        };

      case "CANCELLED":
        return {
          icon: "⚠️",
          title: "Payment Cancelled",
          bg: "bg-orange-500",
          text: "Payment cancelled by user",
        };

      default:
        return {
          icon: "⏳",
          title: "Payment Pending",
          bg: "bg-slate-600",
          text: "Waiting for payment",
        };
    }
  };

  const statusUI = getStatusUI();



  const downloadPDF = async () => {
  if (!ticketRef.current) return;

  try {
    const canvas = await html2canvas(ticketRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 190;
    const pdfHeight =
      (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(
      imgData,
      "PNG",
      10,
      10,
      pdfWidth,
      pdfHeight
    );

    pdf.save(`ticket-${payment.payment_id}.pdf`);
  } catch (err) {
    console.error("PDF Error:", err);
  }
};

  return (
   <div className="min-h-screen bg-slate-100 p-4">
  <div className="mx-auto max-w-md rounded-2xl bg-white shadow-sm">
    <div ref={ticketRef}>
    {/* Header */}
    <div className="border-b p-4">
      <h2 className="text-lg font-semibold">
        Bus Ticket
      </h2>
      <p className="text-sm text-slate-500">
        Payment  <span
          className={
            payment.status === "PAID"
              ? "text-green-600 font-medium"
              : payment.status === "FAILED"
              ? "text-red-600 font-medium"
              : "text-orange-600 font-medium"
          }
        >
          {payment.status}
        </span>
      </p>
    </div>

    {/* Body */}
    <div className="p-4 space-y-3">

      <div className="flex justify-between">
        <span className="text-slate-500">Ticket ID</span>
        <span>{payment.payment_id}</span>
      </div>

      <div className="flex justify-between">
        <span className="text-slate-500">Bus</span>
        <span>RJ14PA1234</span>
      </div>

      {/* <div className="flex justify-between">
        <span className="text-slate-500">Route</span>
        <span>Jaipur → Ajmer</span>
      </div> */}

      <div className="flex justify-between">
        <span className="text-slate-500">Amount</span>
        <span>₹{payment.amount}</span>
      </div>
       <div className="flex justify-between">
        <span className="text-slate-500">Mobile</span>
        <span>{payment.phone_number}</span>
      </div>

        {payment.cashback > 0 && (
        <div className="flex justify-between border-t pt-2">
        <span>Cashback Earned</span>
        <span className="font-semibold text-green-600">
        ₹{payment.cashback}
        </span>
        </div>
        )}

      <div className="flex justify-between">
        <span className="text-slate-500">Status</span>

        <span
          className={
            payment.status === "PAID"
              ? "text-green-600 font-medium"
              : payment.status === "FAILED"
              ? "text-red-600 font-medium"
              : "text-orange-600 font-medium"
          }
        >
          {payment.status}
        </span>
      </div>

      {payment.razorpay_payment_id && (
        <div className="flex justify-between">
          <span className="text-slate-500">Txn ID</span>
          <span className="text-xs">
            {payment.razorpay_payment_id}
          </span>
        </div>
      )}

      <div className="flex justify-between">
        <span className="text-slate-500">Time</span>
        <span>
          {new Date(
            payment.paid_at || payment.created_at
          ).toLocaleString("en-IN")}
        </span>
      </div>

    </div>
    </div>

    {/* Footer */}
    {payment.status === "PAID" && (
  <div className="p-4">
    <button
      onClick={downloadPDF}
      className="w-full rounded-xl bg-green-600 py-3 text-white font-semibold"
    >
      Download PDF Ticket
    </button>
  </div>
)}
    <div className="border-t p-4 text-center text-sm text-slate-500">
      Show this ticket to conductor
    </div>

  </div>
</div>
  );
}
