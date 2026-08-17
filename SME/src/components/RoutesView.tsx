"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Bus, Clock, MapPin, ArrowRight } from "lucide-react";

export default function RoutesView() {
  const t = useTranslations("routes");

  const routes = [
    {
      from: t("list.0.from"),
      to: t("list.0.to"),
      price: t("list.0.price"),
      duration: t("list.0.duration"),
      distance: t("list.0.distance"),
      times: ["5:00 AM", "9:00 AM", "1:00 PM", "5:00 PM"],
    },
    {
      from: t("list.1.from"),
      to: t("list.1.to"),
      price: t("list.1.price"),
      duration: t("list.1.duration"),
      distance: t("list.1.distance"),
      times: ["6:30 AM", "10:00 AM", "2:00 PM", "6:00 PM"],
    },
    {
      from: t("list.2.from"),
      to: t("list.2.to"),
      price: t("list.2.price"),
      duration: t("list.2.duration"),
      distance: t("list.2.distance"),
      times: ["5:30 AM", "8:00 AM", "12:00 PM", "4:00 PM"],
    },
    {
      from: t("list.3.from"),
      to: t("list.3.to"),
      price: t("list.3.price"),
      duration: t("list.3.duration"),
      distance: t("list.3.distance"),
      times: ["7:00 AM", "10:30 AM", "2:30 PM", "6:30 PM"],
    },
    {
      from: t("list.4.from"),
      to: t("list.4.to"),
      price: t("list.4.price"),
      duration: t("list.4.duration"),
      distance: t("list.4.distance"),
      times: ["6:00 AM", "9:30 AM", "1:30 PM", "5:30 PM"],
    },
    {
      from: t("list.5.from"),
      to: t("list.5.to"),
      price: t("list.5.price"),
      duration: t("list.5.duration"),
      distance: t("list.5.distance"),
      times: ["7:30 AM", "11:00 AM", "3:00 PM", "7:00 PM"],
    },
  ];

  return (
    <div className="flex flex-col">      
      <div className="py-14 sm:py-16 bg-[#E8721A] text-white text-center">
        <div className="site-container space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            {t("pageHeadline")}
          </h1>
          <p className="text-sm sm:text-base text-white/95 max-w-2xl mx-auto font-normal">
            {t("pageSubheadline")}
          </p>
        </div>
      </div>
      
      <section className="py-16 sm:py-20">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 sm:gap-8">
            {routes.map((route, idx) => (
              <div
                key={idx}
                className="p-6 sm:p-7 rounded-2xl border-2 border-[#FED7AA] bg-[#FAF5EB]/50 hover:bg-[#FAF5EB] shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between space-y-5 group"
              >                
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-[#FFE8D6] text-[#E8721A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                      <Bus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-lg sm:text-xl text-[#111827] leading-snug">
                        {route.from} → {route.to}
                      </h2>
                      <span className="text-xs text-gray-500 font-normal block mt-0.5">
                        ⇆ {t("viceVersa")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-gray-500 font-semibold block">
                      {t("fromLabel")}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#E8721A] leading-none">
                      ₹ {route.price}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-5 text-xs sm:text-sm text-gray-600 font-normal">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{route.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{route.distance}</span>
                  </div>
                </div>
                
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">
                    {t("departureTimes")}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                    {route.times.map((time, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-3.5 py-1 rounded-full bg-[#EDE5D8] text-xs sm:text-sm font-bold text-gray-800 border border-[#E0D5C3]"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2">
                  <Link
                    href="/qr-payment"
                    className="w-full py-3 sm:py-3.5 rounded-xl bg-[#E8721A] hover:bg-[#D96516] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{t("payByQrBtn")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
