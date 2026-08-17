"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { QrCode, CheckCircle2, ArrowRight } from "lucide-react";

export default function HomeQRPaySection() {
  const t = useTranslations("homeQRPay");

  const features = [
    t("f1"),
    t("f2"),
    t("f3"),
    t("f4"),
  ];

  return (
    <section className="py-20 bg-[#0A0E17] text-white relative overflow-hidden">      
      <div className="absolute inset-0 bg-[radial-gradient(#222F43_1px,transparent_1px)] [background-size:20px_20px] opacity-70 pointer-events-none" />
      <div className="site-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">          
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative bg-white rounded-3xl p-6 sm:p-8 shadow-2xl max-w-xs sm:max-w-sm w-full border-4 border-white/10">            
              <div className="absolute -top-3 right-6 bg-[#E8721A] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md"> 
                  {t("cashbackBadge")}
              </div>              
              <div className="relative aspect-square w-full p-3 bg-white rounded-2xl flex items-center justify-center">
                <svg
                  viewBox="0 0 200 200"
                  className="w-full h-full text-[#111827]"
                  fill="currentColor"
                >                  
                  <rect x="15" y="15" width="55" height="55" rx="8" fill="none" stroke="#E8721A" strokeWidth="8" />
                  <rect x="30" y="30" width="25" height="25" rx="4" fill="#111827" />

                  <rect x="130" y="15" width="55" height="55" rx="8" fill="none" stroke="#E8721A" strokeWidth="8" />
                  <rect x="145" y="30" width="25" height="25" rx="4" fill="#111827" />

                  <rect x="15" y="130" width="55" height="55" rx="8" fill="none" stroke="#E8721A" strokeWidth="8" />
                  <rect x="30" y="145" width="25" height="25" rx="4" fill="#111827" />
                  
                  <rect x="85" y="15" width="12" height="12" fill="#E8721A" />
                  <rect x="105" y="15" width="12" height="12" fill="#111827" />
                  <rect x="85" y="35" width="12" height="12" fill="#111827" />
                  <rect x="105" y="45" width="12" height="25" fill="#E8721A" />

                  <rect x="15" y="85" width="22" height="12" fill="#E8721A" />
                  <rect x="45" y="85" width="12" height="12" fill="#111827" />
                  <rect x="20" y="105" width="16" height="12" fill="#111827" />

                  <rect x="75" y="75" width="50" height="50" rx="8" fill="#FFF9F5" stroke="#E8721A" strokeWidth="3" />
                  <circle cx="100" cy="100" r="14" fill="#E8721A" />

                  <rect x="135" y="85" width="12" height="12" fill="#111827" />
                  <rect x="155" y="85" width="30" height="12" fill="#E8721A" />
                  <rect x="140" y="105" width="20" height="12" fill="#111827" />
                  <rect x="170" y="105" width="15" height="12" fill="#E8721A" />

                  <rect x="85" y="135" width="12" height="20" fill="#111827" />
                  <rect x="105" y="145" width="12" height="12" fill="#E8721A" />
                  <rect x="85" y="165" width="25" height="12" fill="#E8721A" />
                  <rect x="120" y="140" width="15" height="15" fill="#111827" />
                  <rect x="145" y="140" width="15" height="15" fill="#E8721A" />
                  <rect x="170" y="140" width="15" height="15" fill="#111827" />
                  <rect x="135" y="165" width="50" height="15" fill="#E8721A" />
                </svg>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white text-[#E8721A] flex items-center justify-center shadow font-black text-xs">
                    SME
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                {t("title")}
              </h2>
              <p className="text-sm sm:text-base text-gray-300 max-w-xl leading-relaxed">
                {t("subtitle")}
              </p>
            </div>
            
            <div className="space-y-3 pt-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-[#E8721A] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-[#E8721A]" />
                  </div>
                  <span className="text-sm sm:text-base text-gray-200 font-medium">
                    {feat}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="pt-4">
              <Link
                href="/qr-payment"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#E8721A] hover:bg-[#D46212] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/30 hover:scale-105 transition duration-200"
              >
                <QrCode className="w-4 h-4" />
                <span>{t("btn")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
