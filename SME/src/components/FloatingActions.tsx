"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { MessageCircle, Phone, ArrowUp } from "lucide-react";

export default function FloatingActions() {
  const locale = useLocale();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isHindi = locale === "hi";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
      {/* Back to Top */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          aria-label="Back to top"
          className="pointer-events-auto w-11 h-11 rounded-full bg-[#1A2744] text-white flex items-center justify-center shadow-lg hover:bg-[#E8721A] transition duration-300 hover:scale-110"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Call Button (Visible on mobile/tablet) */}
      <Link
        href="tel:+919636048785"
        aria-label="Call SME Buses"
        className="pointer-events-auto md:hidden w-12 h-12 rounded-full bg-[#0F1A33] text-orange-400 flex items-center justify-center shadow-xl border border-orange-500/30 hover:scale-110 transition active:scale-95"
      >
        <Phone className="w-5 h-5" />
      </Link>

      {/* Floating WhatsApp Button */}
      <Link
        href="https://wa.me/919928261238?text=Hello%20Shree%20Mateshwari%20Enterprises,%20I%20would%20like%20to%20inquire%20about%20bus%20routes%20and%20timings."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="pointer-events-auto group relative flex items-center gap-2.5 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-2xl hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition duration-300"
      >
        {/* Pulse effect */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

        <MessageCircle className="w-6 h-6 shrink-0" />
        <span className="text-xs sm:text-sm font-bold tracking-wide hidden sm:inline">
          {isHindi ? "व्हाट्सएप सहायता" : "WhatsApp Us"}
        </span>
      </Link>
    </div>
  );
}
