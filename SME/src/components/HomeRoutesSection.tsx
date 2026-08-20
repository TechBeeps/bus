"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Bus, Clock, MapPin, ArrowRight } from "lucide-react";

export default function HomeRoutesSection() {
  const t = useTranslations("homeRoutes");

  const borderColors = [
    "border-[#FED7AA]",
    "border-[#FDE68A]",
    "border-[#FEF08A]",
    "border-[#FED7AA]",
    "border-[#FDE68A]",
    "border-[#FEF08A]",
  ];

  const routes = [0, 1, 2, 3, 4, 5].map((i) => ({
    from: t(`routes.${i}.from`),
    to: t(`routes.${i}.to`),
    duration: t(`routes.${i}.duration`),
    price: t(`routes.${i}.price`),
    borderColor: borderColors[i % borderColors.length],
  }));

  return (
    <section className="py-20">
      <div className="site-container">        
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#111827] tracking-tight">
            {t("title")}
          </h2>
          <p className="text-sm sm:text-base text-[#9C6218] font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {routes.map((route, index) => (
            <div
              key={index}
              className={`p-6 rounded-2xl border-2 ${route.borderColor} bg-[#FAF5EB]/50 hover:bg-[#FAF5EB] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group`}
            >              
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-[#FFE8D6] text-[#E8721A] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] sm:text-[17px] text-[#111827] leading-snug tracking-tight">
                      {route.from} → {route.to}
                    </h3>
                    <span className="text-xs text-gray-500 font-normal block mt-0.5">
                      {t("viceVersa")}
                    </span>
                  </div>
                </div>
               
                <div className="px-3.5 py-1.5 rounded-full bg-[#E8721A] text-white text-xs sm:text-sm font-extrabold shadow-xs shrink-0 whitespace-nowrap self-start">
                  {t("fromLabel")} ₹{route.price}
                </div>
              </div>
              
              <div className="flex items-center gap-5 text-xs text-gray-600 font-normal pt-6">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{route.duration}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                  <span>{t("dailyService")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center mt-12">
          <Link
            href="/routes"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#E8721A] hover:bg-[#D46212] text-white font-extrabold text-sm sm:text-base shadow-lg shadow-orange-500/25 hover:scale-105 transition duration-200"
          >
            <span>{t("viewAllRoutes")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
