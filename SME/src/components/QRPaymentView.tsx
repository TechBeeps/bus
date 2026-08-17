"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { QrCode, CheckCircle2, ArrowRight } from "lucide-react";

export default function QRPaymentView() {
  const t = useTranslations("qrPayment");

  const features = [
    t("f1"),
    t("f2"),
    t("f3"),
    t("f4"),
  ];

  return (
    <div className="flex flex-col">      
      <div className="py-14 sm:py-16 bg-[#0A0E17] text-white text-center">
        <div className="site-container space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {t("pageHeadline")}
          </h1>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto font-normal">
            {t("pageSubheadline")}
          </p>
        </div>
      </div>      
      <section className="py-16 sm:py-24">
        <div className="site-container flex justify-center">
          <div className="max-w-xl w-full p-8 sm:p-12 rounded-3xl bg-[#FAF5EB]/50 border-2 border-[#FED7AA] shadow-xs text-center flex flex-col items-center space-y-6">           
            <div className="w-14 h-14 rounded-2xl bg-[#FFE8D6] text-[#E8721A] flex items-center justify-center shadow-xs">
              <QrCode className="w-7 h-7" />
            </div>            
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#111827]">
                {t("comingSoonTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-[#9C6218] font-medium max-w-md mx-auto leading-relaxed">
                {t("comingSoonDesc")}
              </p>
            </div>            
            <div className="space-y-3 text-left w-fit mx-auto pt-2">
              {features.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs sm:text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-[#E8721A] shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>            
            <div className="pt-3">
              <Link
                href="/routes"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E8721A] hover:bg-[#D46212] text-white font-extrabold text-sm sm:text-base shadow-md hover:scale-105 transition duration-200 cursor-pointer"
              >
                <span>{t("viewAllRoutes")}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
