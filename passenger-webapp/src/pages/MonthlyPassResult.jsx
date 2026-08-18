import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";


export default function MonthlyPassResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const passRef = useRef(null);
  

  const data = location.state || {};

  const downloadPDF = async () => {
  if (!passRef.current) return;

  try {
    const canvas = await html2canvas(passRef.current, {
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

    pdf.save(`smb-pass-${data.mobile}.pdf`);
  } catch (err) {
    console.error("PDF Error:", err);
  }
};

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">

       
        {data.status === "SUCCESS" && (
          <>
            <div ref={passRef}>
            <h1 className="text-2xl font-bold text-green-600 mb-4">
              Monthly Pass Activated
            </h1>

            <div className="space-y-3">

              <div>
                <strong>Name:</strong> {data.name}
              </div>

              <div>
                <strong>Mobile:</strong> {data.mobile}
              </div>

              <div>
                <strong>PIN:</strong> {data.pin}
              </div>

              <div>
                <strong>Total Rides:</strong> {data.rides}
              </div>

              <p>&nbsp;</p>

            </div>
           
            </div>
              <button
         onClick={downloadPDF}
          className="mt-6 w-full rounded-2xl bg-indigo-600 py-3 text-white"
        >
          Download Pass
        </button>

          </>
        )}

        {data.status === "FAILED" && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Payment Failed
            </h1>

            <p>
              Your monthly pass payment could not be completed.
            </p>
          </>
        )}

        {data.status === "CANCELLED" && (
          <>
            <h1 className="text-2xl font-bold text-orange-600 mb-4">
              Payment Cancelled
            </h1>

            <p>
              Monthly pass purchase was cancelled.
            </p>
           
          </>
          
        )}
        
        
       

        

      </div>
    </div>
  );
}